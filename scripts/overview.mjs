// Gera o HTML da parte visual (topo da página) a partir de conteudo/resumo.json.
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (n) => n.toLocaleString('pt-PT').replace(/ |\s/g, '.');

const HORIZONTES = {
  emergencia: { rotulo: 'Emergência', prazo: '0–12 meses' },
  medio: { rotulo: 'Médio prazo', prazo: '1–5 anos' },
  estrutural: { rotulo: 'Estrutural', prazo: '5–15 anos' },
};
const IMPACTO = { alto: 'Impacto alto', medio: 'Impacto médio', baixo: 'Impacto baixo', base: 'Condição para o resto' };

export const NAV = [
  ['resumo', 'Resumo'], ['graficos', 'Gráficos'], ['causas', 'Causas'], ['quem-paga', 'Quem paga'],
  ['casas-vazias', 'Casas vazias'], ['solucoes', 'Soluções'], ['plano', 'Plano 2030'], ['relatorio', 'Relatório'],
];

function section(id, cls, eyebrow, title, lede, inner) {
  return `<section class="ov ${cls}" id="${id}" aria-labelledby="${id}-t"><div class="wrap">
  <header class="ov-head"><p class="eyebrow">${esc(eyebrow)}</p><h2 id="${id}-t">${esc(title)}</h2>${lede ? `<p class="ov-lede">${lede}</p>` : ''}</header>
  ${inner}
</div></section>`;
}

function chartFigure(name, caption) {
  return `<figure class="fig fig-ov"><div class="fig-scroll"><div class="chart" data-w="${name}"><p class="chart-wait">A carregar o gráfico…</p></div></div>`
    + (caption ? `<figcaption><span>Fonte</span> ${caption}</figcaption>` : '') + `</figure>`;
}

export function renderOverview(d, { anchors, captions }) {
  const out = [];

  // Resumo
  out.push(section('resumo', 'ov-tese', 'Em resumo', 'Uma crise de oferta que recai sobre quem entra',
    null,
    `<ol class="tese">${d.tese.map((t, i) => `<li><span class="tese-n">${i + 1}</span><h3>${esc(t.titulo)}</h3><p>${esc(t.texto)}</p></li>`).join('')}</ol>`));

  // Gráficos em separadores
  const tabs = d.graficos.map((g, i) => `<button type="button" role="tab" id="tab-${g.id}" aria-controls="panel-${g.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(g.rotulo)}</button>`).join('');
  const panels = d.graficos.map((g, i) => `<div role="tabpanel" id="panel-${g.id}" aria-labelledby="tab-${g.id}"${i === 0 ? '' : ' hidden'}>
    ${chartFigure(g.grafico, captions[g.grafico])}</div>`).join('');
  out.push(section('graficos', '', 'O problema em números', 'Casas mais caras, salários atrás, construção parada', null,
    `<div class="tabs" data-tabs><div class="tablist" role="tablist" aria-label="Gráficos">${tabs}</div>${panels}</div>`));

  // Causas
  const meter = (p) => {
    const segs = [1, 2, 3, 4, 5].map((k) => `<i class="${p >= k ? 'on' : p >= k - 0.5 ? 'half' : ''}"></i>`).join('');
    return `<span class="meter" aria-hidden="true">${segs}</span>`;
  };
  out.push(section('causas', 'ov-alt', 'Porque estão tão caras', 'Muitas causas, pesos muito diferentes',
    'Avaliação qualitativa do peso de cada fator na subida dos preços desde 2015. Nenhum estudo decompõe a subida por causa.',
    `<ul class="causas">${d.causas.map((c) => `<li class="causa${c.peso === 0 ? ' causa-amp' : ''}">
      <div class="causa-top"><h3>${esc(c.fator)}</h3>${c.peso ? meter(c.peso) : '<span class="amp-tag">amplificador</span>'}</div>
      <p class="causa-peso">${esc(c.pesoTexto)} · <span>${esc(c.onde)}</span></p>
      <p class="causa-txt">${esc(c.texto)}</p>
      <p class="causa-conf">Confiança na avaliação: <strong>${esc(c.confianca)}</strong></p></li>`).join('')}</ul>`));

  // Quem paga
  const col = (cls, title, sub, items) => `<div class="qp ${cls}"><h3>${title}</h3><p class="qp-sub">${sub}</p><ul>${items.map((x) => `<li><span class="qp-n">${esc(x.n)}</span><span class="qp-t">${esc(x.texto)}</span></li>`).join('')}</ul></div>`;
  out.push(section('quem-paga', '', 'Quem está dentro e quem está fora', 'Um mercado partido em dois', null,
    `<div class="qp-grid">${col('qp-in', 'Protegidos', 'Já tinham casa antes da subida', d.protegidos)}${col('qp-out', 'Expostos', 'Entram agora no mercado', d.expostos)}</div>`
    + (d.geracional ? (() => { const g = d.geracional; return `<div class="ger"><div class="ger-main"><h3>${esc(g.titulo)}</h3><p>${esc(g.texto)}</p>
      <ul class="ger-n">${g.numeros.map((x) => `<li><span class="qp-n">${esc(x.n)}</span><span class="qp-t">${esc(x.texto)}</span></li>`).join('')}</ul></div>
      <div class="ger-res"><h4>Ressalvas</h4><ul>${g.ressalvas.map((r) => `<li>${esc(r)}</li>`).join('')}</ul><a href="#${g.ancora}">Ler no relatório</a></div></div>`; })() : '')));

  // Casas vazias
  const max = d.vazios[0].n;
  out.push(section('casas-vazias', 'ov-alt', 'Casas vazias', 'Muitas casas vazias, poucas mobilizáveis depressa',
    'Censos 2021. Cada barra é uma parte da anterior; o comprimento é proporcional ao número.',
    `<ol class="funil">${d.vazios.map((v) => `<li class="${v.meta ? 'meta' : ''}"><div class="funil-lab"><strong>${esc(v.rotulo)}</strong><span>${esc(v.texto)}</span></div>
      <div class="funil-bar"><span style="width:${Math.max(0.6, (v.n / max) * 100).toFixed(1)}%"></span><b>${v.meta ? '~' : ''}${fmt(v.n)}</b></div></li>`).join('')}</ol>
     <p class="ov-foot">As casas vazias em bom estado ajudam porque chegam primeiro e estão nas cidades, mas não substituem construir.</p>`));

  // Soluções
  const filtros = [['todas', 'Todas'], ...Object.entries(HORIZONTES).map(([k, h]) => [k, `${h.rotulo} <small>${h.prazo}</small>`])]
    .map(([k, l], i) => `<button type="button" class="chip" data-filtro="${k}" aria-pressed="${i === 0}">${l}</button>`).join('');
  const cards = d.medidas.map((m) => {
    const h = HORIZONTES[m.horizonte];
    const href = m.ancora || anchors[m.codigo];
    if (!href) throw new Error(`Sem âncora no relatório para a medida ${m.codigo}`);
    return `<li class="medida imp-${m.impacto}${m.prioridade ? ' prio' : ''}" data-horizonte="${m.horizonte}" data-prioridade="${m.prioridade ? 1 : 0}">
      <div class="medida-top"><span class="code">${esc(m.rotulo || m.codigo)}</span>${m.prioridade ? '<span class="prio-tag">Prioridade</span>' : ''}</div>
      <h3>${esc(m.titulo)}</h3><p>${esc(m.texto)}</p>
      <div class="medida-foot"><span class="tag">${h.rotulo}</span><span class="tag tag-imp">${IMPACTO[m.impacto]}</span><a href="#${href}">Ler no relatório</a></div></li>`;
  }).join('');
  out.push(section('solucoes', '', 'O que fazer', `${d.medidas.length} medidas em três horizontes`,
    'O papel social é do Estado e paga-se pelo Orçamento; quem constrói, reabilita e arrenda tem regras estáveis; quem retém casas vazias ou revende sem acrescentar valor paga mais.',
    `<div class="filtros" role="group" aria-label="Filtrar medidas">${filtros}<label class="so-prio"><input type="checkbox" id="so-prio"> Só prioridades</label></div>
     <ul class="medidas">${cards}</ul>
     <p class="vazio" hidden>Nenhuma medida com estes filtros.</p>
     <div class="evitar"><h3>O que a evidência desaconselha</h3><ul>${d.evitar.map((e) => `<li><strong>${esc(e.titulo)}</strong><span>${esc(e.texto)}</span></li>`).join('')}</ul></div>`));

  // Plano
  out.push(section('plano', 'ov-alt', 'Chega?', 'Até 2030, só construindo mais',
    'No cenário central, as medidas dão ~185 mil fogos em 2027–2030 para uma necessidade estimada de 140–290 mil. Nem o cenário alto cobre a necessidade alta. O objetivo realista é que os preços deixem de crescer mais depressa do que os rendimentos.',
    chartFigure('plano-fogos-2030', captions['plano-fogos-2030'])));

  return out.join('\n');
}
