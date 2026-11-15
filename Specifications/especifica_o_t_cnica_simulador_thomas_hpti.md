# Especificação Técnica: Webapp de Avaliação - Thomas HPTI

## 1. Base Teórica do Teste

O Thomas HPTI (High Potential Trait Indicator), desenvolvido por Ian MacRae e Adrian Furnham, tem as suas raízes no modelo "Big Five" da personalidade, mas foi calibrado exclusivamente para o contexto corporativo. O teste mede a adequação de um indivíduo para assumir papéis de liderança, avaliando seis traços essenciais de personalidade que ditam como a pessoa lida com risco, estratégia, pessoas e stress.

### Os 6 Traços Avaliados:
1. **Conscienciosidade (Conscientiousness):** Mede a autodisciplina, a organização e o foco em resultados. Líderes de alto potencial são metódicos e orientados para o planeamento.
2. **Ajustamento (Adjustment):** Reflete a resiliência emocional. É a capacidade de gerir o stress e a pressão externa sem que isso afete negativamente a tomada de decisão.
3. **Curiosidade (Curiosity):** A propensão para explorar novas ideias e inovar. Líderes curiosos procuram novas formas de trabalhar e adaptam-se bem às inovações tecnológicas e estratégicas.
4. **Abordagem ao Risco (Risk Approach):** A vontade de enfrentar situações difíceis, de lidar com conflitos e de tomar decisões audazes em vez de as evitar ou procrastinar.
5. **Aceitação da Ambiguidade (Ambiguity Acceptance):** A capacidade de prosperar num ambiente complexo, onde a incerteza é alta, a informação é escassa e as regras não são claras.
6. **Competitividade (Competitiveness):** O desejo intrínseco de sucesso, reconhecimento, poder e de vencer num ambiente competitivo.

---

## 2. Formato da Interface de Resposta

O HPTI utiliza um formato de avaliação psicométrica padronizada e simples, ideal para uma webapp rápida (estimativa de 10 minutos para a versão completa, ou 3 minutos para a nossa versão de 30 perguntas).

* **Mecânica de Apresentação:** Uma afirmação por ecrã, centralizada.
* **Escala de Avaliação:** Uma Escala Likert de 7 pontos, apresentada horizontalmente em botões (ou radio buttons esteticamente limpos):
  1. Discordo Totalmente
  2. Discordo
  3. Discordo Ligeiramente
  4. Neutro
  5. Concordo Ligeiramente
  6. Concordo
  7. Concordo Totalmente
* **UX/UI Dinâmica:** Ao clicar numa opção, a webapp deve guardar o valor (1 a 7) num estado/array local e avançar instantaneamente para o próximo slide (com uma barra de progresso no topo a avançar).

---

## 3. Base de Dados de Afirmações (Estrutura JSON)

Abaixo estão 30 afirmações formatadas em tom corporativo (5 por cada traço), prontas para serem mapeadas no teu código. (*Nota: Numa versão simplificada para treino, todas as afirmações têm polaridade positiva, ou seja, pontuações altas indicam forte presença do traço.*)

### Traço 1: Conscienciosidade
1. Planeio as minhas tarefas diárias com um elevado nível de rigor e organização.
2. Cumpro sempre os prazos estabelecidos, independentemente dos obstáculos que surjam.
3. Sou frequentemente reconhecido pela minha extrema atenção aos detalhes.
4. Estabeleço objetivos de longo prazo ambiciosos e claramente estruturados para mim mesmo.
5. Sinto uma forte necessidade de concluir as tarefas imediatamente, não deixando pontas soltas.

### Traço 2: Ajustamento
6. Consigo manter a calma e a clareza mental em situações de elevada pressão.
7. As críticas profissionais não afetam o meu equilíbrio emocional.
8. Recupero e adapto-me rapidamente após um fracasso num projeto importante.
9. O stress intenso não prejudica a minha capacidade de tomar decisões cruciais.
10. Mantenho uma postura positiva e otimista mesmo perante adversidades organizacionais.

### Traço 3: Curiosidade
11. Procuro ativamente novas formas de melhorar os processos de trabalho estabelecidos.
12. Gosto de explorar conceitos inovadores que fogem à forma tradicional de fazer as coisas.
13. Questiono frequentemente o "status quo" se achar que existe uma solução mais inteligente.
14. Dedico parte do meu tempo livre a aprender sobre áreas de negócio fora da minha especialidade.
15. Sinto-me bastante motivado quando me deparo com problemas complexos e totalmente desconhecidos.

### Traço 4: Abordagem ao Risco
16. Não evito conflitos construtivos se estes forem necessários para o sucesso da equipa.
17. Assumo a responsabilidade por decisões difíceis, mesmo sabendo que podem ser impopulares.
18. Estou disposto a correr riscos calculados no mercado se a recompensa for proporcional.
19. Sinto-me energizado ao enfrentar confrontos e problemas interpessoais no trabalho.
20. Prefiro tomar uma decisão audaz imediatamente do que adiar por medo de errar.

### Traço 5: Aceitação da Ambiguidade
21. Tenho um alto desempenho em projetos onde os processos e regras não estão totalmente definidos.
22. A falta de instruções detalhadas por parte das chefias não me impede de progredir.
23. Adapto-me rapidamente a mudanças estruturais imprevistas na estratégia da empresa.
24. Consigo gerir a incerteza do mercado sem sentir ansiedade ou frustração.
25. Gosto de liderar iniciativas onde o resultado final não é claro nem garantido desde o primeiro dia.

### Traço 6: Competitividade
26. Sou impulsionado por um forte desejo de superar o desempenho dos meus pares no trabalho.
27. O meu principal foco de carreira é alcançar posições de elevada influência e liderança.
28. Ganhar, ser o melhor da equipa e destacar-me é fundamental para a minha satisfação.
29. Esforço-me de forma agressiva para garantir que o meu sucesso é reconhecido pelas chefias.
30. Meço o meu próprio valor profissional comparando os meus resultados com os da concorrência.

---

## 4. Lógica de Cálculo e Interpretação

Para gerar o relatório final de Liderança, o teu código deve somar os pontos de cada traço (baseado nos valores de 1 a 7 atribuídos pelo utilizador). 

* **Pontuação Máxima por Traço:** 5 perguntas × 7 pontos = 35 pontos.
* **Pontuação Mínima por Traço:** 5 perguntas × 1 ponto = 5 pontos.

### Zonas de Potencial (Bands)
O verdadeiro poder do HPTI não é "quanto mais alto, melhor". Pontuações excessivas podem tornar-se descarriladores de carreira (ex: competitividade extrema gera líderes tóxicos). O relatório deve enquadrar a pontuação de cada traço nas seguintes faixas:

* **1. Baixo (5 - 14 pontos):**
  * *Significado:* O traço está muito ausente. Pode indicar falta de motivação (em competitividade) ou desorganização (em conscienciosidade).
  * *Recomendação:* Pode precisar de suporte adicional neste eixo organizacional.

* **2. Moderado (15 - 23 pontos):**
  * *Significado:* Nível funcional e médio. A pessoa tem flexibilidade para se adaptar, mas este não é o seu motor principal.

* **3. Ótimo (24 - 30 pontos):**
  * *Significado:* A "Golden Zone" para líderes de alto potencial. Indica uma forte propensão para gerir estrategicamente sem se deixar cegar pelo extremismo.

* **4. Excessivo (31 - 35 pontos):**
  * *Significado:* O traço é tão acentuado que se pode tornar num risco corporativo.
  * *Exemplos de feedback:* 
    * *Conscienciosidade Excessiva:* Risco de microgestão e perfecionismo paralisante.
    * *Ajustamento Excessivo:* Risco de parecer apático, frio ou desconectado da dor da equipa.
    * *Risco Excessivo:* Tendência para comportamentos imprudentes ou agressivos.

### Estrutura do Relatório Final (Dashboard)
Ao terminar o teste, a webapp apresenta 6 gráficos de barras horizontais (ou um gráfico radial/radar). Cada barra terá a pontuação total da pessoa, pintada com base na Zona de Potencial:
* Azul/Verde para a zona "Ótimo".
* Amarelo para as zonas "Baixo" ou "Moderado".
* Vermelho/Laranja para a zona "Excessivo".