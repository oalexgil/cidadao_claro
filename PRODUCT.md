# Cidadão Claro — Produto v3

## Problema

Editais concentram requisitos, cronogramas, cargos e regras de reserva de vagas em documentos longos. O usuário precisa descobrir rapidamente “qual cargo combina comigo?”, “qual é o próximo prazo?” e “o que minha modalidade exige?”.

## Proposta

Um leitor local que transforma o edital em um painel de decisão: visão geral + encaixe de perfil + áreas correlatas + linha do tempo + documentação geral + regras específicas de cota.

## ICP inicial

- pessoas que acompanham concursos e processos seletivos;
- profissionais que não sabem quais cargos correlatos procurar;
- candidatos que têm dificuldade em separar cronograma geral de etapas específicas de cotas;
- usuários que preferem não cadastrar documentos pessoais em plataformas.

## Critérios de produto

1. **A evidência vem do edital**: a interface diferencia encontrado, relacionado e não localizado.
2. **Cota não é inferida como documento**: se o texto não exigir um documento, o sistema informa que ele não foi localizado.
3. **IA é assistiva**: a proximidade semântica apoia a descoberta de cargos; não decide elegibilidade.
4. **Prazos têm prioridade**: datas são ordenadas e recebem estado encerrado/hoje/próximo.
5. **Privacidade por padrão**: perfil em localStorage; sem cadastro e sem API obrigatória.

## Roadmap

### V3.1
- OCR opcional no navegador para PDFs escaneados;
- extração de tabelas de vagas por cargo;
- detecção de banca/órgão e fonte oficial;
- botão “abrir item do edital” com contexto por página quando o PDF permitir.

### V3.2
- ranking de cargos + filtros por UF, remuneração e escolaridade;
- modo “quero só cargos acima de X salário”;
- exportação do cronograma em ICS;
- PWA offline para análises já carregadas.

### V4
- base pública de editais e histórico;
- alertas opt-in;
- comparação entre editais;
- assistente de estudos por etapa.
