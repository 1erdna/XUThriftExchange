# XU ThriftExchange — Milestone 3 Core Functionality

ITCC 41-A · Mobile Applications Development  
**Team:** Andrei Nacaya · Dann Roa · Denz Macasero

## Project status

**Milestone 3 source code has been integrated and passes automated mocked-database tests.** The project is **NOT YET a verified live multi-user application**: it still needs an actual Firebase project configuration, deployed security rules, university-approved Google authentication, and tests using real student accounts. Android/Cordova Google sign-in and installable APK build also remain unverified.

- Stable Milestone 2 preview: [`main`](https://github.com/1erdna/XUThriftExchange/tree/main)
- Integrated Milestone 3 code: [`integration`](https://github.com/1erdna/XUThriftExchange/tree/integration)
- Milestone 3 acceptance testing: [`staging`](https://github.com/1erdna/XUThriftExchange/tree/staging)
- **[Milestone 3 setup and testing checklist](MILESTONE3_SETUP.md)**

## Working features in code

- Google SSO controller for browser Firebase Authentication, Xavier account checks, sign-out and session restoration (**requires Firebase Web configuration**).
- Firestore-compatible Item Listings: input validation, posting, photo upload and retrieval.
- Item Status: seller-only availability changes, with reservation safety.
- Search and Filtering: keyword and category filtering on fetched Firestore listings.
- Reservations: transactional reservation, duplicate protection and cancellation.
- Existing responsive app UI, saved-item behavior, profile, seller contacts and navigation.
- Explicit offline UI demonstration when Firebase is not configured, with **no pretend live account**.

## Contributor evidence

- **Dann:** [Item Listings PR #1](https://github.com/1erdna/XUThriftExchange/pull/1) · [Item Status PR #2](https://github.com/1erdna/XUThriftExchange/pull/2)
- **Denz:** [Search PR #3](https://github.com/1erdna/XUThriftExchange/pull/3) · [Reservations PR #4](https://github.com/1erdna/XUThriftExchange/pull/4)
- **Andrei:** [Firebase Setup PR #5](https://github.com/1erdna/XUThriftExchange/pull/5) · [Google SSO PR #6](https://github.com/1erdna/XUThriftExchange/pull/6) · [UI Integration PR #7](https://github.com/1erdna/XUThriftExchange/pull/7)

The PRs preserve feature commits from the respective contributors. They document uploaded/merged code, not proof that live Firebase authentication or Android testing has passed.

## Run the browser preview

```bash
python -m http.server 8080 -d www
```

Open **http://localhost:8080**. If `www/js/firebase-config.js` is blank, the app clearly operates in local demo mode (without real login or shared database). After you register a Firebase Web app, fill in the configuration and enable/deploy the services as described in [MILESTONE3_SETUP.md](MILESTONE3_SETUP.md). Do **not** enter real account passwords into demo forms.

Run the local feature checks:

```bash
npm test
```

GitHub Actions also checks JavaScript syntax and tests feature logic on relevant pushes and pull requests. These are **unit/smoke tests with a mocked database**; an actual Firebase Emulator Suite run and real-device acceptance tests are still required.

## Branch workflow

`feature/<member>-<feature>` → Pull request → `integration` → reviewed PR → `staging` → tested release PR → `main`.

Keep `main` unchanged until the group approves the tested release. No code changes need to be claimed as final until the required Milestone 3 acceptance criteria pass.
