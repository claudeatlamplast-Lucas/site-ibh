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

/* ---------- Cursor (ponto preciso + anel com leve atraso) ---------- */
const dot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');
if(dot){
  window.addEventListener('mousemove', e=>{
    dot.style.left = e.clientX+'px';
    dot.style.top = e.clientY+'px';
    if(cursorRing){
      cursorRing.style.left = e.clientX+'px';
      cursorRing.style.top = e.clientY+'px';
    }
  });
}
if(dot && cursorRing){
  const CURSOR_HOVER_SELECTOR = 'a, button, [role="button"], input, textarea, select, label';
  document.addEventListener('mouseover', e=>{
    if(e.target.closest(CURSOR_HOVER_SELECTOR)){
      dot.classList.add('hover');
      cursorRing.classList.add('hover');
    }
  });
  document.addEventListener('mouseout', e=>{
    const leavingInteractive = e.target.closest(CURSOR_HOVER_SELECTOR);
    const enteringInteractive = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(CURSOR_HOVER_SELECTOR);
    if(leavingInteractive && !enteringInteractive){
      dot.classList.remove('hover');
      cursorRing.classList.remove('hover');
    }
  });
}

/* ---------- Botão Voltar ---------- */
const backBtn = document.getElementById('backBtn');
if(backBtn){
  backBtn.addEventListener('click', ()=>{
    if(history.length > 1){ history.back(); }
    else { window.location.href = 'index.html'; }
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
  lenis = new Lenis({
    duration: 1.0,
    easing: (t)=> 1 - Math.pow(1 - t, 4), // ease-out-quart — resposta mais imediata, chegada macia
    smoothWheel: true,
    wheelMultiplier: 1.05
  });
  if(window.gsap && window.ScrollTrigger){
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time)=>{ lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (time)=>{ lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
}

/* ---------- Reveal on scroll (fade + translateY, com stagger em grids) ---------- */
const revealEls = document.querySelectorAll('.reveal');
const staggerEls = document.querySelectorAll('.reveal-stagger');
if(window.gsap && window.ScrollTrigger){
  revealEls.forEach(el=>{
    gsap.fromTo(el, {opacity:0, y:24}, {
      opacity:1, y:0, duration:1.1, ease:'power2.out',
      scrollTrigger:{ trigger: el, start:'top 85%', once:true }
    });
  });
  staggerEls.forEach(el=>{
    gsap.fromTo(el.children, {opacity:0, y:22}, {
      opacity:1, y:0, duration:0.85, ease:'power2.out', stagger:0.09,
      scrollTrigger:{ trigger: el, start:'top 88%', once:true }
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
  staggerEls.forEach(el=>revealIO.observe(el));
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

/* ---------- Card "Você sabia?" (curiosidades rotativas) ---------- */
const FACTS = [
  {
    title: 'Contando em coreano',
    text: 'No dojang, as repetições dos exercícios são contadas em coreano:\nhana (1) · dul (2) · set (3) · net (4) · daseot (5)\nyeoseot (6) · ilgop (7) · yeodeol (8) · ahop (9) · yeol (10)'
  },
  {
    title: 'Como amarrar a faixa',
    text: 'Dobre a faixa ao meio para achar o centro. Envolva a cintura com o centro nas costas e cruze uma ponta sob a outra na frente. Passe a ponta de cima por dentro da volta, puxe e ajuste as duas pontas do mesmo tamanho. Cada escola pode ensinar uma variação — vale sempre seguir o jeito do seu instrutor.'
  },
  {
    title: 'Por que "dojang"?',
    text: '"Do" significa caminho e "jang" significa lugar — "dojang" é, literalmente, o "lugar do caminho". É o equivalente coreano ao "dojo" japonês: o espaço onde a técnica e a disciplina são praticadas.'
  },
  {
    title: 'Etiqueta no dojang coreano',
    text: 'Reverência ao entrar e sair do tatame, alunos se posicionam por graduação nas filas, e o instrutor é sempre tratado pelo título — nunca pelo primeiro nome, dentro do dobok.'
  }
];

const factCard = document.getElementById('factCard');
const factBody = document.getElementById('factCardBody');
const factTitle = document.getElementById('factTitle');
const factText = document.getElementById('factText');
const factDotsEl = document.getElementById('factDots');

if(factCard && factBody && FACTS.length){
  let factIndex = 0;
  let factTimer = null;

  FACTS.forEach((_, i)=>{
    const dot = document.createElement('span');
    if(i === 0) dot.classList.add('active');
    factDotsEl.appendChild(dot);
  });
  const dots = factDotsEl.querySelectorAll('span');

  const renderFact = (i)=>{
    factTitle.textContent = FACTS[i].title;
    factText.textContent = FACTS[i].text;
    dots.forEach((d, di)=>d.classList.toggle('active', di === i));
  };
  renderFact(0);

  const showNextFact = ()=>{
    factIndex = (factIndex + 1) % FACTS.length;
    factBody.classList.add('fading');
    setTimeout(()=>{
      renderFact(factIndex);
      factBody.classList.remove('fading');
    }, 500);
  };

  const startFactTimer = ()=>{ factTimer = setInterval(showNextFact, 7000); };
  const stopFactTimer = ()=>{ clearInterval(factTimer); factTimer = null; };

  if(!prefersReducedMotion){
    startFactTimer();
    factCard.addEventListener('mouseenter', stopFactTimer);
    factCard.addEventListener('mouseleave', startFactTimer);
  }
}
