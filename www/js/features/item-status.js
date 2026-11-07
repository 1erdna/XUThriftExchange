(function (root) {
  "use strict";
  const ALLOWED_STATUSES = Object.freeze(["Available", "Reserved", "Sold"]);
  function requireUser(user) {
    if (!user || !String(user.uid || "").trim())
      throw new Error("Sign in to manage your listings.");
    return user.uid;
  }
  async function updateItemStatus({
    listingId,
    newStatus,
    currentUser,
    firestore,
  } = {}) {
    const sellerUid = requireUser(currentUser);
    if (!firestore || typeof firestore.runTransaction !== "function")
      throw new Error("Firestore is not configured.");
    if (!String(listingId || "").trim()) throw new Error("Select a listing.");
    if (!ALLOWED_STATUSES.includes(newStatus))
      throw new Error("Invalid listing status.");
    if (newStatus === "Reserved")
      throw new Error("Use the reservation workflow to reserve an item.");
    const ref = firestore.collection("listings").doc(listingId);
    return firestore.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("Listing not found.");
      const item = snap.data();
      if (item.sellerUid !== sellerUid)
        throw new Error("Only the listing owner can change its status.");
      if (item.status === "Sold" && newStatus !== "Sold")
        throw new Error("Sold items cannot be reopened automatically.");
      if (item.reservationId && item.status === "Reserved")
        throw new Error(
          "Resolve the active reservation before changing this item status.",
        );
      if (newStatus === "Available" && item.reservationId)
        throw new Error("Resolve the reservation before reopening this item.");
      if (item.status === newStatus)
        return { id: snap.id, ...item, owner: true };
      const patch = { status: newStatus, updatedAt: new Date().toISOString() };
      tx.update(ref, patch);
      return { id: snap.id, ...item, ...patch, owner: true };
    });
  }
  async function getMyItems({ currentUser, firestore } = {}) {
    const uid = requireUser(currentUser);
    if (!firestore || typeof firestore.collection !== "function")
      throw new Error("Firestore is not configured.");
    const snap = await firestore
      .collection("listings")
      .where("sellerUid", "==", uid)
      .limit(100)
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data(), owner: true }));
  }
  root.XUThriftFeatures = root.XUThriftFeatures || {};
  root.XUThriftFeatures.itemStatus = {
    ALLOWED_STATUSES,
    updateItemStatus,
    getMyItems,
  };
})(typeof window !== "undefined" ? window : globalThis);
