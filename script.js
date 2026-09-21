(() => {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ============ 1. Construir flores SVG ============ */
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // Girasol: dos capas de 16 pétalos + semillas en espiral (ángulo áureo)
  const PET_GIRA = 'M0 -14 C7 -22 8 -38 0 -48 C-8 -38 -7 -22 0 -14Z';
  for (let i = 0; i < 16; i++) {
    el('path', { d: PET_GIRA, transform: `rotate(${i * 22.5 + 11.25}) scale(.93)` }, $('#gira-atras'));
    el('path', { d: PET_GIRA, transform: `rotate(${i * 22.5})` }, $('#gira-frente'));
    el('path', { d: 'M0 -18 L0 -43', transform: `rotate(${i * 22.5})` }, $('#gira-venas'));
  }
  const SEM = 120;
  for (let i = 1; i <= SEM; i++) {
    const a = i * 137.508 * Math.PI / 180;
    const r = 15.6 * Math.sqrt(i / SEM);
    el('circle', {
      cx: (r * Math.cos(a)).toFixed(2),
      cy: (r * Math.sin(a)).toFixed(2),
      r: (0.5 + 0.7 * i / SEM).toFixed(2),
      fill: i % 3 === 0 ? '#C98A2B' : '#6B3F0E',
      opacity: 0.85
    }, $('#gira-semillas'));
  }

  // Margarita: dos capas de 14 pétalos + puntitos en el centro
  for (let i = 0; i < 14; i++) {
    const a = i * (360 / 14);
    el('ellipse', { rx: 5.2, ry: 18, cy: -27, transform: `rotate(${a + 360 / 28})` }, $('#marg-atras'));
    el('ellipse', { rx: 5.6, ry: 19.5, cy: -26, transform: `rotate(${a})` }, $('#marg-frente'));
  }
  for (let i = 1; i <= 34; i++) {
    const a = i * 137.508 * Math.PI / 180;
    const r = 9 * Math.sqrt(i / 34);
    el('circle', { cx: (r * Math.cos(a)).toFixed(2), cy: (r * Math.sin(a)).toFixed(2), r: 0.75 }, $('#marg-puntos'));
  }

  // Rosa: tres anillos de pétalos, de afuera hacia adentro
  const PET_ROSA = 'M0 -4 C-21 -10 -25 -37 0 -43 C25 -37 21 -10 0 -4Z';
  [[1, 0], [0.74, 36], [0.5, 14]].forEach(([s, off]) => {
    for (let i = 0; i < 5; i++) {
      el('path', { d: PET_ROSA, transform: `rotate(${i * 72 + off}) scale(${s})` }, $('#rosa-petalos'));
    }
  });

  /* ============ 2. Pétalos de fondo ============ */
  const cont = $('#petalos');
  const crearPetalo = (extra) => {
    const p = document.createElement('span');
    p.className = 'petalo' + (extra ? ' extra' : '');
    p.style.left = rnd(0, 100) + 'vw';
    p.style.setProperty('--s', rnd(9, 17) + 'px');
    p.style.setProperty('--dur', rnd(13, 22) + 's');
    p.style.setProperty('--del', -rnd(0, 22) + 's');
    p.style.setProperty('--sway', rnd(-40, 40) + 'px');
    p.style.setProperty('--o', rnd(0.35, 0.75).toFixed(2));
    cont.appendChild(p);
  };
  for (let i = 0; i < 16; i++) crearPetalo(false);
  for (let i = 0; i < 10; i++) crearPetalo(true);

  /* ============ 3. Precarga de fotos ============ */
  $$('.polaroid img').forEach((img) => {
    const pre = new Image();
    pre.src = img.getAttribute('src');
    img.addEventListener('error', () => img.parentElement.classList.add('sin-foto'));
  });

  /* ============ 4. Música ============ */
  const audio = $('#musica');
  const btnMusica = $('#btnMusica');
  let sonando = false;

  const actualizarBtnMusica = () => {
    btnMusica.textContent = sonando ? '🔊' : '🔇';
    btnMusica.setAttribute('aria-label', sonando ? 'Pausar música' : 'Reproducir música');
  };
  const play = () => audio.play().then(() => { sonando = true; actualizarBtnMusica(); }).catch(() => {});
  const pause = () => { audio.pause(); sonando = false; actualizarBtnMusica(); };

  btnMusica.addEventListener('click', () => (sonando ? pause() : play()));

  // Si sale de la app, pausa; al volver, retoma
  let eraSonando = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { eraSonando = sonando; if (sonando) audio.pause(); }
    else if (eraSonando) audio.play().catch(() => {});
  });

  /* ============ 5. Navegación ============ */
  const pantallas = $$('.pantalla');
  const RAMO = 5, CARTA = 6;
  const nav = $('#nav');
  const btnSig = $('#btnSiguiente');
  const btnAnt = $('#btnAnterior');
  const progreso = $('#progreso');
  const iconos = $$('#progreso svg');
  const pantallaRamo = $('#pantallaRamo');
  let actual = 0;
  let bloqueado = false;
  let timerRamo = null;

  function textoBoton(n) {
    if (n === 4) return 'Ver tu ramo 💐';
    if (n === RAMO) return 'Leer mi carta 💌';
    return 'Siguiente flor 🌼';
  }

  function armarRamo() {
    const chispas = $('#chispas');
    chispas.innerHTML = '';
    for (let i = 0; i < 16; i++) {
      const c = document.createElement('span');
      c.className = 'chispa';
      c.style.setProperty('--x', rnd(15, 85) + '%');
      c.style.setProperty('--y', rnd(20, 60) + '%');
      c.style.setProperty('--t', rnd(5, 10) + 'px');
      c.style.setProperty('--dx', rnd(-40, 40) + 'px');
      c.style.setProperty('--d', (5.2 + rnd(0, 1.2)).toFixed(2) + 's');
      c.style.setProperty('--dur', rnd(1.6, 2.6).toFixed(2) + 's');
      chispas.appendChild(c);
    }
    pantallaRamo.classList.remove('armar');
    void pantallaRamo.offsetWidth; // reinicia animaciones
    pantallaRamo.classList.add('armar');
  }

  function ir(n) {
    if (bloqueado || n === actual || n < 1 || n >= pantallas.length) return;
    bloqueado = true;
    setTimeout(() => { bloqueado = false; }, 650);

    const adelante = n > actual;
    const vieja = pantallas[actual];
    const nueva = pantallas[n];

    vieja.classList.remove('activa');
    vieja.classList.toggle('atras', adelante);
    nueva.classList.remove('atras');
    nueva.scrollTop = 0;
    nueva.classList.add('activa');
    actual = n;

    // Ramo
    clearTimeout(timerRamo);
    if (vieja === pantallaRamo) setTimeout(() => pantallaRamo.classList.remove('armar'), 700);
    document.body.classList.toggle('modo-ramo', n === RAMO);

    // Progreso
    progreso.classList.remove('oculto');
    iconos.forEach((ic, i) => ic.classList.toggle('lista', i < Math.min(n, 4)));

    // Navegación
    btnSig.textContent = textoBoton(n);
    btnAnt.classList.toggle('oculto', n === 1);
    if (n === CARTA) {
      nav.classList.add('oculto');
    } else if (n === RAMO) {
      nav.classList.add('oculto');
      armarRamo();
      timerRamo = setTimeout(() => nav.classList.remove('oculto'), reduce ? 300 : 6800);
    } else {
      nav.classList.remove('oculto');
    }
  }

  const siguiente = () => {
    if (actual === RAMO && nav.classList.contains('oculto')) return; // esperar a que se arme
    ir(actual + 1);
  };
  const anterior = () => ir(actual - 1);

  btnSig.addEventListener('click', siguiente);
  btnAnt.addEventListener('click', anterior);
  $('#btnReiniciar').addEventListener('click', () => ir(1));

  // Portada: primer toque → música + abrir el pimpollo
  $('#btnAbrir').addEventListener('click', () => {
    play();
    btnMusica.classList.remove('oculto');
    $('#pimpolloPortada').classList.add('abriendo');
    setTimeout(() => ir(1), reduce ? 100 : 750);
  }, { once: true });

  // Swipe
  let x0 = null, y0 = null;
  const app = $('#app');
  app.addEventListener('touchstart', (e) => {
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
  }, { passive: true });
  app.addEventListener('touchend', (e) => {
    if (x0 === null || actual === 0) return;
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0 && actual !== CARTA) siguiente();
    else if (dx > 0) anterior();
  }, { passive: true });

  // Teclado (compu)
  document.addEventListener('keydown', (e) => {
    if (actual === 0) return;
    if (e.key === 'ArrowRight' && actual !== CARTA) siguiente();
    if (e.key === 'ArrowLeft') anterior();
  });

  /* ============ 6. Tocar una flor del ramo ============ */
  $$('.rf').forEach((flor) => {
    flor.addEventListener('click', (e) => {
      flor.classList.remove('rebote');
      void flor.getBoundingClientRect();
      flor.classList.add('rebote');
      setTimeout(() => flor.classList.remove('rebote'), 750);

      const r = flor.getBoundingClientRect();
      const cx = e.clientX || r.left + r.width / 2;
      const cy = e.clientY || r.top + r.height / 2;
      for (let i = 0; i < 3; i++) {
        const p = document.createElement('span');
        p.className = 'petalo-suelto';
        p.style.left = cx + rnd(-14, 14) + 'px';
        p.style.top = cy + rnd(-10, 10) + 'px';
        p.style.setProperty('--dx', rnd(-50, 50) + 'px');
        p.style.setProperty('--rot', rnd(120, 400) + 'deg');
        p.style.animationDelay = i * 0.12 + 's';
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 2200);
      }
    });
  });
})();
