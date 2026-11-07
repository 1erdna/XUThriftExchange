/*
 * MILESTONE 3 STARTER — DENZ MACASERO — SEARCH AND FILTERING
 * INCOMPLETE BY DESIGN: implement and test this feature in your own GitHub commits.
 * Hook this module into www/js/app.js -> displayItems(), search input, category chips.
 * Fetch/search actual Firebase listings, not sample demo items.
 */
(function (global) {
  "use strict";

  async function searchListings({ firestore, keyword, category, course, status }) {
    // TODO (Denz): retrieve appropriate listings from Firestore.
    // TODO (Denz): filter title/description by keyword, category, course and status.
    // TODO (Denz): show useful empty/error/loading states in the UI.
    // TODO (Denz): avoid exposing non-public or unauthorized listing records.
    throw new Error("Search and Filtering — searchListings is not implemented.");
  }

  function displaySearchResults(listings, resultElement) {
    // TODO (Denz): integrate with existing app.js card/grid rendering helpers.
    // TODO (Denz): safely render results and update the result counter.
    throw new Error("Search and Filtering — displaySearchResults is not implemented.");
  }

  global.XUThriftFeatures = global.XUThriftFeatures || {};
  global.XUThriftFeatures.searchFilter = { searchListings, displaySearchResults };
})(window);
