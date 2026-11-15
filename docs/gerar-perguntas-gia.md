# Gerar mais perguntas para o GIA com IA

O simulador carrega as perguntas de `data/gia/perguntas.json`. O ficheiro inicial tem um banco de
partida verificado (≈ 80 / 120 / 120 / 60 / 90 itens). Para treinar sem repetir perguntas, convém
alargá-lo. Os volumes recomendados por subteste estão na tabela abaixo.

| Subteste | Chave JSON | Tempo | Itens recomendados |
|---|---|---|---|
| Raciocínio | `raciocinio` | 5 min | ≥ 80 |
| Velocidade Percetiva | `velocidade_percetiva` | 4 min | ≥ 150 |
| Precisão e Velocidade Numérica | `numerica` | 2 min | ≥ 150 |
| Significado das Palavras | `palavras` | 3 min | ≥ 120 |
| Orientação Espacial | `espacial` | 3 min | ≥ 100 |

## Fluxo de trabalho

1. Copie o prompt abaixo para o assistente de IA, indicando o subteste e o número de itens.
2. Guarde a resposta num ficheiro temporário, por exemplo `novo.json` (`{"palavras": [ ... ]}`;
   basta a secção nova), e valide-o sozinho:
   ```bash
   node tools/validate.mjs novo.json
   ```
3. Junte os itens ao array respetivo em `data/gia/perguntas.json`. Os `id` têm de continuar únicos.
4. Valide o banco completo e corrija o que for indicado:
   ```bash
   node tools/validate.mjs
   ```
   O validador recalcula a resposta certa da velocidade percetiva, da numérica e da espacial, e
   deteta empates, letras inválidas, opções repetidas e ids duplicados. Os itens inválidos que
   escapem são ignorados pelo simulador (aparece um aviso no ecrã de início do GIA), mas é melhor
   corrigi-los.
5. **Reveja à mão o raciocínio e as palavras.** Aí o validador só verifica a estrutura, não a lógica
   nem o significado.

## Formato de cada subteste

```jsonc
{
  "raciocinio": [
    {
      "id": "r081",
      "premissa": "O Tomás não é tão forte quanto o Pedro.",   // compara exatamente 2 pessoas
      "pergunta": "Quem é mais fraco?",
      "opcoes": ["Tomás", "Pedro"],                             // exatamente 2 nomes, ambos na premissa
      "resposta_correta": "Tomás",
      "explicacao": "O Pedro é o mais forte; o Tomás é o mais fraco."   // opcional
    }
  ],
  "velocidade_percetiva": [
    {
      "id": "p121",
      "pares": [["G", "g"], ["A", "c"], ["T", "t"], ["M", "n"]],  // 4 pares [MAIÚSCULA, minúscula]
      "maiusculas_em_cima": true,                                  // false = minúsculas na linha de cima
      "resposta_correta": 2                                        // nº de pares com a mesma letra
    }
  ],
  "numerica": [
    { "id": "n121", "numeros": [12, 15, 25], "resposta_correta": 25 }  // 3 inteiros diferentes, sem empate
  ],
  "palavras": [
    {
      "id": "w061",
      "palavras": ["acima", "abaixo", "água"],
      "resposta_correta": "água",
      "explicacao": "“acima” e “abaixo” são opostos; “água” não tem relação com nenhuma delas."
    }
  ],
  "espacial": [
    {
      "id": "e091",
      "caixa1": { "topo": { "rot": 0, "espelho": false }, "base": { "rot": 90, "espelho": false } },
      "caixa2": { "topo": { "rot": 180, "espelho": true }, "base": { "rot": 270, "espelho": false } },
      "resposta_correta": 1     // nº de caixas em que topo.espelho === base.espelho
    }
  ]
}
```

## Regras que a IA tem de cumprir

- **Raciocínio:** duas pessoas do mesmo género, artigo definido ("O Tomás", "A Vânia") e português
  europeu. Varie as formas: "é mais X do que", "é menos X do que", "não é tão X quanto", e use
  também o adjetivo oposto. Na pergunta, alterne entre o atributo da premissa e o oposto
  ("mais rápido" → "Quem é mais lento?"). A resposta tem de decorrer da premissa sem ambiguidade.
  Evite "não é menos X" (admite igualdade).
- **Velocidade percetiva:** use letras A–Z sem acentos. Nos pares diferentes, prefira letras
  parecidas (b/d, p/q, m/n, u/v, c/e). Nunca use o par `["I", "l"]`: em letra sem serifa o I
  maiúsculo e o l minúsculo são iguais. Distribua as respostas de 0 a 4 de forma equilibrada e
  ponha cerca de 30% dos itens com `maiusculas_em_cima: false`.
- **Numérica:** a resposta é o extremo (maior ou menor) mais afastado do número do meio. Nunca pode
  haver empate de distâncias. Comece com números até 30 e depois use números até 99, com
  distâncias próximas para aumentar a dificuldade.
- **Palavras:** duas palavras são **sinónimos ou opostos**; a terceira **não tem relação nenhuma**
  com qualquer delas. Não use pares do tipo "Frio / Gelado / Quente": "Quente" é o oposto de "Frio",
  logo está relacionada. Use palavras em minúsculas e em português europeu, sem repetir tríades.
- **Espacial:** `rot` ∈ {0, 90, 180, 270}; `espelho` é true/false. Topo e base devem ter rotações
  diferentes. Distribua as respostas 0, 1 e 2 de forma equilibrada.

## Prompt pronto a usar

```text
Gera {N} itens novos para o subteste "{CHAVE}" de um simulador do teste Thomas GIA, em português europeu.
Devolve APENAS JSON válido no formato {"{CHAVE}": [ ... ]}, sem comentários nem texto extra.
Os ids começam em "{PREFIXO}{INÍCIO}" (ex.: "w061") e são sequenciais com 3 dígitos.

Formato e regras (cumpre-as todas):
{COLAR AQUI A SECÇÃO "Formato" DO SUBTESTE E AS RESPETIVAS "Regras" DESTE DOCUMENTO}

Antes de responder, verifica cada item: a resposta_correta tem de estar certa e ser única.
```
