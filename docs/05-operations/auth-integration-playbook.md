# Auth Integration Playbook (Free-First)

Last updated: 2026-03-07

## Goal

Harden the current production-grade authentication baseline in this Next.js + Prisma app while keeping platform cost low.

## Current implementation in this repo

- Auth runtime: Auth.js with JWT sessions (no Prisma adapter yet).
- Route protection: `middleware.ts` guards workspace UI + `/api/*` (except `/api/auth/*`).
- Sign-in UI: `app/auth/signin/page.tsx` (industrial design system style).
- Sign-up UI: `app/auth/signup/page.tsx` (customer entry into onboarding).
- Guided onboarding route: `app/(workspace)/workspace/get-started/page.tsx`.
- Provider route: `app/api/auth/[...nextauth]/route.ts`.
- Config entrypoint: `auth.ts`.
- Actor mapping: middleware injects `x-actor-email` and `x-actor-name` from session for existing workspace services.
- Production-sensitive note: new customer-entry flows are layered on top of the current middleware/session bridge and do not replace it.

## Current rollout values

- Production URL: `https://www.salescortex.me/`
- Target providers: Google + LinkedIn
- Temporary rollout flag: `APP_ENABLE_DEV_LOGIN=1`
- Required callback URLs:
   - `https://www.salescortex.me/api/auth/callback/google`
   - `https://www.salescortex.me/api/auth/callback/linkedin`

## Production auth pitfalls

- OAuth callbacks must match the final public host exactly. If the Vercel default domain or apex domain redirects to `https://www.salescortex.me`, register the `www` callback URLs at Google and LinkedIn.
- In the Vercel environment variable UI, do not paste surrounding quotes from `.env`. Values such as `"client-id"` will be stored with literal quotes and can break provider auth in production.
- Set `AUTH_SECRET` or `NEXTAUTH_SECRET` in production. The runtime accepts either name.

## Free-first options

### 1) Auth.js (NextAuth v5) + Prisma (recommended for this repo)

- Cost: framework is free and open source.
- Best when: you want no vendor lock-in and already run your own Postgres/Prisma.
- LinkedIn: supported provider.
- Tradeoff: you own email/OAuth config, session storage, and operational hardening.

### 2) Supabase Auth

- Cost signal: Free plan includes 2 free projects and 50,000 MAU quota.
- Best when: you want managed auth + Postgres + RLS in one stack.
- LinkedIn: supported in social providers list.
- Tradeoff: deeper coupling to Supabase auth model.

### 3) Clerk

- Cost signal: Hobby plan is free with 50,000 MRU per app.
- Best when: fastest integration and polished hosted auth UI.
- LinkedIn: first-class LinkedIn OIDC guide available.
- Tradeoff: managed vendor dependency for core identity layer.

### 4) Firebase Auth

- Cost signal: Spark has 3,000 DAU cap; upgraded pricing includes 50,000 MAU no-cost tier before overage.
- Best when: you are already standardized on Firebase/GCP.
- Tradeoff: more friction with this Prisma/Postgres app architecture.

### 5) Keycloak (self-hosted)

- Cost: open source IAM server.
- Best when: enterprise SSO-heavy requirements and full control.
- Tradeoff: highest ops burden for a small team.

## What to choose here

For this project, choose one of these:

1. Auth.js + Prisma for long-term control and lowest lock-in.
2. Clerk if speed of launch matters most and you want less auth plumbing.
3. Supabase Auth if you plan to fully adopt Supabase platform features.

## Recommended implementation plan (Auth.js + Prisma)

1. Add Prisma adapter support and auth models to `prisma/schema.prisma` (`User`, `Account`, `Session`, `VerificationToken`).
2. Run `npm run db:generate` and `npm run db:push`.
3. Keep current providers in `auth.ts` and decide whether to add email magic links (Resend/Nodemailer).
4. Reduce the current header bridge:
   - derive actor email/name from session user where possible
   - keep `APP_AUTO_PROVISION_MEMBERS=1` during migration
5. Update settings:
   - show authenticated identity
   - wire password/session/security controls to real auth source
6. Add role sync:
   - map signed-in user email to `workspaceMember`
   - owner/manager/rep gates from DB role
7. Add basic auth tests:
   - unauthenticated route redirect
   - authenticated workspace access
   - settings read/write under real session
8. Add login audit events and provider error telemetry.

## Launch checklist

- Custom domain set for callbacks.
- OAuth redirect URLs configured for production.
- Secure cookie/session settings enabled.
- Brute-force and bot protections enabled.
- Audit logs for login and role changes enabled.
- Recovery flow (magic link/password reset) tested end-to-end.

## Source links

- Auth.js: https://authjs.dev/
- Auth.js getting started/providers/adapters: https://authjs.dev/getting-started
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase billing quotas: https://supabase.com/docs/guides/platform/billing-on-supabase
- Clerk pricing: https://clerk.com/pricing
- Clerk LinkedIn OIDC: https://clerk.com/docs/guides/configure/auth-strategies/social-connections/linkedin-oidc
- Firebase Auth limits/pricing notes: https://firebase.google.com/docs/auth
- Keycloak (open source IAM): https://www.keycloak.org/
