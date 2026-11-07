(function (root) {
  "use strict";
  const MAX_IMAGE = 8 * 1024 * 1024;
  const MAX_INLINE_IMAGE_CHARS = 150000; // ~110 KB JPEG thumbnail; well within Firestore's 1 MiB document limit.
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
  // Free Spark-plan fallback: store a SMALL, compressed JPEG thumbnail with the
  // Firestore listing document. This is for a school project, not a production
  // replacement for Cloud Storage.
  async function compressPhotoForFirestore(file) {
    verifyFile(file);
    if (typeof FileReader === "undefined" || typeof Image === "undefined" ||
        typeof document === "undefined") {
      throw new Error("Photo processing requires a browser with image and canvas support.");
    }
    const source = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Unable to read the selected photo."));
      reader.readAsDataURL(file);
    });
    const picture = new Image();
    await new Promise((resolve, reject) => {
      picture.onload = resolve;
      picture.onerror = () => reject(new Error("This photo cannot be opened. Try another JPG, PNG or WebP."));
      picture.src = source;
    });
    const width = picture.naturalWidth || picture.width;
    const height = picture.naturalHeight || picture.height;
    if (!width || !height) throw new Error("The selected photo has invalid dimensions.");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image compression is not supported in this browser.");
    for (const maxSide of [640, 480, 360, 260, 180]) {
      const scale = Math.min(1, maxSide / Math.max(width, height));
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      context.fillStyle = "#ffffff"; // White backdrop for transparent PNGs.
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(picture, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.72, 0.54, 0.40, 0.28]) {
        const jpeg = canvas.toDataURL("image/jpeg", quality);
        if (jpeg.startsWith("data:image/jpeg;base64,") &&
            jpeg.length <= MAX_INLINE_IMAGE_CHARS) {
          return jpeg;
        }
      }
    }
    throw new Error("This photo cannot be compressed small enough. Try a simpler photo.");
  }
  function checkInlinePhoto(dataUrl) {
    if (typeof dataUrl !== "string" ||
        dataUrl.length > MAX_INLINE_IMAGE_CHARS ||
        !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(dataUrl)) {
      throw new Error("The photo thumbnail is invalid or too large.");
    }
    return dataUrl;
  }
  function toItem(doc) {
    return { id: doc.id, ...doc.data() };
  }
  async function createListing({
    formValues,
    currentUser,
    firestore,
    photoFile,
    photoEncoder = compressPhotoForFirestore,
  } = {}) {
    const sellerUid = assertUser(currentUser);
    if (!firestore || typeof firestore.collection !== "function")
      throw new Error("Firestore is not configured.");
    const clean = validateListing(formValues);
    verifyFile(photoFile);
    // Firebase Storage is unavailable on Spark. Generate a compact JPG data URL
    // and store it in the Firestore 'image' field alongside the listing instead.
    // If compression fails, report the error rather than silently losing a photo.
    const image = photoFile ? checkInlinePhoto(await photoEncoder(photoFile)) : "";
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
    const ref = await firestore.collection(COLLECTION).add(listing);
    return { id: ref.id, ...listing, owner: true };
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
    compressPhotoForFirestore,
    MAX_INLINE_IMAGE_CHARS,
  };
})(typeof window !== "undefined" ? window : globalThis);
