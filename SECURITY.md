# Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately rather than via a public GitHub issue. Use GitHub's "Report a vulnerability" (Security Advisories) feature on this repository, or email the maintainers listed in `package.json`. Include:

- A description of the vulnerability and its impact
- Steps to reproduce (a minimal Express app + request is ideal)
- The version(s) affected

We aim to acknowledge reports within 72 hours.

## Scope notes

- The `suspiciousRequests` feature is explicitly a heuristic, defense-in-depth layer, not a WAF. Bypasses of individual regex patterns are expected and lower severity than, say, an auth bypass in `apiKey` or an IP-spoofing issue in `trustedProxies`.
- Timing side-channels in API key comparison are mitigated via `crypto.timingSafeEqual`; report any remaining timing leak (e.g. in `validate()` callback paths) as a real finding.

## Supported versions

Security fixes are backported to the latest minor of the current major version. Once 1.0 ships, older majors are supported per the table added at that time.
