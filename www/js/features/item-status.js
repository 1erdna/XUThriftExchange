/*
 * MILESTONE 3 STARTER — DANN ROA — ITEM STATUS
 * INCOMPLETE BY DESIGN: implement and test this feature in your own GitHub commits.
 * Hook this module into www/js/app.js -> listAction('mark-sold', ...).
 * Coordinate state changes with Denz's Reservations feature.
 */
(function (global) {
  "use strict";

  const ALLOWED_STATUSES = ["Available", "Reserved", "Sold"];

  async function updateItemStatus({ listingId, newStatus, currentUser, firestore }) {
    // TODO (Dann): reject invalid status values.
    // TODO (Dann): enforce currentUser.uid === listing.sellerUid.
    // TODO (Dann): update Firestore atomically and return the updated listing.
    // TODO (Dann): make Reserved/Sold state compatible with reservation rules.
    throw new Error("Item Status — updateItemStatus is not implemented.");
  }

  async function getMyItems({ currentUser, firestore }) {
    // TODO (Dann): retrieve only the signed-in seller's items from Firestore.
    throw new Error("Item Status — getMyItems is not implemented.");
  }

  global.XUThriftFeatures = global.XUThriftFeatures || {};
  global.XUThriftFeatures.itemStatus = { ALLOWED_STATUSES, updateItemStatus, getMyItems };
})(window);
