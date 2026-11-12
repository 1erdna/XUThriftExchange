/* Milestone 3 — mobile layout and Firebase auth behavior regression tests.
 * The Firebase service is mocked; this is NOT a real Android OAuth test.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.join(__dirname, '..', 'www');
const coreSource = fs.readFileSync(path.join(base, 'js/firebase-core.js'), 'utf8');
const css = fs.readFileSync(path.join(base, 'css/styles.css'), 'utf8');
new vm.Script(coreSource, {filename:'firebase-core.js'});

const ssoSource = fs.readFileSync(path.join(base, 'js/google-sso.js'), 'utf8');
const appSource = fs.readFileSync(path.join(base, 'js/app.js'), 'utf8');
const firestoreRules = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
const storageRules = fs.readFileSync(path.join(__dirname, '..', 'storage.rules'), 'utf8');
// Regression: do not reintroduce the deprecated g.xu.edu.ph login domain
// or the offline-reset/pending-verification controls on the profile screen.
for(const [name,source] of [
  ['firebase-core.js',coreSource],['google-sso.js',ssoSource],
  ['app.js',appSource],['firestore.rules',firestoreRules],
  ['storage.rules',storageRules]
]) {
  assert.ok(!source.includes('@g.xu.edu.ph'),name+' must not contain a deprecated school domain');
  assert.ok(!source.includes('(my|g)')&&!source.includes('(?:my|g)'),name+' must use only the my subdomain');
  assert.doesNotMatch(source, /@g\\.xu\\.edu\\.ph|\\(my\\|g\\)|\\(\\?:my\\|g\\)/,name+' must only support my.xu.edu.ph');
}
assert.doesNotMatch(appSource, /Reset offline demo|confirm-reset|reset-demo|Google and XU verification are pending/);
assert.match(appSource, /Verified XU Google account/);
const expectedRule = String.raw`@my\\.xu\\.edu\\.ph$');`;
assert.ok(firestoreRules.includes(expectedRule),'Firestore rule must end in the anchored my.xu.edu.ph pattern');
assert.ok(storageRules.includes(expectedRule),'Storage rule must use the same anchored email domain');

// Prevent malformed rules from being deployed again: a second appended
// block broke deployment at lines 86 and 93 in November 2026.
assert.equal((firestoreRules.match(/service cloud\.firestore\s*\{/g)||[]).length, 1);
assert.equal((firestoreRules.match(/match \/listings\/\{listingId\}/g)||[]).length, 1);
assert.equal((firestoreRules.match(/match \/reservations\/\{reservationId\}/g)||[]).length, 1);
assert.match(firestoreRules, /\n  \}\n\}\s*$/, 'Firestore rules must end at the document root closing braces');
assert.doesNotMatch(firestoreRules, /\n\);\s*\n\s*\}\s*\n\s*function listingPath/,
  'Never append a second, orphaned copy of the rule functions');


// The actual Android screen must not render an embedded phone/clock/notch.
assert.match(css, /@media\s*\(max-width:\s*767px\)\s*,\s*\(hover:\s*none\)\s*and\s*\(pointer:\s*coarse\)/);
assert.match(css, /\.app-header-safe,\s*\.app-header-safe::before,\s*\.app-header-safe::after\s*\{\s*display:\s*none\s*!important\s*;/);
assert.match(css, /\.phone-frame\s*\{[\s\S]*?width:\s*100%;[\s\S]*?height:\s*100%;[\s\S]*?border:\s*0;[\s\S]*?border-radius:\s*0;/);
assert.match(css, /\.preview-stage\s*\{[\s\S]*?height:\s*100dvh;/);
assert.match(css, /\.app-page\s*\{\s*top:\s*env\(safe-area-inset-top,\s*0px\)/);
assert.match(css, /\.nav-item\s*\{[\s\S]*?flex:\s*1 1 0;[\s\S]*?min-width:\s*0;/);
assert.match(css, /@media\s*\(max-width:\s*360px\)/);
assert.match(css, /@media\s*\(max-height:\s*500px\)\s*and\s*\(orientation:\s*landscape\)/);
assert.match(
  fs.readFileSync(path.join(base,'index.html'),'utf8'),
  /name="viewport"\s+content="width=device-width, initial-scale=1, viewport-fit=cover"/
);

const config = {
  apiKey:'test-public-key',authDomain:'test.firebaseapp.com',
  projectId:'test',storageBucket:'test.appspot.com',appId:'test:app'
};
const xuEmail='student@my.xu.edu.ph';
const mockUser = {
  uid:'test-student', email:xuEmail, emailVerified:true,
  getIdTokenResult: async() => ({claims:{
    firebase:{sign_in_provider:'google.com'}, email_verified:true,email:xuEmail
  }})
};

function buildEnvironment({ua='Mozilla/5.0 Chrome', hostname='localhost', protocol='http:', cordova=false,
                         popup=async()=>({user:mockUser}), redirect=async()=>{}, redirectResult=async()=>null}={}) {
  let popupCalls=0, redirectCalls=0, signOutCalls=0;
  const auth={
    onAuthStateChanged:()=>{},
    getRedirectResult:redirectResult,
    signInWithPopup:async(...args)=>{popupCalls++;return popup(...args);},
    signInWithRedirect:async(...args)=>{redirectCalls++;return redirect(...args);},
    signOut:async()=>{signOutCalls++;}
  };
  const fakeFirebase = {
    apps:[],
    initializeApp:()=>({
      auth:()=>auth,firestore:()=>({}),storage:()=>({})
    }),
    auth: {GoogleAuthProvider:class {setCustomParameters() {}}}
  };
  const root = {
    XU_FIREBASE_CONFIG: config, firebase:fakeFirebase,
    navigator:{userAgent:ua}, location:{hostname,protocol},
    cordova:cordova?{}:undefined
  };
  const ctx = vm.createContext({window:root,console,Promise});
  vm.runInContext(coreSource,ctx);
  return {
    backend:root.XUThriftBackend,
    popupCalls:()=>popupCalls,redirectCalls:()=>redirectCalls,signOutCalls:()=>signOutCalls
  };
}

(async()=>{
  const desktop=buildEnvironment();
  assert.equal(desktop.backend.ready,true);
  assert.equal(desktop.backend.isXUEmail('student@my.xu.edu.ph'),true);
  assert.equal(desktop.backend.isXUEmail('student@g.xu.edu.ph'),false);
  assert.equal(desktop.backend.isXUEmail('student@gmail.com'),false);
  assert.equal((await desktop.backend.signInGoogle()).email,xuEmail);
  assert.equal(desktop.popupCalls(),1);
  const mobile=buildEnvironment({ua:'Mozilla/5.0 (Linux; Android 14) Chrome/130',hostname:'test.firebaseapp.com',protocol:'https:'});
  assert.equal(await mobile.backend.signInGoogle(),null);
  assert.equal(mobile.redirectCalls(),1);
  assert.equal(mobile.popupCalls(),0);
  const apk=buildEnvironment({cordova:true});
  await assert.rejects(()=>apk.backend.signInGoogle(),/Android APK login is not yet implemented/);
  assert.equal(apk.popupCalls(),0);
  const webView=buildEnvironment({ua:'Mozilla/5.0 (Linux; Android 14; Pixel) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36 wv',hostname:'localhost',protocol:'https:'});
  await assert.rejects(()=>webView.backend.signInGoogle(),/Android APK login is not yet implemented/);
  let release;
  const pending=new Promise(resolve=>{release=resolve;});
  const repeated=buildEnvironment({popup:()=>pending});
  const first=repeated.backend.signInGoogle(),second=repeated.backend.signInGoogle();
  await Promise.resolve();
  assert.equal(repeated.popupCalls(),1,'double taps must not launch multiple Google popups');
  release({user:mockUser});
  assert.equal((await first).email,xuEmail);
  assert.equal((await second).email,xuEmail);
  console.log('PASS: responsive fullscreen (small/landscape), safe areas, nav sizing, native APK guard, mobile redirect and popup single-flight.');
})().catch(err=>{console.error(err);process.exitCode=1;});
