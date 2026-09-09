# Contributing

Thanks for improving Cidadão Claro.

## Development setup

Requirements:

- Node.js 20 or newer recommended;
- a modern browser;
- no mandatory external API key for the main local-analysis workflow.

Run locally:

```bash
npm start
```

Validate before submitting changes:

```bash
npm run ci
```

## Contribution principles

1. Preserve the rule that the official source prevails over automated analysis.
2. Do not turn semantic similarity into claims of eligibility or approval probability.
3. Do not invent requirements, dates, quota rules or documents when they are absent from the source text.
4. Prefer pure, testable extraction functions over UI-bound logic.
5. Escape untrusted text before rendering it as HTML.
6. Never commit secrets or real private user documents.
7. Add or update tests when changing deterministic extraction or scoring rules.

## Pull requests

Keep pull requests focused. Describe:

- the problem;
- the chosen approach;
- user-visible changes;
- tests performed;
- limitations or follow-up work.

For behavior changes, include a small synthetic input that demonstrates the previous and new result.

## Architecture direction

New domain logic should move toward reusable modules that can serve both the browser and the optional Node.js server. See `ARCHITECTURE.md` before introducing new cross-cutting dependencies.
