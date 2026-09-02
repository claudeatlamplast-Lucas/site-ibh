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
  }, 2800);
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
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

if(window.gsap && window.ScrollTrigger){
  gsap.registerPlugin(ScrollTrigger);
}

let lenis;
if(window.Lenis && !prefersReducedMotion && !isTouchDevice){
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
if(window.gsap && window.ScrollTrigger && !isTouchDevice){
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

/* ---------- Fade sutil entre seções da home (mobile) ---------- */
if(document.querySelector('.hero') && window.matchMedia('(max-width:900px)').matches && !prefersReducedMotion){
  const fadeSections = document.querySelectorAll('body > section:not(.hero)');
  fadeSections.forEach(s=>{ s.style.transition = 'opacity 350ms ease'; s.style.opacity = '0.85'; });
  const fadeIO = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      entry.target.style.opacity = entry.isIntersecting ? '1' : '0.85';
    });
  }, {threshold:0.35});
  fadeSections.forEach(s=>fadeIO.observe(s));
}

/* ---------- Proteção contra cópia — documentos pessoais escaneados (Credenciais) ---------- */
document.querySelectorAll('.no-copy').forEach(el=>{
  el.addEventListener('contextmenu', e=>e.preventDefault());
  el.addEventListener('dragstart', e=>e.preventDefault());
});

/* ---------- Parallax das camadas de fumaça (equivalente ao data-ratio do izanami) ---------- */
if(window.gsap && window.ScrollTrigger && !prefersReducedMotion && !isTouchDevice){
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
    text: 'No dojang, as repetições dos exercícios são contadas em coreano:\nhana (1) · dul (2) · set (3) · net (4) · daseot (5)\nyeoseot (6) · ilgop (7) · yeodeol (8) · ahop (9) · yeol (10)',
    photo: 'assets/ig/dojang-treino.jpg',
    link: 'sobre.html', linkLabel: 'Sobre o Instituto'
  },
  {
    title: 'Como amarrar a faixa',
    text: 'Dobre a faixa ao meio para achar o centro. Envolva a cintura com o centro nas costas e cruze uma ponta sob a outra na frente. Passe a ponta de cima por dentro da volta, puxe e ajuste as duas pontas do mesmo tamanho. Cada escola pode ensinar uma variação — vale sempre seguir o jeito do seu instrutor.',
    photo: 'assets/ig/como-amarrar-faixa.jpeg',
    link: 'formacao.html', linkLabel: 'Ver Formação'
  },
  {
    title: 'Por que "dojang"?',
    text: '"Do" significa caminho e "jang" significa lugar — "dojang" é, literalmente, o "lugar do caminho". É o equivalente coreano ao "dojo" japonês: o espaço onde a técnica e a disciplina são praticadas.',
    photo: 'assets/ig/dojang-grupo-2023.jpg',
    link: 'sobre.html', linkLabel: 'Sobre o Instituto'
  },
  {
    title: 'Etiqueta no dojang coreano',
    text: 'Reverência ao entrar e sair do tatame, alunos se posicionam por graduação nas filas, e o instrutor é sempre tratado pelo título — nunca pelo primeiro nome, dentro do dobok.',
    photo: 'assets/ig/criancas-reverencia.jpg',
    link: 'sobre.html', linkLabel: 'Sobre o Instituto'
  },
  {
    title: 'A hierarquia das faixas',
    text: 'Cada cor de faixa marca uma etapa de evolução técnica e pessoal no Hapkido, da branca até a preta — e, a partir dela, os graus de Dan. A progressão é acompanhada de perto pelos instrutores do Instituto.',
    photo: 'assets/ig/hierarquia-faixas.jpeg',
    link: 'formacao.html', linkLabel: 'Ver Formação'
  },
  {
    title: 'Três gerações até o Brasil',
    text: 'A linhagem do Instituto Brasileiro de Hapkido atravessou três gerações de mestres até chegar ao Chong Kwanjangnim Raul Braga Freire, que hoje segue transmitindo a arte ao lado dos filhos em Piracaia-SP.',
    photo: 'assets/ig/mestre-raul-1.jpg',
    link: 'mestre.html', linkLabel: 'Conhecer o Mestre'
  },
  {
    title: 'O Instituto nasceu em 2007',
    text: 'O IBH é uma associação sem fins lucrativos fundada pelo Chong Kwanjangnim Raul Braga Freire em Piracaia-SP, em 2007. Hoje reúne cerca de 200 atletas em 5 escolas filiadas — mais de 70% deles crianças e jovens.',
    photo: 'assets/ig/dojang-alfa-atibaia.jpg',
    link: 'sobre.html', linkLabel: 'Sobre o Instituto'
  },
  {
    title: '116 medalhas em três mundiais',
    text: 'Entre 2013 e 2017, o Instituto conquistou 2º lugar geral nos Mundiais da Coreia do Sul e da Tailândia, além de pódio no Mundial do México — 116 medalhas documentadas em competições internacionais.',
    photo: 'assets/ig/trofeus-vitrine.jpg',
    link: 'campeonatos.html#campeonatos', linkLabel: 'Ver Campeonatos'
  },
  {
    title: 'As graduações do Mestre Raul Braga',
    text: 'O Chong Kwanjangnim Raul Braga Freire é 9º DAN de Hapkido pelo IBH, 6º DAN de Hapkido no Brasil, 5º DAN pela TUKKONG, 4º DAN de Hangumdo e 1º DAN de Hankido — além de GHA Master Instructor desde 2013.',
    photo: 'assets/ig/mestre-hangumdo-treino.jpg',
    link: 'mestre.html#mestre-raul', linkLabel: 'Conhecer o Mestre'
  },
  {
    title: 'Cidadão Honorário de Pattaya',
    text: 'Em 2015, o Mestre recebeu no mesmo dia o Diploma da Assembleia Legislativa de SP, o Certificado da GHA e o título de Mestre Honoris Causa. No Mundial da Tailândia de 2016, foi declarado Cidadão Honorário de Pattaya pela prefeitura da cidade.',
    photo: 'assets/ig/certificados/thailand-2016.jpg',
    link: 'mestre.html#mestre-raul', linkLabel: 'Conhecer o Mestre'
  },
  {
    title: 'Uma rede com 5 escolas filiadas',
    text: 'Equipe Alfa (Atibaia-SP), Escola Paekho (Batatuba, Piracaia-SP), Associação Koga de Hapkido (Lavras-MG), Escola Hyonmu (Atibaia-SP) e Escola Calza (São Paulo-SP) formam a rede de escolas filiadas ao Instituto.',
    photo: 'assets/ig/aula-filiada-flags.jpg',
    link: 'rede.html#escolas', linkLabel: 'Ver a Rede'
  },
  {
    title: 'Cinco linhas de formação',
    text: 'A formação do Instituto é organizada em cinco linhas — Autodefesa, Tradicional, Infantil, Competição e Formação de Instrutores — cada uma com seu próprio foco dentro do Hapkido.',
    photo: 'assets/ig/corpo-instrutores.jpg',
    link: 'formacao.html#programas', linkLabel: 'Ver Formação'
  },
  {
    title: 'Horários de aula em Piracaia',
    text: 'Segunda, quarta e sexta há duas turmas — 18h30 às 19h30 e 19h30 às 20h30; terça e quinta, a turma adulta é das 19h às 20h. A Equipe Alfa Atibaia combina horários direto com o professor Junior pelo WhatsApp.',
    photo: 'assets/ig/criancas-grupo-punhos.jpg',
    link: 'contato.html#horarios', linkLabel: 'Ver Horários'
  },
  {
    title: 'Como funciona a Comunidade',
    text: 'O espaço da Comunidade é onde os alunos compartilham fotos de treinos, seminários, campeonatos e viagens. O cadastro passa por aprovação do Instituto, e depois é possível solicitar trocas de graduação direto pelo perfil.',
    photo: 'assets/ig/seminario-treino-grupo.jpg',
    link: 'comunidade.html', linkLabel: 'Ver a Comunidade'
  },
  {
    title: 'Do arquivo pessoal',
    text: 'Uma trajetória em imagens: fotos raras do arquivo pessoal do Mestre Raul Braga, da fase paulistana dos anos 1980 até os dias de hoje em Piracaia, contando a história por trás do Instituto.',
    photo: 'assets/acervo/acervo-raul-kimjongman.jpg',
    link: 'mestre.html#acervo', linkLabel: 'Ver o Acervo'
  },
  {
    title: 'Entrevistas com o Mestre',
    text: 'Reunimos as entrevistas em vídeo do Chong Kwanjangnim Raul Braga desde 2017 — da primeira matéria na TV local até os podcasts mais recentes sobre a trajetória do Instituto.',
    photo: 'assets/entrevistas/gente-da-gente-2022.jpg',
    link: 'mestre.html#entrevistas', linkLabel: 'Ver Entrevistas'
  }
];

const factCard = document.getElementById('factCard');
const factBody = document.getElementById('factCardBody');
const factPhoto = document.getElementById('factPhoto');
const factTitle = document.getElementById('factTitle');
const factText = document.getElementById('factText');
const factLink = document.getElementById('factLink');
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
    const fact = FACTS[i];
    factTitle.textContent = fact.title;
    factText.textContent = fact.text;
    if(fact.photo){
      factPhoto.src = fact.photo;
      factPhoto.alt = fact.title;
      factPhoto.hidden = false;
    } else {
      factPhoto.hidden = true;
    }
    if(fact.link){
      factLink.href = fact.link;
      factLink.querySelector('span').textContent = fact.linkLabel || 'Saiba mais';
      factLink.hidden = false;
    } else {
      factLink.hidden = true;
    }
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

  factCard.addEventListener('click', (e)=>{
    if(e.target.closest('a')) return;
    stopFactTimer();
    showNextFact();
    if(!prefersReducedMotion) startFactTimer();
  });

  if(!prefersReducedMotion){
    startFactTimer();
    factCard.addEventListener('mouseenter', stopFactTimer);
    factCard.addEventListener('mouseleave', startFactTimer);
  }
}

/* ---------- Mural do Dojang (home) ----------
   Para adicionar um novo item, inserir um objeto no array MURAL (ordem não importa,
   a lista é reordenada sozinha pela data):
   { tipo: 'evento' | 'aviso', titulo: '...', texto: '...', data: '...', dataISO: 'AAAA-MM-DD' }
   dataISO é opcional e serve só para ordenar e gerar o carimbo curto (ex: "12 SET") na
   nota fechada — quem não tem dataISO cai automaticamente pro fim do mural, como "sem data". */
const MURAL = [
  {
    tipo: 'evento',
    titulo: 'Exame de Faixa',
    texto: 'Exame de faixa para os alunos das faixas Branca à Ponta Vermelha, na Escola de Arte Marcial - Piracaia. Os alunos selecionados para o exame serão notificados pessoalmente. Contamos com a presença e o empenho de todos!',
    data: 'Sábado, 12/09/2026 · 09h às 12h (previsão) · Escola de Arte Marcial, Piracaia-SP',
    dataISO: '2026-09-12'
  },
  {
    tipo: 'evento',
    titulo: 'Apresentação no EMPREPIRA',
    texto: 'O Instituto fará uma apresentação no EMPREPIRA. Contamos com a presença de todos! HAPKI!',
    data: 'Domingo, 13/09/2026 às 17h · Gruta de Nossa Senhora Aparecida, Piracaia-SP',
    dataISO: '2026-09-13'
  },
  {
    tipo: 'aviso',
    titulo: 'Campanha de arrecadação',
    texto: 'A Escola de Hapkido de Piracaia — IBH está arrecadando doações para as famílias atingidas pelas fortes chuvas na região. Toda ajuda é bem-vinda: alimentos e mantimentos, roupas para adultos e crianças, cobertores, fraldas e produtos de higiene e limpeza. As doações podem ser entregues na Academia — a equipe se encarrega de separar e levar ao Centro Esportivo, de onde serão destinadas às famílias que precisam. Se puder contribuir, contribua. Se não puder, ajude compartilhando.',
    data: 'Entregas na Academia · Piracaia-SP'
  },
  {
    tipo: 'aviso',
    titulo: 'Aula exclusiva para faixas-pretas',
    texto: 'Turma especial com o Chong Kwanjangnim Raul Braga Freire — aulas quinzenais aos domingos, revezando entre a sede do IBH em Piracaia e a escola do Sabonim Júnior Silva (Equipe Alfa), em Atibaia. Vagas limitadas.',
    data: 'Piracaia-SP e Atibaia-SP · desde janeiro de 2026'
  }
];

const muralBoard = document.getElementById('muralBoard');
if(muralBoard){
  if(!MURAL.length){
    muralBoard.innerHTML = '<p class="mural-empty">Nenhum aviso no momento.</p>';
  } else {
    const MESES_ABREV = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
    const stampFromISO = (iso)=>{
      const [, m, d] = iso.split('-');
      return d + ' ' + MESES_ABREV[Number(m) - 1];
    };
    const rotClasses = ['rot-a','rot-b','rot-c','rot-d'];

    const ordenado = MURAL
      .map((item, i) => ({ item, i }))
      .sort((a, b)=>{
        if(a.item.dataISO && b.item.dataISO) return a.item.dataISO < b.item.dataISO ? -1 : a.item.dataISO > b.item.dataISO ? 1 : a.i - b.i;
        if(a.item.dataISO && !b.item.dataISO) return -1;
        if(!a.item.dataISO && b.item.dataISO) return 1;
        return a.i - b.i;
      })
      .map(x => x.item);

    const primeiroSemData = ordenado.findIndex(item => !item.dataISO);

    ordenado.forEach((item, idx)=>{
      if(idx === primeiroSemData){
        const divisor = document.createElement('div');
        divisor.className = 'mural-divider';
        divisor.textContent = 'Sem data marcada';
        muralBoard.appendChild(divisor);
      }

      const uid = 'mural-item-' + idx;
      const rot = rotClasses[idx % rotClasses.length];

      const nota = document.createElement('button');
      nota.type = 'button';
      nota.className = 'mural-note ' + rot + (item.dataISO ? '' : ' mural-note--undated');
      nota.setAttribute('aria-expanded', 'false');
      nota.innerHTML =
        '<span class="mural-note-title">' + item.titulo + '</span>' +
        '<span class="mural-note-meta">' +
          (item.dataISO
            ? '<span class="mural-stamp">' + stampFromISO(item.dataISO) + '</span>'
            : '<span class="mural-nodate">Contínuo</span>') +
          '<span class="mural-chevron"></span>' +
        '</span>';
      muralBoard.appendChild(nota);

      const wrap = document.createElement('div');
      wrap.className = 'mural-scroll-wrap';
      wrap.innerHTML =
        '<div class="mural-scroll-inner"><div class="mural-scroll">' +
          '<span class="mural-scroll-tag">' + (item.tipo === 'evento' ? 'Evento' : 'Aviso') + '</span>' +
          '<h4>' + item.titulo + '</h4>' +
          '<p>' + item.texto + '</p>' +
          (item.data ? '<span class="mural-scroll-date">' + item.data + '</span>' : '') +
        '</div></div>';
      muralBoard.appendChild(wrap);

      nota.addEventListener('click', ()=>{
        const abrindo = !wrap.classList.contains('is-open');
        muralBoard.querySelectorAll('.mural-scroll-wrap.is-open').forEach(w => w.classList.remove('is-open'));
        muralBoard.querySelectorAll('.mural-note.is-open').forEach(n => { n.classList.remove('is-open'); n.setAttribute('aria-expanded', 'false'); });
        if(abrindo){
          wrap.classList.add('is-open');
          nota.classList.add('is-open');
          nota.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }
}

/* ---------- Card "Entrevistas" (página do Mestre) ---------- */
const INTERVIEWS = [
  {
    title: 'Piracaia na Rede — a entrevista mais antiga',
    text: 'Em 02/08/2017, o Chong Kwanjangnim Raul Braga foi entrevistado pela página Piracaia na Rede, apresentado como presidente e fundador do Instituto Brasileiro de Hapkido — o registro em vídeo mais antigo já encontrado com o Mestre.',
    photo: 'assets/entrevistas/piracaia-na-rede-2017.jpg'
  },
  {
    title: '"Matéria sobre Hapkido"',
    text: 'A página Piracaia na Rede visita o dojang do IBH e mostra como funcionam as aulas de Hapkido em Piracaia, com o Mestre Raul Braga.',
    photo: 'assets/entrevistas/materia-hapkido-2020.jpg',
    link: 'https://www.youtube.com/watch?v=u6g-bp2Hhi8', linkLabel: 'Assistir no YouTube'
  },
  {
    title: 'Podcast Gente da Gente — Ep. 01',
    text: 'Ao vivo pela Piracaia na Rede, o Mestre Raul Braga conversa por mais de uma hora sobre sua trajetória pessoal com o Hapkido, num dos registros mais longos e completos já feitos com ele.',
    photo: 'assets/entrevistas/gente-da-gente-2022.jpg',
    link: 'https://www.youtube.com/watch?v=5Vw_UlDVCLw', linkLabel: 'Assistir no YouTube'
  },
  {
    title: 'Podcast Entrelinhas #01',
    text: 'O Mestre Raul Braga, ao lado de Kyosanim do Instituto, conta a jornada do IBH desde os primeiros passos na arte marcial até as competições mundiais, num bate-papo descontraído.',
    photo: 'assets/entrevistas/entrelinhas-2023.jpg',
    link: 'https://www.youtube.com/watch?v=4plqGpfXB7c', linkLabel: 'Assistir no YouTube'
  }
];

const interviewsCard = document.getElementById('interviewsCard');
const interviewsBody = document.getElementById('interviewsCardBody');
const interviewsPhoto = document.getElementById('interviewsPhoto');
const interviewsTitle = document.getElementById('interviewsTitle');
const interviewsText = document.getElementById('interviewsText');
const interviewsLink = document.getElementById('interviewsLink');
const interviewsDotsEl = document.getElementById('interviewsDots');

if(interviewsCard && interviewsBody && INTERVIEWS.length){
  let interviewIndex = 0;
  let interviewTimer = null;

  INTERVIEWS.forEach((_, i)=>{
    const dot = document.createElement('span');
    if(i === 0) dot.classList.add('active');
    interviewsDotsEl.appendChild(dot);
  });
  const interviewDots = interviewsDotsEl.querySelectorAll('span');

  const renderInterview = (i)=>{
    const item = INTERVIEWS[i];
    interviewsTitle.textContent = item.title;
    interviewsText.textContent = item.text;
    if(item.photo){
      interviewsPhoto.src = item.photo;
      interviewsPhoto.alt = item.title;
      interviewsPhoto.hidden = false;
    } else {
      interviewsPhoto.hidden = true;
    }
    if(item.link){
      interviewsLink.href = item.link;
      interviewsLink.querySelector('span').textContent = item.linkLabel || 'Assistir';
      interviewsLink.hidden = false;
    } else {
      interviewsLink.hidden = true;
    }
    interviewDots.forEach((d, di)=>d.classList.toggle('active', di === i));
  };
  renderInterview(0);

  const showNextInterview = ()=>{
    interviewIndex = (interviewIndex + 1) % INTERVIEWS.length;
    interviewsBody.classList.add('fading');
    setTimeout(()=>{
      renderInterview(interviewIndex);
      interviewsBody.classList.remove('fading');
    }, 500);
  };

  const startInterviewTimer = ()=>{ interviewTimer = setInterval(showNextInterview, 7000); };
  const stopInterviewTimer = ()=>{ clearInterval(interviewTimer); interviewTimer = null; };

  interviewsCard.addEventListener('click', (e)=>{
    if(e.target.closest('a')) return;
    stopInterviewTimer();
    showNextInterview();
    if(!prefersReducedMotion) startInterviewTimer();
  });

  if(!prefersReducedMotion){
    startInterviewTimer();
    interviewsCard.addEventListener('mouseenter', stopInterviewTimer);
    interviewsCard.addEventListener('mouseleave', startInterviewTimer);
  }
}

/* ---------- Acervo (carrossel de fotos antigas) ---------- */
const ACERVO = [
  {
    img: 'assets/acervo/acervo-raul-kimjongman.jpg',
    alt: 'Jovem Raul Braga Freire ao lado do Grão-Mestre Kim Jong Man',
    caption: 'Raul Braga com o Grão-Mestre Kim Jong Man, seu formador na fase paulistana'
  },
  {
    img: 'assets/acervo/acervo-turma-faixas-pretas-sp.jpg',
    alt: 'Turma de faixas-pretas da fase paulistana do Hapkido, por volta de 1988/89',
    caption: 'Turma de faixas-pretas da fase paulistana, por volta de 1988/89'
  },
  {
    img: 'assets/acervo/acervo-raul-alex.jpg',
    alt: 'Raul Braga Freire com o filho Alex Santos Freire, ainda criança, no dojang de casa',
    caption: 'Raul com o filho Alex, ainda criança, no dojang de casa'
  },
  {
    img: 'assets/acervo/acervo-raul-igor-maruca.jpg',
    alt: 'Mestre Raul Braga Freire aplicando uma técnica de defesa pessoal no Kyosanim Igor Maruca, em apresentação pública',
    caption: 'Demonstração de defesa pessoal com o Kyosanim Igor Maruca'
  },
  {
    img: 'assets/acervo/acervo-raul-pais.jpg',
    alt: 'Mestre Raul Braga Freire ao lado de seus pais',
    caption: 'O Mestre Raul Braga Freire ao lado dos pais'
  }
];

const acervoImg = document.getElementById('acervoImg');
const acervoCaption = document.getElementById('acervoCaption');
const acervoDotsEl = document.getElementById('acervoDots');
const acervoPrev = document.getElementById('acervoPrev');
const acervoNext = document.getElementById('acervoNext');

if(acervoImg && acervoCaption && ACERVO.length){
  let acervoIndex = 0;

  ACERVO.forEach((_, i)=>{
    const dot = document.createElement('span');
    if(i === 0) dot.classList.add('active');
    dot.addEventListener('click', ()=>renderAcervo(i));
    acervoDotsEl.appendChild(dot);
  });
  const acervoDots = acervoDotsEl.querySelectorAll('span');

  function renderAcervo(i){
    acervoIndex = (i + ACERVO.length) % ACERVO.length;
    const item = ACERVO[acervoIndex];
    acervoImg.src = item.img;
    acervoImg.alt = item.alt;
    acervoCaption.textContent = item.caption;
    acervoDots.forEach((d, di)=>d.classList.toggle('active', di === acervoIndex));
  }
  renderAcervo(0);

  if(acervoPrev) acervoPrev.addEventListener('click', ()=>renderAcervo(acervoIndex - 1));
  if(acervoNext) acervoNext.addEventListener('click', ()=>renderAcervo(acervoIndex + 1));
}

if('serviceWorker' in navigator){
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('/service-worker.js').catch(function(){});
  });
}
