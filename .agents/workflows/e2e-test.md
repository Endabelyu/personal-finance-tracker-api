---
description: Create and execute E2E tests simulating real user scenarios
---

1. Install Playwright testing utilities: `npm install -D @playwright/test`
2. Install Playwright browsers: `npx playwright install --with-deps chromium`
3. Create setting configuration `playwright.config.ts`.
4. Create test file `tests/e2e/auth.spec.ts` evaluating user Registration, Login, and secure page Navigation securely using the local dev server at `http://localhost:5173`.
5. Execute the test suite using `npx playwright test`.
