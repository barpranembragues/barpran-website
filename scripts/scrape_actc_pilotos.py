# Trigger de ejecución vía Pull Request para descargar las fotos oficiales de ACTC.
import asyncio
import re
import unicodedata
from pathlib import Path
from urllib.parse import urljoin, urlparse

from playwright.async_api import async_playwright

PILOTOS = {
    "tc": [
        "Agustín Canapino", "Mariano Werner", "Germán Todino", "Andrés Jakos",
        "Mauricio Lambiris", "Juan Martín Trucco", "Santiago Mangoni", "Jeremías Olmedo",
        "Norberto Fontana", "Gastón Mazzacane", "Sebastián Abella", "Tomás Abdala",
        "Nicolás Trosset", "Lautaro De La Iglesia", "Lucas Valle", "Rodrigo Lugón",
        "Gastón Ferrante", "Kevin Candela", "Hernán Palazzo", "Martín Vázquez",
        "Valentín Aguirre", "Jeremías Scialchi", "Marco Dianda", "Santiago Álvarez",
        "Marcos Castro", "Marcos Quijada", "Marcelo Agrelo",
    ],
    "tcp": [
        "Gabriel Gandulia", "Benjamín Antón", "Eugenio Provens", "Manuel Borgert",
        "Benjamín Ochoa", "Nicanor Santilli Pazos", "Brian Quevedo",
    ],
}

OUT = Path("public/pilotos")
OUT.mkdir(parents=True, exist_ok=True)


def norm(text: str) -> str:
    text = unicodedata.normalize("NFD", text or "")
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def slug(text: str) -> str:
    return norm(text).replace(" ", "-")


def score_match(target: str, candidate: str) -> int:
    tt = [t for t in norm(target).split() if len(t) > 1]
    cc = norm(candidate)
    return sum(1 for t in tt if t in cc)


async def candidate_from_anchor(anchor, target):
    return await anchor.evaluate(
        """
        (a, target) => {
          const normalize = s => (s || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();
          const tokens = normalize(target).split(/[^a-z0-9]+/).filter(x => x.length > 1);
          let node = a;
          const candidates = [];
          for (let level = 0; node && level < 8; level++, node = node.parentElement) {
            const imgs = [...node.querySelectorAll('img')];
            for (const img of imgs) {
              const src = img.currentSrc || img.src || img.getAttribute('data-src') || img.getAttribute('data-original') || '';
              if (!src) continue;
              const r = img.getBoundingClientRect();
              const context = normalize((img.alt || '') + ' ' + (node.innerText || ''));
              let score = 0;
              score += Math.min(12, Math.floor((img.naturalWidth || r.width || 0) / 100));
              score += Math.min(12, Math.floor((img.naturalHeight || r.height || 0) / 100));
              if ((img.naturalHeight || r.height || 0) >= (img.naturalWidth || r.width || 0)) score += 8;
              if (tokens.some(t => context.includes(t))) score += 20;
              if (/logo|icon|sponsor|marca|bandera/i.test(src + ' ' + (img.alt || ''))) score -= 30;
              candidates.push({src, score, level, w: img.naturalWidth, h: img.naturalHeight, alt: img.alt || ''});
            }
            const bg = getComputedStyle(node).backgroundImage || '';
            const m = bg.match(/url\\([\"']?(.*?)[\"']?\\)/);
            if (m && m[1]) candidates.push({src:m[1], score:5, level, w:0,h:0,alt:'background'});
          }
          candidates.sort((x,y) => y.score - x.score || x.level - y.level);
          return candidates.slice(0,10);
        }
        """,
        target,
    )


async def profile_candidates(page, url, target):
    await page.goto(url, wait_until="networkidle", timeout=90000)
    await page.wait_for_timeout(1200)
    return await page.evaluate(
        """
        (target) => {
          const normalize = s => (s || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();
          const tokens = normalize(target).split(/[^a-z0-9]+/).filter(x => x.length > 1);
          const out = [];
          for (const img of [...document.images]) {
            const src = img.currentSrc || img.src || img.getAttribute('data-src') || img.getAttribute('data-original') || '';
            if (!src) continue;
            const r = img.getBoundingClientRect();
            const context = normalize((img.alt || '') + ' ' + (img.parentElement?.innerText || ''));
            let score = 0;
            score += Math.min(15, Math.floor((img.naturalWidth || r.width || 0) / 100));
            score += Math.min(15, Math.floor((img.naturalHeight || r.height || 0) / 100));
            if ((img.naturalHeight || r.height || 0) >= (img.naturalWidth || r.width || 0)) score += 10;
            if (tokens.some(t => context.includes(t))) score += 25;
            if (/piloto|driver|corredor/i.test(src + ' ' + (img.alt || ''))) score += 10;
            if (/logo|icon|sponsor|marca|bandera|banner/i.test(src + ' ' + (img.alt || ''))) score -= 40;
            out.push({src, score, w:img.naturalWidth,h:img.naturalHeight,alt:img.alt || ''});
          }
          out.sort((a,b) => b.score-a.score);
          return out.slice(0,20);
        }
        """,
        target,
    )


async def download_with_context(page, url, target, referer):
    try:
        resp = await page.request.get(url, headers={"Referer": referer}, timeout=60000)
        if not resp.ok:
            print(f"  download {resp.status}: {url}")
            return False
        ctype = (resp.headers.get("content-type") or "").lower()
        if not ctype.startswith("image/"):
            print(f"  not image ({ctype}): {url}")
            return False
        ext = ".jpg"
        if "png" in ctype: ext = ".png"
        elif "webp" in ctype: ext = ".webp"
        data = await resp.body()
        if len(data) < 5000:
            print(f"  image too small ({len(data)}): {url}")
            return False
        path = OUT / f"{slug(target)}{ext}"
        path.write_bytes(data)
        print(f"  SAVED {path} ({len(data)} bytes) <- {url}")
        return True
    except Exception as e:
        print(f"  download error {url}: {e}")
        return False


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 1200},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36",
        )
        page = await context.new_page()

        for cat, names in PILOTOS.items():
            list_url = f"https://www.actc.org.ar/{cat}/pilotos.html"
            print(f"\n=== {cat.upper()} {list_url} ===")
            await page.goto(list_url, wait_until="networkidle", timeout=90000)
            await page.wait_for_timeout(1800)
            anchors = page.locator("a")
            count = await anchors.count()
            rows = []
            for i in range(count):
                a = anchors.nth(i)
                try:
                    txt = (await a.inner_text(timeout=1500)).strip()
                    href = await a.get_attribute("href")
                except Exception:
                    continue
                if txt and href and "pilotos" in href.lower():
                    rows.append((a, txt, href))
            print(f"driver-like links: {len(rows)}")

            for target in names:
                print(f"\n{target}")
                ranked = sorted(rows, key=lambda x: score_match(target, x[1]), reverse=True)
                best = ranked[0] if ranked and score_match(target, ranked[0][1]) >= 2 else None
                if not best:
                    print("  profile link not found")
                    continue
                a, txt, href = best
                profile_url = urljoin(list_url, href)
                print(f"  profile: {profile_url} | text={txt[:100]}")
                candidates = await candidate_from_anchor(a, target)
                print("  card candidates:", candidates[:3])
                saved = False
                for cand in candidates:
                    if cand.get("score", 0) < 0: continue
                    src = urljoin(list_url, cand["src"])
                    if await download_with_context(page, src, target, list_url):
                        saved = True
                        break
                if saved:
                    continue

                pcands = await profile_candidates(page, profile_url, target)
                print("  profile candidates:", pcands[:5])
                for cand in pcands:
                    if cand.get("score", 0) < 0: continue
                    src = urljoin(profile_url, cand["src"])
                    if await download_with_context(page, src, target, profile_url):
                        saved = True
                        break
                if not saved:
                    print("  FAILED TO SAVE")

                await page.goto(list_url, wait_until="networkidle", timeout=90000)
                await page.wait_for_timeout(900)
                anchors = page.locator("a")
                count = await anchors.count()
                rows = []
                for i in range(count):
                    aa = anchors.nth(i)
                    try:
                        t = (await aa.inner_text(timeout=1000)).strip()
                        h = await aa.get_attribute("href")
                    except Exception:
                        continue
                    if t and h and "pilotos" in h.lower():
                        rows.append((aa, t, h))

        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
