import json, os
from PIL import Image, ImageDraw, ImageFilter
L=[json.loads(l) for l in open('data/items.jsonl')]
OUT='site/img'
import sys
ONLY_MAIN=sys.argv[1] if len(sys.argv)>1 else None
for d in ('m','d','p'): os.makedirs(f'{OUT}/{d}',exist_ok=True)
# left edge of the right-hand text column, per page (None = no patch needed)
P={1:538,2:522,5:488,6:530,9:520,66:552,67:None,68:538,89:538,4:None,8:None,10:None}
# engraved numbers that give the answer away
BLUR={49:[325,1095,380,1160],50:[325,1125,385,1190],51:[305,1120,370,1180],
      52:[315,1065,390,1135],53:[295,1090,370,1160],54:[310,1065,395,1135],
      55:[290,1080,375,1150],56:[310,1065,395,1140]}
def circ(img, box, size=360):
    c=img.crop(tuple(box)).resize((size,size),Image.LANCZOS).convert('RGBA')
    m=Image.new('L',(size*4,size*4),0)
    r=size*4*0.475
    ImageDraw.Draw(m).ellipse([size*2-r,size*2-r,size*2+r,size*2+r],fill=255)
    m=m.resize((size,size),Image.LANCZOS)
    c.putalpha(m)
    return c
for it in L:
    n=it['n']
    pg=Image.open(f'pages/p{n:03d}.jpg').convert('RGB')
    if ONLY_MAIN is None:
        full=pg.copy(); full.thumbnail((900,1400),Image.LANCZOS)
        full.save(f'{OUT}/p/{n:03d}.webp',quality=74,method=6)
    if it['kind']=='cmp' and ONLY_MAIN is not None: continue
    if it['kind']=='cmp':
        for k,(nm,txt,box) in enumerate(it['pair']):
            circ(pg,box).save(f'{OUT}/d/{n:03d}{"ab"[k]}.webp',quality=82,method=6)
        continue
    work=pg.copy()
    if n in BLUR:
        x0,y0,x1,y1=BLUR[n]
        reg=work.crop((x0-20,y0-20,x1+20,y1+20))
        bl=reg.filter(ImageFilter.GaussianBlur(9))
        mk=Image.new('L',reg.size,0)
        ImageDraw.Draw(mk).rounded_rectangle([14,14,reg.size[0]-14,reg.size[1]-14],radius=12,fill=255)
        mk=mk.filter(ImageFilter.GaussianBlur(6))
        reg.paste(bl,(0,0),mk)
        work.paste(reg,(x0-20,y0-20))
    x0,y0,x1,y1=it['crop']
    # trim a cyan title underline caught at the top edge
    for y in range(y0,y0+16):
        row=[work.getpixel((x,y)) for x in range(x0,x1,3)]
        cy=sum(1 for r,g,b in row if b>170 and g>140 and r<150)
        if cy>0.45*len(row): print('trim',n,y); y0=max(y0,y+5)
    px=P.get(n,533)
    if px is not None and x1>px:
        # extend the background column left of the text panels across them
        for y in range(500,966):
            row=[work.getpixel((x,y)) for x in range(px-14,px-2)]
            r=sorted(row)[len(row)//2]
            for x in range(px-2,x1):
                work.putpixel((x,y),r)
        # soften the seam
        band=work.crop((px-10,495,x1,971)).filter(ImageFilter.GaussianBlur(3))
        work.paste(band,(px-10,495))
    m=work.crop((x0,y0,x1,y1))
    m.save(f'{OUT}/m/{n:03d}.webp',quality=80,method=4)
    if it['det'] and ONLY_MAIN is None:
        circ(pg,it['det']).save(f'{OUT}/d/{n:03d}.webp',quality=82,method=6)
print('done')
