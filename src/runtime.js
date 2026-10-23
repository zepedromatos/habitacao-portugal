// Ambiente mínimo para os gráficos em graficos/*.jsx.
// Os gráficos usam o mesmo formato dos widgets do Claude Docs:
// <claude.Visualize sources={{...}}>{({rows, datum}) => <svg>…</svg>}</claude.Visualize>
import { datasets } from 'virtual:datasets';

function resolve(source) {
  if (!source) return [];
  if (source.kind === 'data') return source.data;
  if (source.kind === 'dataset') {
    const d = datasets[source.name];
    if (!d) throw new Error(`Conjunto de dados desconhecido: ${source.name}`);
    return d;
  }
  throw new Error(`Tipo de fonte não suportado: ${source.kind}`);
}

globalThis.claude = {
  Visualize(props) {
    const data = {};
    for (const [k, s] of Object.entries(props.sources || {})) data[k] = resolve(s);
    // datum() marca a célula de origem no Claude Docs; aqui não é necessário.
    data.datum = () => ({});
    return props.children(data);
  },
};
