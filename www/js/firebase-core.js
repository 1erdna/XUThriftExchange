/* Firebase compat SDK adapter for XU ThriftExchange browser preview.
 * Cordova Android Google OAuth requires a separately supported native credential flow.
 * No credentials, real users, or backend are simulated in this module.
 */
(function (root) {
  "use strict";
  const allowed = /@(my|g)\.xu\.edu\.ph$/i;
  const config = root.XU_FIREBASE_CONFIG;
  const sdk = root.firebase;
  const configured = !!(sdk && config && ["apiKey","authDomain","projectId","storageBucket","appId"].every(k => String(config[k] || "").trim() && !/replace|your[-_ ]/i.test(config[k])));
  let initError = null, app = null, auth = null, firestore = null, storage = null, currentUser = null;
  const subscribers = new Set();
  function broadcast(error) {for (const fn of subscribers) {try {fn({user: currentUser, error: error || initError});} catch (err) {console.warn(err);}}}
  function isXUEmail(email) {return allowed.test(String(email || "").trim());}
  async function eligible(user) {
    if (!user || !isXUEmail(user.email) || !user.emailVerified) return false;
    const token = await user.getIdTokenResult();
    return token?.claims?.firebase?.sign_in_provider === "google.com" &&
      token?.claims?.email_verified === true && isXUEmail(token?.claims?.email);
  }
  if (configured) {
    try {
      app = sdk.apps.length ? sdk.app() : sdk.initializeApp(config);
      auth = app.auth();
      firestore = app.firestore();
      storage = app.storage();
      auth.onAuthStateChanged(async user => {
        try {
          if (user && !(await eligible(user))) {
            currentUser = null;
            await auth.signOut();
            broadcast(new Error("Only verified Xavier University Google accounts are accepted."));
            return;
          }
          currentUser = user || null;
          broadcast(null);
        } catch (error) {
          currentUser = null;
          broadcast(error);
        }
      }, error => {currentUser = null; broadcast(error);});
    } catch (error) {initError = error; console.error("Firebase initialization failed", error);}
  }
  const ready = configured && !initError && !!auth && !!firestore;
  function subscribe(fn) {
    subscribers.add(fn);
    fn({user: currentUser, error: initError});
    return () => subscribers.delete(fn);
  }
  async function signInGoogle() {
    if (!ready) throw new Error("Firebase is not configured yet. See MILESTONE3_SETUP.md.");
    if (root.cordova) throw new Error("Google OAuth inside Android Cordova requires the native Google sign-in integration; use the browser preview for now.");
    const provider = new sdk.auth.GoogleAuthProvider();
    provider.setCustomParameters({prompt:"select_account"});
    const result = await auth.signInWithPopup(provider);
    if (!(await eligible(result.user))) {
      await auth.signOut();
      throw new Error("Please use your verified @my.xu.edu.ph or @g.xu.edu.ph Google account.");
    }
    currentUser = result.user;
    broadcast(null);
    return currentUser;
  }
  async function signOut() {
    if (!ready) return;
    await auth.signOut();
    currentUser = null;
    broadcast(null);
  }
  root.XUThriftBackend = {ready, configured, isXUEmail, eligible, subscribe, signInGoogle, signOut,
    get auth(){return auth;},get firestore(){return firestore;},get storage(){return storage;},
    get currentUser(){return currentUser;},get error(){return initError;}};
})(typeof window !== "undefined" ? window : globalThis);
