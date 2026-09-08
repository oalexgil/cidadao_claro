# Cidadão Claro 2.0

Plataforma open-source, estática e gratuita para transformar textos burocráticos em decisões claras. A nova versão adiciona um **Radar de Concursos/Editais** que cruza o edital com o perfil do candidato e mostra dados gerais e pontos específicos do perfil, incluindo modalidades de cota como **PPP**, PCD, indígenas e outras quando identificadas no texto.

## O que a versão 2.0 faz

- Funciona sem servidor e sem chave de API.
- Pode ser publicada diretamente no **GitHub Pages**.
- Aceita texto colado e arquivos `.txt` / `.md` / `.pdf`.
- Mantém histórico e perfil no `localStorage` do navegador.
- Analisa editais com extração local de:
  - cargos e funções;
  - salários/remuneração;
  - quantidade de vagas;
  - datas e prazos;
  - taxa de inscrição;
  - escolaridade e experiência;
  - etapas do certame;
  - cotas/modalidades reservadas;
  - documentos e exigências.
- Gera um **índice de compatibilidade** baseado apenas no que estiver explícito no edital e no perfil informado.
- Cria checklist personalizado, pontos de atenção e próximos passos.
- Tem modo de serviço público geral para documentos, ações, custos, prazos e contatos.
- Não envia o perfil ou o texto para um servidor no modo GitHub Pages.

## Publicação no GitHub Pages

1. Crie um repositório público no GitHub.
2. Envie todo o conteúdo desta pasta.
3. Abra `Settings > Pages`.
4. Em `Build and deployment`, escolha `GitHub Actions`.
5. O workflow em `.github/workflows/deploy-pages.yml` publicará a pasta `docs/`.

Também é possível publicar manualmente `docs/` como fonte de Pages.

## Rodar localmente

O site é estático. Pode abrir `docs/index.html` diretamente ou servir a pasta com qualquer servidor local.

Para usar o backend opcional legado:

```bash
npm install
npm start
```

Ele serve o site e expõe a análise básica em `/api/analyze`.

## Testes

```bash
npm test
npm run check
```

## Privacidade

No modo GitHub Pages, as entradas e o perfil ficam no navegador via `localStorage`. O projeto não cria contas nem banco de dados. Como o usuário pode inserir informações pessoais, recomenda-se não incluir documentos, CPF, endereço ou qualquer dado que não seja necessário à análise.

## Limites importantes

Este projeto é um **analisador de apoio**, não uma fonte oficial. Ele não garante elegibilidade, direito a cotas, enquadramento legal, pontuação ou aprovação. O edital oficial e a banca organizadora sempre prevalecem.

## Roadmap sugerido

- Importação de PDF com parser no navegador usando PDF.js 6.3.289, sem enviar o arquivo ao servidor; scripts de PDF são desativados durante a leitura.
- Comparação de versões do edital.
- Monitoramento de novas publicações via GitHub Actions.
- Catálogo por órgão/cargo.
- Alertas locais de prazo.
- OCR opcional para PDFs digitalizados.
- Camada de IA opcional através de um backend sem segredos no navegador.
