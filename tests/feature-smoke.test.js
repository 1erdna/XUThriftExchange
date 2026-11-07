/* Milestone 3 local smoke tests — no Firebase project required. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.join(__dirname,'..','www','js');
const context={window:{},URL,console,crypto:globalThis.crypto};
vm.createContext(context);
function load(name){const code=fs.readFileSync(path.join(base,name),'utf8');new vm.Script(code,{filename:name});vm.runInContext(code,context);}
for(const name of ['features/item-listings.js','features/item-status.js','features/search-filter.js','features/reservations.js','firebase-config.js','firebase-core.js','google-sso.js','app.js']){
 const code=fs.readFileSync(path.join(base,name),'utf8');
 new vm.Script(code,{filename:name});
 if(name!=='app.js' && !name.startsWith('firebase-') && name!=='google-sso.js')load(name);
}
const {itemListings,itemStatus,searchFilter,reservations}=context.window.XUThriftFeatures;
const seller={uid:'seller-123',email:'20240029560@my.xu.edu.ph',displayName:'XU Seller'};
const buyer={uid:'buyer-456',email:'another@g.xu.edu.ph'};
const good={title:'Calculus textbook',description:'Complete pages and notes',price:'280',category:'Textbooks',condition:'Good',course:'Engineering',facebook:'https://www.facebook.com/testpage',phone:''};
class FakeFirestore{
 constructor(){this.data=new Map();this.seq=1;}
 docs(name){if(!this.data.has(name))this.data.set(name,new Map());return this.data.get(name);}
 collection(name){return new FakeCollection(this,name);}
 async runTransaction(fn){
  const edits=[];
  const tx={
   get:async ref=>ref.get(),
   set:(ref,data)=>edits.push(()=>this.docs(ref.name).set(ref.id,{...data})),
   update:(ref,patch)=>edits.push(()=>{const cur=this.docs(ref.name).get(ref.id);if(!cur)throw Error('Not found');this.docs(ref.name).set(ref.id,{...cur,...patch});})
  };
  const result=await fn(tx);for(const write of edits)write();return result;
 }
}
class FakeCollection{
 constructor(db,name,conditions=[],cap=100){this.db=db;this.name=name;this.conditions=conditions;this.cap=cap;}
 doc(id){const key=id||'test-doc-'+this.db.seq++;const d=this.db.docs(this.name);
  return {id:key,name:this.name,get:async()=>({id:key,exists:d.has(key),data:()=>({...d.get(key)})})};}
 async add(data){const ref=this.doc();this.db.docs(this.name).set(ref.id,{...data});return ref;}
 where(field,op,value){assert.equal(op,'==');return new FakeCollection(this.db,this.name,[...this.conditions,[field,value]],this.cap);}
 limit(count){return new FakeCollection(this.db,this.name,this.conditions,count);}
 async get(){const entries=[...this.db.docs(this.name)].filter(([id,v])=>this.conditions.every(([k,w])=>v[k]===w)).slice(0,this.cap);
  return {docs:entries.map(([id,v])=>({id,data:()=>({...v})}))};}
}
(async()=>{
 const db=new FakeFirestore();
 assert.equal(itemListings.validateListing(good).price,280);
 assert.throws(()=>itemListings.validateListing({...good,price:'-1'}),/Price/);
 assert.throws(()=>itemListings.validateListing({...good,phone:'123',facebook:''}),/mobile/);
 const created=await itemListings.createListing({formValues:good,currentUser:seller,firestore:db});
 assert.equal(created.status,'Available');
 assert.equal(created.sellerUid,seller.uid);
 // A Spark-plan listing with an attached photo must not require Cloud Storage.
 const jpegData='data:image/jpeg;base64,'+'A'.repeat(5000);
 const photograph={type:'image/png',size:2048};
 const withPhoto=await itemListings.createListing({
   formValues:{...good,title:'Laboratory textbook'},currentUser:seller,
   firestore:db,photoFile:photograph,photoEncoder:async()=>jpegData
 });
 assert.equal(withPhoto.image,jpegData);
 assert.equal(db.docs('listings').get(withPhoto.id).image,jpegData);
 await assert.rejects(()=>itemListings.createListing({
   formValues:good,currentUser:seller,firestore:db,photoFile:photograph,
   photoEncoder:async()=>('data:image/jpeg;base64,'+'A'.repeat(itemListings.MAX_INLINE_IMAGE_CHARS))
 }),/too large/);
 // Test the browser compressor's canvas/photo-handling path with lightweight stubs.
 context.FileReader=class {
   readAsDataURL(){this.result='data:image/png;base64,AAAA';this.onload();}
 };
 context.Image=class {
   constructor(){this.naturalWidth=1200;this.naturalHeight=900;}
   set src(value){this.onload();}
 };
 context.document={createElement:()=>({
   width:0,height:0,
   getContext:()=>({fillStyle:'',fillRect:()=>{},drawImage:()=>{}}),
   toDataURL:()=>jpegData
 })};
 assert.equal(await itemListings.compressPhotoForFirestore(photograph),jpegData);

 const all=await itemListings.fetchListings({firestore:db});
 assert.equal(all.length,1);
 const mine=await itemStatus.getMyItems({currentUser:seller,firestore:db});
 assert.equal(mine.length,1);
 assert.equal(searchFilter.filterListings(all,{keyword:'calculus'}).length,1);
 assert.equal(searchFilter.filterListings(all,{keyword:'stethoscope'}).length,0);
 assert.equal((await searchFilter.searchListings({firestore:db,category:'Textbooks',keyword:'calculus'})).length,1);
 assert.equal((await searchFilter.searchListings({firestore:db,category:'Uniforms'})).length,0);
 await assert.rejects(()=>itemStatus.updateItemStatus({listingId:created.id,newStatus:'Sold',currentUser:buyer,firestore:db}),/owner/);
 const reservation=await reservations.createReservation({listingId:created.id,currentUser:buyer,firestore:db});
 assert.equal(reservation.status,'Reserved');
 assert.equal(db.docs('listings').get(created.id).status,'Reserved');
 await assert.rejects(()=>reservations.createReservation({listingId:created.id,currentUser:{uid:'other'},firestore:db}),/reserved|unavailable/);
 await assert.rejects(()=>itemStatus.updateItemStatus({listingId:created.id,newStatus:'Sold',currentUser:seller,firestore:db}),/reservation/);
 await reservations.cancelReservation({reservationId:reservation.id,currentUser:buyer,firestore:db});
 assert.equal(db.docs('listings').get(created.id).status,'Available');
 await itemStatus.updateItemStatus({listingId:created.id,newStatus:'Sold',currentUser:seller,firestore:db});
 assert.equal(db.docs('listings').get(created.id).status,'Sold');
 await assert.rejects(()=>reservations.createReservation({listingId:created.id,currentUser:buyer,firestore:db}),/unavailable/);
 console.log('PASS: listing CRUD, inline photo fallback/compression, ownership, search/filter, reservation/cancellation smoke tests.');
})().catch(e=>{console.error(e);process.exitCode=1;});
