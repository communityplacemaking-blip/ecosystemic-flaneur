#!/usr/bin/env python3
"""Builds the two design directions (a = Urban Night, b = Living Ecosystem) as preview pages.

Content is taken verbatim from the live pages of the site at build time, so the prototypes never
rewrite approved wording. The mechanism pages load the live mechanism code unchanged.
Run from the repository root:  python3 preview/worlds/_build/build.py
"""
import copy, os, posixpath, random, re
from bs4 import BeautifulSoup, NavigableString, Tag, Comment

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT = os.path.join(ROOT, 'preview', 'worlds')
PAGES = ['', 'the-wanderer', 'flaneur', 'method', 'academy', 'library', 'journey', 'mechanism']
DIRS = {
    'a': {'name': 'לילה עירוני', 'en': 'Urban Night', 'sky': 'night'},
    'b': {'name': 'אקוסיסטם חי', 'en': 'Living Ecosystem', 'sky': 'day'},
}
LIVE = 'https://communityplacemaking-blip.github.io/ecosystemic-flaneur/'


def soup(p):
    return BeautifulSoup(open(os.path.join(ROOT, p), encoding='utf-8').read(), 'html.parser')


# ---------------------------------------------------------------- links
class Ctx:
    def __init__(self, d, page):
        self.d, self.page = d, page
        self.depth = 3 if page == '' else 4
        self.root = '../' * self.depth          # to the repository root
        self.assets = ('../' if page == '' else '../../') + 'assets/'
        self.img = self.root + 'img/'

    def to(self, key, frag=''):
        if key == self.page:
            return frag or './'
        base = ('' if self.page == '' else '../') + (key + '/' if key else '')
        return (base or './') + frag

    def link(self, href, srcdir):
        if not href or href.startswith(('mailto:', 'http', 'tel:')):
            return href
        if href.startswith('#'):
            return href
        path, _, frag = href.partition('#')
        full = posixpath.normpath(posixpath.join(srcdir or '.', path)) if path else srcdir.rstrip('/')
        if full in ('.', ''):
            full = ''
        key = full.split('/')[0] if full else ''
        rest = full[len(key):].strip('/')
        f = ('#' + frag) if frag else ''
        if key in PAGES and not rest:
            return self.to(key, f)
        return self.root + (full + '/' if full and not os.path.splitext(full)[1] else full) + f


# ---------------------------------------------------------------- translation of live markup
KEEP = {'p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'b', 'strong', 'em', 'span', 'a', 'br', 'blockquote', 'cite', 'div',
        'aside', 'article', 'figure', 'figcaption', 'img', 'dl', 'dt', 'dd', 'details', 'summary', 'small', 'nav', 'i', 'q', 'sup'}
CLASSMAP = {
    'w-big': 'big', 'pull': 'pull', 'moment': 'moment', 'm-k': 'mk', 'quiet': 'quiet', 'w-prose': 'prose', 'prose': 'prose',
    'w-two': 'split top', 'w-h3': 'subh', 'w-lead2': 'lead', 'lead': 'lead', 'small': 'small', 'more': 'more', 'btn': 'btn',
    'primary': 'go', 'triad': 'triad', 'widen-box': 'widen-box', 'widen': 'widen', 'pairs': 'pairs', 'way': 'card', 'sp': 'card',
    'three-ways': 'cards', 'spaces': 'cards', 'caps': 'ticks', 'verbs': 'verbs', 'notes-board': 'ticks', 'h-sub': 'k', 'common': 'big',
    'ex': 'quiet', 'mrow': 'mrow', 'pr': 'card', 'constel': 'cards', 'mtable': 'mtable', 'mhead': 'mrow mh', 'time': 'ticks', 'qs': 'qs',
    'pro-story': 'ticks', 'for6': 'ticks', 'offer6': 'cards', 'pro-found': 'dlx', 'duo': 'split top', 'pair2': 'split top', 'sh-two': 'split top',
    'roots3': 'cards', 'five5': 'cards', 'ac-two': 'split top', 'src-line': 'srcl', 'roots': 'srcl', 'bridge': 'big', 'f0': 'big', 'f1': 'big', 'f2': 'big',
    'w-motto': 'subh', 'power': 'card', 'row': 'row', 'r2': 'row', 'honest': 'quiet', 'rd': 'rd', 'known': 'known', 'reading': 'reading',
    'w-gloss': 'quiet', 'btns': 'btns', 'light': 'card', 'mid': 'card m', 'light': 'card', 'dark': 'card', 'quote': 'pull',
}
DROP_CLASSES = {'walker-fig', 'horizon', 'dot', 'star', 'tag', 'label-chip', 'state', 'w-num', 'num', 'kicker', 'ring', 'f-walk',
                'route-svg', 'route-fig', 'compass-box', 'noise', 'gridbg', 'toc', 'short-toc', 'w-down', 'copied', 'lc-ours', 'lc-src', 't-ext', 't-dec'}
DROP_TEXT = re.compile(r'נוסח מאושר|החלטה של היוצר|מתוך ההנחיה שלך|טרם נוסח|בבדיקה|ממתין לאישור|יתווסף')


def translate(el, ctx, srcdir, keep_svg=False):
    """Copies live markup into the new world: keeps text and inline semantics, maps classes, drops visual scaffolding."""
    el = copy.copy(el)
    for c in el.find_all(string=lambda s: isinstance(s, Comment)):
        c.extract()
    for t in list(el.find_all(True)):
        if t.parent is None:
            continue
        cls = set(t.get('class') or [])
        if cls & DROP_CLASSES or t.name in ('script', 'style', 'button', 'input', 'label', 'fieldset', 'textarea', 'form'):
            t.decompose(); continue
        if t.name == 'svg':
            if keep_svg and 'ripple' in cls:
                continue
            t.decompose(); continue
        if t.find_parent('svg'):
            continue
        if t.name in ('span', 'p') and DROP_TEXT.search(t.get_text()) and len(t.get_text(strip=True)) < 40:
            t.decompose(); continue
    for t in el.find_all(True):
        if t.find_parent('svg') or t.name == 'svg':
            continue
        cls = t.get('class') or []
        newc = ' '.join(CLASSMAP[c] for c in cls if c in CLASSMAP)
        attrs = {}
        for k in ('href', 'dir', 'lang', 'src', 'alt', 'width', 'height', 'id', 'open'):
            if t.has_attr(k):
                attrs[k] = t[k]
        if 'href' in attrs:
            attrs['href'] = ctx.link(attrs['href'], srcdir)
        if 'src' in attrs:
            attrs['src'] = ctx.link(attrs['src'], srcdir)
            attrs['loading'] = 'lazy'
        if 'id' in attrs and t.name not in ('h2', 'h3'):
            del attrs['id']
        if newc:
            attrs['class'] = newc
        if t.name == 'i' and not t.get_text(strip=True):
            t.decompose(); continue
        if t.name not in KEEP:
            t.name = 'div'
        t.attrs = attrs
    return el


def inner(el):
    return ''.join(str(c) for c in el.contents).strip() if el else ''


def txt(el):
    return ' '.join(el.get_text(' ', strip=True).split()) if el else ''


# ---------------------------------------------------------------- shared chrome
NAV = [('the-wanderer', 'המשוטט'), ('flaneur', 'השיטה'), ('journey', 'המנגנון'), ('try', '10 דקות'), ('library', 'הספרייה'), ('academy', 'אקדמי ומקצועי')]
TERR = [  # key, title, line, x%, y%
    ('', 'המסע', 'מאיפה הכול צמח', 50, 48),
    ('the-wanderer', 'המשוטט', 'הדמות, והאורות שלה', 20, 24),
    ('flaneur', 'השיטה בקצרה', 'שבע התנועות, בעמוד אחד', 64, 16),
    ('method', 'השיטה לעומק', 'עם המקורות', 88, 36),
    ('journey', 'המנגנון', 'לצאת לשוטט', 74, 74),
    ('mechanism', 'מסע בחמישה שלבים', 'יציאה אישית, צעד אחר צעד', 93, 88),
    ('academy', 'אקדמי ומקצועי', 'לעבוד יחד', 30, 80),
    ('library', 'הספרייה', 'רעיונות ותבניות מסע', 9, 54),
]
TLINKS = [('', 'the-wanderer'), ('', 'flaneur'), ('', 'method'), ('', 'journey'), ('', 'academy'), ('', 'library'),
          ('the-wanderer', 'flaneur'), ('flaneur', 'method'), ('journey', 'mechanism'), ('journey', 'library'), ('academy', 'method'), ('the-wanderer', 'library')]


def head(ctx, title, desc):
    D = DIRS[ctx.d]
    return f'''<!doctype html>
<html lang="he" dir="rtl" data-dir="{ctx.d}" data-sky="{D['sky']}" data-theme="{'light' if D['sky'] == 'day' else 'dark'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>{title} | המשוטט · The Ecosystemic Flâneur</title>
<meta name="description" content="{desc}">
<script>(function(){{var h=document.documentElement,s=null;try{{s=new URLSearchParams(location.search).get('sky')||localStorage.getItem('ef-sky')}}catch(e){{}}if(s==='day'||s==='night'){{h.setAttribute('data-sky',s);h.setAttribute('data-theme',s==='day'?'light':'dark')}}h.classList.add('js')}})()</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@300;400;500;700&family=Heebo:wght@300;400;500;600;700;800&display=swap">
'''


def header(ctx):
    nav = ''.join(f'<a href="{ctx.to(k)}"{" aria-current=\"page\"" if k == ctx.page else ""}>{n}</a>' for k, n in NAV)
    return f'''<a class="skip" href="#main">דלגו לתוכן</a>
<header class="wb"><div class="wb-in">
<a class="brand" href="{ctx.to('')}"><span class="fig-mini"><img src="{ctx.img}flaneur-figure.png" alt="" width="25" height="22"></span>המשוטט</a>
<nav class="wb-nav" aria-label="עמודים">{nav}</nav>
<button class="sky" type="button" aria-pressed="false"><span class="sky-ic" aria-hidden="true"></span><span class="sky-l">אל הלילה</span></button>
<button class="terr-btn" type="button" aria-expanded="false" aria-controls="terr"><svg class="ti" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 14 C6 9 9 12 15 4"/><circle cx="3" cy="14" r="2"/><circle cx="15" cy="4" r="2"/><circle cx="9" cy="10" r="1.6"/></svg><span class="tl">המפה</span></button>
</div></header>
{territories(ctx)}'''


def territories(ctx):
    pos = {k: (x, y) for k, _, _, x, y in TERR}
    paths = []
    for a, b in TLINKS:
        (x1, y1), (x2, y2) = pos[a], pos[b]
        X1, Y1, X2, Y2 = x1 * 16, y1 * 9, x2 * 16, y2 * 9
        mx, my = (X1 + X2) / 2 + (Y2 - Y1) * .18, (Y1 + Y2) / 2 - (X2 - X1) * .18
        paths.append(f'<path class="tp" d="M{X1:.0f} {Y1:.0f} Q{mx:.0f} {my:.0f} {X2:.0f} {Y2:.0f}"/>')
    rings = ''.join(f'<ellipse class="tc" cx="800" cy="430" rx="{r * 1.6:.0f}" ry="{r:.0f}"/>' for r in (150, 260, 380))
    nodes = ''.join(
        f'<a class="t-node" href="{ctx.to(k)}" style="--x:{x}%;--y:{y}%"{" aria-current=\"page\"" if k == ctx.page else ""}><i></i><b>{t}</b><small>{s}</small></a>'
        for k, t, s, x, y in TERR)
    return f'''<div class="terr" id="terr" role="dialog" aria-modal="true" aria-labelledby="terr-h" hidden>
<div class="terr-in">
<div class="terr-h"><h2 id="terr-h">המפה של המשוטט</h2><button class="terr-close" type="button">לסגור</button></div>
<div class="terr-map"><svg viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">{rings}{''.join(paths)}</svg>{nodes}</div>
</div></div>'''


def spine(items):
    if not items:
        return ''
    return '<nav class="spine" aria-label="בעמוד הזה">' + ''.join(f'<a href="#{i}"><i></i><span>{l}</span></a>' for i, l in items) + '</nav>'


def seam(seed):
    r = random.Random(seed)
    pts = []
    x = -20
    while x < 1460:
        pts.append((x, 27 + r.uniform(-14, 14)))
        x += r.uniform(110, 200)
    d = 'M' + ' '.join(f'{p[0]:.0f} {p[1]:.0f}' for p in pts[:1])
    for i in range(1, len(pts)):
        (x0, y0), (x1, y1) = pts[i - 1], pts[i]
        d += f' C{x0 + 60:.0f} {y0:.0f} {x1 - 60:.0f} {y1:.0f} {x1:.0f} {y1:.0f}'
    dots = ''.join(f'<circle cx="{p[0]:.0f}" cy="{p[1]:.0f}" r="{r.choice([2.2, 3, 4]):.1f}"/>' for p in r.sample(pts[1:-1], min(3, len(pts) - 2)))
    return f'<div class="seam" aria-hidden="true"><svg viewBox="0 0 1440 54" preserveAspectRatio="none"><path d="{d}"/>{dots}</svg></div>'


def footer(ctx):
    links = ''.join(f'<a href="{ctx.to(k)}">{t}</a>' for k, t, _, _, _ in TERR)
    return f'''<footer class="wf"><div class="wrap"><span class="wf-brand">המשוטט · <span lang="en" dir="ltr">The Ecosystemic Flâneur</span></span>{links}<span>איורים: ליאל</span></div></footer>'''


def scripts(ctx, extra=''):
    return f'<script src="{ctx.assets}field.js"></script>\n{extra}<script src="{ctx.assets}worlds.js"></script>\n</body>\n</html>\n'


def page(ctx, title, desc, body, spine_items=(), extra_head='', extra_js='', body_cls='', pre=''):
    return (head(ctx, title, desc) + f'<link rel="stylesheet" href="{ctx.assets}worlds.css">\n{extra_head}</head>\n'
            + f'<body class="pg-{ctx.page or "home"} {body_cls}">\n' + header(ctx) + pre + spine(spine_items)
            + f'\n<main id="main">\n{body}\n</main>\n' + footer(ctx) + '\n' + scripts(ctx, extra_js))


def fig(ctx, cap=True, cls='hero-fig'):
    c = '<span class="hero-cap">הדמות ההולכת: איור מקורי של ליאל</span>' if cap else ''
    return f'<div class="{cls}"><img src="{ctx.img}flaneur-figure.png" alt="הדמות ההולכת: איור מקורי של ליאל" width="480" height="415">{c}</div>'


def hero(ctx, seed, labels, text, inner_cls='inner', anchor='.3,.72', density=1):
    return f'''<section class="hero {inner_cls}" data-listen>
<div class="field" data-field="{seed}-{ctx.d}" data-labels="{'|'.join(labels)}" data-anchor="{anchor}" data-density="{density}"></div>
<div class="wrap"><div class="hero-text">{text}</div>{fig(ctx)}</div>
</section>'''


def section(sid, inner_html, cls='', label=None):
    lab = f' aria-labelledby="{label}"' if label else ''
    return f'<section class="sec {cls}" id="{sid}"{lab}><div class="wrap">{inner_html}</div></section>'


def illus(ctx, src, alt, title, text, w=1200, h=800):
    return f'''<figure class="ill rv"><div class="frame"><img src="{ctx.img}{src}" alt="{alt}" width="{w}" height="{h}" loading="lazy"></div><figcaption><b>{title}</b>{text}</figcaption></figure>'''


def moves_block(ctx, src_loop, side_html):
    bs = src_loop.select('li > button')
    btns = ''
    for i, b in enumerate(bs):
        name = txt(b.select_one('b'))
        btns += f'<button type="button" data-k="{i}" data-name="{name}" data-d="{b.get("data-d", "")}" style="--i:{i}" aria-pressed="{"true" if i == 0 else "false"}"><i aria-hidden="true"></i>{name}<small>{i + 1}</small></button>'
    return f'''<div class="moves">
<div class="mv-ring" data-pick="#pk" role="group" aria-label="שבע התנועות">
<svg class="orbit" viewBox="0 0 100 100" aria-hidden="true"><ellipse class="o1" cx="50" cy="50" rx="42" ry="42"/><ellipse class="o2" cx="50" cy="50" rx="47" ry="45"/></svg>
<div class="mv-center"><img src="{ctx.img}flaneur-figure.png" alt="" width="480" height="415"></div>
{btns}</div>
<div class="pk" id="pk" aria-live="polite"><span class="pk-n"></span><p class="pk-d"></p>{side_html}</div>
</div>'''


def five_block(items):
    """items: list of (title, text) in the live order. The middle measure sits in the centre."""
    mid = [x for x in items if 'מידת האמצע' in x[0]]
    rest = [x for x in items if 'מידת האמצע' not in x[0]]
    out = '<div class="five rv"><svg class="ties" viewBox="0 0 300 300" preserveAspectRatio="none" aria-hidden="true"><path d="M50 40 Q120 110 150 150 M250 40 Q180 110 150 150 M50 260 Q120 190 150 150 M250 260 Q180 190 150 150"/></svg>'
    if mid:
        out += f'<article class="card m"><h3>{mid[0][0]}</h3><p>{mid[0][1]}</p></article>'
    for i, (t, p) in enumerate(rest[:4]):
        out += f'<article class="card c{i + 1}"><h3>{t}</h3><p>{p}</p></article>'
    return out + '</div>'


# ---------------------------------------------------------------- the threshold (home)
def threshold(ctx):
    rnd = random.Random('th')
    day = ''.join(f'<path d="M{rnd.randint(-50, 400)} {rnd.randint(0, 900)} C{rnd.randint(0, 600)} {rnd.randint(0, 900)} {rnd.randint(0, 600)} {rnd.randint(0, 900)} {rnd.randint(300, 700)} {rnd.randint(0, 900)}" fill="none" stroke="#112B48" stroke-opacity=".14" stroke-width="1.2"/>' for _ in range(16))
    day += ''.join(f'<ellipse cx="{rnd.randint(60, 560)}" cy="{rnd.randint(80, 820)}" rx="{r}" ry="{r * .8:.0f}" fill="none" stroke="#B65E3E" stroke-opacity=".22"/>' for r in (40, 70, 100, 30, 55))
    day += '<path d="M40 760 C160 640 260 700 330 560 S420 380 560 300" fill="none" stroke="#C2902A" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>'
    night = ''.join(f'<circle cx="{rnd.randint(0, 600)}" cy="{rnd.randint(0, 900)}" r="{rnd.choice([.6, .9, 1.3, 1.8])}" fill="#FFF4D6" fill-opacity="{rnd.uniform(.25, .9):.2f}"/>' for _ in range(140))
    night += '<path d="M560 140 L470 230 L390 210 L300 330 L210 300 L120 420" fill="none" stroke="#E8B54D" stroke-opacity=".55" stroke-width="1"/>'
    night += ''.join(f'<circle cx="{x}" cy="{y}" r="3.2" fill="#F0C66A"/>' for x, y in ((560, 140), (470, 230), (390, 210), (300, 330), (210, 300), (120, 420)))
    night += '<ellipse cx="300" cy="520" rx="420" ry="160" fill="none" stroke="#5BBDB3" stroke-opacity=".22" transform="rotate(-14 300 520)"/>'
    return f'''<div class="threshold" role="dialog" aria-modal="true" aria-labelledby="th-q" hidden>
<p class="th-q" id="th-q">באיזו שעה תרצו להיכנס לעולם של המשוטט?</p>
<button class="th-side th-day" type="button" data-enter="day">
<span class="th-map" aria-hidden="true"><svg viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice">{day}</svg></span>
<span class="th-k">Wander by Day</span><span class="th-t">לשוטט ביום</span>
<span class="th-d">העיר מתגלה כמפה חיה: שבילים, שכונות, אנשים ומקומות שנפגשים.</span><span class="th-go">להיכנס ביום</span></button>
<button class="th-side th-night" type="button" data-enter="night">
<span class="th-map" aria-hidden="true"><svg viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice">{night}</svg></span>
<span class="th-k">Wander by Night</span><span class="th-t">לשוטט בלילה</span>
<span class="th-d">העיר מתגלה כרשת של אורות, שבילים וקבוצות כוכבים שמתהוות.</span><span class="th-go">להיכנס בלילה</span></button>
<div class="th-mid" aria-hidden="true"><span class="th-fig"><img src="{ctx.img}flaneur-figure.png" alt="" width="480" height="415"></span></div>
</div>'''


# ---------------------------------------------------------------- pages
def p_home(ctx):
    s = soup('index.html')
    h = s.select_one('.h-hero')
    by = translate(h.select_one('.by'), ctx, '')
    text = f'''<p class="kick ltr" lang="en">The Ecosystemic Flâneur</p>
<h1><span class="under">המשוטט</span></h1>
<p class="lead" style="font-size:1.35em">{inner(h.select_one('.lead'))}</p>
<p class="sub" style="opacity:.85">שוטטות אקוסיסטמית · <span lang="en" dir="ltr" style="white-space:nowrap">The Ecosystemic Flâneur</span></p>
<p class="sub">{inner(by)}</p>
<div class="btns"><a class="btn go" href="#journey">{txt(h.select('.btns a')[0])}</a><a class="btn" href="{ctx.to('journey')}">{txt(h.select('.btns a')[1])}</a></div>'''
    labels = [txt(t) for t in h.select('svg text')] or ['רחוב', 'משחק', 'שאלה', 'שולחן משותף', 'הקשבה', 'חלום', 'שכונה', 'מפגש']
    body = hero(ctx, 'home', labels, text, inner_cls='', anchor='.28,.78', density=1.15)

    # 01 the journey between worlds
    j = s.select_one('#journey')
    nodes = ''
    for b in j.select('.wn'):
        st = b.get('style', '')
        n = b['data-n']
        if 'hub' in (b.get('class') or []):
            nodes += f'<button type="button" class="wn hub" data-n="{n}" style="{st}" aria-pressed="false"><span class="d"><img src="{ctx.img}flaneur-figure.png" alt="" width="480" height="415"></span><b>{txt(b.select_one("b"))}</b></button>'
        else:
            nodes += f'<button type="button" class="wn" data-n="{n}" style="{st}" aria-pressed="false"><span class="d" aria-hidden="true"></span><b>{txt(b.select_one("b"))}</b><small>{txt(b.select_one("small"))}</small></button>'
    stories = ''
    for a in j.select('.story'):
        t = translate(a, ctx, '')
        stories += f'<article class="story" id="{a["id"]}">{inner(t)}</article>'
    cr = j.select_one('#creator')
    crt = translate(cr.select_one('.txt'), ctx, '')
    body += seam('s1') + section('journey', f'''<div class="sec-h rv"><p class="kick">{txt(j.select_one(".kicker"))}</p><h2 id="journey-h">{txt(j.select_one("h2"))}</h2><p class="lead">{inner(j.select_one(".h-lead"))}</p></div>
<div class="web-wrap"><div><div class="web" id="web"><svg class="links" aria-hidden="true"></svg>{nodes}</div>
<p class="web-meta"><span>{txt(j.select_one(".web-hint"))}</span><span>ביקרתם ב־<span id="web-count">1 מתוך 10</span></span></p></div>
<div class="stories card" aria-live="polite">{stories}</div></div>
<div class="split top rv" style="margin-top:clamp(40px,6vw,72px)"><div class="hero-fig" style="justify-self:start;width:min(220px,50%)"><img src="{ctx.img}flaneur-figure.png" alt="" width="480" height="415"></div><div class="prose">{inner(crt).replace("<h2", "<h3 class=\"big\"").replace("</h2>", "</h3>").replace("<blockquote>", "<blockquote class=\"pull\">")}</div></div>''', label='journey-h')

    # 02 from the journey to the method
    m = s.select_one('#method')
    copy_side = m.select_one('.moves-in .copy')
    side = ''.join(str(translate(p, ctx, '')) for p in copy_side.select('p')[1:])
    modes = ''.join(f'<article class="card rv"><span class="k">{txt(a.select_one(".h-sub"))}</span><h3>{txt(a.select_one("h3"))}</h3><p>{inner(a.select_one("p:not(.h-sub)"))}</p></article>' for a in m.select('.modes2 article'))
    mech = m.select_one('.mech')
    mech_t = translate(mech, ctx, '')
    views = m.select('.views figure')
    ill = ''
    for f in views:
        img = f.select_one('img')
        ill += illus(ctx, img['src'].split('/')[-1], img['alt'], inner(f.select_one('h3')), txt(f.select_one('p')), img.get('width', 1200), img.get('height', 800))
    ins = [(txt(li.select_one('h3')), txt(li.select_one('p'))) for li in m.select('.insights li')]
    note5 = txt(m.select('.quiet.prose')[-1]) if m.select('.quiet.prose') else ''
    body += seam('s2') + section('method', f'''<div class="sec-h rv"><p class="kick">{txt(m.select_one(".kicker"))}</p><h2 id="method-h">{txt(m.select_one("h2"))}</h2><p class="lead">{inner(m.select_one(".h-lead"))}</p></div>
{moves_block(ctx, m.select_one('.loop'), side)}
<div class="cards" style="margin-top:clamp(36px,5vw,60px)">{modes}</div>
<p class="quiet small" style="margin-top:12px">{inner(m.select_one(".modes2 + p"))}</p>
<div class="card rv" style="margin-top:28px"><div class="split top">{inner(mech_t)}</div></div>
<h3 class="big rv" style="margin:clamp(48px,6vw,80px) 0 22px">{txt(m.select("h3.roots-h")[0])}</h3>
<div class="split top">{ill.split("</figure>")[0]}</figure>{ill.split("</figure>")[1]}</figure></div>
<div style="margin-top:28px;max-width:900px">{ill.split("</figure>")[2]}</figure></div>
<h3 class="big rv" style="margin:clamp(48px,6vw,80px) 0 10px">{txt(m.select("h3.roots-h")[1])}</h3>
<p class="quiet prose rv">{note5}</p>
{five_block(ins)}''', cls='alt', label='method-h')

    w = s.select_one('#work')
    offers = ''.join(f'<article class="card rv"><h3>{txt(a.select_one("h3"))}</h3><p>{inner(a.select_one("p"))}</p></article>' for a in w.select('.offer'))
    ct = translate(w.select_one('.contact'), ctx, '')
    body += seam('s3') + section('work', f'''<div class="sec-h rv"><p class="kick">{txt(w.select_one(".kicker"))}</p><h2 id="work-h">{txt(w.select_one("h2"))}</h2><p class="lead">{inner(w.select_one(".h-lead"))}</p></div>
<div class="cards">{offers}</div><div class="card rv" style="margin-top:22px"><div class="split">{inner(ct)}</div></div>''', label='work-h')

    d = s.select_one('#deeper')
    cards = ''
    for a in d.select('.dp'):
        cards += f'<a class="card rv" href="{ctx.link(a["href"], "")}"><span class="k">{txt(a.select_one("em"))}</span><h3>{txt(a.select_one("b"))}</h3><p>{txt(a.select_one("span"))}</p></a>'
    body += seam('s4') + section('deeper', f'''<div class="sec-h rv"><p class="kick">{txt(d.select_one(".kicker"))}</p><h2 id="deeper-h">{txt(d.select_one("h2"))}</h2><p class="lead">{inner(d.select_one(".h-lead"))}</p></div>
<div class="cards">{cards}</div><p class="quiet" style="margin-top:22px">{txt(d.select_one(".voices"))}</p>''', cls='deep', label='deeper-h')
    sp = [('journey', 'מסע בין עולמות'), ('method', 'מהמסע לשיטה'), ('work', 'לאן השיטה מובילה'), ('deeper', 'לעומק')]
    return page(ctx, 'המשוטט', txt(h.select_one('.lead')), body, sp, pre=threshold(ctx))


def p_wanderer(ctx):
    s = soup('the-wanderer/index.html')
    h = s.select_one('.w-hero')
    labels = [txt(t) for t in h.select('svg text') if len(txt(t)) > 1][:6]
    text = f'''<p class="kick ltr" lang="en">{txt(h.select_one(".w-en"))}</p>
<h1><span class="under">{txt(h.select_one("h1"))}</span></h1>
<p class="big" style="color:var(--terra);margin-top:18px">{txt(h.select_one(".w-sub"))}</p>
<p class="lead">{inner(h.select_one(".w-lead"))}</p>
<p class="sub">{inner(h.select_one(".w-hero-p"))}</p>
<div class="btns"><a class="btn go" href="#figure">{txt(h.select_one(".w-down"))}</a></div>'''
    body = hero(ctx, 'wanderer', labels, text, anchor='.22,.7')
    sp = []
    for sec in s.select('main > section.w-sec'):
        sid = sec.get('id')
        num = txt(sec.select_one('.w-num'))
        h2 = sec.select_one('h2')
        sp.append((sid, txt(h2)[:28]))
        if sid == 'constellation':
            body += seam(sid) + lights(ctx, sec)
            continue
        wrap = sec.select_one('.wrap')
        t = translate(wrap, ctx, 'the-wanderer/', keep_svg=True)
        h2n = t.select_one('h2')
        if h2n:
            h2n['id'] = sid + '-h'
            h2n.insert_before(BeautifulSoup(f'<p class="kick">{num}</p>', 'html.parser'))
        noise = ''
        if sid == 'see':
            words = txt(sec.select_one('.noise'))
            noise = f'<p class="noise" aria-hidden="true"><span>{words}</span></p>'
        cls = {'see': 'deep', 'compass': 'deep', 'discern': 'alt', 'invite': 'alt'}.get(sid, '')
        body += seam(sid) + section(sid, noise + inner(t), cls=cls + ' w-' + sid, label=sid + '-h')
    src = s.select_one('.w-sources')
    if src:
        body += f'<section class="sec w-src"><div class="wrap"><details class="card"><summary class="big">{txt(src.select_one("h2, h3, summary")) or "מקורות"}</summary>{inner(translate(src.select_one(".src-body") or src, ctx, "the-wanderer/"))}</details></div></section>'
    return page(ctx, 'המשוטט', 'מפגש ספרותי ופילוסופי עם דמות המשוטט: קשב, פליאה והבחנה.', body, sp[:7])


def lights(ctx, sec):
    """The constellation of lights: a small sky to navigate, one light at a time."""
    stns = sec.select('li.stn')
    n = len(stns)
    rnd = random.Random('lights')
    P9 = [(84, 20), (64, 13), (44, 22), (24, 16), (12, 38), (27, 58), (47, 68), (68, 58), (84, 80), (60, 88)]
    pos = P9[:n]
    d = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pos)
    btns, cards = '', ''
    for i, (li, (x, y)) in enumerate(zip(stns, pos)):
        name = txt(li.select_one('h3'))
        btns += f'<button type="button" data-k="{i}" data-name="{name}" style="--x:{x:.1f}%;--y:{y:.1f}%" aria-pressed="{"true" if i == 0 else "false"}" aria-controls="light-{i}"><i aria-hidden="true"></i>{name}</button>'
        t = translate(li.select_one('article'), ctx, 'the-wanderer/')
        cards += f'<article class="light light-card{" on" if i == 0 else ""}" id="light-{i}">{inner(t)}</article>'
    lead = txt(sec.select_one('.w-lead2'))
    honest = inner(translate(sec.select_one('.honest'), ctx, 'the-wanderer/'))
    js = '''<script>(function(){var g=document.querySelector('.sky-map');if(!g)return;var bs=g.querySelectorAll('button');bs.forEach(function(b){b.addEventListener('click',function(){bs.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});document.querySelectorAll('.light').forEach(function(l){l.classList.toggle('on',l.id==='light-'+b.dataset.k)})})})})()</script>'''
    return section('constellation', f'''<div class="sec-h rv"><p class="kick">{txt(sec.select_one(".w-num"))}</p><h2 id="constellation-h">{txt(sec.select_one("h2"))}</h2><p class="lead">{lead}</p><p class="quiet small">{honest}</p></div>
<div class="lights"><div class="sky-map" role="group" aria-label="האורות"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="halo" cx="50" cy="52" r="44"/><circle class="halo" cx="50" cy="52" r="28"/><path class="route" d="{d}"/></svg>{btns}</div>
<div aria-live="polite">{cards}</div></div>{js}''', cls='deep', label='constellation-h')


def p_flaneur(ctx):
    s = soup('flaneur/index.html')
    h = s.select_one('.short-hero')
    abc = translate(h.select_one('.abc'), ctx, 'flaneur/') if h.select_one('.abc') else None
    text = f'''<p class="kick">{txt(h.select_one(".kicker"))}</p><h1>{txt(h.select_one("h1"))}</h1><p class="lead">{inner(h.select_one(".lead"))}</p>{('<div class="abc big">' + inner(abc) + '</div>') if abc else ''}'''
    body = hero(ctx, 'flaneur', ['ערך', 'שחרור', 'שוטטות', 'קשב', 'הבחנה', 'יצירה', 'חגיגה'], text, anchor='.3,.7')
    sp = []
    for sec in s.select('main > section.sh-sec'):
        sid = sec.get('id') or ''
        if not sid:
            continue
        h2 = sec.select_one('h2')
        sp.append((sid, txt(h2)[:26]))
        if sid == 'moves':
            ol = sec.select_one('ol')
            fake = BeautifulSoup('<ol class="loop">' + ''.join(f'<li><button data-d="{txt(li.select_one("span") or li)}"><b>{txt(li.select_one("b"))}</b></button></li>' for li in ol.select('li')) + '</ol>', 'html.parser')
            after = ''.join(str(translate(p, ctx, 'flaneur/')) for p in sec.select('.wrap > p:not(.num)'))
            body += seam(sid) + section(sid, f'<div class="sec-h rv"><p class="kick">{txt(sec.select_one(".num"))}</p><h2 id="{sid}-h">{txt(h2)}</h2></div>' + moves_block(ctx, fake.select_one('ol'), after), cls='alt', label=sid + '-h')
            continue
        if sid == 'five':
            items = [(txt(a.select_one('h3')), txt(a.select_one('p'))) for a in sec.select('.five5 > *') if a.select_one('h3')]
            lead = ''.join(str(translate(p, ctx, 'flaneur/')) for p in sec.select('.wrap > p:not(.num)'))
            body += seam(sid) + section(sid, f'<div class="sec-h rv"><p class="kick">{txt(sec.select_one(".num"))}</p><h2 id="{sid}-h">{txt(h2)}</h2>{lead}</div>' + five_block(items), label=sid + '-h')
            continue
        t = translate(sec.select_one('.wrap'), ctx, 'flaneur/')
        for fg in t.select('figure'):
            fg['class'] = 'ill rv'
            im = fg.select_one('img')
            if im:
                im.wrap(BeautifulSoup('<div class="frame"></div>', 'html.parser').div)
        h2n = t.select_one('h2')
        if h2n:
            h2n['id'] = sid + '-h'
            h2n.insert_before(BeautifulSoup(f'<p class="kick">{txt(sec.select_one(".num"))}</p>', 'html.parser'))
        body += seam(sid) + section(sid, inner(t), cls='deep' if sid == 'place' else '', label=sid + '-h')
    return page(ctx, 'השיטה בקצרה', 'מיהו המשוטט האקוסיסטמי, היסודות, שבע התנועות וחמש התובנות.', body, sp)


def p_method(ctx):
    s = soup('method/index.html')
    h = s.select_one('.deep-hero')
    text = f'''<p class="kick">{txt(h.select_one(".kicker"))}</p><h1>{txt(h.select_one("h1"))}</h1><p class="lead">{inner(translate(h.select_one(".lead"), ctx, "method/"))}</p>'''
    body = hero(ctx, 'method', ['EGO', 'ECO', 'כאוס', 'סדר', 'רשת חיה'], text, anchor='.25,.75')
    sp = []
    main = s.select_one('.deep-main')
    for i, sec in enumerate(main.find_all(['section', 'div'], recursive=False)):
        sid = sec.get('id') or f'm{i}'
        h2 = sec.select_one('h2')
        if not h2 or 'end' in (sec.get('class') or []):  # the closing section is added once, below
            continue
        sp.append((sid, txt(h2)[:24]))
        t = translate(sec, ctx, 'method/')
        for fg in t.select('figure'):
            fg['class'] = 'ill rv'
            im = fg.select_one('img')
            if im:
                im.wrap(BeautifulSoup('<div class="frame"></div>', 'html.parser').div)
        h2n = t.select_one('h2')
        h2n['id'] = sid + '-h'
        h2n.insert_before(BeautifulSoup(f'<p class="kick">{txt(sec.select_one(".num"))}</p>', 'html.parser'))
        body += seam(sid) + section(sid, f'<div class="mth">{inner(t)}</div>', cls='alt' if i % 2 else '', label=sid + '-h')
    end = s.select_one('section.end')
    if end:
        t = translate(end, ctx, 'method/')
        body += section('end', inner(t), cls='deep')
    return page(ctx, 'השיטה לעומק', 'המשוטט האקוסיסטמי לעומק: המבט האקוסיסטמי, המקורות, חמש התובנות ושבע התנועות.', body, sp[:9])


def p_academy(ctx):
    s = soup('academy/index.html')
    h = s.select_one('.pro-hero')
    facts = ''.join(f'<div><b>{txt(li.select_one("b"))}</b><span>{txt(li.select_one("span"))}</span></div>' for li in h.select('.pro-facts li'))
    text = f'''<p class="kick">{txt(h.select_one(".kicker"))}</p><h1 style="font-size:clamp(2rem,4.4vw,3.6rem)">{inner(h.select_one("h1"))}</h1><p class="lead">{inner(translate(h.select_one(".lead"), ctx, "academy/"))}</p>
<div class="btns">{''.join(f'<a class="btn{" go" if "primary" in (a.get("class") or []) else ""}" href="{ctx.link(a["href"], "academy/")}">{txt(a)}</a>' for a in h.select(".btns a"))}</div>'''
    body = hero(ctx, 'academy', ['תל אביב', 'יוון', 'גרמניה', 'ברלין', 'ולנסיה'], text, anchor='.3,.7')
    body += f'<section class="sec"><div class="wrap"><div class="steps rv">{facts}</div></div></section>'
    sp = []
    for sec in s.select('main > section.pro-sec, main > section.pro-invite'):
        sid = sec.get('id') or ''
        h2 = sec.select_one('h2')
        if not sid or not h2:
            continue
        sp.append((sid, txt(h2)[:24]))
        if sid == 'contact':
            dl = translate(sec.select_one('dl'), ctx, 'academy/') if sec.select_one('dl') else ''
            body += seam(sid) + section(sid, f'<div class="sec-h"><p class="kick">{txt(sec.select_one(".num, .kicker"))}</p><h2 id="contact-h">{txt(h2)}</h2></div><div class="card">{inner(dl) if dl else ""}</div>', cls='deep', label='contact-h')
            continue
        t = translate(sec.select_one('.wrap') or sec, ctx, 'academy/')
        for fg in t.select('figure'):
            fg['class'] = 'ill rv'
            im = fg.select_one('img')
            if im:
                im.wrap(BeautifulSoup('<div class="frame"></div>', 'html.parser').div)
        for a in t.select('a.btn, a'):
            if a.get('class') == ['btn'] or 'btn' in (a.get('class') or []):
                pass
        h2n = t.select_one('h2')
        h2n['id'] = sid + '-h'
        k = sec.select_one('.num, .kicker')
        if k:
            h2n.insert_before(BeautifulSoup(f'<p class="kick">{txt(k)}</p>', 'html.parser'))
        body += seam(sid) + section(sid, f'<div class="acd">{inner(t)}</div>', cls={'offer': 'alt', 'for': 'alt', 'invite': 'deep'}.get(sid, ''), label=sid + '-h')
    return page(ctx, 'אקדמי ומקצועי', 'הרצאות, סדנאות, הכשרה ושיתופי פעולה סביב המשוטט האקוסיסטמי.', body, sp)


def p_library(ctx):
    s = soup('library/index.html')
    h = s.select_one('.lib-hero')
    text = f'''<p class="kick">הספרייה</p><h1>{txt(h.select_one("h1"))}</h1><p class="lead">{inner(h.select_one(".lead"))}</p>'''
    names = []
    try:
        names = re.findall(r'"name": "([^"]+)"', open(os.path.join(ROOT, 'library/ideas-snapshot.js'), encoding='utf-8').read())[:6]
    except OSError:
        pass
    body = hero(ctx, 'library', [n if len(n) < 26 else n[:24] + '…' for n in names], text, anchor='.3,.7')
    a = s.select_one('#ideas')
    b = s.select_one('#tools')
    c = s.select_one('#journeys')
    doors = ''
    for sec, L in ((a, 'א'), (b, 'ב'), (c, 'ג')):
        doors += f'<a class="card rv" href="#{sec["id"]}"><b class="l">{L}</b><h3>{txt(sec.select_one("h2"))}</h3><p>{txt(sec.select_one("h2 + p, .lead, p:not(.num):not(.kicker)"))}</p></a>'
    body += section('doors', f'<div class="doors">{doors}</div>', label=None)
    body += seam('ideas') + section('ideas', f'''<div class="sec-h rv"><p class="kick">א</p><h2 id="ideas-h">{txt(a.select_one("h2"))}</h2><p class="lead">{txt(a.select_one("h2 + p") or a.select_one("p.lead"))}</p></div>
<div class="lib-tools"><input id="idea-q" type="search" placeholder="חיפוש" aria-label="חיפוש ברעיונות"><button type="button" data-kind="all" aria-pressed="true">הכול</button><button type="button" data-kind="practice" aria-pressed="false">תרגולים</button><button type="button" data-kind="lens" aria-pressed="false">עדשות</button><span class="quiet small" id="idea-n" aria-live="polite"></span></div>
<ol class="idea-list"></ol>''', cls='alt', label='ideas-h')
    purposes = ''.join(f'<li>{txt(x)}</li>' for x in b.select('.purpose b, .p6 b, ol li b')[:6]) or ''
    body += seam('tools') + section('tools', f'''<div class="sec-h rv"><p class="kick">ב</p><h2 id="tools-h">{txt(b.select_one("h2"))}</h2><p class="lead">{txt(b.select_one("h2 + p") or b.select_one("p.lead"))}</p></div>
{('<ol class="ticks" style="columns:2;column-gap:40px">' + purposes + '</ol>') if purposes else ''}''', label='tools-h')
    ct = [p for p in c.select('p') if len(txt(p)) > 60][:2]
    moves = ' · '.join(txt(x) for x in c.select('.arc7 li, .mv7 li, ol li')[:7])
    body += seam('journeys') + section('journeys', f'''<div class="sec-h rv"><p class="kick">ג</p><h2 id="journeys-h">{txt(c.select_one("h2"))}</h2>{''.join(f'<p class="lead">{txt(p)}</p>' for p in ct[:1])}</div>
<div class="cards"><a class="card rv" href="{ctx.to('journey')}"><span class="k">המנגנון</span><h3>שוטטות אישית ושוטטות משתתפת</h3><p>{txt(ct[1]) if len(ct) > 1 else ''}</p></a><a class="card rv" href="{ctx.to('mechanism')}"><span class="k">מסע אישי</span><h3>יציאה אחת בחמישה שלבים</h3><p>כניסה · תנועה · הבחנה · עקבה · חזרה</p></a></div>''', cls='deep', label='journeys-h')
    extra = f'<script src="{ctx.root}library/ideas-snapshot.js"></script>\n'
    return page(ctx, 'הספרייה', 'ספריית הידע של המשוטט: רעיונות לשוטטות, כלים משתתפים ותבניות מסע.', body,
                [('ideas', 'רעיונות'), ('tools', 'כלים'), ('journeys', 'תבניות מסע')], extra_js=extra)


def p_journey(ctx):
    """The adaptive mechanism, unchanged code, in the new world with the living circle."""
    s = soup('journey/index.html')
    top = s.select_one('.jr-top')
    text = f'''<p class="kick">המנגנון האדפטיבי</p><h1>{txt(top.select_one("h1"))}</h1><p class="lead">{txt(top.select_one(".lead"))}</p>'''
    stage = copy.copy(s.select_one('section.stage'))
    stage['class'] = 'stage lc-stage sec'
    fc = stage.select_one('#f-center')
    wf = fc.select_one('.walker-fig')
    if wf:
        wf.replace_with(BeautifulSoup(f'<img class="fig" src="{ctx.img}flaneur-figure.png" alt="" width="480" height="415">', 'html.parser'))
    body = f'''<section class="hero inner jr-hero" data-listen>
<div class="field" data-field="journey-{ctx.d}" data-density=".7" data-anchor=".2,.7"></div>
<div class="wrap" style="min-height:0;padding-block:clamp(30px,5vw,60px) 10px;grid-template-columns:minmax(0,1fr)"><div class="hero-text">{text}</div></div></section>
{str(stage)}
{str(s.select_one('section.out'))}'''
    R = ctx.root
    head_extra = f'''<link rel="stylesheet" href="{R}site.css">
<link rel="stylesheet" href="{R}ef.css">
<link rel="stylesheet" href="{R}journey/journey.css">
<link rel="stylesheet" href="{ctx.assets}worlds.css">
<link rel="stylesheet" href="{ctx.assets}mech.css">
'''
    js = f'''<script src="{R}library/ideas-snapshot.js"></script>
<script src="{R}journey/knowledge.js"></script>
<script src="{R}journey/engine.js"></script>
<script src="{ctx.assets}circle.js"></script>
<script src="{R}journey/app.js"></script>
'''
    html = (head(ctx, 'המנגנון', 'המנגנון האדפטיבי של המשוטט האקוסיסטמי.') + head_extra + '</head>\n'
            + '<body class="sub jr-page pg-journey">\n' + header(ctx) + f'\n<main id="main">\n{body}\n</main>\n' + footer(ctx) + '\n' + scripts(ctx, js))
    return html


def chrome_css():
    css = open(os.path.join(OUT, 'assets', 'worlds.css'), encoding='utf-8').read()
    parts = re.split(r'(?=/\* ---------- )', css)
    keep = [p for p in parts if p.startswith('/* ---------- tokens') or p.startswith('/* ---------- header') or p.startswith('/* ---------- the twilight') or p.startswith('/* ---------- the territories') or p.startswith('/* ---------- footer')]
    base = ('.wb,.terr,.wf{font-family:var(--f-sans)}.wb *,.terr *,.wf *{box-sizing:border-box}.wrap.wf-w{max-width:calc(var(--max) + 2*var(--gut));margin:0 auto;padding-inline:var(--gut)}'
            '.skip{position:absolute;inset-inline-start:12px;top:-60px;z-index:100;background:var(--gold);color:var(--on-gold);padding:8px 14px;border-radius:8px;font:500 15px var(--f-sans)}.skip:focus{top:10px}'
            '.wf .wrap{max-width:calc(var(--max) + 2*var(--gut));margin:0 auto;padding-inline:var(--gut)}[hidden]{display:none!important}.wb h2,.terr h2{font-family:var(--f-display);font-weight:var(--fw-display);margin:0;color:var(--ink)}\n')
    return '/* generated from worlds.css: only the shared chrome (tokens, header, twilight, map, footer) */\n' + base + ''.join(keep)


def p_mechanism(ctx):
    """Version B, unchanged code. The world's chrome and palette are added around it."""
    src = open(os.path.join(ROOT, 'mechanism/index.html'), encoding='utf-8').read()
    D = DIRS[ctx.d]
    inject_head = (f'<meta name="robots" content="noindex">\n'
                   f'<script>(function(){{var h=document.documentElement,s=null;h.setAttribute("data-dir","{ctx.d}");h.setAttribute("data-sky","{D["sky"]}");try{{s=new URLSearchParams(location.search).get("sky")||localStorage.getItem("ef-sky")}}catch(e){{}}if(s!=="day"&&s!=="night")s="{D["sky"]}";h.setAttribute("data-sky",s);h.setAttribute("data-theme",s==="day"?"light":"dark")}})()</script>\n'
                   f'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@300;400;500;700&family=Heebo:wght@300;400;500;600;700;800&display=swap">\n'
                   f'<link rel="stylesheet" href="{ctx.assets}chrome.css">\n<link rel="stylesheet" href="{ctx.assets}b-skin.css">\n')
    out = src.replace('</head>', inject_head + '</head>', 1)
    out = re.sub(r'<body([^>]*)>', lambda m: f'<body{m.group(1)}>\n' + header(ctx) + '\n', out, count=1)
    out = out.replace('</body>', footer(ctx) + f'\n<script src="{ctx.assets}field.js"></script>\n<script src="{ctx.assets}worlds.js"></script>\n</body>', 1)
    # images and the compass asset the page references stay at their live location
    out = out.replace('src="compass.png"', f'src="{ctx.root}mechanism/compass.png"')
    out = out.replace('"../fx/', f'"{ctx.root}fx/').replace('"../img/', f'"{ctx.root}img/').replace('href="../"', f'href="{ctx.to("")}"').replace('href="a/"', f'href="{ctx.root}mechanism/a/"')
    return out


BUILDERS = {'': p_home, 'the-wanderer': p_wanderer, 'flaneur': p_flaneur, 'method': p_method, 'academy': p_academy,
            'library': p_library, 'journey': p_journey, 'mechanism': p_mechanism}


def main():
    open(os.path.join(OUT, 'assets', 'chrome.css'), 'w', encoding='utf-8').write(chrome_css())
    for d in DIRS:
        for key, fn in BUILDERS.items():
            ctx = Ctx(d, key)
            html = fn(ctx)
            path = os.path.join(OUT, d, key, 'index.html') if key else os.path.join(OUT, d, 'index.html')
            os.makedirs(os.path.dirname(path), exist_ok=True)
            open(path, 'w', encoding='utf-8').write(html)
            print('wrote', os.path.relpath(path, ROOT), len(html))


if __name__ == '__main__':
    main()
