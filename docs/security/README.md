# Security & Compliance Documentation

## Overview

The Retail Intelligence Platform implements enterprise-grade security measures to protect sensitive retail data and ensure compliance with global regulations. This document outlines our security architecture, policies, and procedures.

## Table of Contents

- [Security Architecture](#security-architecture)
- [Authentication & Authorization](#authentication--authorization)
- [Data Protection](#data-protection)
- [API Security](#api-security)
- [Infrastructure Security](#infrastructure-security)
- [Compliance](#compliance)
- [Security Policies](#security-policies)
- [Incident Response](#incident-response)
- [Security Checklist](#security-checklist)

## Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────────────────────────┐
│                   WAF (Web Application Firewall)         │
├─────────────────────────────────────────────────────────┤
│                   CDN (DDoS Protection)                  │
├─────────────────────────────────────────────────────────┤
│              Edge Functions (Input Validation)           │
├─────────────────────────────────────────────────────────┤
│           Application Layer (Authentication)             │
├─────────────────────────────────────────────────────────┤
│              API Layer (Rate Limiting)                   │
├─────────────────────────────────────────────────────────┤
│         Database (Row Level Security)                    │
├─────────────────────────────────────────────────────────┤
│           Infrastructure (Encryption)                    │
└─────────────────────────────────────────────────────────┘
```

### Security Principles

1. **Least Privilege**: Users and services have minimum required permissions
2. **Zero Trust**: Verify every request, regardless of source
3. **Defense in Depth**: Multiple security layers
4. **Fail Secure**: System fails to a secure state
5. **Security by Design**: Security built into every component

## Authentication & Authorization

### Authentication Methods

#### 1. Email/Password Authentication

```typescript
// Secure password requirements
const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventReuse: 5
};

// Password hashing
import { hash, verify } from 'argon2';

export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1
  });
}
```

#### 2. Multi-Factor Authentication (MFA)

```typescript
// TOTP implementation
import { authenticator } from 'otplib';

export function setupMFA(userId: string) {
  const secret = authenticator.generateSecret();
  const qrCode = authenticator.keyuri(
    userId,
    'Retail Intelligence',
    secret
  );
  
  return { secret, qrCode };
}

export function verifyMFA(token: string, secret: string): boolean {
  return authenticator.verify({ token, secret });
}
```

#### 3. Single Sign-On (SSO)

- SAML 2.0 support
- OAuth 2.0 / OpenID Connect
- Azure AD integration
- Google Workspace integration

### Authorization Model

#### Role-Based Access Control (RBAC)

```typescript
enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  ANALYST = 'analyst',
  VIEWER = 'viewer'
}

interface Permission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    { resource: '*', actions: ['*'] }
  ],
  [Role.ADMIN]: [
    { resource: 'organization', actions: ['read', 'update'] },
    { resource: 'users', actions: ['*'] },
    { resource: 'sites', actions: ['*'] },
    { resource: 'reports', actions: ['*'] }
  ],
  [Role.MANAGER]: [
    { resource: 'sites', actions: ['read', 'update'] },
    { resource: 'reports', actions: ['read', 'create'] },
    { resource: 'metrics', actions: ['read'] }
  ],
  [Role.ANALYST]: [
    { resource: 'reports', actions: ['read', 'create'] },
    { resource: 'metrics', actions: ['read'] }
  ],
  [Role.VIEWER]: [
    { resource: 'reports', actions: ['read'] },
    { resource: 'metrics', actions: ['read'] }
  ]
};
```

#### Attribute-Based Access Control (ABAC)

```typescript
// Fine-grained permissions
interface AccessPolicy {
  effect: 'allow' | 'deny';
  principal: {
    userId?: string;
    role?: Role;
    attributes?: Record<string, any>;
  };
  resource: {
    type: string;
    id?: string;
    attributes?: Record<string, any>;
  };
  action: string;
  condition?: (context: AccessContext) => boolean;
}

// Example: Users can only access their assigned stores
const storeAccessPolicy: AccessPolicy = {
  effect: 'allow',
  principal: { role: Role.MANAGER },
  resource: { type: 'site' },
  action: 'read',
  condition: (context) => {
    return context.user.assignedSites.includes(context.resource.id);
  }
};
```

### Session Management

```typescript
// Secure session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET!,
  duration: 7 * 24 * 60 * 60 * 1000, // 7 days
  activeDuration: 30 * 60 * 1000, // 30 minutes
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
};

// Session invalidation
export async function invalidateSession(sessionId: string) {
  await redis.del(`session:${sessionId}`);
  await supabase
    .from('user_sessions')
    .update({ invalidated_at: new Date() })
    .eq('id', sessionId);
}
```

## Data Protection

### Encryption

#### 1. Data at Rest

```sql
-- Transparent Data Encryption (TDE)
ALTER DATABASE retail_intelligence SET ENCRYPTION ON;

-- Column-level encryption for sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt PII
INSERT INTO customers (email, phone) 
VALUES (
  pgp_sym_encrypt('user@example.com', current_setting('app.encryption_key')),
  pgp_sym_encrypt('+1234567890', current_setting('app.encryption_key'))
);
```

#### 2. Data in Transit

```typescript
// Force HTTPS
export function middleware(request: Request) {
  const proto = request.headers.get('x-forwarded-proto');
  if (proto !== 'https') {
    return Response.redirect(
      `https://${request.headers.get('host')}${request.url}`,
      301
    );
  }
}

// TLS configuration
const tlsConfig = {
  minVersion: 'TLSv1.2',
  ciphers: [
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-SHA256'
  ]
};
```

#### 3. Field-Level Encryption

```typescript
// Encrypt sensitive fields
import { encrypt, decrypt } from '@/lib/crypto';

export class EncryptedField {
  static async set(value: string): Promise<string> {
    return encrypt(value, process.env.FIELD_ENCRYPTION_KEY!);
  }
  
  static async get(encrypted: string): Promise<string> {
    return decrypt(encrypted, process.env.FIELD_ENCRYPTION_KEY!);
  }
}

// Usage in schema
const userSchema = z.object({
  email: z.string().email(),
  ssn: z.string().transform(EncryptedField.set),
  creditCard: z.string().transform(EncryptedField.set)
});
```

### Data Masking

```typescript
// PII masking for logs and non-production environments
export function maskPII(data: any): any {
  const masks = {
    email: (email: string) => email.replace(/^(.{2}).*(@.*)$/, '$1***$2'),
    phone: (phone: string) => phone.replace(/\d(?=\d{4})/g, '*'),
    ssn: (ssn: string) => `***-**-${ssn.slice(-4)}`,
    creditCard: (cc: string) => `****-****-****-${cc.slice(-4)}`
  };
  
  // Recursively mask object
  return deepMap(data, (key, value) => {
    if (masks[key]) {
      return masks[key](value);
    }
    return value;
  });
}
```

## API Security

### Rate Limiting

```typescript
// Rate limiter configuration
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit'
});

export async function rateLimitMiddleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);
  
  if (!success) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(reset).toISOString()
      }
    });
  }
}
```

### Input Validation

```typescript
// Strict input validation
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// SQL injection prevention
const siteIdSchema = z.string().uuid();
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// XSS prevention
const textInputSchema = z.string().transform((val) => 
  DOMPurify.sanitize(val, { ALLOWED_TAGS: [] })
);

// Request validation middleware
export function validateRequest(schema: z.ZodSchema) {
  return async (request: Request) => {
    try {
      const body = await request.json();
      const validated = schema.parse(body);
      request.validated = validated;
    } catch (error) {
      return Response.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
  };
}
```

### API Key Management

```typescript
// Secure API key generation and storage
import { randomBytes } from 'crypto';

export async function generateAPIKey(userId: string, name: string) {
  const key = `sk_${randomBytes(32).toString('hex')}`;
  const hashedKey = await hash(key);
  
  await supabase.from('api_keys').insert({
    user_id: userId,
    name,
    key_hash: hashedKey,
    key_prefix: key.substring(0, 7),
    last_used_at: null,
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  });
  
  // Return key only once
  return key;
}
```

## Infrastructure Security

### Network Security

```yaml
# Security groups configuration
security_groups:
  web_tier:
    ingress:
      - protocol: tcp
        port: 443
        source: 0.0.0.0/0
    egress:
      - protocol: tcp
        port: 5432
        destination: database_tier
        
  database_tier:
    ingress:
      - protocol: tcp
        port: 5432
        source: web_tier
    egress: []
```

### Secrets Management

```typescript
// Environment variable encryption
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

export async function getSecret(name: string): Promise<string> {
  const [version] = await client.accessSecretVersion({
    name: `projects/${PROJECT_ID}/secrets/${name}/versions/latest`
  });
  
  return version.payload.data.toString();
}

// Rotate secrets periodically
export async function rotateSecret(name: string) {
  const newSecret = generateSecureToken();
  
  await client.addSecretVersion({
    parent: `projects/${PROJECT_ID}/secrets/${name}`,
    payload: {
      data: Buffer.from(newSecret)
    }
  });
  
  // Update application configuration
  await updateApplicationSecret(name, newSecret);
}
```

### Container Security

```dockerfile
# Secure Docker configuration
FROM node:20-alpine AS base

# Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy only necessary files
COPY --chown=nextjs:nodejs . .

# Remove unnecessary packages
RUN apk --no-cache add dumb-init
RUN npm ci --only=production

USER nextjs

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

## Compliance

### GDPR Compliance

```typescript
// Data subject rights implementation
export class GDPRService {
  // Right to access
  async exportUserData(userId: string) {
    const data = await this.collectUserData(userId);
    return this.formatForExport(data);
  }
  
  // Right to erasure
  async deleteUserData(userId: string) {
    await this.anonymizeTransactions(userId);
    await this.deletePersonalData(userId);
    await this.logDeletion(userId);
  }
  
  // Right to rectification
  async updateUserData(userId: string, updates: any) {
    await this.validateUpdates(updates);
    await this.applyUpdates(userId, updates);
    await this.logUpdate(userId);
  }
  
  // Consent management
  async updateConsent(userId: string, consents: ConsentUpdate[]) {
    await this.validateConsents(consents);
    await this.storeConsents(userId, consents);
  }
}
```

### SOC 2 Type II Controls

```typescript
// Audit logging
interface AuditLog {
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure';
  metadata?: Record<string, any>;
}

export async function logAuditEvent(event: AuditLog) {
  // Immutable audit log
  await supabase.from('audit_logs').insert({
    ...event,
    checksum: calculateChecksum(event)
  });
  
  // Real-time alerting for suspicious activity
  if (isSuspicious(event)) {
    await alertSecurityTeam(event);
  }
}
```

### PCI DSS (if processing payments)

```typescript
// Credit card tokenization
export async function tokenizeCreditCard(cardNumber: string) {
  // Never store actual card numbers
  const token = await paymentProvider.tokenize(cardNumber);
  
  return {
    token,
    last4: cardNumber.slice(-4),
    expiryMonth: null, // Don't store
    expiryYear: null,  // Don't store
    cvv: null          // Never store
  };
}
```

## Security Policies

### Password Policy

```typescript
const passwordPolicy = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  
  preventPatterns: [
    /(.)\1{2,}/, // No repeated characters
    /12345/,     // No sequential numbers
    /password/i, // No word "password"
    /qwerty/i    // No keyboard patterns
  ],
  
  preventPersonalInfo: true, // Check against user profile
  checkPwnedPasswords: true, // Check against breach databases
  
  expiryDays: 90,
  historyCount: 12, // Prevent reuse of last 12 passwords
  
  lockoutAttempts: 5,
  lockoutDuration: 30 * 60 * 1000 // 30 minutes
};
```

### Access Control Policy

```yaml
access_control:
  authentication:
    - Multi-factor authentication required for admin roles
    - SSO required for enterprise customers
    - Session timeout after 30 minutes of inactivity
    
  authorization:
    - Principle of least privilege
    - Regular access reviews (quarterly)
    - Automated deprovisioning on termination
    
  monitoring:
    - All access logged and monitored
    - Anomaly detection for unusual patterns
    - Real-time alerts for privileged actions
```

## Incident Response

### Incident Response Plan

```typescript
enum IncidentSeverity {
  CRITICAL = 'critical', // Data breach, system compromise
  HIGH = 'high',         // Service outage, security vulnerability
  MEDIUM = 'medium',     // Performance degradation, minor breach
  LOW = 'low'            // Minor issues, false positives
}

interface IncidentResponse {
  detect: () => Promise<void>;
  contain: () => Promise<void>;
  investigate: () => Promise<void>;
  remediate: () => Promise<void>;
  recover: () => Promise<void>;
  postmortem: () => Promise<void>;
}

export class IncidentHandler implements IncidentResponse {
  async detect() {
    // Automated detection via monitoring
    // Manual reporting via security@retailintelligence.io
  }
  
  async contain() {
    // Isolate affected systems
    // Preserve evidence
    // Prevent further damage
  }
  
  async investigate() {
    // Determine scope and impact
    // Identify root cause
    // Collect forensic data
  }
  
  async remediate() {
    // Apply patches/fixes
    // Remove malicious code
    // Update configurations
  }
  
  async recover() {
    // Restore services
    // Verify integrity
    // Monitor for recurrence
  }
  
  async postmortem() {
    // Document timeline
    // Identify improvements
    // Update procedures
  }
}
```

### Security Contacts

```yaml
security_team:
  email: security@retailintelligence.io
  phone: +1-555-SEC-RITY
  
  escalation:
    - level_1: security-oncall@retailintelligence.io
    - level_2: ciso@retailintelligence.io
    - level_3: cto@retailintelligence.io
    
  external:
    incident_response: incident-response-vendor.com
    legal: legal@retailintelligence.io
    pr: communications@retailintelligence.io
```

## Security Checklist

### Development

- [ ] All dependencies scanned for vulnerabilities
- [ ] Code reviewed for security issues
- [ ] Secrets not committed to repository
- [ ] Input validation implemented
- [ ] Output encoding implemented
- [ ] Authentication checks in place
- [ ] Authorization checks in place
- [ ] Error messages don't leak information
- [ ] Logging doesn't include sensitive data
- [ ] Security headers configured

### Deployment

- [ ] TLS/SSL certificates valid
- [ ] Security groups properly configured
- [ ] Secrets rotated
- [ ] Monitoring enabled
- [ ] Backup procedures tested
- [ ] Incident response plan reviewed
- [ ] Security patches applied
- [ ] Penetration testing completed
- [ ] Compliance requirements met
- [ ] Documentation updated

### Ongoing

- [ ] Regular security audits
- [ ] Dependency updates
- [ ] Security training
- [ ] Incident response drills
- [ ] Access reviews
- [ ] Log analysis
- [ ] Threat modeling
- [ ] Vulnerability scanning
- [ ] Penetration testing
- [ ] Compliance audits

## Security Tools

```bash
# Dependency scanning
npm audit
snyk test

# Static analysis
eslint --ext .ts,.tsx --plugin security
semgrep --config=auto

# Dynamic analysis
zap-cli quick-scan https://app.retailintelligence.io

# Infrastructure scanning
terraform plan -var-file=prod.tfvars
tfsec .
```

---

For security concerns or to report vulnerabilities, please contact security@retailintelligence.io