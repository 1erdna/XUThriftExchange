/* XU ThriftExchange — Google SSO actions for the web preview.
 * Firebase Auth provider must be enabled and an XU identity account verified.
 * The Cordova Android OAuth path is NOT implemented by the web popup SDK.
 */
(function (root) {
  "use strict";
  const allowedEmail = email => /@(my|g)\.xu\.edu\.ph$/i.test(String(email||""));
  async function login() {
    const backend=root.XUThriftBackend;
    if (!backend?.ready) throw new Error("Firebase setup is incomplete. Configure your Firebase Web app first.");
    const user=await backend.signInGoogle();
    if (user === null) return null; // Google redirect will complete on page return.
    if (!user || !allowedEmail(user.email)) {
      await backend.signOut();
      throw new Error("Only verified Xavier University Google accounts can sign in.");
    }
    return user;
  }
  async function logout() {
    if (root.XUThriftBackend?.ready) await root.XUThriftBackend.signOut();
  }
  root.XUThriftSSO={login,logout,allowedEmail};
})(typeof window !== "undefined" ? window : globalThis);
