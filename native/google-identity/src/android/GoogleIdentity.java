package ph.edu.xu.identity;

import android.app.Activity;
import androidx.credentials.ClearCredentialStateRequest;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.ClearCredentialException;
import androidx.credentials.exceptions.GetCredentialException;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;

public final class GoogleIdentity extends CordovaPlugin {
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callback) {
        Activity activity = cordova.getActivity();
        CredentialManager manager = CredentialManager.create(activity);
        if ("clear".equals(action)) {
            manager.clearCredentialStateAsync(new ClearCredentialStateRequest(), null,
                activity::runOnUiThread, new CredentialManagerCallback<Void, ClearCredentialException>() {
                    public void onResult(Void ignored) { callback.success(); }
                    public void onError(ClearCredentialException error) {
                        callback.error("Google account selection could not be reset.");
                    }
                });
            return true;
        }
        if (!"signIn".equals(action)) return false;
        String clientId = preferences.getString("GoogleWebClientId", "");
        if (!clientId.endsWith(".apps.googleusercontent.com")) {
            callback.error("Android sign-in needs the project's Web OAuth client ID. Use the hosted app in Chrome.");
            return true;
        }
        GetCredentialRequest request = new GetCredentialRequest.Builder()
            .addCredentialOption(new GetSignInWithGoogleOption.Builder(clientId).build()).build();
        activity.runOnUiThread(() -> manager.getCredentialAsync(activity, request, null,
            activity::runOnUiThread, new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                public void onResult(GetCredentialResponse result) {
                    Credential credential = result.getCredential();
                    if (credential instanceof CustomCredential &&
                        GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {
                        try {
                            callback.success(GoogleIdTokenCredential.createFrom(credential.getData()).getIdToken());
                            return;
                        } catch (Exception ignored) { /* No token content is logged. */ }
                    }
                    callback.error("Google did not return a usable credential.");
                }
                public void onError(GetCredentialException error) {
                    callback.error("Google sign-in did not finish. Check the selected account and Android OAuth configuration.");
                }
            }));
        return true;
    }
}
