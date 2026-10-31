(function(){
  'use strict';
  var IDEAS = window.IDEAS || [];
  var DOC = {workshop:'מתועד בסדנה', chapter:'מתועד בפרק "איך משוטטים"', chapterAI:'מתועד בפרק, הנוסח בבדיקה', idea:'רעיון מתועד, טרם נוסה', external:'מקור חיצוני', nameonly:'שם בלבד, חסר נוסח', told:'לפי תיאור של תומר'};
  var PLACE = {city:'עיר ורחוב', neighborhood:'שכונה', nature:'טבע או גינה', institution:'מוסד', any:'כל מקום'};
  var SLOT = {entry:'כניסה', move:'תנועה', discern:'הבחנה', trace:'עקבה', 'return':'חזרה'};
  var SLOTS = ['entry','move','discern','trace','return'];

  function el(tag, cls, text){ var e=document.createElement(tag); if(cls) e.className=cls; if(text!=null) e.textContent=text; return e; }
  function places(r){ return Array.isArray(r.places) ? r.places : null; }

  /* ---------- A: ideas ---------- */
  var grid = document.getElementById('ideas-grid');
  var state = {k:'all', p:'all', q:''};

  function card(r){
    var d = el('details','idea' + (r.kind==='lens'?' lens':'') + (r.invite?'':' noinv'));
    d.dataset.id = r.id;
    var s = el('summary');
    var top = el('div','i-top');
    top.appendChild(el('span','i-kind', r.kind==='lens' ? 'עדשה' : 'תרגול'));
    if (r.min) top.appendChild(el('span','i-min', r.min + ' דק׳'));
    s.appendChild(top);
    s.appendChild(el('h3', null, r.name.replace(/^עדשה: /,'')));
    s.appendChild(el('p','i-inv', r.invite || 'שם בלבד. עוד אין נוסח הזמנה.'));
    var meta = el('div','i-meta');
    var pl = places(r);
    meta.appendChild(el('span','i-pl', pl ? pl.map(function(x){return PLACE[x]||x}).join(' · ') : 'כל מקום'));
    if (r.border) meta.appendChild(el('span','verify','שיוך למאגר בבדיקה'));
    s.appendChild(meta);
    d.appendChild(s);

    var body = el('div','i-body');
    var dl = el('dl');
    function row(k,v){ if(!v) return; var w=el('div'); w.appendChild(el('dt',null,k)); w.appendChild(el('dd',null,v)); dl.appendChild(w); }
    if (r.note) row('הערה למנחה', r.note);
    row('תיעוד', DOC[r.doc] || r.doc);
    row('מקור', r.src);
    if (r.slots && r.slots.length) row('במשוטט, בשלב', r.slots.map(function(x){return SLOT[x]||x}).join(', '));
    body.appendChild(dl);
    d.appendChild(body);
    return d;
  }

  function match(r){
    if (state.k!=='all' && r.kind!==state.k) return false;
    if (state.p!=='all'){ var pl=places(r); if (pl && pl.indexOf(state.p)<0) return false; }
    if (state.q){ var t=(r.name+' '+(r.invite||'')+' '+(r.src||'')).toLowerCase(); if (t.indexOf(state.q)<0) return false; }
    return true;
  }

  function render(){
    grid.textContent='';
    var n=0;
    IDEAS.forEach(function(r){ if(match(r)){ grid.appendChild(card(r)); n++; } });
    if (!n) grid.appendChild(el('p','none','אין רעיון שמתאים לסינון הזה.'));
    var add = el('div','idea add');
    add.appendChild(el('span','plus','+'));
    add.appendChild(el('b',null,'מקום לרעיון הבא'));
    add.appendChild(el('p',null,'רעיונות חדשים נכנסים בידי המחבר, עם מקור ותיעוד.'));
    grid.appendChild(add);
    document.getElementById('shown').textContent = n;
  }

  function group(sel, key){
    var bs=[].slice.call(document.querySelectorAll(sel));
    bs.forEach(function(b){ b.addEventListener('click',function(){
      bs.forEach(function(x){ x.classList.remove('on'); x.setAttribute('aria-pressed','false'); });
      b.classList.add('on'); b.setAttribute('aria-pressed','true');
      state[key] = b.dataset[key]; render();
    }); });
  }
  if (grid){
    group('.filt .f','k'); group('.filt .p','p');
    var q=document.getElementById('q');
    q.addEventListener('input',function(){ state.q=q.value.trim().toLowerCase(); render(); });
    document.getElementById('total').textContent = IDEAS.length;
    document.getElementById('count-a').textContent = IDEAS.length;
    render();
  }

  /* ---------- B: purposes ---------- */
  var petals=[].slice.call(document.querySelectorAll('.petal'));
  petals.forEach(function(b){ b.addEventListener('click',function(){
    petals.forEach(function(x){ x.setAttribute('aria-pressed','false'); });
    b.setAttribute('aria-pressed','true');
    document.getElementById('shelf-n').textContent = 'מטרה ' + (+b.dataset.i + 1);
    document.getElementById('shelf-t').textContent = b.querySelector('span').textContent;
  }); });
  var segs=[].slice.call(document.querySelectorAll('.sg'));
  segs.forEach(function(b){ b.addEventListener('click',function(){
    segs.forEach(function(x){ x.classList.remove('on'); x.setAttribute('aria-pressed','false'); });
    b.classList.add('on'); b.setAttribute('aria-pressed','true');
    document.getElementById('shelf-kind').textContent = b.dataset.t==='tool' ? 'כלים' : 'מתודולוגיות שלמות';
  }); });

  /* ---------- C: journey templates ---------- */
  var path=document.getElementById('solo-path');
  if (path){
    SLOTS.forEach(function(s,i){
      var c = IDEAS.filter(function(r){ return r.slots && r.slots.indexOf(s)>=0; }).length;
      var li=el('li');
      li.appendChild(el('i',null,String(i+1)));
      li.appendChild(el('b',null,SLOT[s]));
      li.appendChild(el('span','sock s-a', c + ' רעיונות ממאגר א'));
      path.appendChild(li);
    });
  }
  var tabs=[].slice.call(document.querySelectorAll('.mt'));
  function show(t){
    tabs.forEach(function(x){ var on=x===t; x.classList.toggle('on',on); x.setAttribute('aria-selected',on); document.getElementById(x.getAttribute('aria-controls')).hidden=!on; });
  }
  tabs.forEach(function(t){ t.addEventListener('click',function(){ show(t); }); });
  if (location.hash==='#journeys-group'){ show(document.getElementById('tab-group')); var j=document.getElementById('journeys'); if(j) setTimeout(function(){ j.scrollIntoView(); },0); }
})();
