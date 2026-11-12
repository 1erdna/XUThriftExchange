# XU ThriftExchange — Android Phone Testing (Dann Roa)

**Last updated:** 13 November 2026  
**Project:** `xuthriftexchange`  
**Branch for testing:** `staging`

## What the screen recording showed

The application displayed a fake iPhone notch, a fake clock (9:41), and simulated signal bars **inside** the actual Android phone. Those belonged to a desktop mockup and have been hidden on real mobile and touch screens. This does not mean the hardware clock was malfunctioning.

The `auth/cancelled-popup-request` message is a **separate login issue** caused when multiple Firebase Google popup operations conflict. The code now prevents repeated clicks; the web version also uses redirect-based Google sign-in when served from the project's own `.firebaseapp.com` domain.

**Important:** A Cordova APK is *not* equivalent to the mobile web app. The current APK does **not** have native Google Sign-In credentials or a native OAuth plugin. It can show screens, but it cannot demonstrate Firebase Google login until the native integration is implemented.

## Recommended: working browser test on Android Chrome

Use **Firebase Hosting** rather than a local IP address or an installed Cordova APK. Hosting can serve the static website on the Spark plan (subject to free quotas).

### Andrei — one-time hosting deployment on a Windows laptop

1. Download and extract the latest **staging branch** from:
   https://github.com/1erdna/XUThriftExchange/tree/staging
2. Open the **project root** in VS Code (the folder containing `firebase.json` and `www`). Do **not** run the following commands from inside `www`.
3. In the integrated terminal run:

   ```powershell
   npx --yes firebase-tools login
   ```

   Sign in with the Google account that administers Firebase project `xuthriftexchange`.

4. Deploy **only the website**:

   ```powershell
   npx --yes firebase-tools deploy --only hosting --project xuthriftexchange
   ```

   **Do not use `firebase deploy` without `--only hosting`**: Firestore rules and Storage deployment are separately managed.
5. Firebase CLI displays the final hosting URL. Use the `https://xuthriftexchange.firebaseapp.com` domain (rather than the `.web.app` one) for this first mobile OAuth test, because the Firebase Web config uses `xuthriftexchange.firebaseapp.com` as its authDomain. If the URL is not provisioned, follow the Firebase Console Hosting first-time setup prompts.

### Dann — test on the Android phone

1. Open **Google Chrome** (not a Cordova APK or an in-app browser).
2. Type the Firebase-hosted URL returned by the deployment above, specifically its `.firebaseapp.com` address.
3. Confirm the app fills the screen without a second, fake clock, notch, or signal bars.
4. Tap **Continue with Google once**. The mobile web version should redirect to Google and return to the app.
5. Choose a verified `@my.xu.edu.ph` or `@g.xu.edu.ph` Google account.
6. Test these operations: log in, post with a compressed photo, search/filter, reserve another user's available item, and mark an unreserved item Sold from the seller's account.
7. Save screenshots of successful login/profile, listings with image, search results, reservation, item status, and corresponding Firestore records.

**If the website still looks old:** close the old installed shortcut/APK; in Chrome open the typed HTTPS URL directly. Clear Chrome data for this site or use a new regular tab and refresh. The HTML, JS, and CSS are configured to be fetched fresh by Hosting.

## Optional: test an Android APK's interface only

Use `npx cordova platform add android` (if Android platform missing) and `npx cordova build android` from the project root, after installing a compatible Android SDK, Java and Gradle. Locate the build under `platforms/android/app/build/outputs/apk/debug/`. This APK **still needs native Google identity integration** before its login can work; do not claim that Firebase login was tested in the APK merely because the welcome screen opens.

The mock phone frame should be gone in the newly built APK once the updated `www/css/styles.css` is packaged. Old APKs must be rebuilt/reinstalled to receive these changes.

## Screen-size regression checks

The current `staging` mobile UI is fluid (no embedded fake phone frame, notch, or 9:41 clock). On Android Chrome, check both portrait and landscape, especially:

- A compact phone around 320-360 CSS pixels wide, or Chrome's device emulation.
- A typical 390-430 CSS pixel wide phone.
- A larger 480+ CSS pixel phone or tablet.
- Short/landscape screens: login actions, item form and navigation remain reachable through internal scrolling.
- The bottom navigation is fully visible and the device's status bar is not duplicated.

The responsive CSS has automated source-regression tests. **Real-device visual verification is still required.** Do not use a stale installed APK; it does not auto-update from GitHub.

## Troubleshooting

- **Two clocks / black notch:** old app build; get new staging code and rebuild or refresh the hosted page. A real Android status bar may remain at the top—this is normal.
- **`auth/cancelled-popup-request`:** close extra windows and tap login once; on the `.firebaseapp.com` mobile website the new code uses redirect login instead of popups.
- **`auth/unauthorized-domain`:** ensure you are opening the URL on Firebase's authorized domains list. Do not use a LAN IP or GitHub HTML preview for OAuth.
- **APK says native login not implemented:** expected until we integrate a supported Android Google Sign-In plugin and register the SHA-1/OAuth credentials with Firebase.
- **Firestore permission denied:** verify the account is a verified eligible XU Google account and Firestore security rules have been published.
- **Photo fails:** latest staging code compresses the image to a small Firestore thumbnail; Firebase Storage is not required.

## Report to Andrei

Send (a) a screenshot showing the new full-screen layout, (b) the Google login result, (c) one successful core-feature test, and (d) the exact browser URL or Android APK version. Only mark native Android login complete after successful native credential testing.
