# Especificação Técnica: Simulador Web - Thomas PPA (Metodologia DISC)

## Visão Geral do Teste
O Thomas PPA (Personal Profile Analysis) baseia-se na teoria DISC de William Moulton Marston. O teste avalia quatro fatores comportamentais:
*   **D (Dominância):** Orientação para resultados, poder e assertividade.
*   **I (Influência):** Orientação para pessoas, comunicação e persuasão.
*   **S (Estabilidade - *Steadiness*):** Orientação para o ritmo, paciência e segurança.
*   **C (Conformidade - *Compliance*):** Orientação para regras, precisão e estrutura.

O teste tem uma duração média de 6 a 8 minutos e é composto por **24 blocos de 4 adjetivos** (tétrades).

---

## 1. Mecânica de Resposta Ipsativa (Escolha Forçada)

A natureza "ipsativa" significa que o candidato é forçado a escolher entre opções que podem ser todas positivas ou todas negativas, evitando o enviesamento de "desejabilidade social" comum em escalas Likert (1 a 5).

### Lógica da Interface
Para cada um dos 24 blocos (tétrades):
1.  São apresentados 4 adjetivos no ecrã.
2.  Existem duas colunas de seleção: **"MAIS"** (a palavra que mais se aproxima do seu comportamento no trabalho) e **"MENOS"** (a palavra que menos se aproxima).
3.  **Regra de Ouro 1:** O candidato é obrigado a escolher exatamente UMA palavra na coluna "MAIS" e UMA palavra na coluna "MENOS".
4.  **Regra de Ouro 2:** A mesma palavra não pode ser escolhida como "MAIS" e "MENOS" em simultâneo (a interface deve bloquear o *radio button* oposto assim que uma escolha é feita).
5.  Apenas quando ambas as seleções estão feitas, o sistema permite (ou faz automaticamente) o avanço para a próxima tétrade.

---

## 2. Estrutura das Tétrades e Exemplos Práticos

Cada bloco de 4 adjetivos contém tipicamente uma palavra de cada fator (D, I, S, C). O objetivo é forçar o candidato a priorizar que fator lhe é mais natural e qual lhe é menos natural.

**Exemplos de Tétrades (Semelhantes ao PPA):**

*   **Bloco 1:**
    *   Competitivo (Fator D)
    *   Entusiasta (Fator I)
    *   Amigável (Fator S)
    *   Lógico (Fator C)
*   **Bloco 2:**
    *   Pioneiro (Fator D)
    *   Persuasivo (Fator I)
    *   Paciente (Fator S)
    *   Meticuloso (Fator C)
*   **Bloco 3:**
    *   Assertivo (Fator D)
    *   Sociável (Fator I)
    *   Calmo (Fator S)
    *   Disciplinado (Fator C)

---

## 3. Matemática da Pontuação e os 3 Gráficos

O sistema PPA gera três perfis distintos com base em como as contagens de "MAIS" e "MENOS" são tratadas. O teu algoritmo de backend/frontend deve realizar a seguinte contagem para cada um dos quatro fatores (D, I, S, C).

### Passo A: Contagem Base
Ao final das 24 questões, contabiliza-se:
*   Total de vezes que palavras do fator **D** foram escolhidas como "MAIS" (`D_Mais`) e como "MENOS" (`D_Menos`).
*   Repetir para **I**, **S** e **C**.
*   *Sanity Check:* A soma total de todos os "MAIS" tem de ser 24. A soma total de todos os "MENOS" tem de ser 24.

### Passo B: Geração dos Gráficos

#### Gráfico I: Máscara de Trabalho (Perfil Percebido)
*   **Origem dos Dados:** Baseia-se **exclusivamente na coluna "MAIS"**.
*   **Significado:** Como o candidato acredita que precisa de se comportar no seu ambiente de trabalho atual. Representa a adaptação ao meio.
*   **Cálculo:** Valores de `D_Mais`, `I_Mais`, `S_Mais`, `C_Mais`.

#### Gráfico II: Comportamento sob Pressão (Perfil Core)
*   **Origem dos Dados:** Baseia-se **exclusivamente na coluna "MENOS"**.
*   **Significado:** O comportamento instintivo da pessoa, especialmente sob stress ou pressão, quando a "máscara" cai. 
*   **Cálculo:** No PPA clássico, os valores "Menos" são plotados numa escala inversa (quanto mais vezes rejeitas o fator D, menor é o teu D inato). Para o simulador, guardas os valores brutos de `D_Menos`, `I_Menos`, etc.

#### Gráfico III: Autoimagem (Perfil Intrínseco)
*   **Origem dos Dados:** É a diferença matemática entre as escolhas "MAIS" e "MENOS".
*   **Significado:** É a autoimagem real da pessoa, integrando o comportamento natural e a adaptação. É o gráfico principal lido pelos recrutadores.
*   **Cálculo (O mais importante):** Para cada fator, a fórmula é `MAIS - MENOS`.
    *   `D_Final = D_Mais - D_Menos`
    *   `I_Final = I_Mais - I_Menos`
    *   `S_Final = S_Mais - S_Menos`
    *   `C_Final = C_Mais - C_Menos`
    *   *Nota Matemática:* O resultado de cada fator pode variar de -24 a +24. Num gráfico visual, o 0 representa a "Linha Média". Valores acima de zero indicam alta presença do fator; valores abaixo indicam baixa presença.

---

## 4. Estrutura da Base de Dados (JSON)

Para a webapp, deves estruturar o JSON de forma a separar a visualização (as palavras) da lógica de pontuação (os fatores DISC associados), para que possas calcular os totais facilmente.

```json
{
  "nome_teste": "Simulador Thomas PPA",
  "instrucoes": "Em cada grupo de 4 palavras, escolha uma que MAIS o descreve e uma que MENOS o descreve no ambiente de trabalho.",
  "questoes": [
    {
      "id": 1,
      "opcoes": [
        { "id_opcao": "1A", "palavra": "Competitivo", "fator": "D" },
        { "id_opcao": "1B", "palavra": "Entusiasta", "fator": "I" },
        { "id_opcao": "1C", "palavra": "Amigável", "fator": "S" },
        { "id_opcao": "1D", "palavra": "Lógico", "fator": "C" }
      ]
    },
    {
      "id": 2,
      "opcoes": [
        { "id_opcao": "2A", "palavra": "Pioneiro", "fator": "D" },
        { "id_opcao": "2B", "palavra": "Persuasivo", "fator": "I" },
        { "id_opcao": "2C", "palavra": "Paciente", "fator": "S" },
        { "id_opcao": "2D", "palavra": "Meticuloso", "fator": "C" }
      ]
    }
    // ... repetir até ao id 24
  ]
}
```

### Dica de Implementação no Frontend
Ao ler o JSON, o estado (state) da tua aplicação para a Questão 1 deverá ter o formato:
`respostas[1] = { mais: "1A", menos: "1D" }`.
Ao final do teste, percorres o array `respostas`, identificas os `fatores` correspondentes aos IDs escolhidos e aplicas as fórmulas descritas no Passo B para plotar os gráficos (podes usar a biblioteca *Chart.js* ou *Recharts* para criar gráficos de linhas simples com uma linha média central).