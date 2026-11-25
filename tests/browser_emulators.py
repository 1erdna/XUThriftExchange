"""Run against a fresh local demo-xu Emulator Suite. See README for setup."""

from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import os

root = Path(__file__).resolve().parents[1]
ev = Path(os.getenv("XU_EVIDENCE_DIR", "evidence"))
ev.mkdir(parents=True, exist_ok=True)
cfg = """window.XU_FIREBASE_CONFIG={apiKey:'demo-key',projectId:'demo-xu',appId:'demo-app',authDomain:'demo-xu.firebaseapp.com',storageBucket:'demo-xu.appspot.com'};
firebase.initializeApp(window.XU_FIREBASE_CONFIG);
firebase.auth().useEmulator('http://127.0.0.1:9099',{disableWarnings:true});
firebase.firestore().settings({experimentalForceLongPolling:true});firebase.firestore().useEmulator('127.0.0.1',8085);"""


def session():
    c = b.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=3,
        service_workers="block",
    )
    c.route(
        "**/js/firebase-config.js",
        lambda r: r.fulfill(body=cfg, content_type="application/javascript"),
    )
    if os.getenv("XU_SDK_DIR"):
        c.route(
            "https://www.gstatic.com/firebasejs/**",
            lambda r: r.fulfill(
                path=str(Path(os.environ["XU_SDK_DIR"]) / r.request.url.split("/")[-1]),
                content_type="application/javascript",
            ),
        )
    p = c.new_page()
    p.set_default_timeout(7500)
    p.goto("http://127.0.0.1:8510")
    return p


def shot(p, n):
    p.locator("#toast.visible").wait_for(state="hidden", timeout=5000)
    p.screenshot(path=ev / (n + ".png"))


def login(p, name, domain="my.xu.edu.ph"):
    email = name + "@" + domain
    p.evaluate(
        """async ({email,name})=>{
  const payload={sub:name,email,email_verified:true,name:'XU '+name,iss:'https://accounts.google.com',aud:'demo-xu',iat:Math.floor(Date.now()/1000)};
  const enc=v=>btoa(JSON.stringify(v)).replace(/=+$/,'').replaceAll('+','-').replaceAll('/','_');
  const token=enc({alg:'none',typ:'JWT'})+'.'+enc(payload)+'.';
  await firebase.auth().signInWithCredential(firebase.auth.GoogleAuthProvider.credential(token));
 }""",
        {"email": email, "name": name},
    )
    if domain == "my.xu.edu.ph":
        expect(p.locator(".hero-title")).to_be_visible()


def act(p, a):
    p.locator('[data-action="' + a + '"]').first.click()


def nav(p, a):
    p.locator('[data-page="' + a + '"]').first.click()


def mark(t):
    print("PASS", t, flush=True)


with sync_playwright() as pw:
    b = pw.chromium.launch(
        executable_path=os.getenv("CHROMIUM_PATH"), args=["--no-sandbox"]
    )
    s = session()
    shot(s, "01-login")
    login(s, "seller")
    mark("emulator Google provider eligible")
    s.reload()
    expect(s.locator(".hero-title")).to_be_visible()
    mark("session restored")
    nav(s, "post")
    s.locator("#item-name").fill("Calculus textbook")
    s.locator("#item-price").fill("280")
    s.locator("#item-course").fill("Engineering")
    s.locator("#item-description").fill("Complete pages with a few pencil notes.")
    s.locator("#seller-phone").fill("09170000000")
    pub = s.get_by_role("button", name="Publish listing")
    pub.click()
    expect(s.locator("#post-error")).to_contain_text("Add a photo")
    mark("missing required photo")
    s.locator("#item-photo").set_input_files(str(root / "www/assets/books.jpg"))
    expect(s.locator(".photo-drop img")).to_be_visible()
    s.locator(".app-page").evaluate("(e)=>e.scrollTop=0")
    shot(s, "02-post")
    pub.click()
    expect(s.locator(".my-item")).to_have_count(1)
    shot(s, "03-inventory")
    mark("photo compressed and listing created")
    buyer = session()
    login(buyer, "buyer")
    buyer.get_by_role("button", name="Textbooks", exact=True).click()
    expect(buyer.locator("#search-query")).to_be_visible()
    buyer.locator("#search-query").fill("missing")
    expect(buyer.locator(".product-card")).to_have_count(0)
    buyer.locator("#search-query").fill("Calculus")
    expect(buyer.locator(".product-card")).to_have_count(1)
    shot(buyer, "04-search")
    mark("category plus keyword and empty result")
    act(buyer, "detail")
    expect(buyer.locator(".availability")).to_have_text("Available")
    shot(buyer, "05-detail")
    act(buyer, "reserve")
    expect(buyer.get_by_text("Reservation recorded", exact=True).first).to_be_visible()
    shot(buyer, "06-reserved")
    mark("buyer reserves seller item")
    other = session()
    login(other, "other")
    act(other, "detail")
    expect(other.locator("[data-action=reserve]")).to_be_disabled()
    expect(other.locator("[data-action=cancel]")).to_have_count(0)
    mark("third account blocked by UI")
    act(buyer, "detail")
    shot(buyer, "09-cancel")
    act(buyer, "cancel")
    expect(buyer.locator(".availability")).to_have_text("Available")
    mark("buyer cancellation")
    # Two eligible buyers request the same available listing concurrently.
    dbargs = """async()=>{const db=firebase.firestore();const snap=await db.collection('listings').where('visibility','==','public').get();const listingId=snap.docs[0].id;
 try {await XUThriftFeatures.reservations.createReservation({listingId,currentUser:firebase.auth().currentUser,firestore:db});return 'reserved';}
 catch(e){return e.message;}}"""
    for page in [buyer, other]:
        page.evaluate("()=>{window.raceResult=(" + dbargs + ")()}")
    race = [page.evaluate("window.raceResult") for page in [buyer, other]]
    assert race.count("reserved") == 1 and any(
        "unavailable" in str(v) for v in race
    ), race
    mark("simultaneous buyers exactly one reservation")
    denied = buyer.evaluate(
        """async()=>{const db=firebase.firestore();const snap=await db.collection('listings').where('visibility','==','public').get();
 try{await snap.docs[0].ref.update({status:'Sold'});return 'unexpected';}catch(e){return e.code;}}"""
    )
    assert denied == "permission-denied", denied
    mark("Firestore rules deny non-owner status write")
    s.reload()
    expect(s.locator(".product-card")).to_have_count(1)
    nav(s, "profile")
    nav(s, "myitems")
    act(s, "mark-sold")
    expect(s.locator(".my-item .muted")).to_have_text("₱280 · Sold")
    shot(s, "07-sold")
    mark("seller completes active reservation as Sold")
    buyer.reload()
    expect(buyer.locator(".product-card")).to_have_count(1)
    act(buyer, "detail")
    expect(buyer.locator(".availability")).to_have_text("Sold")
    expect(buyer.locator("[data-action=reserve]")).to_be_disabled()
    mark("sold persists across account and reload")
    winner = buyer if race[0] == "reserved" else other
    states = winner.evaluate(
        """async()=>{const db=firebase.firestore();return (await db.collection('reservations').where('buyerUid','==',firebase.auth().currentUser.uid).get()).docs.map(d=>d.data().status)}"""
    )
    assert "Completed" in states
    mark("reservation completion persisted")

    for width, height in [(320, 568), (360, 740), (412, 915), (844, 390), (1280, 800)]:
        buyer.set_viewport_size({"width": width, "height": height})
        assert buyer.evaluate("document.documentElement.scrollWidth <= innerWidth")
        expect(buyer.locator("[data-action=reserve]")).to_be_visible()
    mark("viewport checks 320 360 412 844 1280")
    nav(s, "profile")
    act(s, "signout")
    expect(s.get_by_text("Continue with Google")).to_be_visible()
    s.reload()
    expect(s.get_by_text("Continue with Google")).to_be_visible()
    mark("logout survives reload")
    login(s, "outsider", "gmail.com")
    s.wait_for_timeout(1200)
    expect(s.get_by_text("Continue with Google")).to_be_visible()
    assert s.evaluate("firebase.auth().currentUser===null")
    mark("ineligible provider account signed out")
