/* ============================================================
   EAGLOPEN AMBASSADOR SECTION - shared behaviour (loaded once per page).
   Copied verbatim from the supplied <script id="am-script"> block.
   Runs on load; the section markup sits above this file's <script>
   tag in the page, so the DOM nodes it queries already exist.
   ============================================================ */
(function(){
  var sec=document.querySelector('.am'); if(!sec) return;
  var scene=document.getElementById('am-scene'), pass=sec.querySelector('.am-pass');
  var calm=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // stars
  var st=document.getElementById('am-stars');
  for(var i=0;i<38;i++){var s=document.createElement('span');s.className='am-star';
    s.style.left=(Math.random()*100)+'%';s.style.top=(Math.random()*100)+'%';
    s.style.animationDelay=(Math.random()*4)+'s';s.style.animationDuration=(3+Math.random()*3)+'s';st.appendChild(s);}

  // entrance
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(e){if(e[0].isIntersecting){sec.classList.add('is-in');io.disconnect();}},{threshold:.2});
    io.observe(sec);
  } else sec.classList.add('is-in');
  if(calm){sec.classList.add('is-in');return;}

  // pointer tilt + holographic sheen, idle sway otherwise
  var tx=0,ty=0,cx=0,cy=0,hover=false,t0=performance.now(),vis=true;
  sec.addEventListener('pointermove',function(e){
    var r=sec.getBoundingClientRect();
    var nx=(e.clientX-r.left)/r.width-.5, ny=(e.clientY-r.top)/r.height-.5;
    tx=nx*30; ty=-ny*16; hover=true;
    var b=pass.getBoundingClientRect();
    pass.style.setProperty('--mx',((e.clientX-b.left)/b.width*100)+'%');
    pass.style.setProperty('--my',((e.clientY-b.top)/b.height*100)+'%');
  });
  sec.addEventListener('pointerleave',function(){hover=false;});
  new IntersectionObserver(function(e){vis=e[0].isIntersecting;}).observe(sec);

  (function loop(now){
    if(vis){
      if(!hover){var s=(now-t0)/1000;tx=Math.sin(s*.6)*14;ty=Math.cos(s*.45)*4;}
      cx+=(tx-cx)*.07;cy+=(ty-cy)*.07;
      scene.style.setProperty('--ry',cx.toFixed(2)+'deg');
      scene.style.setProperty('--rx',cy.toFixed(2)+'deg');
      pass.style.setProperty('--hx',(50+cx*2.4).toFixed(1)+'%');
    }
    requestAnimationFrame(loop);
  })(t0);
})();
