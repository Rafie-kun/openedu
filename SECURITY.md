# Security policy

EduBuf handles student personal data: names, contact details, academic records, financial plans and
private application notes. Please treat security reports seriously and report them privately.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting on this repository (Security → Advisories → Report a
vulnerability). If that is unavailable, contact the maintainer directly through their GitHub profile.

Include:

- what the issue is and where it lives (route, action, package);
- steps to reproduce, or a proof of concept that does not touch another real user's data;
- the impact you believe it has;
- whether you want credit in the fix.

Do not open a public issue, and do not test against accounts you do not own.

## What to expect

- An acknowledgement within a few days.
- A fix or a clear explanation within a reasonable window, depending on severity.
- Credit if you want it, after the fix is released.

## Supported versions

Only the current `main` branch is supported. This is pre-1.0 software; there are no backports.

## In scope

- Authentication and session handling
- Broken access control between student accounts
- Injection, XSS, CSRF, SSRF
- Rate-limit bypass with real impact
- Exposure of secrets or environment configuration
- Unsafe file handling, once uploads exist
- Dependency vulnerabilities with a reachable path

## Out of scope

- Missing security headers on non-production deployments
- Self-XSS or issues that require the victim to paste code into their console
- Email spoofing without a concrete abuse path
- The content of a public catalogue record being wrong. That is a data issue; open a normal issue
  with a source.
- Denial of service by volume against a local development server

## Known limitations

Be aware of these before reporting them:

- Rate limiting is database-backed and per-process boundary only; a distributed deployment would need
  a shared store such as Redis.
- Email verification is not enforced in this build.
- Document upload and storage are not implemented, so there is no file security surface yet.
- Audit entries are kept after account deletion in a detached form and contain no academic content.
  This is deliberate and documented in the retention policy.

## Secrets

Never commit `.env`, tokens, keys or production dumps. If a secret leaks, rotate it first and then
tell the maintainer; do not wait for a fix.
