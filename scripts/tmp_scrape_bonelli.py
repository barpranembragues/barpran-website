import asyncio
from pathlib import Path
from urllib.parse import urljoin
from playwright.async_api import async_playwright

OUT = Path('public/pilotos/nicolas-bonelli.png')
PROFILE = 'https://www.actc.org.ar/tc/pilotos/2026/nicolas-bonelli_10692.html'

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 1200}, user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36')
        await page.goto(PROFILE, wait_until='domcontentloaded', timeout=90000)
        await page.wait_for_timeout(2500)
        candidates = await page.evaluate('''() => {
          const out=[];
          for (const img of [...document.images]) {
            const src = img.currentSrc || img.src || img.getAttribute('data-src') || img.getAttribute('data-original') || '';
            if (!src) continue;
            const w=img.naturalWidth||0,h=img.naturalHeight||0;
            let score = Math.min(20,Math.floor(w/80))+Math.min(20,Math.floor(h/80));
            if (h>=w) score += 12;
            const s=(src+' '+(img.alt||'')).toLowerCase();
            if (/piloto|driver|bonelli/.test(s)) score += 20;
            if (/logo|icon|banner|marca|bandera|sponsor/.test(s)) score -= 40;
            out.push({src,score,w,h,alt:img.alt||''});
          }
          return out.sort((a,b)=>b.score-a.score).slice(0,25);
        }''')
        print(candidates[:10])
        for c in candidates:
            if c['score'] < 0: continue
            src=urljoin(PROFILE,c['src'])
            try:
                resp=await page.request.get(src, headers={'Referer':PROFILE}, timeout=60000)
                ct=(resp.headers.get('content-type') or '').lower()
                data=await resp.body()
                if resp.ok and ct.startswith('image/') and len(data)>10000:
                    OUT.parent.mkdir(parents=True,exist_ok=True)
                    OUT.write_bytes(data)
                    print('SAVED',src,len(data),ct)
                    break
            except Exception as e:
                print('ERR',src,e)
        await browser.close()

asyncio.run(main())
