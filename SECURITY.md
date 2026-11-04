# StickTheBizz Security Policy

## Supported Versions
| Version | Supported |
|---------|-----------|
| 1.x.x   | ✅        |

## Reporting a Vulnerability
Email: **security@stickthebizz.in** (create this alias)

We aim to respond within 48 hours and patch Critical/High within 7 days.

## Security Checklist for Contributors
- [ ] Never commit `.env*` files
- [ ] Run `npm audit` before PR
- [ ] All server actions verify ownership via `getAuthenticatedMerchant()`
- [ ] All user input sanitized via `sanitizeHtml()`
- [ ] RLS policies verified for new tables
- [ ] Rate limiting on new auth endpoints
- [ ] Error messages sanitized via `sanitizeError()`
- [ ] Phone numbers masked via `maskPhone()` in merchant views