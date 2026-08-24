import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 86400;

const ALLOWED = new Set(["tc", "tcp", "tcm", "tcpk"]);

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stripTags(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&aacute;/gi, "á")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
    .replace(/&ntilde;/gi, "ñ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (char) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  })[char] || char);
}

function fallback(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="720" height="900" viewBox="0 0 720 900">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#111111"/>
        <stop offset="1" stop-color="#262626"/>
      </linearGradient>
    </defs>
    <rect width="720" height="900" fill="url(#g)"/>
    <path d="M0 760 L720 520 L720 900 L0 900 Z" fill="#e31b23" opacity=".16"/>
    <text x="50%" y="46%" dominant-baseline="middle" text-anchor="middle" fill="#f1eee7" font-family="Arial, sans-serif" font-size="150" font-weight="800">${escapeXml(initials)}</text>
    <text x="50%" y="59%" dominant-baseline="middle" text-anchor="middle" fill="#9a9a9a" font-family="monospace" font-size="25" letter-spacing="5">BARPRAN MOTORSPORT</text>
  </svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

async function findProfile(category: string, name: string) {
  if (normalize(name) === "marcos di palma") {
    return "https://www.actc.org.ar/tc/pilotos/2010/marcos-di-palma_525.html";
  }

  const listUrl = `https://www.actc.org.ar/${category}/pilotos.html`;
  const listResponse = await fetch(listUrl, {
    headers: { "User-Agent": "Mozilla/5.0 BARPRAN/1.0" },
    next: { revalidate: 86400 },
  });
  if (!listResponse.ok) return null;

  const html = await listResponse.text();
  const targetTokens = normalize(name).split(" ").filter((token) => token.length > 1);
  const anchors = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];

  let best: { href: string; score: number } | null = null;
  for (const anchor of anchors) {
    const href = anchor[1];
    const text = normalize(stripTags(anchor[2]));
    if (!href || !text || !/pilotos/i.test(href)) continue;
    const score = targetTokens.reduce((sum, token) => sum + (text.includes(token) ? 1 : 0), 0);
    if (score >= Math.max(2, targetTokens.length - 1) && (!best || score > best.score)) {
      best = { href, score };
    }
  }

  if (!best) return null;
  return new URL(best.href, listUrl).toString();
}

function extractImage(profileHtml: string, profileUrl: string, name: string) {
  const candidates: { src: string; score: number }[] = [];
  const normalizedName = normalize(name);
  const surnames = normalizedName.split(" ").slice(-2);

  for (const match of profileHtml.matchAll(/<meta\b[^>]*(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*content=["']([^"']+)["'][^>]*>/gi)) {
    candidates.push({ src: match[1], score: 20 });
  }
  for (const match of profileHtml.matchAll(/<meta\b[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*>/gi)) {
    candidates.push({ src: match[1], score: 20 });
  }

  for (const match of profileHtml.matchAll(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
    const src = match[1];
    const lower = normalize(src);
    let score = 0;
    if (/piloto|pilotos|corredor|driver/.test(lower)) score += 8;
    if (/foto|imagen|image|archivo|upload/.test(lower)) score += 4;
    if (surnames.some((part) => part.length > 3 && lower.includes(part))) score += 8;
    if (/logo|icon|banner|publicidad|sponsor|header|footer/.test(lower)) score -= 12;
    if (/\.svg($|\?)/i.test(src)) score -= 10;
    candidates.push({ src, score });
  }

  const valid = candidates
    .map((item) => {
      try {
        return { ...item, src: new URL(item.src, profileUrl).toString() };
      } catch {
        return null;
      }
    })
    .filter((item): item is { src: string; score: number } => Boolean(item))
    .filter((item) => /^https?:\/\//i.test(item.src))
    .sort((a, b) => b.score - a.score);

  return valid[0]?.src || null;
}

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("cat") || "tc";
  const name = request.nextUrl.searchParams.get("name") || "Piloto BARPRAN";

  if (!ALLOWED.has(category)) return fallback(name);

  try {
    const profileUrl = await findProfile(category, name);
    if (!profileUrl) return fallback(name);

    const profileResponse = await fetch(profileUrl, {
      headers: { "User-Agent": "Mozilla/5.0 BARPRAN/1.0" },
      next: { revalidate: 86400 },
    });
    if (!profileResponse.ok) return fallback(name);

    const profileHtml = await profileResponse.text();
    const imageUrl = extractImage(profileHtml, profileUrl, name);
    if (!imageUrl) return fallback(name);

    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 BARPRAN/1.0",
        Referer: profileUrl,
      },
      next: { revalidate: 86400 },
    });
    if (!imageResponse.ok) return fallback(name);

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return fallback(name);

    return new NextResponse(await imageResponse.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return fallback(name);
  }
}
