# Cidadão Claro

## Versão GitHub Pages + IA local

O Cidadão Claro é um leitor de informações públicas com foco especial em editais de concursos/processos seletivos. O modo Radar permite criar um perfil e cruzá-lo com o edital para localizar cargos compatíveis, áreas correlatas, cronograma e regras de cotas.

### O que a versão atual faz

- publicação estática via GitHub Pages;
- leitura de PDF/TXT/MD no navegador;
- IA local para semelhança semântica de área ↔ cargos, sem chave de API;
- mapa de áreas correlatas (ex.: Design de Produto → UX/UI, Service Design, UX Research etc.);
- compatibilidade indicativa com evidências separadas de alertas;
- cronograma em linha do tempo, ordenado e com status de data;
- documentação geral separada da documentação/regras da modalidade de cota;
- quando um documento de cota não está explicitamente no edital, o sistema mostra “não localizado” em vez de inventá-lo;
- perfil e histórico em `localStorage`;
- interface responsiva e impressão.

### IA sem pagamento

A análise sem chave usa Transformers.js no navegador com o modelo `Xenova/paraphrase-multilingual-MiniLM-L12-v2`. Na primeira análise, o navegador baixa o modelo; depois ele fica em cache. O processamento de embeddings acontece no cliente.

A implementação também possui um caminho de segurança: caso o modelo não carregue, o radar continua com heurísticas locais e deixa isso explícito na interface.

### Publicação

Envie o conteúdo da pasta `docs/` ao GitHub e configure GitHub Pages para publicar `/docs` a partir da branch `main`.

Não há banco de dados nem servidor obrigatório.

### Estrutura

```text
cidadao-claro/
├── docs/
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── server/              # backend opcional para futuras integrações
├── tests/
├── PRODUCT.md
├── package.json
└── LICENSE
```

### Observações importantes

O percentual de IA é uma medida de proximidade textual/semântica, não uma estimativa de aprovação ou de elegibilidade jurídica. Para cotas, o sistema não cria exigências que não estejam no texto analisado.
