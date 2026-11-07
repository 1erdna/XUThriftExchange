/*
 * XU ThriftExchange — ITCC 41 Milestone 2
 * UI implementation only. Google / email authentication, institutional verification,
 * marketplace data, reservations, and file uploads are SIMULATED with browser-local demo state.
 * Never enter real credentials here. No network calls, payments or server persistence.
 */
(()=>{
'use strict';
const STORAGE='xuThriftExchange_milestone2_demo_v1';
const backend=window.XUThriftBackend||{ready:false};
const features=window.XUThriftFeatures||{};
const cloudMode=!!backend.ready;
let cloudUser=null;
let cloudSearchResults=null;
let searchGeneration=0;
let searchTimer=null;
const app=document.getElementById('app');
const toastElement=document.getElementById('toast');
const dialogRoot=document.getElementById('dialog-root');
const initialItems=[
  {id:'book-1',title:'Intro to Psychology',price:290,condition:'Good',category:'Textbooks',course:'Psychology',image:'assets/books.jpg',description:'Pre-loved reference book with complete pages and minimal highlighting. Suitable for an introductory psychology course.',status:'Available',seller:'S. Cruz',owner:false,facebook:'',phone:''},
  {id:'medical-1',title:'Medical Stethoscope',price:180,condition:'Like New',category:'Equipment',course:'Health Sciences',image:'assets/medical.jpg',description:'Functional second-hand stethoscope for student practice and skills training.',status:'Available',seller:'M. Santos',owner:false,facebook:'',phone:''},
  {id:'bag-1',title:'Student Backpack',price:240,condition:'Good',category:'Uniforms',course:'General',image:'assets/bag.jpg',description:'Gently used school backpack with working zippers and spacious compartments.',status:'Available',seller:'Demo Student',owner:true,facebook:'',phone:''},
  {id:'math-1',title:'Calculus: Early Transcendentals',price:380,condition:'Like New',category:'Textbooks',course:'Engineering',image:'assets/math.jpg',description:'A calculus reference book in good condition, useful for mathematics and engineering classes.',status:'Available',seller:'D. Lim',owner:false,facebook:'',phone:''}
];
const emptyModel=()=>({demoSignedIn:false,accountEmail:'',items:structuredClone(initialItems),saved:[],reservations:[]});
function loadModel(){try{const raw=localStorage.getItem(STORAGE);if(!raw)return emptyModel();const parsed=JSON.parse(raw);if(!Array.isArray(parsed.items)||!Array.isArray(parsed.saved))return emptyModel();return {...emptyModel(),...parsed};}catch{return emptyModel();}}
let model=loadModel();
if(cloudMode){model=emptyModel();model.items=[];model.demoSignedIn=false;model.accountEmail='';model.saved=[];}
let currentScreen=model.demoSignedIn?'home':'login';
let selectedCategory='All';
let searchQuery='';
let currentItemId='book-1';
let detailOrigin='home';
let reservationItemId=null;
let emailTyped='';
let imageUpload=null;
let toastTimeout=null;
const categories=['All','Textbooks','Uniforms','Lab Gowns','Equipment'];
function persist(){try{
if(cloudMode){if(cloudUser)localStorage.setItem('xu-m3-saved-'+cloudUser.uid,JSON.stringify(model.saved));return;}
localStorage.setItem(STORAGE,JSON.stringify(model));
}catch(err){console.warn('Browser saved-item storage unavailable:',err);toast('Browser storage is full; saved items might not persist.');}}
function h(value){return String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function peso(p){return Number(p)===0?'Free':'₱'+Number(p||0).toLocaleString('en-PH');}
function icon(name){const paths={
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  search:'<circle cx="10.8" cy="10.8" r="6.6"/><path d="m16 16 5 5"/>',
  plus:'<path d="M12 4v16M4 12h16"/>',
  heart:'<path d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 6l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.3a5.5 5.5 0 0 0 0-7.8Z"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
  arrow:'<path d="m9 18 6-6-6-6"/>',
  back:'<path d="m15 18-6-6 6-6"/>',
  check:'<path d="m5 12 4.5 4.5L19 7"/>',
  shield:'<path d="M12 2 20 5v6c0 5-3.3 8.3-8 11-4.7-2.7-8-6-8-11V5z"/><path d="m9 12 2 2 4-4"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  phone:'<path d="M22 16.8v3a2 2 0 0 1-2.2 2 18.9 18.9 0 0 1-8.3-2.9 18.7 18.7 0 0 1-5.7-5.7 19 19 0 0 1-2.9-8.4A2 2 0 0 1 4.9 2.6h3a2 2 0 0 1 2 1.7l.4 2.9a2 2 0 0 1-.6 1.7L8 10.4a16 16 0 0 0 5.6 5.6l1.5-1.7a2 2 0 0 1 1.7-.6l2.9.4a2 2 0 0 1 2.3 1.9Z"/>',
  external:'<path d="M14 4h6v6M10 14 20 4"/><path d="M20 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6"/>',
  box:'<rect x="3" y="6" width="18" height="15" rx="2"/><path d="M3 10h18M9 6V3h6v3"/>',
  camera:'<path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="3"/>',
  logout:'<path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19 12h3M2 12h3M12 2v3M12 19v3M17 7l2-2M5 19l2-2M17 17l2 2M5 5l2 2"/>',
  recycle:'<path d="m9 4 3-2 3 2M12 2v5M19 8l3 4-3 4M22 12h-5M5 8l-3 4 3 4M2 12h5M7 19h10M10 16l-3 3 3 3M14 16l3 3-3 3"/>',
  alert:'<path d="M12 3 2 21h20zM12 9v5M12 18h.01"/>',
  filter:'<path d="M4 7h16M7 12h10M10 17h4"/>',
  star:'<path d="m12 2 3.1 6.7 7.2.9-5.2 5 .9 7.1-6-3.5-6 3.5.9-7.1-5.2-5 7.2-.9z"/>'
};return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">'+(paths[name]||paths.box)+'</svg>';}
const brand=()=>'<div class="brand"><span class="logo">XU</span><span>Thrift<small>Exchange</small></span></div>';
function topBar({actions=true}={}){return '<header class="topbar">'+brand()+(actions?'<div class="header-actions"><button class="square-icon" data-action="nav" data-page="saved" aria-label="Saved items">'+icon('heart')+'</button><button class="square-icon" data-action="nav" data-page="profile" aria-label="Profile">'+icon('user')+'</button></div>':'')+'</header>';}
function statusBar(){return '<div class="app-header-safe" aria-hidden="true"><span>9:41</span><span class="status-icons">▮▮▮　▰</span></div>';}
function navBar(active){return '<nav class="navbar" aria-label="Main navigation">'+[
  ['home','home','Home'],['search','search','Search'],['post','plus','Sell'],['saved','heart','Saved'],['profile','user','Profile']
].map(([page,ic,label])=>'<button class="nav-item '+(active===page?'active':'')+'" data-action="nav" data-page="'+page+'" '+(active===page?'aria-current="page"':'')+'>'+icon(ic)+'<span>'+label+'</span></button>').join('')+'</nav>';}
function page(html,{nav=null,extraClass=''}={}){return statusBar()+'<div class="app-page '+(nav?'with-nav ':'')+extraClass+'">'+html+'</div>'+(nav?navBar(nav):'');}
function toast(msg){toastElement.textContent=msg;toastElement.classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>toastElement.classList.remove('visible'),2700);}
function modal(title,paragraph,actions){dialogRoot.innerHTML='<div class="dialog-backdrop" data-action="close-modal"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><h2 id="dialog-title">'+h(title)+'</h2><p>'+paragraph+'</p><div class="stack-actions">'+actions.map(a=>'<button class="'+(a.primary?'primary-btn':'secondary-btn')+' wide-btn" data-action="'+h(a.action)+'">'+h(a.text)+'</button>').join('')+'</div></section></div>';}
function closeModal(){dialogRoot.innerHTML='';}
function navigate(next,{push=true}={}){if(cloudMode&&['email','verify'].includes(next))next='login';const protectedScreens=['home','search','details','post','reservation','saved','profile','myitems'];if(!model.demoSignedIn&&protectedScreens.includes(next))next='login';if(next==='details'&&currentScreen!=='details')detailOrigin=currentScreen;currentScreen=next;if(push){try{history.pushState({screen:next},'',location.pathname+'#'+next);}catch{}}render();if(cloudMode&&next==='search')void refreshSearchFromCloud();}
function demoLogin(){if(cloudMode){toast('Use real Google sign-in.');return;}model.demoSignedIn=true;model.accountEmail=emailTyped||'demo.student@g.xu.edu.ph';persist();closeModal();navigate('home');toast('Demo session started — no real Google sign-in performed.');}
async function signOut(){
 if(cloudMode){
  try{await window.XUThriftSSO.logout();cloudUser=null;model.demoSignedIn=false;model.accountEmail='';model.items=[];model.saved=[];currentScreen='login';render();toast('Signed out of Google.');}
  catch(error){toast(error.message||'Could not sign out.');}
  return;
 }
 model.demoSignedIn=false;model.accountEmail='';persist();navigate('login');toast('Signed out of the local demonstration.');
}
async function loginReal(){
 try{
  const user=await window.XUThriftSSO.login();
  cloudUser=user;
  model.demoSignedIn=true;
  model.accountEmail=user.email;
  currentScreen='home';
  render();
  await loadCloudListings();
  toast('Signed in with your verified XU Google account.');
 }catch(error){toast(error.message||'Google sign-in failed.');}
}
function resetDemo(){if(cloudMode){toast('Online data cannot be reset from this device.');return;}model=emptyModel();selectedCategory='All';searchQuery='';imageUpload=null;persist();closeModal();navigate('login');toast('Local demonstration data reset.');}
function loginView(){
 if(cloudMode)return page('<div class="login-page"><div class="login-brand"><div class="login-mark">XU</div><h1>ThriftExchange</h1><p class="subhead">Trade smarter. Waste less.</p><p class="intro">A campus marketplace for pre-loved books, uniforms, and academic essentials.</p></div><div class="login-actions"><button class="pill-button" data-action="google-demo"><span class="google-g" aria-hidden="true">G</span>Continue with Google</button><p class="login-disclaimer">Sign in using a verified Xavier University Google account (@my.xu.edu.ph or @g.xu.edu.ph).</p><p class="login-disclaimer">Browser sign-in is supported when your Firebase project is configured. Android Cordova requires a separate native OAuth integration.</p></div></div>');
 return page('<div class="login-page"><div class="login-brand"><div class="login-mark">XU</div><h1>ThriftExchange</h1><p class="subhead">Trade smarter. Waste less.</p><p class="intro">A campus marketplace for pre-loved books, uniforms, and academic essentials.</p></div><div class="login-actions"><button class="pill-button" data-action="google-demo"><span class="google-g" aria-hidden="true">G</span>Preview Google sign-in (Demo)</button><button class="pill-button" data-action="nav" data-page="email">'+icon('mail')+'Continue with XU email (Demo)</button><p class="login-disclaimer"><strong>Offline UI demo only:</strong> Firebase has not been configured. All demo data stays on this device. This is not real login or database synchronization.</p></div></div>');
}
function emailView(){return page('<div class="verify-wrap">'+brand()+'<h1>Continue with XU email.</h1><p>Use your institutional email for the planned passwordless alternative. You will not be asked for your Gmail password.</p><form id="email-form"><div class="form-field"><label for="institution-email">XU institutional email</label><input id="institution-email" name="email" class="form-control" type="email" autocomplete="email" placeholder="name@my.xu.edu.ph" value="'+h(emailTyped)+'" required></div><p class="form-hint">Demo validation checks the email format only. A verification email is <strong>not actually sent</strong> during Milestone 2.</p><button class="primary-btn wide-btn" style="margin-top:19px" type="submit">Continue to verification preview '+icon('arrow')+'</button></form><div class="bottom-actions"><button class="secondary-btn wide-btn" data-action="nav" data-page="login">'+icon('back')+' Back to sign-in</button></div></div>');}
function verifyView(){return page('<div class="verify-wrap">'+brand()+'<h1>Institutional verification</h1><p>The final application will verify an eligible university identity before granting campus marketplace access.</p><div class="info-box"><strong>Demo email:</strong> '+h(emailTyped||'demo.student@g.xu.edu.ph')+'<br><strong>Current milestone:</strong> UI navigation only.<br><strong>Not yet implemented:</strong> Email link delivery, ownership verification, and Firebase authentication.</div><div class="bottom-actions stack-actions"><button class="primary-btn" data-action="demo-login">Continue with demo account '+icon('arrow')+'</button><button class="secondary-btn" data-action="nav" data-page="login">Back to sign-in</button></div></div>');}
function displayItems(){
 const items=(cloudMode&&Array.isArray(cloudSearchResults))?cloudSearchResults:model.items;
 if(features.searchFilter?.filterListings)return features.searchFilter.filterListings(items,{keyword:searchQuery,category:selectedCategory,status:'All'});
 return items.filter(item=>(selectedCategory==='All'||selectedCategory===item.category)&&(!searchQuery||(`${item.title} ${item.category} ${item.course} ${item.description}`).toLowerCase().includes(searchQuery.trim().toLowerCase())));
}
function normalizeCloudItem(i){return {...i,image:i.image||'assets/books.jpg',owner:!!cloudUser&&i.sellerUid===cloudUser.uid};}
async function loadCloudListings(){
 if(!cloudMode||!cloudUser)return;
 try{
  const [publicListings,ownListings]=await Promise.all([
   features.itemListings.fetchListings({firestore:backend.firestore,limit:100}),
   features.itemStatus.getMyItems({currentUser:cloudUser,firestore:backend.firestore})
  ]);
  const items=new Map();
  for(const item of [...publicListings,...ownListings])items.set(item.id,normalizeCloudItem(item));
  model.items=Array.from(items.values()).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  cloudSearchResults=null;
  if(currentScreen==='search')void refreshSearchFromCloud();
  render();
 }catch(error){toast('Could not load marketplace: '+(error.message||'unknown error'));}
}
async function refreshSearchFromCloud(){
 if(!cloudMode||!cloudUser||!features.searchFilter?.searchListings)return;
 const seq=++searchGeneration;
 try{
  const results=await features.searchFilter.searchListings({firestore:backend.firestore,keyword:searchQuery,category:selectedCategory,status:'All',limit:100});
  if(seq!==searchGeneration)return;
  cloudSearchResults=results.map(normalizeCloudItem);
  if(currentScreen==='search'){
   const node=document.getElementById('catalog-results');if(node)node.innerHTML=grid(displayItems());
   const counter=document.getElementById('result-count');if(counter)counter.textContent=displayItems().length+' result'+(displayItems().length===1?'':'s');
  }
 }catch(error){if(seq===searchGeneration)toast('Search failed: '+(error.message||'unknown error'));}
}
function card(item){const isSaved=model.saved.includes(item.id);return '<article class="product-card"><button class="product-open" data-action="detail" data-id="'+h(item.id)+'" aria-label="View '+h(item.title)+'"><img src="'+h(item.image)+'" alt="Photo of '+h(item.title)+'"><div class="product-info"><span class="condition">'+h(item.condition)+'</span><h3>'+h(item.title)+'</h3><span class="product-price">'+peso(item.price)+'</span><span class="product-type">'+h(item.category)+'</span></div></button><button class="heart-btn" data-action="favorite" data-id="'+h(item.id)+'" aria-pressed="'+isSaved+'" aria-label="'+(isSaved?'Remove saved item':'Save item')+'">'+icon('heart')+'</button></article>';}
function grid(items){return items.length?'<div class="catalog">'+items.map(card).join('')+'</div>':'<div class="empty-state"><div class="empty-icon">'+icon('search')+'</div><h3>No matching items</h3><p>Try another keyword or choose a different category.</p></div>';}
function chips(){return '<div class="chip-scroller" role="group" aria-label="Item categories">'+categories.map(cat=>'<button class="chip '+(selectedCategory===cat?'selected':'')+'" data-action="category" data-category="'+h(cat)+'" aria-pressed="'+(selectedCategory===cat)+'">'+h(cat)+'</button>').join('')+'</div>';}
function homeView(){const items=model.items.slice(0,6);return page(topBar()+'<div class="greeting"><div class="avatar">XU</div><p class="muted" style="margin:0">Good morning, student</p><h1 class="hero-title">Find your next campus essential.</h1></div><button class="search-launch" data-action="nav" data-page="search">'+icon('search')+'<span>Search books, uniforms &amp; more</span><span class="quick-filter">'+icon('filter')+'</span></button><div class="banner"><div class="eyebrow">Smarter campus living</div><h3>Give your old items a new story.</h3><button class="text-link" style="padding:0;color:white" data-action="nav" data-page="post">Start selling ›</button></div><div class="section-title"><h2>Browse categories</h2><button class="text-link" data-action="nav" data-page="search">See all</button></div>'+chips()+'<div class="section-title"><h2>Fresh finds</h2><button class="text-link" data-action="nav" data-page="search">'+items.length+' items</button></div>'+grid(items)+'<div class="demo-strip">Marketplace · Live Firebase data when configured</div>',{nav:'home'});}
function searchView(){const items=displayItems();return page(topBar({actions:false})+'<div class="page-title"><h1>Explore the marketplace</h1><p class="muted" style="margin:0">Academic essentials, from fellow XU students.</p></div><div class="search-inline"><input id="search-query" type="search" aria-label="Search second-hand items" placeholder="Search items, subjects, courses..." value="'+h(searchQuery)+'"></div>'+chips()+'<div class="section-title"><h2>Available items</h2><span class="muted" id="result-count">'+items.length+' result'+(items.length===1?'':'s')+'</span></div><div id="catalog-results">'+grid(items)+'</div>',{nav:'search'});}
function detailView(){const item=model.items.find(i=>i.id===currentItemId);if(!item)return searchView();const owned=!!item.owner;const available=item.status==='Available';let contactHtml='';if(item.facebook||item.phone){contactHtml='<div class="contact-buttons">'+(item.facebook?'<button class="secondary-btn" data-action="facebook" data-id="'+h(item.id)+'">'+icon('external')+' Facebook</button>':'')+(item.phone?'<button class="secondary-btn" data-action="phone" data-id="'+h(item.id)+'">'+icon('phone')+' Phone</button>':'')+'</div>';}else{contactHtml='<p class="muted" style="margin-top:12px">Seller contact information is not available for this sample listing.</p>';}
return page('<div class="back-header"><button class="back-button" data-action="back-detail">'+icon('back')+' Back to listings</button></div><div class="detail-cover"><img src="'+h(item.image)+'" alt="'+h(item.title)+'"></div><div class="detail-body"><div class="row"><span class="condition">'+h(item.condition)+'</span><span class="muted">'+h(item.category)+' · '+h(item.course)+'</span></div><h1>'+h(item.title)+'</h1><div class="big-price">'+peso(item.price)+'</div><div class="divider"></div><div class="section-label">About this item</div><p class="muted">'+h(item.description)+'</p><div class="row" style="margin-top:17px"><span class="muted">Availability</span><span class="availability">'+h(item.status)+'</span></div><div class="seller-card"><div class="round">'+(owned?'DS':'XU')+'</div><div><small>Seller · '+(owned?'Your demo listing':'Sample listing')+'</small><br><strong>'+h(item.seller)+'</strong></div></div>'+contactHtml+'<p class="muted" style="margin-top:16px">Meetup arrangements and payments happen directly with the seller, outside the app.</p></div><div class="bottom-cta"><button class="secondary-btn" data-action="favorite" data-id="'+h(item.id)+'" aria-label="Toggle saved item">'+icon('heart')+'</button><button class="primary-btn" data-action="reserve" data-id="'+h(item.id)+'" '+(!available||owned?'disabled':'')+'>'+(owned?'Your listing':available?'Reserve item':'Item '+h(item.status))+' '+icon('arrow')+'</button></div>');}
function postView(){return page(topBar({actions:false})+'<div class="form-page"><div class="page-title"><h1>Post an academic item</h1><p class="muted" style="margin:0">Help another Xavier student reuse it.</p></div><form class="form-body" id="post-form"><label class="photo-drop" for="item-photo">'+icon('camera')+'<br><strong>Add item photo</strong><small>Add an item photo (compressed thumbnail, no Storage upgrade required).</small>'+(imageUpload?'<img src="'+h(imageUpload)+'" alt="Selected item preview">':'')+'</label><input style="display:none" type="file" id="item-photo" name="photo" accept="image/jpeg,image/png,image/webp"><div class="form-field"><label for="item-name">Item name *</label><input class="form-control" id="item-name" name="title" placeholder="e.g., Chemistry lab gown" required minlength="4" maxlength="80"></div><div class="form-grid"><div class="form-field"><label for="item-price">Price (₱) *</label><input class="form-control" id="item-price" name="price" type="number" step="1" min="0" max="99999" placeholder="0 = Free" required></div><div class="form-field"><label for="item-condition">Condition *</label><select class="form-control" id="item-condition" name="condition" required><option>Good</option><option>Like New</option><option>Fair</option></select></div></div><div class="form-grid"><div class="form-field"><label for="item-category">Category *</label><select class="form-control" id="item-category" name="category" required><option>Textbooks</option><option>Uniforms</option><option>Lab Gowns</option><option>Equipment</option></select></div><div class="form-field"><label for="item-course">Course/Dept.</label><input class="form-control" id="item-course" name="course" placeholder="e.g., Nursing" maxlength="50"></div></div><div class="form-field"><label for="item-description">Description *</label><textarea class="form-control textarea" id="item-description" name="description" placeholder="Describe your item clearly..." minlength="10" maxlength="500" required></textarea></div><div class="form-field"><label for="seller-facebook">Facebook profile URL</label><input class="form-control" id="seller-facebook" name="facebook" type="text" inputmode="url" placeholder="https://www.facebook.com/yourprofile"></div><div class="form-field"><label for="seller-phone">Phone number</label><input class="form-control" id="seller-phone" name="phone" type="tel" inputmode="tel" placeholder="09XX XXX XXXX"></div><p class="form-hint">Provide Facebook or a phone number so the buyer can contact you outside the app. When Firebase is configured, your post is shared online; otherwise this is a local demonstration.</p><p class="form-error" id="post-error" role="alert" hidden></p><button class="primary-btn wide-btn" type="submit">Publish listing '+icon('arrow')+'</button></form></div>',{nav:'post'});}
function reservationView(){const item=model.items.find(i=>i.id===reservationItemId);return page(topBar({actions:false})+'<div class="success-view"><div class="success-symbol">'+icon('check')+'</div><h1>Reservation recorded</h1><p class="message"><strong>'+h(item?.title||'Your item')+'</strong> is marked <strong>Reserved</strong> for this exchange. Contact the seller to arrange your meetup.</p><div class="callout"><strong>Next step:</strong> Use the seller-provided Facebook profile or phone number if listed. No in-app chat, payment, or delivery service is included.</div><div class="stack-actions"><button class="primary-btn wide-btn" data-action="detail" data-id="'+h(reservationItemId||'')+'">View item and seller contact '+icon('arrow')+'</button><button class="secondary-btn wide-btn" data-action="nav" data-page="home">Back to Home</button></div></div>');}
function savedView(){const items=model.items.filter(i=>model.saved.includes(i.id));return page(topBar({actions:false})+'<div class="page-title"><h1>Saved items</h1><p class="muted" style="margin:0">Keep items you want to revisit.</p></div>'+(items.length?grid(items):'<div class="empty-state"><div class="empty-icon">'+icon('heart')+'</div><h3>No saved items yet</h3><p>Tap the heart on any listing to save it here for later.</p><button class="primary-btn" data-action="nav" data-page="search">Explore listings</button></div>'),{nav:'saved'});}
function profileRow(ic,title,sub,action,target){return '<button class="profile-row" data-action="'+action+'" '+(target?'data-page="'+target+'"':'')+'><span class="row-icon">'+icon(ic)+'</span><span><span class="title">'+title+'</span><small>'+sub+'</small></span><span class="chev">'+icon('arrow')+'</span></button>';}
function profileView(){return page(topBar({actions:false})+'<div class="profile-hero"><div class="profile-avatar">DS</div><div><h2>XU Student</h2><p class="muted" style="margin:0">'+h(model.accountEmail)+'<br><strong>Google verified in Firebase mode; local demo otherwise</strong></p></div></div><div class="profile-list-label">Marketplace activity</div><div class="profile-list">'+profileRow('box','My posted items','Review status and mark items sold','nav','myitems')+profileRow('heart','Saved items','Your bookmarked listings','nav','saved')+profileRow('plus','Sell or donate an item','Create an academic listing','nav','post')+'</div><div class="profile-list-label">Account &amp; testing</div><div class="profile-list">'+profileRow('shield','Account information','Google and XU verification are pending','account-info')+profileRow('settings','Reset offline demo','Restore the sample listings and screen state','confirm-reset')+profileRow('logout','Sign out','Return to the login screen','signout')+'</div>',{nav:'profile'});}
function myitemsView(){const owned=model.items.filter(i=>i.owner);return page('<div class="back-header"><button class="back-button" data-action="nav" data-page="profile">'+icon('back')+' Back to profile</button></div><div class="page-title"><h1>My posted items</h1><p class="muted" style="margin:0">Review your listings and update availability after an exchange.</p></div>'+(owned.length?owned.map(item=>'<article class="my-item"><img src="'+h(item.image)+'" alt="'+h(item.title)+'"><div style="flex:1"><h3>'+h(item.title)+'</h3><p class="muted" style="margin:0">'+peso(item.price)+' · '+h(item.status)+'</p><div class="actions"><button class="small-btn" data-action="detail" data-id="'+h(item.id)+'">View item</button>'+(item.status!=='Sold'?'<button class="small-btn" data-action="mark-sold" data-id="'+h(item.id)+'">Mark as Sold</button>':'')+'</div></div></article>').join(''):'<div class="empty-state"><div class="empty-icon">'+icon('box')+'</div><h3>No posted items</h3><p>Start selling or donate an academic item.</p><button class="primary-btn" data-action="nav" data-page="post">Post an item</button></div>'),{nav:'profile'});}
function render(){let view;switch(currentScreen){case 'login':view=loginView();break;case 'email':view=emailView();break;case 'verify':view=verifyView();break;case 'home':view=homeView();break;case 'search':view=searchView();break;case 'details':view=detailView();break;case 'post':view=postView();break;case 'reservation':view=reservationView();break;case 'saved':view=savedView();break;case 'profile':view=profileView();break;case 'myitems':view=myitemsView();break;default:view=loginView();}
app.innerHTML=view;
const scrolling=app.querySelector('.app-page');if(scrolling)scrolling.scrollTop=0;}
function toggleSave(id){if(model.saved.includes(id)){model.saved=model.saved.filter(x=>x!==id);toast('Removed from Saved Items.');}else{model.saved.push(id);toast('Saved for later.');}persist();render();}
async function reserve(id){
 const item=model.items.find(i=>i.id===id);
 if(!item||item.status!=='Available'||item.owner){toast('This item cannot be reserved.');return;}
 if(cloudMode){
  if(!cloudUser){toast('Sign in to reserve an item.');return;}
  try{
   const result=await features.reservations.createReservation({listingId:id,currentUser:cloudUser,firestore:backend.firestore});
   model.reservations.push({id:result.id,itemId:id,createdAt:result.createdAt,status:'Reserved'});
   reservationItemId=id;
   await loadCloudListings();
   navigate('reservation');
   toast('Reservation recorded in Firebase.');
  }catch(error){toast(error.message||'Could not reserve the item.');}
  return;
 }
 item.status='Reserved';model.reservations.push({itemId:id,createdAt:new Date().toISOString(),status:'Reserved'});persist();reservationItemId=id;navigate('reservation');
}
async function markItemSold(id){
 const item=model.items.find(i=>i.id===id);
 if(!item||!item.owner){toast('Only the seller may change this item.');return;}
 if(cloudMode){
  try{
   await features.itemStatus.updateItemStatus({listingId:id,newStatus:'Sold',currentUser:cloudUser,firestore:backend.firestore});
   await loadCloudListings();toast('Item marked as Sold in Firebase.');
  }catch(error){toast(error.message||'Could not change status.');}
  return;
 }
 item.status='Sold';persist();render();toast('Item marked as Sold locally.');
}
function validFacebook(raw){if(!raw)return '';try{const full=/^https?:\/\//i.test(raw)?raw:'https://'+raw;const parsed=new URL(full);if(['facebook.com','www.facebook.com','m.facebook.com','fb.com','www.fb.com'].includes(parsed.hostname)&&parsed.pathname.length>1&&parsed.protocol==='https:')return parsed.href;}catch{}return null;}
function validPhone(raw){if(!raw)return '';const compact=raw.replace(/[\s()-]/g,'');return /^(09\d{9}|\+639\d{9})$/.test(compact)?compact:null;}
async function addItem(form){
 if(cloudMode){
  if(!cloudUser){toast('Sign in before posting an item.');return;}
  const errorNode=document.getElementById('post-error');
  try{
   const formValues=Object.fromEntries(new FormData(form).entries());
   const photoFile=form.elements.photo?.files?.[0];
   await features.itemListings.createListing({formValues,currentUser:cloudUser,firestore:backend.firestore,photoFile:photoFile?.size?photoFile:null});
   imageUpload=null;
   await loadCloudListings();
   navigate('myitems');
   toast('Item published to the shared marketplace.');
  }catch(error){if(errorNode){errorNode.hidden=false;errorNode.textContent=error.message||'Could not publish listing.';}toast('Could not publish listing.');}
  return;
 }
 const data=new FormData(form);const title=String(data.get('title')||'').trim();const description=String(data.get('description')||'').trim();const price=Number(data.get('price'));
 const fb=validFacebook(String(data.get('facebook')||'').trim());const phone=validPhone(String(data.get('phone')||'').trim());let error='';
 if(title.length<4)error='Enter an item name with at least 4 characters.';
 else if(description.length<10)error='Describe the item in at least 10 characters.';
 else if(!Number.isFinite(price)||price<0||price>99999)error='Enter a valid non-negative price.';
 else if(fb===null)error='Enter a valid Facebook profile URL (facebook.com/yourprofile).';
 else if(phone===null)error='Enter a valid Philippine mobile phone number.';
 else if(!fb&&!phone)error='Enter at least one seller contact method: Facebook or phone.';
 if(error){const node=document.getElementById('post-error');if(node){node.hidden=false;node.textContent=error;}toast('Please check your form.');return;}
 const id='demo-'+Date.now().toString(36);model.items.unshift({id,title,description,price,condition:String(data.get('condition')),category:String(data.get('category')),course:String(data.get('course')||'General').trim()||'General',facebook:fb||'',phone:phone||'',image:imageUpload||'assets/books.jpg',status:'Available',seller:'Demo Student',owner:true});imageUpload=null;persist();navigate('myitems');toast('Demo listing published locally.');
}
function previewPhoto(file){if(!file)return;if(!file.type.startsWith('image/')){toast('Please select an image file.');return;}if(file.size>8*1024*1024){toast('Choose an image smaller than 8 MB.');return;}const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const scale=Math.min(1,700/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);imageUpload=canvas.toDataURL('image/jpeg',.68);const drop=document.querySelector('.photo-drop');if(drop){drop.querySelector('img')?.remove();const preview=document.createElement('img');preview.src=imageUpload;preview.alt='Selected item preview';drop.appendChild(preview);}toast(cloudMode?'Photo ready. It will be compressed when you publish.':'Photo ready for local demo post.');};img.src=String(reader.result);};reader.readAsDataURL(file);}
function sellerContact(kind,id){const item=model.items.find(i=>i.id===id);if(!item)return;const value=kind==='facebook'?item.facebook:item.phone;if(!value){toast('No '+kind+' contact listed.');return;}
if(kind==='facebook'){const url=validFacebook(value);if(url)window.open(url,'_blank','noopener,noreferrer');else toast('Facebook address cannot be opened.');}
else{const number=validPhone(value);if(number)window.location.href='tel:'+number;else toast('Phone number is invalid.');}}
function listAction(action,node){const target=node.dataset.page;const id=node.dataset.id;switch(action){
case 'nav':navigate(target);return;
case 'google-demo':if(cloudMode){void loginReal();return;}modal('Google sign-in · UI preview','The Google button is designed but <strong>no Google or XU service is connected</strong> in Milestone 2. Use the sample account to test automatic session restoration and navigation.',[{text:'Continue as Demo Student',action:'demo-login',primary:true},{text:'Cancel',action:'close-modal'}]);return;
case 'demo-login':demoLogin();return;
case 'close-modal':closeModal();return;
case 'detail':currentItemId=id;navigate('details');return;
case 'back-detail':navigate(detailOrigin||'search');return;
case 'favorite':toggleSave(id);return;
case 'category':selectedCategory=node.dataset.category;cloudSearchResults=null;render();if(cloudMode)void refreshSearchFromCloud();return;
case 'reserve':reserve(id);return;
case 'facebook':sellerContact('facebook',id);return;
case 'phone':sellerContact('phone',id);return;
case 'mark-sold':void markItemSold(id);return;
case 'signout':signOut();return;
case 'account-info':modal(cloudMode?'Google account information':'Account integration pending',cloudMode?'Signed in as '+h(model.accountEmail)+'. Google identity and XU account eligibility are checked using Firebase Auth and security rules.':'This is a local UI demonstration. Real sign-in requires your Firebase project.',[{text:'Got it',action:'close-modal',primary:true}]);return;
case 'confirm-reset':modal('Reset the demo?','This clears locally saved sample bookmarks, reservations, posts, and demo sessions. No online data will be affected.',[{text:'Reset local demo',action:'reset-demo',primary:true},{text:'Cancel',action:'close-modal'}]);return;
case 'reset-demo':resetDemo();return;
}}
document.addEventListener('click',event=>{const node=event.target.closest('[data-action]');if(!node)return;event.preventDefault();if(node.dataset.action==='close-modal'&&event.target!==node)return;listAction(node.dataset.action,node);});
document.addEventListener('submit',event=>{if(event.target.id==='email-form'){event.preventDefault();const field=event.target.elements.email;const email=String(field.value).trim().toLowerCase();if(!/^[^\s@]+@(?:my|g)\.xu\.edu\.ph$/.test(email)){field.setCustomValidity('For this demo, use an email ending in @my.xu.edu.ph or @g.xu.edu.ph.');field.reportValidity();field.setCustomValidity('');return;}emailTyped=email;navigate('verify');return;}
if(event.target.id==='post-form'){event.preventDefault();addItem(event.target);}});
document.addEventListener('input',event=>{if(event.target.id==='search-query'){
 searchQuery=event.target.value;cloudSearchResults=null;
 const items=displayItems();const target=document.getElementById('catalog-results');if(target)target.innerHTML=grid(items);
 const count=document.getElementById('result-count');if(count)count.textContent=items.length+' result'+(items.length===1?'':'s');
 if(cloudMode){clearTimeout(searchTimer);searchTimer=setTimeout(refreshSearchFromCloud,300);}
}});
document.addEventListener('change',event=>{if(event.target.id==='item-photo')previewPhoto(event.target.files?.[0]);});
window.addEventListener('popstate',e=>{const incoming=e.state?.screen;if(incoming)navigate(incoming,{push:false});});
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
window.XU_M3_TEST={getScreen:()=>currentScreen,getModel:()=>JSON.parse(JSON.stringify(model)),navigate:(screen)=>navigate(screen),getCloudMode:()=>cloudMode,refresh:loadCloudListings};
if(cloudMode){
 backend.subscribe(({user,error})=>{
  const prior=cloudUser?.uid||null;cloudUser=user||null;
  model.demoSignedIn=!!cloudUser;model.accountEmail=cloudUser?.email||'';
  if(!cloudUser){model.items=[];model.saved=[];cloudSearchResults=null;currentScreen='login';}
  else if(prior!==cloudUser.uid){
   try{const saved=JSON.parse(localStorage.getItem('xu-m3-saved-'+cloudUser.uid)||'[]');model.saved=Array.isArray(saved)?saved:[];}catch{model.saved=[];}
   currentScreen='home';void loadCloudListings();
  }
  if(error)toast(error.message||'Authentication error.');
  render();
 });
}
render();
})();
