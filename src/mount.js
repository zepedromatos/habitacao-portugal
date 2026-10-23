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
