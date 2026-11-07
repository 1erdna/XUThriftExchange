/*
 * MILESTONE 3 STARTER — DANN ROA — ITEM LISTINGS
 * INCOMPLETE BY DESIGN: implement and test this feature in your own GitHub commits.
 * Hook this module into www/js/app.js -> addItem(form).
 * Depends on the Firebase/Firestore setup contributed by Andrei.
 */
(function (global) {
  "use strict";

  async function createListing({ formValues, currentUser, firestore, storage }) {
    // TODO (Dann): validate required fields, price, photo and seller contact.
    // TODO (Dann): upload an optional item photo to Firebase Storage.
    // TODO (Dann): create a Firestore listings document linked to currentUser.uid.
    // TODO (Dann): return the created listing ID and show confirmation in the UI.
    throw new Error("Item Listings — createListing is not implemented.");
  }

  async function fetchListings({ firestore }) {
    // TODO (Dann): retrieve real listing records from Firestore instead of demo data.
    throw new Error("Item Listings — fetchListings is not implemented.");
  }

  global.XUThriftFeatures = global.XUThriftFeatures || {};
  global.XUThriftFeatures.itemListings = { createListing, fetchListings };
})(window);
