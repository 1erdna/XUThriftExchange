# XU ThriftExchange

A campus marketplace for second-hand books, uniforms, laboratory gowns and equipment at Xavier University – Ateneo de Cagayan. Buyers and sellers use verified Google accounts ending in `@my.xu.edu.ph`. Contact, payment and pickup happen outside the app.

## Run the web app

Use [Firebase Hosting](https://xuthriftexchange.firebaseapp.com) in Chrome. For the source version, check out `staging`, run `npm run preview` with Python 3 on PATH and open http://localhost:8080. Google sign-in needs network access and an authorized origin in Firebase Authentication. Localhost may need to be added by a project administrator. The site uses the Firebase compat SDK from gstatic. If the backend cannot initialize, the sign-in screen offers a retry.

## Firebase and release

The public Web configuration lives in `www/js/firebase-config.js`. Project ID is `xuthriftexchange`. Enable Google in Authentication, check authorized domains and provision Cloud Firestore. Deploy the app and its matching Firestore rules together from the tested revision. The final source requires a photo on new listings and supports completing an active reservation. Earlier hosted revisions may behave differently.

With the Firebase CLI installed and an authorized project account:
```sh
firebase login
firebase deploy --only firestore:rules,hosting --project xuthriftexchange
```

The app stores a compressed JPEG of up to 150,000 characters in the listing document. No Storage deployment, bucket upload or billing upgrade is needed. Existing listings can still be viewed. The feed fetches up to 100 public records and sorts the fetched records locally. Search combines a keyword (including course text) with a category. Availability refreshes on reads and after writes. Reload to see another student's changes. Bookmarks stay in this browser under the signed-in user's ID.

## Tests

`npm test` runs Node feature and auth/layout regressions with test doubles. The browser suite runs real UI code with local Auth and Firestore emulators, rule enforcement and synthetic Google identities. It exercises independent browser sessions, required photos, filtering, ownership, competing buyers, cancellation, seller completion, logout and viewport widths. It requires a fresh emulator database.

1. Install Python Playwright (`python -m pip install playwright`, then `python -m playwright install chromium`). Install the Firebase CLI and Java for your emulator version.
2. In one terminal serve `www` with `python -m http.server 8510 --bind 127.0.0.1 -d www`.
3. In another terminal, from the repository root, run:
```sh
firebase emulators:exec --config firebase.test.json --project demo-xu --only auth,firestore "python tests/browser_emulators.py"
```

The script saves unedited screenshots under `evidence/`. Optional environment variables: `CHROMIUM_PATH` for a Chromium executable, `XU_EVIDENCE_DIR` for the destination and `XU_SDK_DIR` for a local copy of the four SDK scripts named in index.html. Test configuration is supplied by Playwright and never enters the production site.

## Android

Install Node 22+, JDK 17, Android SDK Platform 35, Build Tools 35.0.0, platform-tools and Gradle 8.13. Set JAVA_HOME and ANDROID_HOME and put tools on PATH. From a fresh checkout:

```sh
npm ci
npx cordova prepare android
npx cordova requirements android
npm run cordova:build-android
adb install -r platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

The local Cordova plugin in `native/google-identity` calls Android Credential Manager. The explicit Google button requests an ID token for the project's public Web OAuth client ID in `config.xml`. The JS SDK exchanges it for a Firebase credential and uses the same account checks and Firestore session as the browser. No client secret belongs in the app.

In Firebase Project settings, register package `ph.edu.xu.thriftexchange.ui` with the SHA-1 for the certificate signing the installed APK. Obtain it using `apksigner verify --print-certs PATH_TO_APK`. Register each signing key separately. The project uses the Web SDK for Firebase, so the bridge reads its public Web client ID from Cordova preferences. Test on a Google Play services device with an eligible XU account, then a personal account. Android build and signature verification alone do not establish that production OAuth works.

## Contributions and branches

| Member | Feature | Original evidence |
|---|---|---|
| Andrei Nacaya | Firebase, authentication and UI integration | 395cb54, 51ba469, ec5958a |
| Dann Roa | Item listings and seller status | de76179, ca3b356 |
| Denz Macasero | Search/filtering and reservations | a462cad, 59de4fc |

Feature branches merge into `integration`, then `staging`. Promote staging to `main` through a release pull request after live verification. The Milestone 3 documents and Android testing notes describe earlier revisions.
