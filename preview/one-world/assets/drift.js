/* Drifting stars with fading trails, the same motion as the Word Field, behind every page (brief 12.11). No motion when the visitor asks for reduced motion. */
(function(){
  if(document.getElementById('drift'))return;var cv=document.createElement('canvas');cv.id='drift';cv.setAttribute('aria-hidden','true');cv.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none';document.body.prepend(cv);var x=cv.getContext('2d');
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var W=0,H=0,dpr=Math.min(2,devicePixelRatio||1),S=[];
  function size(){W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0)}
  function day(){return document.documentElement.getAttribute('data-sky')==='day'}
  function star(i){var r=Math.random;return{x:r()*W,y:r()*H,a:r()*6.3,s:i%5===0?3.2:i%3===0?2.2:1.3+r()*.6,v:6+r()*16,turn:(r()-.5)*.5,ph:r()*6.3,gold:i%4===0}}
  function init(){size();var n=Math.round(Math.min(16,Math.max(7,W*H/90000)));S=[];for(var i=0;i<n;i++)S.push(star(i))}
  init();addEventListener('resize',function(){size()});
  var last=performance.now();
  function frame(now){var dt=Math.min(.05,(now-last)/1000);last=now;
    if(document.hidden){requestAnimationFrame(frame);return}
    x.clearRect(0,0,W,H);var d=day();
    S.forEach(function(p,i){p.ph+=dt*.4;p.a+=Math.sin(p.ph)*p.turn*dt;p.x+=Math.cos(p.a)*p.v*dt;p.y+=Math.sin(p.a)*p.v*dt;
      if(p.x<-60||p.x>W+60||p.y<-60||p.y>H+60){var q=star(i);q.x=Math.random()<.5?-20:W+20;q.y=Math.random()*H;q.a=q.x<0?(Math.random()-.5):Math.PI+(Math.random()-.5);S[i]=q;return}
      p.tr=p.tr||[];p.tr.push([p.x,p.y,now]);while(p.tr.length&&now-p.tr[0][2]>4200)p.tr.shift();
      var tw=.65+.35*Math.sin(now/700+i*1.7);
      var c=d?(p.gold?'176,125,18':'15,45,74'):(p.gold?'222,176,60':'255,243,210');
      x.lineCap='round';for(var k=1;k<p.tr.length;k++){var f=1-(now-p.tr[k][2])/4200;x.strokeStyle='rgba('+c+','+(f*f*(d?.35:.5)).toFixed(3)+')';x.lineWidth=p.s*.7*f+.2;
        x.beginPath();x.moveTo(p.tr[k-1][0],p.tr[k-1][1]);x.lineTo(p.tr[k][0],p.tr[k][1]);x.stroke()}
      var g=x.createRadialGradient(p.x,p.y,0,p.x,p.y,p.s*4);g.addColorStop(0,'rgba('+c+','+(d?.55:.85)*tw+')');g.addColorStop(.3,'rgba('+c+','+(d?.18:.3)*tw+')');g.addColorStop(1,'rgba('+c+',0)');
      x.fillStyle=g;x.beginPath();x.arc(p.x,p.y,p.s*4,0,6.283);x.fill();
      x.fillStyle='rgba('+c+','+(d?.7:.95)*tw+')';x.beginPath();x.arc(p.x,p.y,p.s*.55,0,6.283);x.fill()});
    requestAnimationFrame(frame)}
  requestAnimationFrame(frame);
  new MutationObserver(function(){x.clearRect(0,0,W,H)}).observe(document.documentElement,{attributes:true,attributeFilter:['data-sky']});
})()
