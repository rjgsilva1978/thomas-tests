# Especificação Técnica: Webapp de Treino - Thomas GIA (Versão Simples)

## Arquitetura Geral da Webapp
Para garantir a máxima simplicidade de desenvolvimento, a aplicação não terá um motor algorítmico de geração de perguntas. Em vez disso, todo o conteúdo será carregado a partir de um único ficheiro de texto estático (`perguntas.json`). 

A aplicação (que pode ser feita em puro HTML/JS/CSS ou React/Vue simples) irá ler este ficheiro, baralhar a ordem das perguntas de cada categoria e apresentá-las ao utilizador.

### Componentes Globais de UI
*   **Temporizador Global:** Visível no topo, em contagem decrescente para cada subteste.
*   **Auto-Avanço:** Assim que o utilizador clica numa resposta, a UI transita instantaneamente (≤ 150ms) para a próxima pergunta. Não existe botão de "Submeter".
*   **Ecrã de Instruções:** Uma pausa antes de iniciar cada subteste, explicando a mecânica e mostrando um exemplo.

---

## Estrutura Base do Ficheiro de Dados (`perguntas.json`)
O ficheiro central será um objeto JSON dividido por subtestes, contendo arrays de perguntas pré-definidas. Exemplo global:
```json
{
  "raciocinio": [ ... ],
  "velocidade_percetiva": [ ... ],
  "numerica": [ ... ],
  "palavras": [ ... ],
  "espacial": [ ... ]
}
```

---

## 1. Raciocínio (Inferência Comparativa)

*   **Limite de tempo:** 5 minutos.
*   **Mecânica da Interface:**
    1.  Ecrã mostra apenas a premissa central. O utilizador lê e clica (ou pressiona Espaço).
    2.  A premissa desaparece (ou fica semitransparente) e surge a pergunta com três botões de resposta.
*   **Estrutura da Pergunta no JSON:**
    ```json
    {
      "premissa": "O Tomás é mais pesado do que o João. O João é mais pesado do que o Pedro.",
      "pergunta": "Quem é o mais leve?",
      "opcoes": ["Tomás", "João", "Pedro"],
      "resposta_correta": "Pedro"
    }
    ```

## 2. Velocidade Percetiva (Pares de Letras)

*   **Limite de tempo:** 4 minutos.
*   **Mecânica da Interface:**
    1.  Apresentas uma linha com 4 pares de letras.
    2.  Abaixo, 5 botões numerados de `0` a `4`. O utilizador clica no número de pares onde a maiúscula corresponde exatamente à sua minúscula.
*   **Estrutura da Pergunta no JSON:**
    ```json
    {
      "pares": [
        ["G", "g"], 
        ["A", "c"], 
        ["T", "t"], 
        ["M", "n"]
      ],
      "resposta_correta": 2
    }
    ```
    *(Neste exemplo, G-g e T-t são corretos, logo a resposta é 2).*

## 3. Precisão e Velocidade Numérica

*   **Limite de tempo:** 2 minutos.
*   **Mecânica da Interface:**
    1.  Apresentas três números em caixas clicáveis.
    2.  O utilizador clica no número que está mais distante do número do meio (mediana).
*   **Estrutura da Pergunta no JSON:**
    ```json
    {
      "numeros": [12, 15, 25],
      "resposta_correta": 25
    }
    ```
    *(Mediana é 15. Distância de 12 para 15 é 3. Distância de 15 para 25 é 10. O mais distante é o 25).*

## 4. Significado das Palavras (Identificação do Intruso)

*   **Limite de tempo:** 2.5 a 3 minutos.
*   **Mecânica da Interface:**
    1.  Três palavras são exibidas como botões no ecrã.
    2.  O utilizador clica na palavra que não pertence à mesma categoria ou conceito das outras duas.
*   **Estrutura da Pergunta no JSON:**
    ```json
    {
      "palavras": ["Frio", "Gelado", "Quente"],
      "resposta_correta": "Quente"
    }
    ```

## 5. Orientação Espacial (Rotação Mental)

*   **Limite de tempo:** 2 a 3 minutos.
*   **Mecânica da Interface:**
    1.  Mostras no ecrã duas caixas. Cada caixa contém um par de imagens (símbolos geométricos).
    2.  O utilizador avalia se o símbolo de baixo é idêntico ao de cima (apenas rodado, não espelhado).
    3.  Clica num de 3 botões em baixo: `0`, `1` ou `2` (indicando quantos pares válidos existem no ecrã).
*   **Estrutura da Pergunta no JSON:**
    ```json
    {
      "caixa1": {
        "imagem_topo": "caminho/img1_0deg.svg",
        "imagem_base": "caminho/img1_90deg.svg"
      },
      "caixa2": {
        "imagem_topo": "caminho/img2_0deg.svg",
        "imagem_base": "caminho/img2_espelhada.svg"
      },
      "resposta_correta": 1
    }
    ```
    *(Para manter a app simples, as imagens já devem estar geradas e guardadas numa pasta `assets` ou `public`, com os seus caminhos referenciados no JSON).*

---

## Cálculo da Pontuação Final

A lógica de avaliação deve ser mantida simples no frontend com JavaScript:

1.  **Monitorização:**
    *   Guarda o total de respostas corretas, incorretas e omissões (perguntas não respondidas quando o tempo acaba).
    *   (Opcional) Regista a diferença de tempo (timestamp) entre a apresentação de cada pergunta e o clique do utilizador.
2.  **Sistema de Pontos (Raw Score):**
    *   `+1 ponto` por cada resposta correta.
    *   `-0.25 pontos` por cada resposta incorreta (para penalizar cliques adivinhados à sorte).
    *   `0 pontos` por omissão (não subtrai).
3.  **Resultados Finais (Dashboard simples):**
    *   Mostra o **Total de Acertos**.
    *   Mostra a **Taxa de Precisão** (`Acertos / Total Respondidas * 100`).
    *   Mostra o **Tempo Médio de Resposta**.