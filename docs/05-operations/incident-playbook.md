# Incident Playbook

## Severity model

- SEV-1: core cockpit unavailable or data corruption risk
- SEV-2: major workflow failures with fallback path available
- SEV-3: isolated feature degradation

## Response sequence

1. Acknowledge and classify severity.
2. Stop unsafe automations if integrity risk exists.
3. Roll forward with hotfix if bounded; otherwise rollback.
4. Publish incident note with timeline and corrective actions.
