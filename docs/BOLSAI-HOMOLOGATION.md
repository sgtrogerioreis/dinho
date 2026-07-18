# Homologacao BolsAI

- Execucao: 2026-07-18T14:58:15.827Z
- Chave: nunca exibida
- Plano identificado: verificar header/endpoint de uso quando disponivel
- Endpoints usados: /fundamentals/{ticker}
- Requisicoes consumidas nesta execucao: 73
- Contador local registrado: 73
- Painel BolsAI informado: 18
- Diferenca entre contador local e painel: 24
- Ativos testados: 79
- Graham completo: 71 (89.87%)
- Bazin completo: 0 (0%)
- FCD completo: 0 (0%)
- Cobertura completa dos tres metodos: 0

## Cobertura Graham no Ibovespa

- Tickers testados: 78
- Cobertura dos dados necessarios: 78/78 (100%)
- Graham calculavel: 70/78 (89.74%)
- Graham nao aplicavel: 8/78
- Ausencia de dados: 0
- Categorias sem calculo: not_applicable: 8
- Tickers calculaveis: PETR4, VALE3, ITUB4, BBAS3, WEGE3, PRIO3, TAEE11, CMIG4, SUZB3, B3SA3, AXIA3, PETR3, BBDC4, SBSP3, ITSA4, BPAC11, ABEV3, EMBJ3, EQTL3, ENEV3, CPLE3, VBBR3, RDOR3, RENT3, UGPA3, GGBR4, BBSE3, VIVT3, RADL3, BBDC3, CSMG3, TIMS3, RAIL3, ENGI11, TOTS3, MOTV3, KLBN11, CXSE3, LREN3, ALOS3, ISAE4, MBRF3, ASAI3, SMFT3, EGIE3, PSSA3, SANB11, MULT3, BRAV3, CPFE3, CMIN3, GOAU4, FLRY3, HYPE3, CYRE3, BRAP4, IGTI11, CURY3, COGN3, DIRR3, POMO4, SLCE3, RECV3, VIVA3, YDUQ3, AZZA3, CEAB3, MGLU3, BEEF3, VAMO3
- Tickers nao aplicaveis/incompletos: CSAN3 (not_applicable), NATU3 (not_applicable), USIM5 (not_applicable), AURE3 (not_applicable), CSNA3 (not_applicable), HAPV3 (not_applicable), MRVE3 (not_applicable), BRKM5 (not_applicable)
- Requisicoes efetivamente consumidas nesta rodada: 73
- Diferenca entre contador local e painel da BolsAI: 24

## Conclusao Tecnica

- BolsAI Free homologada como fonte principal de dados para Graham.
- Cobertura dos campos necessarios: 100% no Ibovespa testado.
- Fallback nao e necessario por ausencia de dados neste universo.
- Deve existir tratamento semantico para `GRAHAM_NOT_APPLICABLE` quando LPA ou VPA forem iguais ou menores que zero.
- Os casos nao aplicaveis nao podem produzir raiz com dados negativos nem preco justo artificial.
