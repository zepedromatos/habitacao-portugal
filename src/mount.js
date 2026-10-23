import { Component, createElement } from 'react';
import { createRoot } from 'react-dom/client';

class Boundary extends Component {
  constructor(p) { super(p); this.state = { err: false }; }
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(e) { console.error(`Gráfico "${this.props.name}":`, e); }
  render() {
    return this.state.err
      ? createElement('p', { className: 'chart-wait' }, 'Não foi possível desenhar este gráfico.')
      : this.props.children;
  }
}

export function mount(charts) {
  document.querySelectorAll('.chart[data-w]').forEach((el) => {
    const name = el.getAttribute('data-w');
    const W = charts[name];
    if (!W) { el.innerHTML = '<p class="chart-wait">Gráfico indisponível.</p>'; return; }
    createRoot(el).render(createElement(Boundary, { name }, createElement(W)));
  });
  setupToc();
  setupTabs();
  setupFiltros();
  setupTopnav();
}

function setupToc() {
  const det = document.getElementById('toc-details');
  if (!det) return;
  const mq = window.matchMedia('(max-width: 1000px)');
  const sync = () => (mq.matches ? det.removeAttribute('open') : det.setAttribute('open', ''));
  sync();
  mq.addEventListener?.('change', sync);
  document.querySelectorAll('.toc a').forEach((a) =>
    a.addEventListener('click', () => { if (mq.matches) det.removeAttribute('open'); }));

  const links = {};
  document.querySelectorAll('.toc-list ol a').forEach((a) => { links[a.getAttribute('href').slice(1)] = a; });
  const heads = [...document.querySelectorAll('.doc h2[id]')].filter((h) => links[h.id]);
  if (!('IntersectionObserver' in window) || !heads.length) return;
  let current = null;
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      current?.classList.remove('is-active');
      current = links[en.target.id];
      current.classList.add('is-active');
    }
  }, { rootMargin: '0px 0px -75% 0px' });
  heads.forEach((h) => io.observe(h));
}

function setupTabs() {
  document.querySelectorAll('[data-tabs]').forEach((box) => {
    const tabs = [...box.querySelectorAll('[role=tab]')];
    const select = (t, focus) => {
      for (const x of tabs) {
        const on = x === t;
        x.setAttribute('aria-selected', String(on));
        x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      }
      if (focus) t.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); select(tabs.at((i + d) % tabs.length), true); }
      });
    });
  });
}

function setupFiltros() {
  const box = document.getElementById('solucoes');
  if (!box) return;
  const chips = [...box.querySelectorAll('[data-filtro]')];
  const prio = box.querySelector('#so-prio');
  const cards = [...box.querySelectorAll('.medida')];
  const vazio = box.querySelector('.vazio');
  let h = 'todas';
  const apply = () => {
    let n = 0;
    for (const c of cards) {
      const show = (h === 'todas' || c.dataset.horizonte === h) && (!prio.checked || c.dataset.prioridade === '1');
      c.hidden = !show; if (show) n++;
    }
    vazio.hidden = n > 0;
  };
  chips.forEach((c) => c.addEventListener('click', () => {
    h = c.dataset.filtro;
    chips.forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
    apply();
  }));
  prio.addEventListener('change', apply);
}

function setupTopnav() {
  const links = {};
  document.querySelectorAll('.topnav a').forEach((a) => { links[a.getAttribute('href').slice(1)] = a; });
  const targets = Object.keys(links).map((id) => document.getElementById(id)).filter(Boolean);
  if (!('IntersectionObserver' in window) || !targets.length) return;
  let current = null;
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      current?.classList.remove('is-active');
      current = links[en.target.id];
      current.classList.add('is-active');
      const nav = current.parentElement;
      if (nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: current.offsetLeft - 24, behavior: 'smooth' });
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  targets.forEach((t) => io.observe(t));
}
