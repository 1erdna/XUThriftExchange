# XU ThriftExchange — Milestone 3 Setup and Acceptance Tests

This repository now contains the Firebase Web app configuration for project **`xuthriftexchange`**, together with a Firebase/SSO implementation foundation. The Firebase services and rules have **not** been verified or deployed through this repository. **Never claim the live project is working until the following tests pass.**

## Firebase Console setup (Andrei)

1. **Completed:** A Firebase project identified as `xuthriftexchange` was provided by the project owner.
2. **Completed in code:** The public Firebase Web app configuration was added to `www/js/firebase-config.js`. It contains no service-account secret. Never commit private keys.
3. **Still required:** Enable **Authentication → Sign-in method → Google**. Set a support email.
4. **Still required:** Under **Authentication → Settings → Authorized domains**, add the exact domain used to serve your browser preview. For localhost, test from `http://localhost:8080` (ensure the applicable domain is authorized). A GitHub HTML preview proxy may not be supported by OAuth.
5. **Still required:** Enable **Cloud Firestore** and **Cloud Storage**. Publish the provided `firestore.rules` and `storage.rules` using Firebase CLI or the Console. Verify rule behavior with the Emulator Suite before allowing real users.
6. **Still required for rules deployment:** Install Firebase CLI and run `firebase login`, then `firebase use --add`, then `firebase deploy --only firestore:rules,storage`. Select the correct project before deploying.
7. For browser testing, serve the app from its `www` directory: `python -m http.server 8080 -d www`. The CDN-based compat SDK needs internet access.
8. Sign in using a **verified Google account whose actual Firebase token email ends with** `@my.xu.edu.ph` or `@g.xu.edu.ph`. Confirm those account domains are approved by XU's IT office and use actual Google authentication.
9. **Cordova/Android limitation:** the browser popup OAuth flow is not a supported Android WebView implementation. Integrate a supported native Google identity SDK, obtain the Google ID token, and call Firebase `signInWithCredential` before claiming an Android SSO build. Firebase's older Cordova OAuth flows were affected by the 2025 Dynamic Links shutdown.

## Required test cases

- [ ] Real XU account signs in and stays authenticated after browser refresh
- [ ] Non-XU Google email is rejected; signed-out user cannot read or write Firestore
- [ ] User A publishes a listing with valid price, description and contact
- [ ] User B on a different browser/device can retrieve and search User A's listing
- [ ] Search and category filters work with the real Firestore records
- [ ] User B reserves once; a second buyer cannot reserve the same listing
- [ ] Listing owner cannot reserve their own listing
- [ ] Buyer/seller can cancel correctly and listing becomes available again
- [ ] A user cannot change the status of someone else's listing
- [ ] A seller can mark an unreserved available item as Sold
- [ ] Invalid and oversized photo uploads are rejected by the client and Storage rules
- [ ] Web console is clear of errors, all test cases pass on the actual configured Firebase project
- [ ] Integrate features through reviewed pull requests, then test on `staging`
- [ ] Android APK built and tested on a device if the professor requires an installable app

## Milestone 3 deliverables

The professor requires the working app, demonstrations of core features, the updated repository, and a progress report identifying completed/in-progress/remaining work, issues and solutions. The baseline Milestone 2 preview remains available on `main`; `integration` contains code under development. Do not submit a claim of real Google SSO or Firestore-backed functionality without live test evidence.

## Security notes

- Both Firestore and Storage rules restrict access to verified Google sign-in with XU address domains. Test rule compilation and authorization with emulators before production deployment.
- Never trust a user-input email field or an email suffix alone as proof of identity.
- Do not merge untested code to `main`.
