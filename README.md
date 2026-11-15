# Simulador Thomas (GIA · PPA · HPTI)

Aplicação web estática para treinar os três testes psicométricos da Thomas International. Usa
HTML, JavaScript (módulos ES) e Tailwind CSS por CDN. Não tem passo de build nem backend, e os
resultados ficam guardados apenas no navegador (`localStorage`).

> Ferramenta de treino independente, sem ligação à Thomas International. As pontuações não são
> normativas.

## Testes

| Teste | Mecânica | Resultados |
|---|---|---|
| **GIA** | 5 subtestes cronometrados (raciocínio, velocidade percetiva, numérica, palavras, espacial). Avança ao clicar, sem voltar atrás. | Certas / erradas / omissões, pontuação (+1 / −0,25 / 0), precisão e tempo médio por subteste; revisão dos erros com explicação |
| **PPA** | 24 tétrades com escolha forçada MAIS / MENOS (DISC) | Gráficos I (Máscara), II (Pressão, escala invertida) e III (Autoimagem = MAIS − MENOS) e interpretação |
| **HPTI** | 30 afirmações numa escala Likert de 1 a 7, com cerca de 1/3 pontuadas de forma inversa | Pontuação por traço (5–35) com as zonas Baixo / Moderado / Ótimo / Excessivo |

## Executar localmente

`fetch()` não funciona a partir de `file://`, por isso é preciso servir a pasta:

```bash
python3 -m http.server 8000
```

Abra <http://localhost:8000>. Para experimentar o GIA com tempos curtos use
<http://localhost:8000/#/gia?tempo=20> (20 segundos por subteste). Os resultados em modo de
teste não ficam guardados no histórico.

## Publicar no GitHub Pages

1. Faça push para o GitHub.
2. Em **Settings → Pages**, escolha *Deploy from a branch*, ramo `main` e pasta `/ (root)`.
3. A aplicação fica em `https://<utilizador>.github.io/<repositório>/`.

Todos os caminhos são relativos e a navegação usa `#/rotas`, por isso funciona num sub-caminho e
ao atualizar a página. O GitHub Pages distingue maiúsculas de minúsculas, por isso mantenha os
nomes dos ficheiros em `data/` tal como estão.

## Estrutura

```
index.html            página única (Tailwind 3.4 e Chart.js 4.4 por CDN, versões fixas)
css/app.css           estilos próprios (letra "R" rodada, painel do GIA)
js/app.js             router, ecrã inicial e histórico
js/store.js           histórico de tentativas (localStorage)
js/engines/           motores dos testes (gia.js, gia-items.js, ppa.js, hpti.js)
js/results/           pontuação e painéis de resultados
js/lib/               utilitários (dom, timer, charts, validate, …)
data/config.json      tempos dos subtestes do GIA e penalização por erro
data/gia/perguntas.json
data/ppa/tetrades.json
data/hpti/afirmacoes.json
tools/validate.mjs    validador dos ficheiros de dados
docs/gerar-perguntas-gia.md   como alargar o banco do GIA com IA
Specifications/       especificações originais
```

## Editar conteúdos

- **Tempos e penalização do GIA:** `data/config.json`.
- **Mais perguntas para o GIA:** siga [docs/gerar-perguntas-gia.md](docs/gerar-perguntas-gia.md) e valide com:
  ```bash
  node tools/validate.mjs
  ```
- **Tétrades e interpretações do PPA:** `data/ppa/tetrades.json` (uma palavra de cada fator D/I/S/C por tétrade).
- **Afirmações e zonas do HPTI:** `data/hpti/afirmacoes.json` (`polaridade: "-"` é pontuada como 8 − resposta).

## Diferenças face às especificações

Para ficar mais próximo do teste real, o GIA segue o folheto oficial de exemplos do GIA (guardado apenas localmente, fora do repositório) quando este
difere das especificações:

- O raciocínio compara 2 pessoas com 2 respostas, e a premissa desaparece por completo.
- Na velocidade percetiva, a linha de maiúsculas pode aparecer em baixo.
- Na orientação espacial, a letra "R" é rodada e espelhada por CSS, sem imagens.
- No significado das palavras, a palavra intrusa não tem relação com as outras duas.
- No PPA, a ordem das palavras é baralhada em cada tétrade.
- No HPTI, há afirmações pontuadas de forma inversa.
