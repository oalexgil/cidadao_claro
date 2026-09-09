# Architecture

## Context

Cidadão Claro has two execution modes:

1. a browser-first application published from `docs/`;
2. an optional Node.js server exposing deterministic analyzers through HTTP.

The product deliberately keeps its core reading workflow usable without a mandatory hosted backend.

## Current architecture

```text
Browser
  ├─ document input
  ├─ local parsing and heuristics
  ├─ local semantic model (Transformers.js)
  ├─ profile/history in localStorage
  └─ UI rendering

Optional Node server
  ├─ static files from docs/
  └─ deterministic text-analysis endpoints
       ├─ /api/analyze
       └─ /api/contest-analyze
```

### Main components

- `docs/index.html`: application shell.
- `docs/styles.css`: presentation layer.
- `docs/app.js`: browser orchestration, parsing, timeline extraction, profile matching, semantic similarity and UI rendering.
- `server/analyzer.js`: deterministic extraction and profile matching usable outside the browser UI.
- `server/index.js`: minimal HTTP adapter and static file server.
- `tests/analyzer.test.js`: unit tests for the deterministic analyzer.

## Architectural risks

### 1. Monolithic browser module

`docs/app.js` currently owns too many responsibilities. This raises regression risk and makes isolated tests difficult.

### 2. Duplicate domain logic

The browser and Node analyzer independently implement normalization, extraction and profile matching. Rules can diverge over time.

### 3. Weak contracts

Analyzer outputs are plain JavaScript objects without a shared schema. UI code therefore depends on implicit object shapes.

### 4. Limited regression corpus

The tests cover synthetic examples, but there is no controlled set of representative edital fixtures.

## Target architecture

The next architecture should keep the project framework-light while separating domain logic from adapters.

```text
src/
├── core/
│   ├── normalize.js
│   ├── extractors/
│   │   ├── dates.js
│   │   ├── money.js
│   │   ├── contacts.js
│   │   ├── documents.js
│   │   └── quotas.js
│   ├── contest-analysis.js
│   ├── service-analysis.js
│   └── schemas.js
├── profile/
│   ├── taxonomy.js
│   └── matcher.js
├── ai/
│   ├── embeddings.js
│   └── semantic-ranking.js
├── adapters/
│   ├── browser/
│   └── http/
└── ui/
    ├── renderers/
    └── controllers/

tests/
├── unit/
├── integration/
└── fixtures/
```

## Dependency rule

`core/` must not import browser globals, DOM APIs, HTTP code, localStorage or model-specific AI code.

Adapters may import the core. The core must never import adapters.

This keeps extraction logic independently testable and reusable by both browser and server.

## Data contracts

Analysis results should evolve toward explicit versioned objects, for example:

```js
{
  schemaVersion: 1,
  source: { type: 'edital', length: 12345 },
  extracted: {
    dates: [],
    money: [],
    contacts: [],
    documents: [],
    quotas: []
  },
  profileMatch: {
    score: 0,
    band: 'Baixa',
    evidence: [],
    warnings: []
  },
  limitations: []
}
```

## Security boundaries

- User documents should remain local unless the user deliberately selects a server-backed workflow.
- No secrets belong in browser source or repository history.
- Untrusted text must be escaped before insertion into HTML.
- HTTP inputs need size limits and content validation.
- Any future remote AI provider must be isolated behind a server-side adapter or an explicit bring-your-own-key flow with clear warnings.

## Testing strategy

### Unit

Pure functions: normalization, date extraction, quota detection, profile matching and scoring.

### Integration

HTTP routes, malformed JSON, payload limits and static file boundaries.

### Regression

Small anonymized text fixtures representing different edital layouts and known edge cases.

### Browser smoke tests

Critical workflows: open app, save profile, analyze text, display evidence and clear local data.

## Decision log

The project intentionally avoids a mandatory framework migration for now. The immediate goal is separation of concerns and reliable tests, not adding build complexity without product benefit.
