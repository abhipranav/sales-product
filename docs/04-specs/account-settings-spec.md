# Account + Settings Spec (SaaS Baseline)

This spec defines the minimum account/settings surface expected from a production B2B SaaS workflow product.

## Why this exists

Users expect to manage identity, notifications, security posture, and workspace preferences from inside the app. Without this, the product feels demo-only.

## Research-backed capability matrix

### 1) Profile + identity

Required:
- Display name editing
- Primary email visibility
- Role visibility
- Workspace context visibility

Reference patterns:
- Notion account/workspace settings: [Settings & members](https://www.notion.com/help/settings-and-members)
- GitHub personal account settings: [Managing your personal account settings](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-user-account/managing-your-personal-account-settings)

### 2) Notification controls

Required:
- Channel preferences (email/desktop)
- Mention alerts
- Workflow-specific alerts (pipeline risk, approvals)
- Digest mode + digest schedule
- Product announcement opt-in/out

Reference patterns:
- Slack notification granularity: [Configure your Slack notifications](https://slack.com/help/articles/201355156-Configure-your-Slack-notifications)
- HubSpot user notification preferences: [Manage your user profile, preferences, and notifications](https://knowledge.hubspot.com/records/manage-your-user-profile-preferences-and-notifications)

### 3) Workspace permissions + roles

Required:
- Role-aware capability visibility
- Owner/manager/rep boundaries
- Member-management capability gates

Reference patterns:
- Atlassian admin/role operations: [Manage users, groups, permissions, and roles in your organization](https://support.atlassian.com/user-management/docs/manage-users-groups-permissions-and-roles-in-your-organization/)
- HubSpot user/permission operations: [Create and manage users](https://knowledge.hubspot.com/user-management/create-and-manage-users)

### 4) Security controls

Required:
- Login anomaly alert preferences
- MFA status visibility
- Security hardening roadmap in-product

Reference patterns:
- OWASP authentication controls: [Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- NIST digital identity guidance: [SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html)
- Mainstream MFA setup expectation: [Microsoft account two-step verification](https://support.microsoft.com/en-us/account-billing/how-to-use-two-step-verification-with-your-microsoft-account-c7910146-672f-01e9-50a0-93b4585e7eb4)

### 5) Billing + seat management visibility

Required:
- Role-based billing control visibility
- Seat/billing ownership clarity

Reference patterns:
- Stripe customer/billing self-service primitives: [Customer management](https://docs.stripe.com/customer-management)

## Implemented in this codebase

- New `/settings` route with:
  - profile editor (display name)
  - preference controls (theme, locale, timezone, week start, compact/reduced motion)
  - notification controls (email/desktop/mentions/pipeline/approvals/digest/announcements)
  - security section (login alerts + MFA status placeholder)
  - role-based capability panel
- New user settings API:
  - `GET /api/settings/user`
  - `PATCH /api/settings/user`
- Persistence model:
  - `UserPreference` linked to `WorkspaceMember`

## Not yet implemented (explicit gap)

- True authentication/session provider (currently actor-scoped)
- Real MFA enrollment and verification flows
- Password/session management UI with revocation
- Billing provider integration and seat checkout flows
