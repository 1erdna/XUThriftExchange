# XU ThriftExchange — Milestone 3 Core Functionality

ITCC 41-A · Mobile Applications Development  
**Team:** Andrei Nacaya · Dann Roa · Denz Macasero

## Project status

**Milestone 3 source code has been integrated and passes automated mocked-database tests.** The project is **NOT YET a verified live multi-user application**: the Firebase Web configuration is now entered, but it still needs deployed security rules, enabled services, university-approved Google authentication, and tests using real student accounts. Android/Cordova Google sign-in and installable APK build also remain unverified.

- Stable Milestone 2 preview: [`main`](https://github.com/1erdna/XUThriftExchange/tree/main)
- Integrated Milestone 3 code: [`integration`](https://github.com/1erdna/XUThriftExchange/tree/integration)
- Milestone 3 acceptance testing: [`staging`](https://github.com/1erdna/XUThriftExchange/tree/staging)
- **[Milestone 3 setup and testing checklist](MILESTONE3_SETUP.md)**

## Working features in code

- Google SSO controller for browser Firebase Authentication, Xavier account checks, sign-out and session restoration (**requires Google sign-in enabled in Firebase Console**).
- Firestore-compatible Item Listings: input validation, posting, retrieval and **small compressed JPEG thumbnails stored directly in listing documents** on the no-cost Spark plan. Cloud Storage is not required for these thumbnails.
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

## Item photos on the Spark plan

XU ThriftExchange now compresses an attached JPG/PNG/WebP into a **small inline JPEG thumbnail** (up to 150,000 characters, approximately 110 KiB) and saves it in the Firestore listing's `image` field. This avoids the Firebase Storage Blaze-plan requirement for a **school demonstration**.

This is **not a production image hosting strategy**: Firestore documents have size limits and storing images increases database reads, bandwidth, and indexing overhead. Use Cloud Storage or a suitable media hosting service for a production marketplace. The security rules in `firestore.rules` now cap the image string size; **republish that rule update in Firebase Console** before considering the live deployment secured.

## Android phone testing

The app's extra **9:41** clock, fake signal icons and simulated notch are **desktop preview elements only**. They are now removed automatically on mobile and touch devices.

To test the **working Firebase browser features** on an Android phone, deploy the `www` directory to Firebase Hosting and open the hosted `.firebaseapp.com` URL in Android Chrome. See **[Dann's Android Testing Guide](ANDROID_DANN_TESTING.md)** for exact Windows commands and screenshot checklist.

Mobile browser Google login on the matching Firebase Hosting domain uses redirect auth to avoid multiple popup conflicts. This does **not** implement native Google SSO inside a Cordova Android APK. Native Android OAuth requires a separate supported identity plugin, Firebase credential exchange, and SHA-1/OAuth setup.

### Responsive screen sizes

The mobile web UI now expands to the **entire available phone viewport**, instead of displaying the desktop mock phone frame. It handles small phones, larger devices, landscape orientation, touch/tablet browsers, bottom safe-area navigation, long listing details, and on-screen keyboards. The desktop browser still shows the phone-shaped preview by design.

**To see these changes on the Firebase-hosted app**, deploy the latest `staging` branch from the project root using:

```powershell
npx --yes firebase-tools deploy --only hosting --project xuthriftexchange
```

Then in Android Chrome open `https://xuthriftexchange.firebaseapp.com`. Refresh or clear old site cache if it still shows the previous layout. This fixes layout only; a Cordova APK still requires native Google Sign-In.

## Run the browser preview

```bash
python -m http.server 8080 -d www
```

Open **http://localhost:8080**. The Firebase Web configuration for project `xuthriftexchange` has been entered. The browser will now attempt real Firebase Authentication. **A config alone does not establish working sign-in, create Firestore/Storage databases, or deploy rules.** Complete the service setup in [MILESTONE3_SETUP.md](MILESTONE3_SETUP.md). To use local demo mode, use the earlier Milestone 2 `main` branch instead. Do **not** enter real account passwords into demo forms.

Run the local feature checks:

```bash
npm test
```

GitHub Actions also checks JavaScript syntax and tests feature logic on relevant pushes and pull requests. These are **unit/smoke tests with a mocked database**; an actual Firebase Emulator Suite run and real-device acceptance tests are still required.

## Branch workflow

`feature/<member>-<feature>` → Pull request → `integration` → reviewed PR → `staging` → tested release PR → `main`.

Keep `main` unchanged until the group approves the tested release. No code changes need to be claimed as final until the required Milestone 3 acceptance criteria pass.
