from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
import math

W,H=1080,1920
OUT=Path('public/barpran-trucco-bonelli-dianda-story.png')

# Palette
BG=(10,10,12)
WHITE=(245,243,238)
ASH=(168,168,172)
RED=(221,25,26)
DARK=(18,18,21)

img=Image.new('RGB',(W,H),BG)
d=ImageDraw.Draw(img)

# Cinematic motorsport-style background: asphalt / grandstand suggestion without fake cars.
# Sky/upper gradient
for y in range(H):
    t=y/H
    if y < 900:
        v=int(25-12*(y/900))
        col=(v,v,v+2)
    else:
        v=int(13-5*((y-900)/(H-900)))
        col=(v,v,v+1)
    d.line((0,y,W,y),fill=col)

# Track-perspective lines
vanish=(W//2,820)
for x0 in (-420,-220,0,220,440,660,880,1100,1300,1500):
    d.line((vanish[0],vanish[1],x0,H),fill=(26,26,29),width=2)
for y in range(920,H,90):
    d.line((0,y,W,y),fill=(20,20,23),width=1)

# Subtle grandstand lights / bokeh
for i in range(34):
    x=(i*83+41)%W
    y=470+(i*37)%250
    r=2+(i%3)
    d.ellipse((x-r,y-r,x+r,y+r),fill=(95,95,98))

# Red speed accents
d.polygon([(0,700),(W,570),(W,610),(0,745)],fill=(45,12,14))
d.polygon([(0,1530),(W,1440),(W,1460),(0,1555)],fill=(40,10,12))

# Checkered pattern near bottom, subtle
sq=42
for row in range(3):
    y=1760+row*sq
    for col in range(math.ceil(W/sq)):
        if (row+col)%2==0:
            d.rectangle((col*sq,y,(col+1)*sq,y+sq),fill=(23,23,26))

# Fonts
F_REG='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
F_BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
F_COND='/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf'
font_small=ImageFont.truetype(F_BOLD,24)
font_kicker=ImageFont.truetype(F_BOLD,30)
font_title=ImageFont.truetype(F_COND,93)
font_sub=ImageFont.truetype(F_COND,56)
font_name=ImageFont.truetype(F_COND,38)
font_micro=ImageFont.truetype(F_REG,21)

# Logo original
logo=Image.open('public/barpran-logo-negro.png').convert('RGBA')
# Trim transparent/white-ish outer margin conservatively
bbox=logo.getbbox()
if bbox: logo=logo.crop(bbox)
logo.thumbnail((650,230),Image.Resampling.LANCZOS)
# white backing to preserve original black/red logo readability
panel_w=760; panel_h=190; panel_x=(W-panel_w)//2; panel_y=70
d.rounded_rectangle((panel_x,panel_y,panel_x+panel_w,panel_y+panel_h),radius=4,fill=(250,250,248))
lx=(W-logo.width)//2; ly=panel_y+(panel_h-logo.height)//2
img.paste(logo,(lx,ly),logo)

# Header text
kicker='TURISMO CARRETERA  ·  PARANÁ 2026'
kw=d.textbbox((0,0),kicker,font=font_kicker)[2]
d.text(((W-kw)//2,305),kicker,font=font_kicker,fill=RED)

title='BARPRAN EN LO MÁS ALTO'
tb=d.textbbox((0,0),title,font=font_title)
tw=tb[2]-tb[0]
d.text(((W-tw)//2,355),title,font=font_title,fill=WHITE)

d.line((120,485,960,485),fill=RED,width=5)
sub='TRES GANADORES. UN MISMO EMBRAGUE.'
sb=d.textbbox((0,0),sub,font=font_sub)
sw=sb[2]-sb[0]
d.text(((W-sw)//2,510),sub,font=font_sub,fill=WHITE)

# Portrait helpers
slots=[(60,730,340,720,'JUAN MARTÍN','TRUCCO','public/pilotos/juan-martin-trucco.png'),
       (370,690,340,760,'NICOLÁS','BONELLI','public/pilotos/nicolas-bonelli.png'),
       (680,730,340,720,'MARCO','DIANDA','public/pilotos/marco-dianda.png')]

for x,y,w,h,first,last,path in slots:
    p=Image.open(path).convert('RGBA')
    # Preserve official ACTC image; only scale, no face manipulation.
    # Fit inside equal-height area.
    ratio=min(w/p.width,h/p.height)
    nw,nh=int(p.width*ratio),int(p.height*ratio)
    p=p.resize((nw,nh),Image.Resampling.LANCZOS)

    # soft halo behind portrait
    halo=Image.new('RGBA',(w+60,h+60),(0,0,0,0))
    hd=ImageDraw.Draw(halo)
    hd.ellipse((15,70,w+45,h+40),fill=(120,0,0,85))
    halo=halo.filter(ImageFilter.GaussianBlur(35))
    img.paste(halo,(x-30,y-30),halo)

    px=x+(w-nw)//2
    py=y+h-nh
    img.paste(p,(px,py),p)

    # Equal-name plates
    plate_y=1450
    center=x+w//2
    first_text=first
    last_text=last
    b=d.textbbox((0,0),first_text,font=font_micro); d.text((center-(b[2]-b[0])//2,plate_y),first_text,font=font_micro,fill=ASH)
    b=d.textbbox((0,0),last_text,font=font_name); d.text((center-(b[2]-b[0])//2,plate_y+30),last_text,font=font_name,fill=WHITE)
    d.line((center-110,plate_y+80,center+110,plate_y+80),fill=RED,width=4)

# Closing statement
statement='LOS TRES, CON EMBRAGUE BARPRAN'
b=d.textbbox((0,0),statement,font=font_sub); sw=b[2]-b[0]
d.text(((W-sw)//2,1600),statement,font=font_sub,fill=WHITE)

micro='Ingeniería argentina de competición · +50 años en el automovilismo'
b=d.textbbox((0,0),micro,font=font_micro); mw=b[2]-b[0]
d.text(((W-mw)//2,1680),micro,font=font_micro,fill=ASH)

# Bottom brand line
d.rectangle((120,1735,960,1740),fill=RED)
footer='EL EMBRAGUE DEL AUTOMOVILISMO'
b=d.textbbox((0,0),footer,font=font_kicker); fw=b[2]-b[0]
d.text(((W-fw)//2,1790),footer,font=font_kicker,fill=WHITE)

OUT.parent.mkdir(parents=True,exist_ok=True)
img.save(OUT,optimize=True)
print(OUT)
