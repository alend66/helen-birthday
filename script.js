/**
 * Helen's Birthday Journey Script
 * Exact interactive physics, dynamic sky transitions, parallax road, and celebratory features
 * Inspired by & crafted like harikz.vercel.app
 */

const $ = s => document.querySelector(s);

/* ---------- Dynamic Stars ---------- */
const stars = $('#stars');
const isSmallScreen = window.innerWidth < 700;
for (let i = 0; i < (isSmallScreen ? 35 : 65); i++) {
  const s = document.createElement('i');
  s.style.left = Math.random() * 100 + '%';
  s.style.top = Math.random() * 70 + '%';
  s.style.animationDelay = Math.random() * 3 + 's';
  s.style.transform = `scale(${0.6 + Math.random() * 1.4})`;
  stars.appendChild(s);
}

/* ---------- Fireflies ---------- */
const flies = $('#flies');
for (let i = 0; i < (isSmallScreen ? 8 : 14); i++) {
  const f = document.createElement('i');
  f.style.left = Math.random() * 100 + '%';
  f.style.top = 40 + Math.random() * 40 + '%';
  f.style.animationDelay = -Math.random() * 9 + 's';
  f.style.animationDuration = 6 + Math.random() * 6 + 's';
  flies.appendChild(f);
}

const flyers = $('#flyers');
const prog = $('#progress');
const vanEl = $('#van');
let lastY = window.scrollY;

/* ---------- Time-of-Day Keyframes (Dawn -> Day -> Sunset -> Twilight -> Night) ---------- */
const KEYS = [
  { p: 0.00, sky1: '#f6b98a', sky2: '#ffe3b8', ink: '#2b1d14', h1: '#c9785a', h2: '#a85a45', h3: '#7a3f33' },
  { p: 0.28, sky1: '#6fb7e8', sky2: '#d6f0ff', ink: '#1d2b36', h1: '#86b6a0', h2: '#5f9a85', h3: '#3f7a68' },
  { p: 0.55, sky1: '#f08a4b', sky2: '#ffd08a', ink: '#2b1d14', h1: '#b0603f', h2: '#8a4733', h3: '#5e2f26' },
  { p: 0.78, sky1: '#1b2150', sky2: '#4a3a7a', ink: '#f6ead6', h1: '#2c2f63', h2: '#20244e', h3: '#151a3b' },
  { p: 1.00, sky1: '#0b0f2b', sky2: '#26214f', ink: '#f6ead6', h1: '#1a1d45', h2: '#12163a', h3: '#0b0e26' }
];

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function palette(p) {
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const t = clamp((p - a.p) / (b.p - a.p));
  const o = {};
  ['sky1', 'sky2', 'ink', 'h1', 'h2', 'h3'].forEach(k => o[k] = mix(a[k], b[k], t));
  return o;
}

/* ---------- Elements ---------- */
const root = document.documentElement.style;
const sun = $('#sun');
const moon = $('#moon');
const clouds = $('#clouds');
const starsEl = $('#stars');
const l1 = $('#l1');
const l2 = $('#l2');
const l3 = $('#l3');
const road = $('#road');
const w1 = $('#w1');
const w2 = $('#w2');
const beam = $('#beam');
const lamp = $('#lamp');
const roadLight = $('#roadlight');
const kmEl = $('#hud-km');
const stopEl = $('#hud-stop');
const skyEl = $('#sky');
const sceneEl = document.querySelector('.scene');

let MAX = 1, VW = window.innerWidth, VH = window.innerHeight;
let tiles = [0, 0, 0];
let lastQ = -1;

function measure() {
  VW = window.innerWidth;
  VH = window.innerHeight;
  MAX = document.documentElement.scrollHeight - VH;
  tiles = [l1, l2, l3].filter(Boolean).map(el => el.offsetWidth / 2);
}

const setT = (el, v) => {
  if (el && el._t !== v) {
    el._t = v;
    el.style.transform = v;
  }
};

function frame() {
  const y = window.scrollY;
  const p = MAX > 0 ? clamp(y / MAX) : 0;

  // Sky colors
  const q = Math.round(p * 80);
  if (q !== lastQ) {
    lastQ = q;
    const c = palette(q / 80);
    if (skyEl) {
      skyEl.style.setProperty('--sky1', c.sky1);
      skyEl.style.setProperty('--sky2', c.sky2);
    }
    if (sceneEl) {
      sceneEl.style.setProperty('--h1', c.h1);
      sceneEl.style.setProperty('--h2', c.h2);
      sceneEl.style.setProperty('--h3', c.h3);
    }
    root.setProperty('--ink', c.ink);
  }

  // Sun and moon arcs
  const ts = clamp(p / 0.72);
  if (sun) {
    setT(sun, `translate3d(${(0.08 + 0.84 * ts) * VW}px,${(0.60 - Math.sin(Math.PI * ts) * 0.48) * VH}px,0) translate(-50%,-50%)`);
    sun.style.opacity = (1 - clamp((p - 0.62) / 0.1)).toFixed(2);
  }

  const tm = clamp((p - 0.72) / 0.28);
  if (moon) {
    setT(moon, `translate3d(${(0.18 + 0.64 * tm) * VW}px,${(0.46 - Math.sin(Math.PI * tm) * 0.26) * VH}px,0) translate(-50%,-50%)`);
    moon.style.opacity = clamp((p - 0.7) / 0.08).toFixed(2);
  }
  if (starsEl) starsEl.style.opacity = clamp((p - 0.72) / 0.16).toFixed(2);
  if (clouds) clouds.style.opacity = (1 - clamp((p - 0.68) / 0.2) * 0.85).toFixed(2);

  // Parallax hills sliding if present
  if (l1 && l2 && l3) {
    [[l1, 0.10], [l2, 0.22], [l3, 0.42]].forEach(([el, k], i) => {
      setT(el, `translate3d(${-((y * k) % (tiles[i] || 1))}px,0,0)`);
    });
  }
  if (road) road.style.setProperty('--rx', -(y * 0.9 % 80) + 'px');

  // Spinning wheels if present
  const rot = `rotate(${(y * 0.9) % 360}deg)`;
  if (w1) setT(w1, rot);
  if (w2) setT(w2, rot);

  // Milestone Odometer (from 0 to 2026 km)
  const km = String(Math.round(p * 2026)).padStart(4, '0');
  if (kmEl && kmEl.textContent !== km) kmEl.textContent = km;

  // Progress Bar, Fireflies & flyers
  if (prog) setT(prog, `scaleX(${p.toFixed(4)})`);
  const fo = clamp((p - 0.76) / 0.12);
  if (flies) {
    flies.style.opacity = fo.toFixed(2);
    flies.style.visibility = fo > 0 ? 'visible' : 'hidden';
  }

  const fl = 1 - clamp((p - 0.62) / 0.15);
  if (flyers) {
    flyers.style.opacity = fl.toFixed(2);
    flyers.style.visibility = fl > 0 ? 'visible' : 'hidden';
  }

  if (vanEl) {
    const dy = y - lastY;
    lastY = y;
    vanEl.style.rotate = clamp(dy / 60, -1, 1) * -2.5 + 'deg';
    clearTimeout(frame.t);
    frame.t = setTimeout(() => { vanEl.style.rotate = '0deg'; }, 120);
  }
}

let tick = false;
window.addEventListener('scroll', () => {
  if (!tick) {
    tick = true;
    requestAnimationFrame(() => {
      frame();
      tick = false;
    });
  }
}, { passive: true });

window.addEventListener('resize', () => { measure(); frame(); });
window.addEventListener('load', () => { measure(); frame(); });
measure();
frame();

/* ---------- Reveal on Scroll ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) {
    e.target.classList.add('on');
    io.unobserve(e.target);
  }
}), { threshold: 0.05, rootMargin: '0px 0px 80px 0px' });

document.querySelectorAll('.rv').forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 80 + 'ms';
  io.observe(el);
  const r = el.getBoundingClientRect();
  if (r.top < window.innerHeight + 150) {
    el.classList.add('on');
  }
});

// Guaranteed visibility fallback: reveal all elements so nothing is ever hidden
setTimeout(() => {
  document.querySelectorAll('.rv').forEach(el => el.classList.add('on'));
}, 1200);

/* ---------- Current Stop on the HUD ---------- */
const so = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting && e.target.dataset.stop) {
    stopEl.textContent = e.target.dataset.stop;
  }
}), { rootMargin: '-40% 0px -50% 0px' });
document.querySelectorAll('[data-stop]').forEach(s => so.observe(s));

/* ===================================================
   WEB AUDIO API BIRTHDAY MELODY
   =================================================== */
let audioCtx = null;
let isPlaying = false;
let melodyTimer = null;
const musicToggleBtn = $('#musicToggleBtn');
const musicLabel = $('#musicLabel');

const bdayNotes = [
  { f: 261.63, d: 0.35 }, { f: 261.63, d: 0.25 }, { f: 293.66, d: 0.6 }, { f: 261.63, d: 0.6 }, { f: 349.23, d: 0.6 }, { f: 329.63, d: 1.1 },
  { f: 261.63, d: 0.35 }, { f: 261.63, d: 0.25 }, { f: 293.66, d: 0.6 }, { f: 261.63, d: 0.6 }, { f: 392.00, d: 0.6 }, { f: 349.23, d: 1.1 },
  { f: 261.63, d: 0.35 }, { f: 261.63, d: 0.25 }, { f: 523.25, d: 0.6 }, { f: 440.00, d: 0.6 }, { f: 349.23, d: 0.6 }, { f: 329.63, d: 0.6 }, { f: 293.66, d: 0.9 },
  { f: 466.16, d: 0.35 }, { f: 466.16, d: 0.25 }, { f: 440.00, d: 0.6 }, { f: 349.23, d: 0.6 }, { f: 392.00, d: 0.6 }, { f: 349.23, d: 1.3 }
];

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTone(freq, duration, type = 'sine', gainVal = 0.12) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (err) {}
}

function startMelody() {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  isPlaying = true;
  musicLabel.textContent = 'Pause Melody';
  
  let noteIndex = 0;
  function scheduleNextNote() {
    if (!isPlaying) return;
    const note = bdayNotes[noteIndex];
    playTone(note.f, note.d, 'triangle', 0.15);
    // Play warm lower harmony
    playTone(note.f / 2, note.d, 'sine', 0.08);
    
    noteIndex = (noteIndex + 1) % bdayNotes.length;
    melodyTimer = setTimeout(scheduleNextNote, note.d * 1000 + 80);
  }
  scheduleNextNote();
}

function stopMelody() {
  isPlaying = false;
  clearTimeout(melodyTimer);
  musicLabel.textContent = 'Play Melody';
}

if (musicToggleBtn) {
  musicToggleBtn.addEventListener('click', () => {
    if (isPlaying) {
      stopMelody();
    } else {
      startMelody();
    }
  });
}

/* ===================================================
   CONFETTI CANNONS & FIREWORKS
   =================================================== */
function launchConfetti(x = 0.5, y = 0.5, count = 50) {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: count,
      spread: 70,
      origin: { x, y },
      colors: ['#f0b23e', '#d9633b', '#1f5f63', '#ffffff', '#e56b6f']
    });
  }
}

function grandFireworks() {
  if (typeof confetti !== 'function') return;
  const duration = 2.5 * 1000;
  const end = Date.now() + duration;

  (function frameFw() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#f0b23e', '#d9633b', '#ffd166']
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#1f5f63', '#ffffff', '#e56b6f']
    });
    if (Date.now() < end) {
      requestAnimationFrame(frameFw);
    }
  })();
}

const heroConfettiBtn = $('#heroConfettiBtn');
if (heroConfettiBtn) {
  heroConfettiBtn.addEventListener('click', () => {
    launchConfetti(0.5, 0.45, 80);
    playTone(523.25, 0.5, 'sine', 0.2);
  });
}

const finalConfettiBtn = $('#finalConfettiBtn');
if (finalConfettiBtn) {
  finalConfettiBtn.addEventListener('click', () => {
    grandFireworks();
    playTone(659.25, 0.6, 'sine', 0.25);
  });
}

// Celebration burst when clicking any Boarding Pass WhatsApp button
document.querySelectorAll('.pass-wa-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    launchConfetti(0.5, 0.6, 60);
    playTone(587.33, 0.35, 'triangle', 0.18);
  });
});

/* ===================================================
   CANDLE CEREMONY
   =================================================== */
const candles = document.querySelectorAll('.candle');
const blowCandlesBtn = $('#blowCandlesBtn');
const relightCandlesBtn = $('#relightCandlesBtn');
const wishModal = $('#wishModal');

function blowSingleCandle(c) {
  if (c.getAttribute('data-lit') === 'true') {
    c.setAttribute('data-lit', 'false');
    c.classList.add('blown');
    playTone(300, 0.2, 'sawtooth', 0.05);
    checkAllCandles();
  }
}

function checkAllCandles() {
  const allBlown = Array.from(candles).every(c => c.getAttribute('data-lit') === 'false');
  if (allBlown) {
    setTimeout(() => {
      wishModal.classList.remove('hidden');
      blowCandlesBtn.classList.add('hidden');
      relightCandlesBtn.classList.remove('hidden');
      grandFireworks();
      playTone(523.25, 0.6, 'triangle', 0.2);
      setTimeout(() => playTone(659.25, 0.7, 'triangle', 0.2), 150);
      setTimeout(() => playTone(783.99, 1.0, 'triangle', 0.25), 300);
    }, 350);
  }
}

candles.forEach(c => {
  c.addEventListener('click', () => blowSingleCandle(c));
});

if (blowCandlesBtn) {
  blowCandlesBtn.addEventListener('click', () => {
    candles.forEach((c, i) => {
      setTimeout(() => blowSingleCandle(c), i * 160);
    });
  });
}

if (relightCandlesBtn) {
  relightCandlesBtn.addEventListener('click', () => {
    candles.forEach(c => {
      c.setAttribute('data-lit', 'true');
      c.classList.remove('blown');
    });
    wishModal.classList.add('hidden');
    relightCandlesBtn.classList.add('hidden');
    blowCandlesBtn.classList.remove('hidden');
    playTone(440, 0.4, 'sine', 0.15);
  });
}

/* ===================================================
   LIGHTBOX MODAL FOR POLAROIDS & STAMPS
   =================================================== */
const lightbox = $('#lightbox');
const lbImg = $('#lbImg');
const lbCaption = $('#lbCaption');
const closeLightbox = $('#closeLightbox');

function openModal(src, caption) {
  if (lightbox && lbImg && lbCaption) {
    lbImg.src = src;
    lbCaption.textContent = caption || '';
    lightbox.classList.add('active');
    launchConfetti(0.5, 0.5, 30);
  }
}

document.querySelectorAll('.pola-click, .stamp-card').forEach(el => {
  el.addEventListener('click', () => {
    const src = el.getAttribute('data-full') || el.querySelector('img')?.src;
    const caption = el.getAttribute('data-caption') || el.querySelector('figcaption')?.textContent || '';
    if (src) openModal(src, caption);
  });
});

if (closeLightbox && lightbox) {
  closeLightbox.addEventListener('click', () => {
    lightbox.classList.remove('active');
  });
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.classList.remove('active');
  });
}

// User click to enable Web Audio
window.addEventListener('click', () => {
  initAudio();
}, { once: true });
