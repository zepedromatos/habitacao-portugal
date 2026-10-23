# Crise da habitação em Portugal

Diagnóstico com dados da crise da habitação em Portugal e um plano de medidas baseado em evidência económica. O repositório gera um site estático: o texto está em Markdown, os gráficos em ficheiros JSX e os dados dos mapas em CSV.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `conteudo/` | O texto, em Markdown, por partes: `01-diagnostico.md`, `02-solucoes.md`, `03-fontes.md`. Os ficheiros são lidos por ordem alfabética. |
| `conteudo/resumo.json` | A parte visual no topo da página: tese, separadores de gráficos, causas, protegidos e expostos, funil das casas vazias, medidas e o que evitar. Os números vêm do relatório; se mudar um lá, mude-o aqui. |
| `graficos/` | Um ficheiro `.jsx` por gráfico. Cada um contém os seus dados e o código que desenha o SVG. |
| `dados/` | Dados grandes partilhados entre gráficos (`concelhos.csv`: preço, variação, vacância e contorno de cada concelho). |
| `src/` | Modelo da página (`template.html`, com o CSS), arranque dos gráficos e índice. |
| `scripts/` | `build.mjs` gera `dist/`; `serve.mjs` serve `dist/` localmente. |

## Editar

**Texto.** Edite o ficheiro em `conteudo/`. Markdown normal, com tabelas GFM. Os títulos `##` aparecem no índice lateral. Os títulos `###` que começam por um código de medida (`E1.`, `M3.`, `S2.`) ganham a etiqueta azul.

**Inserir um gráfico no texto.** Numa linha própria, com linhas em branco à volta:

```
::: grafico nome-do-ficheiro
Texto da fonte, que aparece por baixo do gráfico. Aceita [ligações](https://…).
:::
```

`nome-do-ficheiro` é o nome em `graficos/` sem `.jsx`. O build falha se o gráfico não existir.

**Alterar dados de um gráfico.** Os valores estão no próprio `.jsx`, em `sources={{ rows: { kind: 'data', data: [ … ] } }}`. Títulos, totais e etiquetas são calculados a partir das linhas, por isso basta mudar os números. Os dois mapas leem `dados/concelhos.csv` através de `{ kind: 'dataset', name: 'concelhos' }`.

**Cores dos gráficos.** Os gráficos usam variáveis CSS (`var(--cds-chart-categorical-1)`, `var(--cds-text-primary)`…), definidas em `src/template.html` para o modo claro e para o escuro. Não use cores literais.

## Correr localmente

Requer Node 20 ou mais recente.

```sh
npm ci
npm run dev   # gera dist/ e serve em http://localhost:8080
```

`npm run build` só gera `dist/`.

## Publicar (Cloudflare Workers)

O site é servido como *static assets* de um Worker, configurado em `wrangler.jsonc` (pasta `dist/`). Pedidos a ficheiros estáticos não contam para o limite do plano gratuito.

Configuração inicial, uma vez, em [dash.cloudflare.com](https://dash.cloudflare.com):

1. **Workers & Pages → Create → Import a repository**, e escolha este repositório.
2. Project name: `habitacao-portugal` (tem de coincidir com `name` em `wrangler.jsonc`).
3. Build command: `npm run build`. Deploy command: `npx wrangler deploy`.
4. **Deploy**. O site fica em `https://habitacao-portugal.<subdomínio>.workers.dev`.
5. Opcional: **Settings → Domains & Routes** para usar um domínio próprio.

A partir daí:

- cada push ou merge para `main` faz build e publica o site;
- os pushes para outros branches (e PRs) geram uma pré-visualização em `https://<branch>-habitacao-portugal.<subdomínio>.workers.dev`, sem mexer no site principal (exige o bloco `previews` em `wrangler.jsonc`);
- o GitHub Actions corre o build em cada PR; ative **Settings → Branches → Require status checks** para bloquear merges que partam a página.

## Contribuir

Correções de números, fontes melhores ou propostas de medidas são bem-vindas. Abra uma issue a explicar o problema e a fonte, ou um pull request com a alteração. Qualquer número novo deve vir com a ligação para a fonte primária (INE, Banco de Portugal, Eurostat, OCDE, BCE) ou para a imprensa que a cita.

## Licença

- Texto, tabelas, dados compilados e gráficos: [CC BY 4.0](LICENSE-CONTEUDO.md).
- Código: [MIT](LICENSE).

Os dados de origem pertencem às entidades que os publicam. Limites administrativos: CAOP, Direção-Geral do Território.
