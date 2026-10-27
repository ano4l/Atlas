from pathlib import Path
import html, json, re
from PIL import Image as PILImage
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle, PageBreak, NextPageTemplate, Image, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from fund_proposal_content import build_pages

ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parents[1]
FUND=json.loads((ROOT/'fund-plan-results.json').read_text())
pages=build_pages(FUND)
for name,file in [('Atlas','arial.ttf'),('Atlas-Bold','arialbd.ttf'),('Atlas-Italic','ariali.ttf')]:
 pdfmetrics.registerFont(TTFont(name,str(Path('C:/Windows/Fonts')/file)))
pdfmetrics.registerFontFamily('Atlas',normal='Atlas',bold='Atlas-Bold',italic='Atlas-Italic',boldItalic='Atlas-Bold')
navy=colors.HexColor('#152B3C'); blue=colors.HexColor('#365CF5'); muted=colors.HexColor('#526876')
styles={
 'body':ParagraphStyle('body',fontName='Atlas',fontSize=10,leading=14.6,textColor=navy,spaceAfter=10),
 'small':ParagraphStyle('small',fontName='Atlas',fontSize=8.3,leading=11.6,textColor=muted,spaceAfter=7),
 'title':ParagraphStyle('title',fontName='Atlas-Bold',fontSize=25,leading=29,textColor=navy,spaceAfter=7),
 'strap':ParagraphStyle('strap',fontName='Atlas',fontSize=10.5,leading=14,textColor=blue,spaceAfter=18),
 'wideTitle':ParagraphStyle('wideTitle',fontName='Atlas-Bold',fontSize=20,leading=24,textColor=navy,spaceAfter=4),
 'wideStrap':ParagraphStyle('wideStrap',fontName='Atlas',fontSize=8.5,leading=10,textColor=blue,spaceAfter=8),
 'h':ParagraphStyle('h',fontName='Atlas-Bold',fontSize=11.5,leading=16,textColor=navy,spaceBefore=8,spaceAfter=6),
 'cell':ParagraphStyle('cell',fontName='Atlas',fontSize=8.8,leading=12,textColor=navy),
 'thead':ParagraphStyle('thead',fontName='Atlas-Bold',fontSize=8.8,leading=12,textColor=colors.white),
 'cover':ParagraphStyle('cover',fontName='Atlas-Bold',fontSize=44,leading=48,textColor=navy,spaceAfter=15),
 'hero':ParagraphStyle('hero',fontName='Atlas-Bold',fontSize=26,leading=32,textColor=navy,spaceAfter=12),
}
def esc(t):
 t=html.escape(str(t))
 return re.sub(r'(https://[^\s<]+)',lambda m:f'<link href="{m.group(1)}" color="#365CF5">{m.group(1)}</link>',t)
def P(t,sty='body'):return Paragraph(esc(t),styles[sty])
def picture(rel,maxw,maxh):
 path=ROOT/rel
 if not path.is_file():raise FileNotFoundError(f'Required mockup not ready: {path}')
 with PILImage.open(path) as im:w,h=im.size
 ratio=min(maxw/w,maxh/h)
 return Image(str(path),width=w*ratio,height=h*ratio,hAlign='CENTER')

md=['# Atlas | Fund application and product concepts','',
 'Prepared 28 October 2026. Funding requested: R100,000 over 12 months. Application pending.','']
for p in pages:
 md+=['## '+p['title'],'',p.get('strap',''),'']
 for typ,b in p['blocks']:
  if typ in ('p','n'):md +=[b,'']
  elif typ=='h':md+=['### '+b,'']
  elif typ=='b':md+=['- '+x for x in b]+['']
  elif typ=='t':
   heads,rows,_=b;md+=['| '+' | '.join(heads)+' |','| '+' | '.join(['---']*len(heads))+' |']+['| '+' | '.join(r)+' |' for r in rows]+['']
  elif typ in ('image','coverimage'):
   rel,caption=b;md +=[f'![{caption}]({rel})','',caption,'']
(ROOT/'Atlas-Business-Proposal.md').write_text('\n'.join(md),encoding='utf-8')

pdfpath=REPO/'output/pdf/Atlas-Commercial-Proposal.pdf'
doc=BaseDocTemplate(str(pdfpath),pagesize=A4,title='Atlas | R100,000 fund application and product concepts',author='Atlas',pageCompression=1)
def footer(c,d):
 w,h=c._pagesize;c.setFillColor(muted);c.setFont('Atlas',8)
 c.drawString(42,24,'ATLAS / FUND APPLICATION / 28 OCT 2026');c.drawRightString(w-42,24,f'{d.page:02d}')
portrait=Frame(42,43,A4[0]-84,A4[1]-86,id='portrait-frame',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
lw,lh=landscape(A4);wide=Frame(36,36,lw-72,lh-72,id='landscape-frame',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
doc.addPageTemplates([PageTemplate(id='portrait',frames=portrait,pagesize=A4,onPage=footer),PageTemplate(id='landscape',frames=wide,pagesize=landscape(A4),onPage=footer)])
story=[]
for idx,p in enumerate(pages):
 if idx:story +=[NextPageTemplate(p.get('mode','portrait')),PageBreak()]
 cover=idx==0;iswide=p.get('mode')=='landscape'
 if cover:
  story +=[Spacer(1,22),P('ATLAS','cover'),P(p['title'],'hero'),P(p['strap'],'strap')]
 else:
  story +=[P(p['title'],'wideTitle' if iswide else 'title'),P(p.get('strap',''),'wideStrap' if iswide else 'strap')]
 for typ,b in p['blocks']:
  if typ=='p':story.append(P(b))
  elif typ=='h':story.append(P(b,'h'))
  elif typ=='n':story.append(P(b,'small'))
  elif typ=='b':
   for x in b:story.append(Paragraph('&#8226; '+esc(x),styles['body']))
  elif typ in ('image','coverimage'):
   rel,caption=b
   if iswide:maxw,maxh=lw-72,425
   elif typ=='coverimage':maxw,maxh=A4[0]-84,326
   else:maxw,maxh=A4[0]-84,485
   story.append(KeepTogether([picture(rel,maxw,maxh),Spacer(1,12),P(caption,'small')]))
  else:
   heads,rows,widths=b;data=[[P(x,'thead') for x in heads]]+[[P(x,'cell') for x in r] for r in rows]
   t=Table(data,colWidths=widths or [(A4[0]-84)/len(heads)]*len(heads),repeatRows=1,hAlign='LEFT')
   t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),navy),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#F1F5F6')])]))
   story +=[t,Spacer(1,14)]
doc.build(story)
print(pdfpath)
print('Designed pages:',len(pages),'(portrait and landscape)')
