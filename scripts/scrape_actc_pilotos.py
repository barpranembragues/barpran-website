import asyncio
import re
import unicodedata
from pathlib import Path
from urllib.parse import urljoin

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


def match_score(target: str, candidate: str) -> int:
    tokens = [t for t in norm(target).split() if len(t) > 1]
    c = norm(candidate)
    return sum(1 for t in tokens if t in c)


async def load(page, url: str):
    await page.goto(url, wait_until="domcontentloaded", timeout=45000)
    await page.wait_for_timeout(1500)
    # Activa lazy-load sin esperar a que ACTC deje de hacer requests periódicos.
    await page.evaluate("""
      async () => {
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        for (let y = 0; y < document.body.scrollHeight; y += 700) {
          window.scrollTo(0, y);
          await sleep(90);
        }
        window.scrollTo(0, 0);
        await sleep(300);
      }
    """)


async def candidates_near_anchor(anchor, target: str):
    return await anchor.evaluate(
        """
        (anchor, target) => {
          const n = s => (s || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
          const tokens = n(target).split(/[^a-z0-9]+/).filter(x => x.length > 1);
          const out = [];
          const add = (src, score, context, kind, w=0, h=0) => {
            if (!src || src.startsWith('data:')) return;
            const low = n(src + ' ' + (context || ''));
            if (/logo|favicon|icon|sponsor|bandera|marca|tracker|pixel/.test(low)) score -= 60;
            if (tokens.some(t => low.includes(t))) score += 30;
            out.push({src, score, kind, w, h});
          };
          let node = anchor;
          for (let depth = 0; node && depth < 9; depth++, node = node.parentElement) {
            const context = (node.innerText || '') + ' ' + (node.className || '');
            for (const img of node.querySelectorAll('img')) {
              const src = img.currentSrc || img.src || img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src') || '';
              const w = img.naturalWidth || img.getBoundingClientRect().width || 0;
              const h = img.naturalHeight || img.getBoundingClientRect().height || 0;
              let score = 20 - depth * 2 + Math.min(20, Math.floor((w + h) / 150));
              if (h >= w && h > 150) score += 15;
              add(src, score, context + ' ' + (img.alt || ''), 'img', w, h);
            }
            for (const el of [node, ...node.querySelectorAll('*')]) {
              if (out.length > 80) break;
              for (const pseudo of [null, '::before', '::after']) {
                const bg = getComputedStyle(el, pseudo).backgroundImage || '';
                const m = bg.match(/url\\([\"']?(.*?)[\"']?\\)/);
                if (m && m[1]) {
                  const r = el.getBoundingClientRect();
                  let score = 12 - depth + Math.min(15, Math.floor((r.width + r.height) / 180));
                  if (r.height >= r.width && r.height > 150) score += 12;
                  add(m[1], score, context, pseudo ? 'pseudo-bg' : 'bg', r.width, r.height);
                }
              }
            }
          }
          out.sort((a,b) => b.score-a.score);
          return out.slice(0, 25);
        }
        """,
        target,
    )


async def candidates_on_profile(page, target: str):
    return await page.evaluate(
        """
        (target) => {
          const n = s => (s || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
          const tokens = n(target).split(/[^a-z0-9]+/).filter(x => x.length > 1);
          const out = [];
          const add = (src, score, context, kind, w=0, h=0) => {
            if (!src || src.startsWith('data:')) return;
            const low = n(src + ' ' + (context || ''));
            if (/logo|favicon|icon|sponsor|bandera|marca|tracker|pixel|banner/.test(low)) score -= 70;
            if (tokens.some(t => low.includes(t))) score += 35;
            if (/piloto|driver|corredor/.test(low)) score += 15;
            out.push({src, score, kind, w, h});
          };
          for (const img of document.images) {
            const src = img.currentSrc || img.src || img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy-src') || '';
            const w = img.naturalWidth || img.getBoundingClientRect().width || 0;
            const h = img.naturalHeight || img.getBoundingClientRect().height || 0;
            let score = Math.min(25, Math.floor((w+h)/130));
            if (h >= w && h > 180) score += 20;
            add(src, score, (img.alt || '') + ' ' + (img.parentElement?.innerText || ''), 'img', w, h);
          }
          for (const el of document.querySelectorAll('body *')) {
            if (out.length > 160) break;
            const r = el.getBoundingClientRect();
            if (r.width < 120 || r.height < 120) continue;
            for (const pseudo of [null, '::before', '::after']) {
              const bg = getComputedStyle(el, pseudo).backgroundImage || '';
              const m = bg.match(/url\\([\"']?(.*?)[\"']?\\)/);
              if (m && m[1]) {
                let score = Math.min(20, Math.floor((r.width+r.height)/150));
                if (r.height >= r.width) score += 15;
                add(m[1], score, el.innerText || '', pseudo ? 'pseudo-bg' : 'bg', r.width, r.height);
              }
            }
          }
          out.sort((a,b) => b.score-a.score);
          return out.slice(0, 35);
        }
        """,
        target,
    )


async def download(context, url: str, target: str, referer: str) -> bool:
    try:
        resp = await context.request.get(url, headers={"Referer": referer}, timeout=45000)
        if not resp.ok:
            print(f"  HTTP {resp.status}: {url}")
            return False
        ctype = (resp.headers.get("content-type") or "").lower()
        if not ctype.startswith("image/"):
            print(f"  no es imagen ({ctype}): {url}")
            return False
        data = await resp.body()
        if len(data) < 8000:
            print(f"  imagen demasiado chica ({len(data)}): {url}")
            return False
        ext = ".jpg"
        if "png" in ctype:
            ext = ".png"
        elif "webp" in ctype:
            ext = ".webp"
        path = OUT / f"{slug(target)}{ext}"
        path.write_bytes(data)
        print(f"  OK {path.name} | {len(data)} bytes | {url}")
        return True
    except Exception as e:
        print(f"  ERROR descarga {url}: {e}")
        return False


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 1200},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36",
        )
        list_page = await context.new_page()
        profile_page = await context.new_page()

        for cat, names in PILOTOS.items():
            list_url = f"https://www.actc.org.ar/{cat}/pilotos.html"
            print(f"\n===== {cat.upper()} =====")
            await load(list_page, list_url)

            links = []
            locator = list_page.locator("a[href*='pilotos']")
            for i in range(await locator.count()):
                a = locator.nth(i)
                try:
                    text = (await a.inner_text(timeout=1200)).strip()
                    href = await a.get_attribute("href")
                    if text and href:
                        links.append((a, text, href))
                except Exception:
                    pass
            print(f"links candidatos: {len(links)}")

            for target in names:
                print(f"\n{target}")
                ranked = sorted(links, key=lambda x: match_score(target, x[1]), reverse=True)
                if not ranked or match_score(target, ranked[0][1]) < 2:
                    print("  NO ENCONTRADO EN LISTADO")
                    continue

                anchor, text, href = ranked[0]
                profile_url = urljoin(list_url, href)
                print(f"  ficha: {profile_url}")
                saved = False

                for c in await candidates_near_anchor(anchor, target):
                    if c.get("score", 0) < 0:
                        continue
                    src = urljoin(list_url, c["src"])
                    if await download(context, src, target, list_url):
                        saved = True
                        break

                if saved:
                    continue

                try:
                    await load(profile_page, profile_url)
                    pc = await candidates_on_profile(profile_page, target)
                    print("  candidatos ficha:", pc[:5])
                    for c in pc:
                        if c.get("score", 0) < 0:
                            continue
                        src = urljoin(profile_url, c["src"])
                        if await download(context, src, target, profile_url):
                            saved = True
                            break
                except Exception as e:
                    print(f"  ERROR ficha: {e}")

                if not saved:
                    print("  *** SIN FOTO ***")

        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
