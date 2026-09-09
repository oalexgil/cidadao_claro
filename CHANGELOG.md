# Changelog

All notable changes to this project will be documented in this file.

The format is inspired by Keep a Changelog. The project currently follows pragmatic versioning while the product is still evolving rapidly.

## [Unreleased]

### Added

- architecture documentation;
- security policy;
- contribution guide;
- GitHub Actions CI for syntax checks and automated tests;
- broader analyzer regression coverage;
- Node.js runtime requirement in `package.json`;
- unified `npm run ci` command;
- regression coverage that prevents the PDF reader from returning to the incompatible PDF.js 6.3.289 browser build;
- candidate-first summary extraction for fee, vacancies, salaries, dates, stages, documents and exam details;
- programmatic-content extraction only when local AI selects a related role.

### Changed

- README rewritten to document product principles, limitations, architecture and technical roadmap;
- PDF parsing now pins the PDF.js 4.10.38 legacy browser build for compatibility with managed/older Chromium environments that do not implement `Uint8Array.prototype.toHex`;
- contest results now use a concise candidate card instead of long explanatory, score and evidence panels;
- important dates are restricted to candidate-relevant cronogram events, avoiding legal citation dates.

## [3.0.0]

### Added

- local semantic analysis in the browser;
- profile-based contest radar;
- optional Node.js analyzer endpoints;
- automated tests for core deterministic extraction;
- product documentation.
