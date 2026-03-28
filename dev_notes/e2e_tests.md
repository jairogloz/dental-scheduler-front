# E2E Smoke Tests Plan

## Goal

Run a set of smoke tests automatically after every production deployment. If any test fails, automatically rollback to the previous Vercel deployment.

## Test Scenarios

1. Login works
2. Calendar loads
3. Create appointment
4. Patient lookup
5. Logout works

---

## Stack

- **Test framework:** Playwright (TypeScript)
- **CI:** GitHub Actions
- **Deployment:** Vercel CLI (via GitHub Actions — not Vercel's auto-deploy)

---

## Pipeline Flow

```
Push to main
    │
    ▼
GitHub Actions starts
    │
    ▼
Step 1: Build the app
    │
    ▼
Step 2: vercel deploy --prod  ← deploys, captures deployment URL
    │
    ▼
Step 3: Playwright smoke tests run against that URL
    │
    ├── PASS ✅ → pipeline succeeds, deployment stays live
    │
    └── FAIL ❌ → vercel rollback  ← promotes previous deployment back to prod
                   pipeline fails, team gets notified
```

---

## Key Decision: GitHub Actions owns the prod deployment

Vercel's **automatic production deployment from GitHub must be disabled**
(Vercel dashboard → Settings → Git → Production Branch → disable).

- Vercel still creates **preview deployments** for PRs as normal.
- Only the `main` → prod promotion is handled by GitHub Actions.
- This ensures the rollback step has full control.

---

## Files to Create

| File                                | Purpose                                                       |
| ----------------------------------- | ------------------------------------------------------------- |
| `playwright.config.ts`              | Playwright config, reads `SMOKE_TEST_URL` from env            |
| `e2e/smoke.spec.ts`                 | The 5 smoke test scenarios                                    |
| `.github/workflows/smoke-tests.yml` | Full CI pipeline: build → deploy → test → rollback on failure |

---

## Required GitHub Secrets

| Secret                    | Description                                                   |
| ------------------------- | ------------------------------------------------------------- |
| `VERCEL_TOKEN`            | Personal access token from Vercel dashboard                   |
| `VERCEL_ORG_ID`           | Found in `.vercel/project.json` or Vercel project settings    |
| `VERCEL_PROJECT_ID`       | Same as above                                                 |
| `SMOKE_TEST_EMAIL`        | Login email for the test account                              |
| `SMOKE_TEST_PASSWORD`     | Login password for the test account                           |
| `SMOKE_TEST_PATIENT_NAME` | Name of a known patient in prod to use for lookup/appointment |
| `SMOKE_TEST_DOCTOR_ID`    | ID of a known doctor in prod to use for appointment creation  |

---

## Test Data Strategy

Use **fixed, pre-existing test data in prod** — a dedicated test user, a known patient, and a known doctor. Tests do not create or clean up data; they rely on this stable baseline.

---

## Notes

- `vercel deploy --prod` returns the deployment URL directly — no polling needed.
- `vercel rollback` is a first-class Vercel CLI command that instantly re-promotes the previous deployment.
- The full pipeline is auditable in the GitHub Actions tab.
- Consider adding Slack/email notifications on failure (GitHub Actions has built-in support).
