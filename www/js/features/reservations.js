/* XU ThriftExchange — atomic reservations (Firebase compat API).
 * IMPORTANT: Firestore Security Rules must enforce this transaction server-side.
 */
(function (root) {
  'use strict';
  function assertUser(user) {
    if (!user || !String(user.uid||'').trim()) throw new Error('Please sign in to reserve an item.');
    return user.uid;
  }
  async function createReservation({listingId,currentUser,firestore}={}) {
    const buyerUid=assertUser(currentUser);
    if (!firestore || typeof firestore.runTransaction!=='function') throw new Error('Firestore is not configured.');
    if (!String(listingId||'').trim()) throw new Error('Select a listing.');
    const listingRef=firestore.collection('listings').doc(listingId);
    const reservationRef=firestore.collection('reservations').doc();
    return firestore.runTransaction(async tx => {
      const snap=await tx.get(listingRef);
      if (!snap.exists) throw new Error('Listing not found.');
      const listing=snap.data();
      if (listing.visibility!=='public') throw new Error('This listing is not public.');
      if (listing.sellerUid===buyerUid) throw new Error('You cannot reserve your own listing.');
      if (listing.status!=='Available' || listing.reservationId) throw new Error('This item is already reserved or unavailable.');
      const now=new Date().toISOString();
      const reservation={listingId,buyerUid,sellerUid:listing.sellerUid,status:'Reserved',createdAt:now,updatedAt:now};
      tx.set(reservationRef,reservation);
      tx.update(listingRef,{status:'Reserved',reservationId:reservationRef.id,updatedAt:now});
      return {id:reservationRef.id,...reservation};
    });
  }
  async function getMyReservations({currentUser,firestore}={}) {
    const buyerUid=assertUser(currentUser);
    if (!firestore || typeof firestore.collection!=='function') throw new Error('Firestore is not configured.');
    const snapshot=await firestore.collection('reservations').where('buyerUid','==',buyerUid).limit(100).get();
    return snapshot.docs.map(d=>({id:d.id,...d.data()}));
  }
  async function cancelReservation({reservationId,currentUser,firestore}={}) {
    const uid=assertUser(currentUser);
    if (!firestore || typeof firestore.runTransaction!=='function') throw new Error('Firestore is not configured.');
    const resRef=firestore.collection('reservations').doc(String(reservationId));
    return firestore.runTransaction(async tx => {
      const resSnap=await tx.get(resRef);
      if (!resSnap.exists) throw new Error('Reservation not found.');
      const res=resSnap.data();
      if (res.buyerUid!==uid && res.sellerUid!==uid) throw new Error('You cannot cancel this reservation.');
      if (res.status!=='Reserved') throw new Error('This reservation cannot be cancelled.');
      const listingRef=firestore.collection('listings').doc(res.listingId);
      const itemSnap=await tx.get(listingRef);
      if (!itemSnap.exists || itemSnap.data().reservationId!==resSnap.id || itemSnap.data().status!=='Reserved') throw new Error('The reservation is out of sync.');
      const now=new Date().toISOString();
      tx.update(resRef,{status:'Cancelled',updatedAt:now});
      tx.update(listingRef,{status:'Available',reservationId:null,updatedAt:now});
      return {id:resSnap.id,...res,status:'Cancelled',updatedAt:now};
    });
  }
  root.XUThriftFeatures=root.XUThriftFeatures||{};
  root.XUThriftFeatures.reservations={createReservation,getMyReservations,cancelReservation};
})(typeof window !== 'undefined' ? window : globalThis);
