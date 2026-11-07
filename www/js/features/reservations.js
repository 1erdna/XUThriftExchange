/*
 * MILESTONE 3 STARTER — DENZ MACASERO — RESERVATIONS
 * INCOMPLETE BY DESIGN: implement and test this feature in your own GitHub commits.
 * Hook this module into www/js/app.js -> reserve(id).
 * Coordinate listing status changes with Dann and Firebase rules with Andrei.
 */
(function (global) {
  "use strict";

  async function createReservation({ listingId, currentUser, firestore }) {
    // TODO (Denz): require an authenticated buyer and a valid listing.
    // TODO (Denz): reject own items and listings that are not Available.
    // TODO (Denz): use a Firestore transaction to prevent double reservation.
    // TODO (Denz): create a reservation record and mark the listing Reserved.
    throw new Error("Reservations — createReservation is not implemented.");
  }

  async function getMyReservations({ currentUser, firestore }) {
    // TODO (Denz): fetch the current buyer's actual reservation history.
    throw new Error("Reservations — getMyReservations is not implemented.");
  }

  global.XUThriftFeatures = global.XUThriftFeatures || {};
  global.XUThriftFeatures.reservations = { createReservation, getMyReservations };
})(window);
