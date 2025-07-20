# Security Policy

## Supported Versions

We actively support the following versions of blipee OS Retail Intelligence:

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

The blipee team takes security seriously. If you discover a security vulnerability in blipee OS Retail Intelligence, please report it responsibly.

### How to Report

1. **Email**: Send details to security@blipee.com
2. **Subject**: Include "SECURITY" in the subject line
3. **PGP**: Use our PGP key for sensitive information (available on request)

### What to Include

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Suggested fix (if available)
- Your contact information

### Response Timeline

- **24 hours**: Initial acknowledgment
- **72 hours**: Preliminary assessment
- **7 days**: Detailed investigation
- **14 days**: Fix implementation (for critical issues)
- **30 days**: Public disclosure (after fix is deployed)

### Scope

This security policy covers:
- Main application (app.blipee.com)
- API endpoints
- Database security
- Authentication systems
- Data privacy

### Out of Scope

- Third-party services (Supabase, Vercel)
- Social engineering attacks
- Physical security issues
- DoS attacks on free tier services

### Bug Bounty

We currently do not offer a formal bug bounty program, but we recognize and appreciate security researchers who help improve our platform security.

### Responsible Disclosure

We ask that you:
- Give us reasonable time to fix the issue
- Do not publicly disclose the vulnerability before we've addressed it
- Do not access or modify user data
- Follow applicable laws and regulations

## Security Features

### Authentication
- Multi-factor authentication (MFA)
- Secure session management
- OAuth 2.0 / OpenID Connect
- SAML 2.0 for enterprise

### Data Protection
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Field-level encryption for sensitive data
- Regular security audits

### Access Control
- Role-based access control (RBAC)
- Row-level security (RLS)
- API rate limiting
- Audit logging

### Infrastructure
- Cloud-native security (Supabase, Vercel)
- Automated security updates
- Regular penetration testing
- Compliance monitoring

## Contact

For security-related questions or concerns:
- **Email**: security@blipee.com
- **Response Time**: Within 24 hours during business days

Thank you for helping keep blipee OS Retail Intelligence secure!