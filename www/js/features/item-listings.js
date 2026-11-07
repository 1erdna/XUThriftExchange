(function (root) {
  "use strict";
  const MAX_IMAGE = 8 * 1024 * 1024;
  const CATEGORIES = ["Textbooks", "Uniforms", "Lab Gowns", "Equipment"];
  const CONDITIONS = ["Good", "Like New", "Fair"];
  const COLLECTION = "listings";
  function text(value) {
    return String(value ?? "").trim();
  }
  function assertUser(user) {
    if (!user || !text(user.uid))
      throw new Error("Please sign in with a verified student account.");
    return user.uid;
  }
  function normalizeFacebook(raw) {
    const value = text(raw);
    if (!value) return "";
    try {
      const url = new URL(
        /^https?:\/\//i.test(value) ? value : `https://${value}`,
      );
      if (
        url.protocol !== "https:" ||
        ![
          "facebook.com",
          "www.facebook.com",
          "m.facebook.com",
          "fb.com",
          "www.fb.com",
        ].includes(url.hostname) ||
        url.pathname === "/" ||
        !url.pathname
      )
        throw Error("bad URL");
      return url.href;
    } catch {
      throw new Error("Enter a valid public Facebook profile or page URL.");
    }
  }
  function normalizePhone(raw) {
    const phone = text(raw).replace(/[\s()\-]/g, "");
    if (!phone) return "";
    if (!/^(09\d{9}|\+639\d{9})$/.test(phone))
      throw new Error("Enter a valid Philippine mobile number.");
    return phone;
  }
  function validateListing(values) {
    if (!values || typeof values !== "object")
      throw new Error("Missing item details.");
    const title = text(values.title),
      description = text(values.description);
    const course = text(values.course) || "General";
    const price = Number(values.price);
    if (title.length < 4 || title.length > 80)
      throw new Error("Item name must have 4–80 characters.");
    if (description.length < 10 || description.length > 500)
      throw new Error("Description must have 10–500 characters.");
    if (
      !Number.isInteger(price) ||
      price < 0 ||
      price > 99999 ||
      text(values.price) === ""
    )
      throw new Error("Price must be a whole peso amount from 0 to 99,999.");
    if (!CATEGORIES.includes(values.category))
      throw new Error("Select a valid item category.");
    if (!CONDITIONS.includes(values.condition))
      throw new Error("Select a valid item condition.");
    if (course.length > 50)
      throw new Error("Course/department must be at most 50 characters.");
    const facebook = normalizeFacebook(values.facebook);
    const phone = normalizePhone(values.phone);
    if (!facebook && !phone)
      throw new Error("Provide at least one seller contact method.");
    return {
      title,
      description,
      price,
      category: values.category,
      condition: values.condition,
      course,
      facebook,
      phone,
    };
  }
  function verifyFile(file) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > MAX_IMAGE ||
      file.size <= 0
    ) {
      throw new Error(
        "Photo must be a JPG, PNG, or WebP file smaller than 8 MB.",
      );
    }
  }
  function toItem(doc) {
    return { id: doc.id, ...doc.data() };
  }
  async function createListing({
    formValues,
    currentUser,
    firestore,
    storage,
    photoFile,
  } = {}) {
    const sellerUid = assertUser(currentUser);
    if (!firestore || typeof firestore.collection !== "function")
      throw new Error("Firestore is not configured.");
    const clean = validateListing(formValues);
    verifyFile(photoFile);
    let photoRef,
      image = "";
    if (photoFile) {
      if (!storage || typeof storage.ref !== "function")
        throw new Error(
          "Firebase Storage is not configured for photo uploads.",
        );
      const extension = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      }[photoFile.type];
      const token =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      photoRef = storage
        .ref()
        .child(`listing-photos/${sellerUid}/${token}.${extension}`);
      await photoRef.put(photoFile, { contentType: photoFile.type });
      image = await photoRef.getDownloadURL();
    }
    const now = new Date().toISOString();
    const listing = {
      ...clean,
      image,
      status: "Available",
      visibility: "public",
      sellerUid,
      seller:
        text(currentUser.displayName) ||
        text(currentUser.email) ||
        "XU Student",
      createdAt: now,
      updatedAt: now,
    };
    try {
      const ref = await firestore.collection(COLLECTION).add(listing);
      return { id: ref.id, ...listing, owner: true };
    } catch (error) {
      // Avoid retaining an orphaned upload if database insertion failed.
      if (photoRef) await photoRef.delete().catch(() => {});
      throw error;
    }
  }
  async function fetchListings({ firestore, status, limit = 100 } = {}) {
    if (!firestore || typeof firestore.collection !== "function")
      throw new Error("Firestore is not configured.");
    const count = Math.min(100, Math.max(1, Number(limit) || 100));
    let q = firestore
      .collection(COLLECTION)
      .where("visibility", "==", "public");
    if (status && ["Available", "Reserved", "Sold"].includes(status))
      q = q.where("status", "==", status);
    const snapshot = await q.limit(count).get();
    return snapshot.docs.map(toItem);
  }
  root.XUThriftFeatures = root.XUThriftFeatures || {};
  root.XUThriftFeatures.itemListings = {
    validateListing,
    createListing,
    fetchListings,
    normalizeFacebook,
    normalizePhone,
  };
})(typeof window !== "undefined" ? window : globalThis);
