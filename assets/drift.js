/* Twinkling stars behind every page: fixed places, scattered sizes and distances, each one blinks at its own random rhythm. No movement across the screen (creator 13.11). With reduced motion the stars stay still. */
(function(){
  if(document.getElementById('drift'))return;var cv=document.createElement('canvas');cv.id='drift';cv.setAttribute('aria-hidden','true');cv.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none';document.body.prepend(cv);var x=cv.getContext('2d');
  var W=0,H=0,dpr=Math.min(2,devicePixelRatio||1),S=[],still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function size(){W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0)}
  function day(){return document.documentElement.getAttribute('data-sky')==='day'}
  function star(i){var r=Math.random,k=r();return{x:r()*W,y:r()*H,s:k<.6?.5+r()*.6:k<.9?1+r()*.8:1.9+r()*1.4,gold:r()<.22,p:3+r()*9,o:r()*20,on:.15+r()*.35,b:.25+r()*.75}}
  function init(){size();var n=Math.round(Math.min(150,Math.max(45,W*H/7000)));S=[];for(var i=0;i<n;i++)S.push(star(i))}
  function lum(p,t){var q=((t/1000+p.o)%p.p)/p.p;if(q>p.on)return .12*p.b;var f=Math.sin(Math.PI*q/p.on);return (.12+.88*f*f)*p.b}
  function draw(t){x.clearRect(0,0,W,H);var d=day();
    S.forEach(function(p){var a=still?.6*p.b:lum(p,t);var c=d?(p.gold?'176,125,18':'15,45,74'):(p.gold?'222,176,60':'255,243,210');
      if(p.s>1.4){var g=x.createRadialGradient(p.x,p.y,0,p.x,p.y,p.s*3.2);g.addColorStop(0,'rgba('+c+','+((d?.4:.6)*a).toFixed(3)+')');g.addColorStop(1,'rgba('+c+',0)');x.fillStyle=g;x.beginPath();x.arc(p.x,p.y,p.s*3.2,0,6.283);x.fill()}
      x.fillStyle='rgba('+c+','+((d?.6:.95)*a).toFixed(3)+')';x.beginPath();x.arc(p.x,p.y,p.s*.6,0,6.283);x.fill()})}
  init();addEventListener('resize',function(){init();if(still)draw(0)});
  if(still){draw(0)}else{(function frame(t){if(!document.hidden)draw(t);requestAnimationFrame(frame)})(performance.now())}
  new MutationObserver(function(){draw(performance.now())}).observe(document.documentElement,{attributes:true,attributeFilter:['data-sky']});
})()
