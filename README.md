# XU ThriftExchange — Milestone 2 Working UI

ITCC 41-A · Mobile Applications Development  
Team: Denz Macasero, Andrei Nacaya, Dann Roa

**Status: navigable mobile UI prototype; backend integration is not yet implemented.**

## Try the working UI demo (browser)

**[▶ Open XU ThriftExchange — Live UI Preview](https://htmlpreview.github.io/?https://github.com/1erdna/XUThriftExchange/blob/main/www/index.html)**

Open the link on a phone or laptop. This third-party GitHub HTML preview displays the latest `www/index.html` from `main`; use a mobile-size browser window for the intended layout. The interface is navigable and uses **local demonstration data only**. Google/XU sign-in, email verification, reservations, and listings are simulations — no real student account or backend is connected. Do not enter real credentials.

## Implemented interface
- Sign In, XU Email, verification preview, Home, Search/Browse, Item Details, Post Item, Reservation Confirmation, Saved Items, Profile, and My Posted Items.
- Responsive layout, navigation, category filters, searchable sample listings, save/unsave, form validation, photo preview, demo reservation and mark-as-sold flows.
- Navy/gold/white visual style based on Milestone 1 screens.
- Local demo data and browser-local saved state; returning demo sessions can be restored.

## Preview on your laptop
Requires Python 3 (or another local static-file server).

```bash
python -m http.server 8080 -d www
```

Visit **http://localhost:8080**. On Windows, you can also run `START_PREVIEW_WINDOWS.bat`. For a mobile preview, use your browser's device emulator.

## Android/Cordova preparation
`www/` is the Cordova web root. With Node.js, a suitable JDK, Android Studio/SDK and Android build tools installed:

```bash
npm install
npx cordova platform add android
npx cordova build android
```

A successful Cordova build normally creates a debug APK in `platforms/android/app/build/outputs/apk/debug/`. **This repository does not include an APK and Android packaging has not been verified.**

## Important limitations
- **Google Sign-In is a visual demo only**, not real Google OAuth.
- **XU institutional account verification is simulated**. Email verification does not send real messages or prove ownership.
- Listings, bookmarks, reservations, and session status are stored in browser localStorage for demonstrations only. They are not synchronized across devices or users.
- No working backend, live database, online payments, courier integration, or in-app messaging. Seller Facebook/phone contact is the intended communication method.
- Do not enter passwords or other real credentials in the demo.
- Actual Google SSO requires a supported Android sign-in integration and university identity-policy confirmation.

## Project structure

```
config.xml               Cordova app metadata
package.json             Development dependencies / scripts
START_PREVIEW_WINDOWS.bat
www/
  index.html             Mobile UI document shell
  css/styles.css         Responsive UI stylesheet
  js/app.js              Screen routing and local demo interactions
  assets/                Bundled sample item photos and XU icon
  manifest.webmanifest
  sw.js                  Basic static asset cache on localhost
```

## Milestone 2 demonstration
Sign in as demo user → Home → Search → Item Details → Save and Reserve → Saved → Sell/Post Item → Profile → My Posted Items → Mark Sold → Sign Out.

Next stage: connect real authentication and authorization, Firebase/Firestore/Storage, proper server-side reservation validation, and test on Android devices.
