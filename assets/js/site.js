/* ======================================================================
   Instituto Brasileiro de Hapkido — JS compartilhado
   Lenis (smooth scroll) + GSAP/ScrollTrigger (reveals, parallax de fumaça),
   mesmo par de bibliotecas usado em izanami-official.com.
   Requer <script> do Lenis e do GSAP (+ScrollTrigger) carregados antes deste.
   ====================================================================== */
document.getElementById('year') && (document.getElementById('year').textContent = new Date().getFullYear());

/* ---------- Intro overlay (só na home) ---------- */
const introOverlay = document.getElementById('introOverlay');
if(introOverlay){
  introOverlay.addEventListener('animationend', ()=>{
    document.body.classList.remove('intro-active');
    introOverlay.remove();
  });
  setTimeout(()=>{
    document.body.classList.remove('intro-active');
    if(introOverlay.parentNode) introOverlay.remove();
  }, 5000);
}

/* ---------- Cursor ---------- */
const dot = document.getElementById('cursorDot');
if(dot){
  window.addEventListener('mousemove', e=>{
    dot.style.left = e.clientX+'px';
    dot.style.top = e.clientY+'px';
  });
}

/* ---------- Fullscreen menu ---------- */
const overlay = document.getElementById('menuOverlay');
const menuOpenBtn = document.getElementById('menuOpenBtn');
const menuCloseBtn = document.getElementById('menuCloseBtn');
if(overlay && menuOpenBtn){
  menuOpenBtn.addEventListener('click', ()=>overlay.classList.add('open'));
  menuCloseBtn.addEventListener('click', ()=>overlay.classList.remove('open'));
  overlay.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>overlay.classList.remove('open')));

  const currentFile = (location.pathname.split('/').pop() || 'index.html');
  overlay.querySelectorAll('a[href]').forEach(a=>{
    const hrefFile = a.getAttribute('href').split('/').pop() || 'index.html';
    if(hrefFile === currentFile) a.classList.add('current');
  });
}

/* ---------- Section index dots (lateral) ---------- */
const sections = document.querySelectorAll('section[data-nav]');
const nav = document.getElementById('sectionNav');
if(nav && sections.length){
  sections.forEach((s)=>{
    const b = document.createElement('button');
    b.title = s.dataset.nav;
    b.addEventListener('click', ()=>s.scrollIntoView({behavior:'smooth'}));
    nav.appendChild(b);
  });
  const navButtons = nav.querySelectorAll('button');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const idx = Array.from(sections).indexOf(entry.target);
        navButtons.forEach(b=>b.classList.remove('active'));
        navButtons[idx].classList.add('active');
      }
    });
  },{threshold:0.5});
  sections.forEach(s=>io.observe(s));
}

/* ---------- Lenis smooth scroll + GSAP ScrollTrigger ---------- */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if(window.gsap && window.ScrollTrigger){
  gsap.registerPlugin(ScrollTrigger);
}

let lenis;
if(window.Lenis && !prefersReducedMotion){
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  if(window.gsap && window.ScrollTrigger){
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time)=>{ lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (time)=>{ lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
}

/* ---------- Reveal on scroll (fade + translateY) ---------- */
const revealEls = document.querySelectorAll('.reveal');
if(window.gsap && window.ScrollTrigger){
  revealEls.forEach(el=>{
    gsap.fromTo(el, {opacity:0, y:24}, {
      opacity:1, y:0, duration:1.1, ease:'power2.out',
      scrollTrigger:{ trigger: el, start:'top 85%', once:true }
    });
  });
} else {
  const revealIO = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        revealIO.unobserve(entry.target);
      }
    });
  },{threshold:0.15});
  revealEls.forEach(el=>revealIO.observe(el));
}

/* ---------- Proteção contra cópia — documentos pessoais escaneados (Credenciais) ---------- */
document.querySelectorAll('.no-copy').forEach(el=>{
  el.addEventListener('contextmenu', e=>e.preventDefault());
  el.addEventListener('dragstart', e=>e.preventDefault());
});

/* ---------- Parallax das camadas de fumaça (equivalente ao data-ratio do izanami) ---------- */
if(window.gsap && window.ScrollTrigger && !prefersReducedMotion){
  document.querySelectorAll('.smoke-wrap').forEach(wrap=>{
    const section = wrap.closest('section') || wrap.parentElement;
    gsap.to(wrap, {
      yPercent: 15,
      ease:'none',
      scrollTrigger:{ trigger: section, start:'top bottom', end:'bottom top', scrub:true }
    });
  });
}
