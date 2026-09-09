# Cidadão Claro

Leitor local de informações públicas com foco em editais de concursos e processos seletivos. O projeto transforma documentos extensos em uma leitura orientada a ações, prazos, documentos, etapas e sinais de compatibilidade com um perfil informado pelo usuário.

> **Status:** protótipo funcional / research product. A análise é informativa e nunca substitui o edital oficial, atos da banca ou avaliação jurídica de requisitos.

## Por que este projeto existe

Editais e páginas de serviços públicos costumam concentrar regras, datas, documentos e exceções em textos longos. O Cidadão Claro busca reduzir o custo de leitura sem esconder a evidência de origem nem transformar similaridade textual em promessa de elegibilidade.

## Principais capacidades

- leitura de PDF, TXT e Markdown no navegador;
- extração local de datas, valores, documentos, contatos, ações e etapas;
- modo **Radar**, que cruza o perfil do usuário com trechos do edital;
- mapa de áreas correlatas para ampliar a busca por cargos;
- similaridade semântica local com Transformers.js, sem chave de API;
- fallback heurístico quando o modelo local não estiver disponível;
- linha do tempo ordenada com status de datas;
- identificação de modalidades de reserva de vagas encontradas no texto;
- separação entre evidências, alertas e recomendações de conferência;
- perfil e histórico armazenados somente no navegador;
- interface responsiva e impressão.

## Princípios de produto

1. **Fonte oficial prevalece.** A ferramenta orienta a leitura; não decide elegibilidade.
2. **Não inventar requisitos.** Se uma informação não for encontrada, o produto deve dizer que não a localizou.
3. **Privacidade por padrão.** O fluxo principal funciona localmente, sem enviar o documento para um serviço obrigatório.
4. **Explicabilidade.** Pontuações e alertas devem ser acompanhados por evidências ou limitações claras.
5. **Fallback explícito.** Se a IA local falhar, a interface informa que está usando heurísticas.

## Arquitetura atual

```text
cidadao_claro/
├── docs/                  # aplicação publicada no GitHub Pages
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── server/                # servidor Node opcional + analisador determinístico
│   ├── analyzer.js
│   └── index.js
├── tests/
│   └── analyzer.test.js
├── .github/workflows/
│   └── ci.yml
├── ARCHITECTURE.md
├── PRODUCT.md
├── SECURITY.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── package.json
└── LICENSE
```

O frontend ainda concentra responsabilidades em `docs/app.js`. A modularização do navegador é a principal dívida técnica planejada; veja `ARCHITECTURE.md`.

## IA local

A versão web carrega `Xenova/paraphrase-multilingual-MiniLM-L12-v2` por Transformers.js para gerar embeddings no próprio navegador. O modelo é baixado na primeira utilização e pode ser reutilizado pelo cache do navegador.

A pontuação de IA representa **proximidade textual/semântica**. Ela não é probabilidade de aprovação, classificação ou direito a uma vaga.

## Executar localmente

Requer Node.js moderno com suporte a ES Modules e `node:test`.

```bash
npm start
```

Abra `http://localhost:3000`.

Para validar o código:

```bash
npm run ci
```

O comando executa checagem sintática e testes automatizados.

## Testes

Os testes atuais cobrem o núcleo determinístico de extração e compatibilidade. A meta seguinte é adicionar testes para parsing de datas, casos ambíguos de cotas, limites de entrada e integração HTTP.

## Segurança e privacidade

- não inclua chaves de API ou dados pessoais de usuários no repositório;
- documentos processados pelo fluxo web principal permanecem no navegador;
- o servidor opcional limita o tamanho das requisições e não persiste os textos recebidos;
- vulnerabilidades devem ser reportadas conforme `SECURITY.md`.

## Limitações conhecidas

- documentos mal extraídos de PDF podem degradar a análise;
- regex e heurísticas não compreendem todas as estruturas possíveis de edital;
- similaridade semântica pode produzir falsos positivos;
- a taxonomia de áreas profissionais é curada manualmente e ainda é limitada;
- requisitos jurídicos, registros profissionais, cotas e equivalências acadêmicas exigem conferência humana;
- o frontend ainda possui código monolítico e lógica parcialmente duplicada com o analisador Node.

## Roadmap técnico

- [ ] modularizar `docs/app.js` em domínio, parsing, IA e UI;
- [ ] criar fixtures de editais anonimizados para regressão;
- [ ] ampliar testes de datas, requisitos e modalidades de vagas;
- [ ] eliminar lógica duplicada entre navegador e servidor;
- [ ] adicionar validação estruturada dos resultados de análise;
- [ ] medir precisão/recall das extrações em um corpus controlado;
- [ ] melhorar acessibilidade e navegação por teclado;
- [ ] automatizar deploy após CI verde.

## Licença

MIT. Consulte `LICENSE`.
