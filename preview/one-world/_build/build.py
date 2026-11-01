#!/usr/bin/env python3
"""Builds ONE WORLD: the refined direction. One visual language, two atmospheres (day and night),
Osim Kehila typography (Heebo only), the star map as a discovery of relationships, and a proposal
for the philosophical echoes of the five insights.

It reuses the generator of /preview/worlds/ (which stays untouched) and changes only what differs.
Content is still taken verbatim from the live pages at build time.
Run from the repository root:
    python3 preview/one-world/_build/build.py          the preview, in /preview/one-world/
    python3 preview/one-world/_build/build.py --live   the live site (content sources in /_source/)
"""
import importlib.util, json, os, random, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
spec = importlib.util.spec_from_file_location('worlds_build', os.path.join(ROOT, 'preview', 'worlds', '_build', 'build.py'))
W = importlib.util.module_from_spec(spec)
spec.loader.exec_module(W)
sys.path.insert(0, HERE)
from cssfold import fold  # noqa: E402
from echoes import ECHOES, TIES  # noqa: E402

LIVE_BUILD = '--live' in sys.argv
SRC = os.path.join(ROOT, '_source')          # the content sources of every page (the live pages are generated)
MARK = '<meta name="robots" content="noindex" data-source-copy>\n'
NOINDEX = '<meta name="robots" content="noindex">'
OUT = ROOT if LIVE_BUILD else os.path.join(ROOT, 'preview', 'one-world')
ASSETS = os.path.join(OUT, 'assets')
W.OUT = OUT
_open = open


def src_open(path, *a, **k):
    """Pages are read from _source/, everything else (scripts, data) from where it is served."""
    rel = os.path.relpath(os.path.abspath(path), ROOT)
    if rel.endswith('index.html') and os.path.exists(os.path.join(SRC, rel)):
        path = os.path.join(SRC, rel)
    return _open(path, *a, **k)


W.open = src_open
W.DIRS = {'w': {'name': 'עולם אחד', 'en': 'One World', 'sky': 'night'}}
W.PAGES = W.PAGES + ['echoes', 'methodology', 'architecture'] + ([] if LIVE_BUILD else ['system'])
OSIM_FONTS = 'https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&display=swap'
OLD_FONTS = 'https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@300;400;500;700&family=Heebo:wght@300;400;500;600;700;800&display=swap'


class Ctx(W.Ctx):
    """One world has no direction folder, so everything sits one level higher."""
    def __init__(self, d, page):
        super().__init__(d, page)
        self.depth = (0 if page == '' else 1) if LIVE_BUILD else (2 if page == '' else 3)
        self.root = '../' * self.depth
        self.assets = ('' if page == '' else '../') + 'assets/'
        self.img = self.root + 'img/'


W.Ctx = Ctx

_spine = W.spine


def spine(items):
    """Section labels in the side spine end on a whole word, never mid-word."""
    out = []
    for i, l in items:
        if len(l) >= 24 and ' ' in l:
            l = l[:l.rfind(' ')].rstrip(' ,:') + '…'
        out.append((i, l))
    return _spine(out)


W.spine = spine


# ---------------------------------------------------------------- the star map: discovering relationships
# The only documented relations between lights are the ones the live page itself states:
# Baudelaire translated Poe and recalls "The Man of the Crowd"; Benjamin returned to Baudelaire's flâneur.
DOCUMENTED = [
    ('אדגר אלן פו', 'שארל בודלר', 'בודלר גם תרגם לצרפתית את סיפוריו של פו, ובאותה מסה הוא נזכר ב"איש ההמון".'),
    ('שארל בודלר', 'ולטר בנימין', 'ולטר בנימין חזר אל הפלנר של בודלר במסותיו ובעבודת הפסאז\'ים.'),
]


def lights(ctx, sec):
    stns = sec.select('li.stn')
    n = len(stns)
    P9 = [(84, 20), (64, 13), (44, 22), (24, 16), (12, 38), (27, 58), (47, 68), (68, 58), (84, 80), (60, 88)]
    pos = P9[:n]
    names = [W.txt(li.select_one('h3')) for li in stns]
    hist = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pos)
    btns, cards, ties = '', '', ''
    for i, (li, (x, y)) in enumerate(zip(stns, pos)):
        era = W.txt(li.select_one('.era') or li.select_one('p'))
        btns += (f'<button type="button" data-k="{i}" style="--x:{x:.1f}%;--y:{y:.1f}%" aria-pressed="{"true" if i == 0 else "false"}" aria-controls="light-{i}"'
                 f'{" class=\"seen\"" if i == 0 else ""}><i aria-hidden="true"></i><span>{names[i]}</span></button>')
        t = W.translate(li.select_one('article'), ctx, 'the-wanderer/')
        cards += f'<article class="light light-card{" on" if i == 0 else ""}" id="light-{i}">{W.inner(t)}</article>'
    notes = ''
    for a, b, note in DOCUMENTED:
        if a in names and b in names:
            ia, ib = names.index(a), names.index(b)
            (x1, y1), (x2, y2) = pos[ia], pos[ib]
            ties += f'<line class="tie" data-a="{ia}" data-b="{ib}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/>'
            notes += f'<li class="tie-note" data-a="{ia}" data-b="{ib}" hidden><b>{a} · {b}</b>{note}</li>'
    lead = W.txt(sec.select_one('.w-lead2'))
    honest = W.inner(W.translate(sec.select_one('.honest'), ctx, 'the-wanderer/'))
    js = '''<script>(function(){
var g=document.querySelector('.sky-map');if(!g)return;
var bs=[].slice.call(g.querySelectorAll('button')),mine=g.querySelector('.mine'),hist=g.querySelector('.hist'),ties=[].slice.call(g.querySelectorAll('.tie')),
notes=[].slice.call(document.querySelectorAll('.tie-note')),cnt=document.querySelector('.lt-count b'),done=document.querySelector('.lt-done'),order=[0],seen={0:1};
function pt(b){return b.style.getPropertyValue('--x').replace('%','')+' '+b.style.getPropertyValue('--y').replace('%','')}
function draw(){mine.setAttribute('d','M'+order.map(function(k){return pt(bs[k])}).join(' L'));
ties.forEach(function(t){var on=seen[t.dataset.a]&&seen[t.dataset.b];if(on&&!t.classList.contains('on')){t.classList.add('on');bs[t.dataset.a].classList.add('tied');bs[t.dataset.b].classList.add('tied')}});
notes.forEach(function(n){var on=seen[n.dataset.a]&&seen[n.dataset.b];if(on&&n.hidden){n.hidden=false;n.classList.add('fresh');setTimeout(function(){n.classList.remove('fresh')},2400)}});
var c=Object.keys(seen).length;if(cnt)cnt.textContent=c;if(c===bs.length){hist.classList.add('on');if(done)done.hidden=false}}
bs.forEach(function(b){b.addEventListener('click',function(){var k=+b.dataset.k;
bs.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});b.classList.add('seen');
if(order[order.length-1]!==k)order.push(k);seen[k]=1;
document.querySelectorAll('.light').forEach(function(l){l.classList.toggle('on',l.id==='light-'+k)});draw()})});
draw()})()</script>'''
    return W.section('constellation', f'''<div class="sec-h rv"><p class="kick">{W.txt(sec.select_one(".w-num"))}</p><h2 id="constellation-h">{W.txt(sec.select_one("h2"))}</h2><p class="lead">{lead}</p><p class="quiet small">{honest}</p></div>
<div class="lights disc">
<div class="lt-side">
<div class="sky-map" role="group" aria-label="האורות. כל אור שמבקרים בו מצטרף לדרך שלכם">
<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><circle class="halo" cx="50" cy="52" r="44"/><circle class="halo" cx="50" cy="52" r="28"/>
<path class="hist" d="{hist}"/>{ties}<path class="mine" d=""/></svg>{btns}</div>
<p class="lt-count small">ביקרתם ב־<b>1</b> מתוך {n} אורות. הקו הדק הוא הדרך שלכם. קו זהב מופיע כששני אורות שיש ביניהם קשר מתועד כבר מוארים.</p>
<ul class="tie-notes" aria-live="polite">{notes}</ul>
<p class="lt-done small" hidden>עכשיו נגלה גם סדר הזמנים, בקו המקווקו, לצד הדרך שאתם בחרתם.</p>
</div>
<div aria-live="polite">{cards}</div></div>{js}''', cls='deep', label='constellation-h')


W.lights = lights


# ---------------------------------------------------------------- the five insights: a doorway to their echoes
_five = W.five_block


def five_block(items):
    return _five(items) + ('<p class="echo-door rv"><a class="more" href="@@ECHOES@@">הדים: הוגים ומסורות שמשוחחים עם חמש התובנות</a></p>')


W.five_block = five_block


# ---------------------------------------------------------------- page: echoes (proposal)
KIND = {'root': 'שורש מוצהר', 'aff': 'קרבה רעיונית', 'ours': 'הניסוח שלנו'}


def p_echoes(ctx):
    s = W.soup('flaneur/index.html')
    live = {W.txt(a.select_one('h3')): W.txt(a.select_one('p')) for a in s.select('#five .five5 > *') if a.select_one('h3')}
    data = []
    for ins in ECHOES:
        data.append({**ins, 'text': live.get(ins['title'], '')})
    stage = ''
    for i, ins in enumerate(data):
        x, y = ins['pos']
        stage += (f'<button type="button" class="ins{" mid" if ins["mid"] else ""}" data-i="{i}" style="--x:{x}%;--y:{y}%" aria-pressed="false" aria-controls="ep">'
                  f'<i aria-hidden="true"></i><span>{ins["title"]}</span></button>')
        for j, e in enumerate(ins['echoes']):
            ex, ey = e['at']
            stage += (f'<button type="button" class="ech k-{e["kind"]}" data-i="{i}" data-j="{j}" style="--x:{ex}%;--y:{ey}%" tabindex="-1" aria-hidden="true">'
                      f'<i></i><span>{e["short"]}</span></button>')
    lines = ''
    for i, ins in enumerate(data):
        x, y = ins['pos']
        for j, e in enumerate(ins['echoes']):
            ex, ey = e['at']
            lines += f'<line class="ray" data-i="{i}" x1="{x}" y1="{y}" x2="{ex}" y2="{ey}"/>'
    tl, tn = '', ''
    for t in TIES:
        (ia, ja), (ib, jb) = t['a'], t['b']
        if ja is None:
            (x1, y1) = data[ia]['pos']
        else:
            (x1, y1) = data[ia]['echoes'][ja]['at']
        (x2, y2) = data[ib]['echoes'][jb]['at'] if jb is not None else data[ib]['pos']
        mx, my = (x1 + x2) / 2 + (y2 - y1) * .08, (y1 + y2) / 2 - (x2 - x1) * .08
        tl += f'<path class="tie" data-a="{ia}" data-b="{ib}" d="M{x1} {y1} Q{mx:.1f} {my:.1f} {x2} {y2}"/>'
        tn += f'<li class="tie-note" data-a="{ia}" data-b="{ib}" hidden><b>{t["label"]}</b>{t["note"]}</li>'
    js_data = json.dumps([{'title': d['title'], 'text': d['text'], 'echoes': d['echoes']} for d in data], ensure_ascii=False)
    body = f'''<section class="hero inner short" data-listen>
<div class="field" data-field="echoes-w" data-labels="אמצע|רבים|מגוון|הקשבה|היש" data-anchor=".5,.5" data-density=".8"></div>
<div class="wrap"><div class="hero-text"><p class="kick">חמש התובנות <span class="en">· Echoes</span></p>
<h1>קבוצת כוכבים של רעיונות<small>חמש התובנות הן ניסוח שלנו. סביבן מהדהדים הוגים ומסורות מתקופות שונות.</small></h1>
<p class="lead">הם לא כתבו את התובנות ואינם מייסדים שלהן. הם אורות שאפשר לשוחח איתם. בחרו תובנה, וראו מי מדבר איתה, ומה מחבר בין התובנות עצמן.</p></div>{W.fig(ctx)}</div>
</section>
{W.seam('echoes')}
<section class="sec deep" id="sky" aria-labelledby="sky-h"><div class="wrap">
<div class="sec-h rv"><h2 id="sky-h" class="sr">ההדים</h2>
<ul class="kinds" aria-label="שלושה סוגי קשר"><li class="k-root"><i></i><b>{KIND['root']}</b>מקור שהטקסט שלנו כבר מצביע עליו במפורש.</li><li class="k-aff"><i></i><b>{KIND['aff']}</b>הוגה או מסורת שאומרים משהו קרוב, בדרכם שלהם. אנחנו מנסחים את דבריהם במילים שלנו, בלי ציטוט.</li><li class="k-ours"><i></i><b>{KIND['ours']}</b>התובנה עצמה, כפי שנוסחה אצלנו.</li></ul><p class="kinds-note">שמות הספרים: כשלא מצאנו תרגום עברי שיצא לאור, מופיע השם המקורי, והשם העברי לצדו מסומן "תרגום שלנו".</p></div>
<div class="echo">
<div class="echo-map"><div class="echo-stage" role="group" aria-label="חמש התובנות">
<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><circle class="halo" cx="50" cy="50" r="46"/><circle class="halo" cx="50" cy="50" r="24"/>{lines}{tl}</svg>
{stage}</div>
<ul class="tie-notes" aria-live="polite">{tn}</ul></div>
<div class="echo-panel" id="ep" aria-live="polite"><p class="ep-hint">בחרו אחת מחמש התובנות. סביבה יידלקו ההדים שלה.</p></div>
</div></div></section>
<script>window.ECHO={js_data};window.ECHO_KIND={json.dumps(KIND, ensure_ascii=False)};</script>'''
    js = f'<script src="{ctx.assets}echoes.js"></script>\n'
    return W.page(ctx, 'הדים', 'הוגים ומסורות שמשוחחים עם חמש התובנות של המשוטט האקוסיסטמי.', body, extra_js=js, body_cls='sub')


# ---------------------------------------------------------------- page: the system (typography and atmospheres)
def p_system(ctx):
    sw = lambda c, n: f'<span><i style="background:{c}"></i>{n}<br><bdi class="ltr">{c}</bdi></span>'
    body = f'''<section class="hero inner short" data-listen>
<div class="field" data-field="system-w" data-labels="יום|לילה|עיר|דרך|אור" data-anchor=".4,.6" data-density=".7"></div>
<div class="wrap"><div class="hero-text"><p class="kick">שפה אחת <span class="en">· One World</span></p>
<h1>עולם אחד, שתי שעות של היום<small>האותיות של עושים קהילה, האור של המשוטט.</small></h1>
<p class="lead">ביום העיר נגלית כמפה חיה. בלילה היא נגלית כאורות. אותם רחובות, אותן תחנות ואותה דרך. מחליפים שעה, לא עולם.</p></div>{W.fig(ctx)}</div>
</section>
{W.seam('sys1')}
<section class="sec" id="type" aria-labelledby="type-h"><div class="wrap">
<div class="sec-h rv"><p class="kick">אותיות</p><h2 id="type-h">היבו, כמו בעושים קהילה</h2><p class="lead">משפחה אחת, שלושה משקלים. 300 לקריאה ולכותרות הגדולות, 400 לניווט ולכפתורים, 500 לכותרות המשנה ולתוויות.</p></div>
<dl class="ts rv">
<div><dt><b>כותרת ראשית</b>Heebo 300 · 38–64px</dt><dd><p class="h1-sample" role="presentation" style="margin:0;font:300 clamp(38px,5.4vw,64px)/1.1 Heebo,sans-serif">המשוטט האקוסיסטמי<small style="display:block;font-size:.4em">The Ecosystemic Flâneur</small></p></dd></div>
<div><dt><b>כותרת פרק</b>Heebo 500 · 28–38px</dt><dd><h2>שבע התנועות</h2></dd></div>
<div><dt><b>כותרת משנה</b>Heebo 500 · 17–22px</dt><dd><h3>הוקרת היש</h3></dd></div>
<div><dt><b>פתיח</b>Heebo 300 · 19–22px</dt><dd><p class="lead" style="margin:0">לפני שמחפשים עוד, לשים לב למה שכבר כאן ולהוקיר אותו.</p></dd></div>
<div><dt><b>גוף טקסט</b>Heebo 300 · 18px · 1.65</dt><dd><p style="margin:0;max-width:60ch">אף אחד לא רואה את כל התמונה. כשאנשים שונים משתפים במה שהם יודעים, יכולה לצמוח הבנה שאף אחד מהם לא היה מגיע אליה לבד.</p></dd></div>
<div><dt><b>תווית עליונה</b>Heebo 400 · 16px · .04em<br>English 14px · .14em</dt><dd><p class="kick" style="margin:0">השיטה <span class="en">· The Method</span></p></dd></div>
<div><dt><b>ניווט וכפתורים</b>Heebo 400 · 16–17px</dt><dd><div class="btns" style="margin:0"><span class="btn go">לצאת לשוטט</span><span class="btn">לקרוא על השיטה</span></div></dd></div>
<div><dt><b>ציטוט</b>Heebo 300 · 22–30px</dt><dd><p class="pull" style="margin:0">ללמוד ללכת בעיר לאיבוד, כמו שהולכים לאיבוד ביער.</p></dd></div>
<div><dt><b>כיתוב</b>Heebo 300 · 14px</dt><dd><figcaption><b>הדמות ההולכת.</b> איור מקורי של ליאל</figcaption></dd></div>
</dl></div></section>
{W.seam('sys2')}
<section class="sec alt" id="sky" aria-labelledby="sky-h"><div class="wrap">
<div class="sec-h rv"><p class="kick">שתי אווירות</p><h2 id="sky-h">אותם צבעים, אור אחר</h2><p class="lead">הצבעים של עושים קהילה הם הבסיס בשתי השעות. הכחול הוא הלילה, השמנת היא היום, והחרדל הוא האור שעובר ביניהם.</p></div>
<div class="two-sky rv">
<div class="tsk" data-dir="w" data-sky="day"><div class="field" data-field="sys-day" data-density=".55" data-labels="מפה|רחוב|שכונה"></div><div class="tsk-t"><h3>ביום</h3><p>מפה חיה: קווי גובה עדינים, רחובות שנגלים, מקומות שמתחברים.</p>
<div class="sw">{sw('#F7F2E8', 'שמנת')}{sw('#0F2D4A', 'כחול')}{sw('#D4A72C', 'חרדל')}{sw('#9A4E2C', 'חום חם')}{sw('#2F7F78', 'טורקיז')}</div></div></div>
<div class="tsk" data-dir="w" data-sky="night"><div class="field" data-field="sys-night" data-density=".55" data-labels="אור|קבוצה|דרך"></div><div class="tsk-t"><h3>בלילה</h3><p>אורות וקבוצות כוכבים: אותן נקודות, שנדלקות כשמשגיחים בהן.</p>
<div class="sw">{sw('#0A1E33', 'לילה')}{sw('#F7F2E8', 'שמנת')}{sw('#D4A72C', 'חרדל')}{sw('#D98B64', 'חום חם')}{sw('#6DB8AF', 'טורקיז')}</div></div></div>
</div></div></section>'''
    return W.page(ctx, 'שפה אחת', 'מערכת האותיות והאווירות של המשוטט האקוסיסטמי.', body, body_cls='sub')


# ---------------------------------------------------------------- pages that keep their own layout (site.css), in the world's chrome
def wrap_site(key):
    """The page's own markup and styles stay; the world's header, footer, type and atmospheres are put around it."""
    def build(ctx):
        import re
        src = src_open(os.path.join(ROOT, key, 'index.html'), encoding='utf-8').read()
        inject = (f'<script>(function(){{var h=document.documentElement,s=null;h.setAttribute("data-dir","w");try{{s=new URLSearchParams(location.search).get("sky")||localStorage.getItem("ef-sky")}}catch(e){{}}if(s!=="day"&&s!=="night")s="night";h.setAttribute("data-sky",s);h.setAttribute("data-theme",s==="day"?"light":"dark");h.classList.add("js")}})()</script>\n'
                  f'<link rel="stylesheet" href="{ctx.assets}chrome.css">\n<link rel="stylesheet" href="{ctx.assets}site-skin.css">\n')
        out = src.replace('</head>', inject + '</head>', 1)
        out = re.sub(r'<header class="bar">.*?</header>', lambda m: W.header(ctx), out, count=1, flags=re.S)
        out = re.sub(r'<footer>.*?</footer>', lambda m: W.footer(ctx), out, count=1, flags=re.S)
        out = out.replace('<main>', '<main id="main">', 1)
        return out.replace('</body>', f'<script src="{ctx.assets}field.js"></script>\n<script src="{ctx.assets}worlds.js"></script>\n</body>', 1)
    return build


W.BUILDERS = {**W.BUILDERS, 'echoes': p_echoes, 'methodology': wrap_site('methodology'), 'architecture': wrap_site('architecture')}
if not LIVE_BUILD:
    W.BUILDERS['system'] = p_system


def live_head(html, key):
    """Each page keeps what its source says to search engines and to link previews."""
    import re
    sp = os.path.join(SRC, key, 'index.html') if key else os.path.join(SRC, 'index.html')
    src = _open(sp, encoding='utf-8').read() if os.path.exists(sp) else '</head>'  # a page with no source (echoes) is public
    shead = src[:src.find('</head>')]
    html = html.replace(MARK, '')
    if NOINDEX not in shead.replace(MARK, ''):
        html = html.replace(NOINDEX + '\n', '', 1).replace(NOINDEX, '', 1)
    elif NOINDEX not in html:
        html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + NOINDEX, 1)
    if key in ('mechanism', 'methodology', 'architecture'):
        return html                       # these keep their whole source head
    keep = re.findall(r'<(?:meta (?:property|name)="(?:og:[^"]+|twitter:[^"]+)"[^>]*|link rel="(?:canonical|icon)"[^>]*)>', shead)
    desc = re.search(r'<meta name="description" content="([^"]*)">', shead)
    if desc:
        html = re.sub(r'<meta name="description" content="[^"]*">', lambda m: f'<meta name="description" content="{desc.group(1)}">', html, count=1)
    t = re.search(r'<title>(.*?)</title>', shead, re.S)
    if t:
        html = re.sub(r'<title>.*?</title>', lambda m: f'<title>{t.group(1)}</title>', html, count=1, flags=re.S)
    return html.replace('</title>', '</title>\n' + '\n'.join(keep), 1) if keep else html


def main():
    import shutil
    os.makedirs(ASSETS, exist_ok=True)
    if LIVE_BUILD:  # the world's scripts and styles are served from /assets/
        for f in ('field.js', 'circle.js', 'echoes.js', 'worlds.js', 'mech.css', 'b-skin.css', 'site-skin.css'):
            shutil.copy(os.path.join(HERE, '..', 'assets', f), os.path.join(ASSETS, f))
    base = fold(open(os.path.join(ROOT, 'preview', 'worlds', 'assets', 'worlds.css'), encoding='utf-8').read())
    layer = open(os.path.join(HERE, '..', 'assets', 'one.css'), encoding='utf-8').read()
    extra = open(os.path.join(HERE, '..', 'assets', 'one-pages.css'), encoding='utf-8').read()
    open(os.path.join(ASSETS, 'worlds.css'), 'w', encoding='utf-8').write(
        '/* generated by preview/one-world/_build/build.py from preview/worlds/assets/worlds.css + one.css + one-pages.css */\n' + base + layer + extra)
    open(os.path.join(ASSETS, 'chrome.css'), 'w', encoding='utf-8').write(W.chrome_css() + layer)
    for key, fn in W.BUILDERS.items():
        ctx = Ctx('w', key)
        html = fn(ctx).replace(OLD_FONTS, OSIM_FONTS).replace('@@ECHOES@@', ctx.to('echoes'))
        for a, b in (('#112B48', '#0F2D4A'), ('#B65E3E', '#9A4E2C'), ('#C2902A', '#D4A72C'), ('#E8B54D', '#D4A72C'), ('#F0C66A', '#E6C056'), ('#5BBDB3', '#6DB8AF'), ('#FFF4D6', '#FFF3D2')):
            html = html.replace(a, b)
        if key == 'method':  # the echoes page is linked from the methodology page, under the five insights
            i = html.find('id="five"'); j = html.find('</div></section>', i)
            html = html[:j] + '<p class="echo-door rv"><a class="more" href="../echoes/">הדים: הוגים ומסורות שמשוחחים עם חמש התובנות</a></p>' + html[j:]
        html = live_head(html, key) if LIVE_BUILD else html.replace(MARK, '')
        path = os.path.join(OUT, key, 'index.html') if key else os.path.join(OUT, 'index.html')
        os.makedirs(os.path.dirname(path), exist_ok=True)
        open(path, 'w', encoding='utf-8').write(html)
        print('wrote', os.path.relpath(path, ROOT), len(html))


if __name__ == '__main__':
    main()
