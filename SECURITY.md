# Security Policy

## Scope

This repository contains a browser-first application and an optional Node.js HTTP server. Security reports are especially useful when they involve:

- unintended exposure of user documents or profile data;
- cross-site scripting or unsafe HTML rendering;
- path traversal or static-file boundary issues;
- bypass of request-size limits;
- leakage of credentials, tokens or private configuration;
- dependency or supply-chain issues that affect the published application.

## Reporting a vulnerability

Please do not publish a working exploit, secret, private document or personal data in a public issue.

Open a minimal issue stating that you found a security problem and avoid including sensitive reproduction data. The maintainer can then coordinate a safer channel for the technical details.

Include, when possible:

- affected component and version/commit;
- impact;
- reproducible steps using non-sensitive test data;
- browser/runtime information;
- suggested mitigation, if known.

## Data handling assumptions

The primary browser workflow is designed to process documents locally. Profile and history data are stored in browser storage. The optional server does not intentionally persist submitted text.

Future changes that introduce remote processing must document what leaves the device, why, and where it is sent.

## Secrets

Never commit API keys, personal access tokens, credentials or real private documents. If a secret is accidentally committed, revoke/rotate it immediately; deleting the file from the latest commit is not sufficient to invalidate the secret.

## Supported version

Security fixes target the latest state of the default branch.
