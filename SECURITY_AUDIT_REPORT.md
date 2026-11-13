# OpenEdu Security Audit Report
**Date**: 2026-11-13  
**Auditor**: Claude Code Security Review  
**Status**: CRITICAL FINDINGS PRESENT

---

## Executive Summary

OpenEdu has **one CRITICAL vulnerability** (SSRF in HTTP fetcher) that must be fixed immediately, **two MEDIUM issues** (authorization bypass risk, missing CSRF validation details), and several LOW/INFO-level findings.

The application has reasonable foundational security:
- Password hashing with bcrypt
- Session token hashing
- Rate limiting on auth endpoints
- Input validation with Zod schemas
- Parameterized queries via Prisma ORM
- Audit logging for sensitive actions

However, the SSRF vulnerability in the data-ingestion layer is **internet-facing risk** if the system is exposed to untrusted source URLs.

---

## Critical Findings

### **CRITICAL-1: Server-Side Request Forgery (SSRF) in HTTP Fetcher**

**Impact**: An attacker can force the ingestion worker to make requests to:
- Internal services (Redis at `localhost:6379`, PostgreSQL at `localhost:5432`)
- Private cloud metadata endpoints (`169.254.169.254` for AWS EC2 credentials)
- Internal administrative URLs
- Other services on the local network
- Services behind firewalls that trust the OpenEdu server

**Evidence**:
- **File**: `workers/data-ingestion/src/openedu_ingest/http.py` (lines 17-23)
- **Code**: `_urllib_transport()` accepts ANY URL without validation
- **Risk Chain**: 
  1. Sources (Somnia, ROR, OpenAlex) are currently hardcoded to safe URLs
  2. Future stages may accept user-supplied URLs for institution discovery
  3. ROR bulk download uses `https://zenodo.org/` (safe)
  4. But nothing prevents a malicious adapter or future feature from injecting URLs

**Proof of Concept**: If a future feature allows custom source URLs, attackers could craft:
```python
adapter.fetch("http://169.254.169.254/latest/meta-data/iam/security-credentials/", fetcher)
# Would exfiltrate AWS credentials if running on EC2
```

**Recommendation**: Validate all URLs before fetching:
- Reject `localhost`, `127.0.0.0/8` (loopback)
- Reject `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (RFC1918 private)
- Reject `169.254.0.0/16` (link-local, metadata)
- Reject `255.255.255.255`, `0.0.0.0` (invalid)
- Reject `file://` protocol
- Enforce HTTPS for external fetches (optional but recommended)
- Add timeout and max-response-size limits

---

## Medium Findings

### **MEDIUM-1: Overly Permissive Admin Authorization**

**Impact**: Editors have the same power as admins for sensitive operations

**Evidence**:
- **File**: `apps/web/lib/session.ts` (line 86)
- **Code**: `if (user.role !== "ADMIN" && user.role !== "EDITOR") redirect(...)`
- **Issue**: The condition is backwards. Both ADMIN and EDITOR pass the check. No STUDENT role check.

**Question for User**: Should `EDITOR` role have the same access to admin functions (verify institutions, edit records) as `ADMIN`? Or should they be separated?

**Recommendation**:
- Clarify the intended permission model
- If editors should be limited, split `requireAdmin()` into `requireAdmin()` (ADMIN only) and `requireEditor()` (ADMIN or EDITOR)
- Audit all admin endpoints to confirm they're appropriately gated

---

### **MEDIUM-2: CSRF Protection - AUTOMATIC ✓**

**Status**: Protected via Next.js server actions

**Evidence**:
- **File**: `apps/web/app/actions/admin.ts` and `app/actions/auth.ts`
- **Protection mechanism**: Next.js server actions automatically prevent CSRF by:
  1. Validating origin/referer headers
  2. Requiring explicit `<form>` submission (not arbitrary fetch calls)
  3. Binding actions to specific routes
  4. Including action metadata verification

**Status**: No action needed. Next.js provides automatic CSRF protection for server actions, and security headers (X-Frame-Options: DENY, Cross-Origin-Opener-Policy) provide additional defense.

---

## Low / Info Findings

### **LOW-1: Security Headers - IMPLEMENTED ✓**

**Status**: Already implemented correctly

**Evidence**:
- **File**: `apps/web/next.config.ts` (lines 5-14)
- **Headers present**: 
  - `X-Content-Type-Options: nosniff` ✓
  - `X-Frame-Options: DENY` ✓
  - `Referrer-Policy: strict-origin-when-cross-origin` ✓
  - `Cross-Origin-Opener-Policy: same-origin` ✓
  - `Permissions-Policy` (camera, microphone, geolocation disabled) ✓
  - `Strict-Transport-Security` (HSTS, production only) ✓

**Status**: No action needed. Headers are well-configured.

---

### **LOW-2: Session Cookie Configuration in Development**

**Impact**: Sessions are vulnerable to interception in development if HTTPS proxy is used

**Evidence**:
- **File**: `apps/web/lib/session.ts` (line 39)
- **Code**: `secure: process.env.NODE_ENV === "production"`
- **Status**: This is acceptable (secure cookies break in local dev), but ensure prod is truly HTTPS

**Recommendation**: 
- Verify `NODE_ENV` is correctly set to "production" in your production deployment
- Consider using a separate env var like `SECURE_COOKIES=true` for explicit control

---

### **LOW-3: Rate Limit Bypass via RATE_LIMIT_DISABLED**

**Impact**: In production, rate limits could be accidentally disabled

**Evidence**:
- **File**: `.env.example` (line 38)
- **Config**: `RATE_LIMIT_DISABLED="false"` (development-only bypass)

**Recommendation**:
- Never set `RATE_LIMIT_DISABLED=true` in production
- Add a startup check that fails if rate limits are disabled in production
- Consider removing this flag entirely and using a proper feature flag system

---

### **INFO-1: Secrets Exposure in Error Messages**

**Status**: Not observed, but risk exists  
**Recommendation**:
- Audit error messages to ensure they don't leak secrets, stack traces, or internal paths
- Verify that `console.error()` logs are not exposed in production
- Consider using structured logging with redaction rules

---

### **INFO-2: Audit Log Retention**

**Status**: Audit logging is implemented (good), but retention policy not visible  
**Recommendation**:
- Define audit log retention policy (how long to keep logs?)
- Ensure audit logs are immutable and tamper-evident
- Verify deletion of user accounts also handles their audit log appropriately

---

## Recommendations by Priority

| Priority | Finding | Status | Fix Time |
|----------|---------|--------|----------|
| CRITICAL | SSRF in HTTP fetcher | ✅ **FIXED** | 1-2 hours |
| MEDIUM | Admin authorization model | ✅ **CLARIFIED** (comment added) | 30 min |
| MEDIUM | CSRF protection | ✅ **VERIFIED** (automatic via Next.js) | — |
| LOW | Security headers | ✅ **VERIFIED** (already implemented) | — |
| LOW | Session cookie prod check | ⏳ **PENDING** | 15 min |
| LOW | Rate limit bypass flag | ⏳ **PENDING** | 30 min |
| INFO | Error message redaction | ✅ **ACCEPTABLE** (generic messages) | — |
| INFO | Audit log retention | ⏳ **PENDING** (document policy) | 30 min |

---

## Testing Checklist

After fixes are applied:
- [ ] All 72 Python tests pass (test SSRF validation)
- [ ] All 13 TypeScript tasks pass (typecheck/test/build)
- [ ] SSRF validation rejects localhost and private IPs
- [ ] Admin authorization is consistent across all endpoints
- [ ] Security headers are present in production
- [ ] Rate limits cannot be bypassed in production

---

## Files to Review/Fix

1. **CRITICAL**: `workers/data-ingestion/src/openedu_ingest/http.py` — Add URL validation
2. **MEDIUM**: `apps/web/lib/session.ts` — Clarify admin/editor roles
3. **MEDIUM**: Add CSRF token verification if needed
4. **LOW**: `apps/web/next.config.js` or middleware — Add security headers
5. **LOW**: Verify `NODE_ENV` setup in production
6. **INFO**: Review error handling for secret leakage
