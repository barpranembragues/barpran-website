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
      "Cache-Control": "public, max-age=900, s-maxage=900",
    },
  });
}

async function findProfile(category: string, name: string) {
  const listUrl = `https://www.actc.org.ar/${category}/pilotos.html`;
  const listResponse = await fetch(listUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
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
    if (!href || !text) continue;

    const score = targetTokens.reduce((sum, token) => sum + (text.includes(token) ? 1 : 0), 0);
    const looksLikeDriver = /pilotos?/i.test(href) || /piloto/i.test(anchor[0]);

    if (looksLikeDriver && score >= Math.max(2, targetTokens.length - 1) && (!best || score > best.score)) {
      best = { href, score };
    }
  }

  if (!best) return null;
  return new URL(best.href, listUrl).toString();
}

function scoreImage(src: string, surroundingText: string, name: string) {
  const normalizedSrc = normalize(src);
  const normalizedContext = normalize(surroundingText);
  const surnameTokens = normalize(name).split(" ").filter((part) => part.length > 3);

  let score = 0;
  if (/piloto|pilotos|corredor|driver/.test(normalizedSrc)) score += 14;
  if (/foto|imagen|image|upload|archivo|media/.test(normalizedSrc)) score += 6;
  if (/piloto|corredor|driver/.test(normalizedContext)) score += 8;
  if (surnameTokens.some((part) => normalizedSrc.includes(part))) score += 16;
  if (surnameTokens.some((part) => normalizedContext.includes(part))) score += 10;
  if (/logo|icon|favicon|banner|publicidad|sponsor|header|footer|tracker|pixel/.test(normalizedSrc)) score -= 30;
  if (/\.svg($|\?)/i.test(src)) score -= 15;
  if (/\.gif($|\?)/i.test(src)) score -= 8;
  return score;
}

function extractImage(profileHtml: string, profileUrl: string, name: string) {
  const candidates: { src: string; score: number }[] = [];

  const pushCandidate = (raw: string | undefined, context: string, bonus = 0) => {
    if (!raw) return;
    const cleaned = raw
      .trim()
      .replace(/^['\"]|['\"]$/g, "")
      .replace(/&amp;/gi, "&");
    if (!cleaned || cleaned.startsWith("data:")) return;

    try {
      const absolute = new URL(cleaned, profileUrl).toString();
      if (!/^https?:\/\//i.test(absolute)) return;
      candidates.push({ src: absolute, score: scoreImage(absolute, context, name) + bonus });
    } catch {
      // ignorar URLs inválidas
    }
  };

  // Metadatos sociales: normalmente contienen la foto principal de la ficha.
  for (const match of profileHtml.matchAll(/<meta\b[^>]*(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*content=["']([^"']+)["'][^>]*>/gi)) {
    pushCandidate(match[1], match[0], 35);
  }
  for (const match of profileHtml.matchAll(/<meta\b[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]*>/gi)) {
    pushCandidate(match[1], match[0], 35);
  }

  // Imágenes convencionales y lazy-load.
  for (const match of profileHtml.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    const attrs = ["src", "data-src", "data-original", "data-lazy-src", "data-image", "data-url"];
    for (const attr of attrs) {
      const value = tag.match(new RegExp(`${attr}=["']([^"']+)["']`, "i"))?.[1];
      pushCandidate(value, tag, attr === "src" ? 14 : 18);
    }

    const srcset = tag.match(/(?:srcset|data-srcset)=["']([^"']+)["']/i)?.[1];
    if (srcset) {
      for (const part of srcset.split(",")) {
        pushCandidate(part.trim().split(/\s+/)[0], tag, 16);
      }
    }
  }

  // Imágenes aplicadas mediante background-image/url(...).
  for (const match of profileHtml.matchAll(/url\((?:['\"]?)([^)'\"]+)(?:['\"]?)\)/gi)) {
    pushCandidate(match[1], match[0], 12);
  }

  // Último recurso: cualquier archivo de imagen mencionado en el HTML.
  for (const match of profileHtml.matchAll(/(?:https?:\/\/|\/|\.\.\/|\.\/)[^\s'\"<>]+\.(?:jpe?g|png|webp)(?:\?[^\s'\"<>]*)?/gi)) {
    pushCandidate(match[0], match[0], 4);
  }

  const unique = new Map<string, number>();
  for (const candidate of candidates) {
    unique.set(candidate.src, Math.max(unique.get(candidate.src) ?? -999, candidate.score));
  }

  return [...unique.entries()]
    .map(([src, score]) => ({ src, score }))
    .sort((a, b) => b.score - a.score)[0]?.src || null;
}

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("cat") || "tc";
  const name = request.nextUrl.searchParams.get("name") || "Piloto BARPRAN";

  if (!ALLOWED.has(category)) return fallback(name);

  try {
    const profileUrl = await findProfile(category, name);
    if (!profileUrl) return fallback(name);

    const profileResponse = await fetch(profileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 86400 },
    });
    if (!profileResponse.ok) return fallback(name);

    const profileHtml = await profileResponse.text();
    const imageUrl = extractImage(profileHtml, profileUrl, name);
    if (!imageUrl) return fallback(name);

    // Redirigimos al navegador hacia la imagen de ACTC. Esto evita que Netlify
    // tenga que descargar/proxyficar el archivo y reduce bloqueos por hotlink.
    const response = NextResponse.redirect(imageUrl, 307);
    response.headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800");
    return response;
  } catch {
    return fallback(name);
  }
}
