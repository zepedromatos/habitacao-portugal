# Crise da habitação em Portugal

Diagnóstico com dados da crise da habitação em Portugal e um plano de medidas baseado em evidência económica. O repositório gera um site estático: o texto está em Markdown, os gráficos em ficheiros JSX e os dados dos mapas em CSV.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `conteudo/` | O texto, em Markdown, por partes: `01-diagnostico.md`, `02-solucoes.md`, `03-fontes.md`. Os ficheiros são lidos por ordem alfabética. |
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

## Publicar (Cloudflare Pages)

Configuração inicial, uma vez:

1. Em [dash.cloudflare.com](https://dash.cloudflare.com), **Workers & Pages → Create → Pages → Connect to Git**, e escolha este repositório.
2. Definições de build:
   - Framework preset: **None**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Variável de ambiente: `NODE_VERSION` = `22`
3. **Save and Deploy**. O site fica em `https://habitacao-portugal.pages.dev` (ou num nome parecido, se este estiver ocupado).
4. Opcional: **Custom domains** para usar um domínio próprio.

A partir daí:

- cada push ou merge para `main` atualiza o site;
- cada pull request recebe um link de pré-visualização, comentado no próprio PR;
- o GitHub Actions corre o build em cada PR e bloqueia o merge de alterações que partam a página, se ativar essa regra em **Settings → Branches**.

## Contribuir

Correções de números, fontes melhores ou propostas de medidas são bem-vindas. Abra uma issue a explicar o problema e a fonte, ou um pull request com a alteração. Qualquer número novo deve vir com a ligação para a fonte primária (INE, Banco de Portugal, Eurostat, OCDE, BCE) ou para a imprensa que a cita.

## Licença

- Texto, tabelas, dados compilados e gráficos: [CC BY 4.0](LICENSE-CONTEUDO.md).
- Código: [MIT](LICENSE).

Os dados de origem pertencem às entidades que os publicam. Limites administrativos: CAOP, Direção-Geral do Território.
