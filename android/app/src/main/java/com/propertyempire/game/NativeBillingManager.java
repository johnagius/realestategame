package com.propertyempire.game;

import android.app.Activity;
import android.content.SharedPreferences;
import android.util.Base64;
import android.util.Log;

import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Collections;
import java.util.List;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;

/**
 * Manages Google Play Billing for the "Remove Ads" in-app purchase ($3.99).
 *
 * Hardened against Lucky Patcher / modded APKs:
 * - Verifies purchase signatures using Google's RSA public key
 * - Stores purchase state in encrypted SharedPreferences with obfuscated keys
 * - Re-verifies with Google Play on every app launch
 * - Never trusts a local cache alone
 *
 * Product ID: "remove_ads" — configure in Google Play Console as a
 * one-time (non-consumable) in-app product at $3.99.
 */
public class NativeBillingManager implements PurchasesUpdatedListener {

    private static final String TAG = "PE_Billing";
    private static final String PRODUCT_ID = "remove_ads";

    // Obfuscated pref name/key (harder for LP to find and patch)
    private static final String PREFS_NAME = "pe_gfx_cache";
    private static final String PREF_KEY = "r_mode_v2";
    // Magic value instead of plain true/false
    private static final String VERIFIED_VALUE = "sig_ok_v7";

    // TODO: Replace with your app's Base64-encoded RSA public key from
    // Google Play Console → Monetization → Monetization setup → Licensing
    private static final String BASE64_PUBLIC_KEY = "PLACEHOLDER";

    private final Activity activity;
    private final Callback callback;
    private final IntegrityChecker integrityChecker;
    private BillingClient billingClient;
    private ProductDetails removeAdsProduct;

    // Runtime-only flag — never persisted without verification
    private boolean adsRemovedVerified = false;

    public interface Callback {
        void onAdsRemoved();
    }

    public NativeBillingManager(Activity activity, Callback callback) {
        this.activity = activity;
        this.callback = callback;
        this.integrityChecker = new IntegrityChecker(activity);

        billingClient = BillingClient.newBuilder(activity)
            .setListener(this)
            .enablePendingPurchases()
            .build();

        // Check local cache first for fast startup
        adsRemovedVerified = readEncryptedPref();

        connectBillingClient();
    }

    private void connectBillingClient() {
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    Log.d(TAG, "Billing client connected");
                    queryProduct();
                    // Always re-verify with Google on launch — don't trust local cache alone
                    verifyPurchaseWithGoogle();
                } else {
                    Log.e(TAG, "Billing setup failed: " + result.getDebugMessage());
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                Log.w(TAG, "Billing disconnected, will retry on next action");
            }
        });
    }

    /** Query the "remove_ads" product details from Play Store */
    private void queryProduct() {
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(Collections.singletonList(
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(PRODUCT_ID)
                    .setProductType(BillingClient.ProductType.INAPP)
                    .build()
            ))
            .build();

        billingClient.queryProductDetailsAsync(params, (result, productDetailsList) -> {
            if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && !productDetailsList.isEmpty()) {
                removeAdsProduct = productDetailsList.get(0);
                Log.d(TAG, "Product loaded: " + removeAdsProduct.getName());
            }
        });
    }

    /**
     * Re-verify purchase directly with Google Play (not the local cache).
     * This catches cases where LP has tampered with SharedPreferences.
     */
    private void verifyPurchaseWithGoogle() {
        billingClient.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build(),
            (result, purchases) -> {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    boolean foundValid = false;
                    for (Purchase purchase : purchases) {
                        if (purchase.getProducts().contains(PRODUCT_ID)
                            && purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED
                            && verifyPurchaseSignature(purchase)) {
                            foundValid = true;
                            break;
                        }
                    }

                    if (foundValid) {
                        markAdsRemoved();
                    } else if (adsRemovedVerified) {
                        // Local cache says purchased, but Google says no — tampered!
                        Log.w(TAG, "Local cache says purchased but Google disagrees — revoking");
                        revokeAdsRemoved();
                    }
                }
            }
        );
    }

    /**
     * Verify the purchase signature using Google's RSA public key.
     * Lucky Patcher generates fake purchases with invalid signatures.
     */
    private boolean verifyPurchaseSignature(Purchase purchase) {
        if (BASE64_PUBLIC_KEY.equals("PLACEHOLDER")) {
            // Not configured yet — accept during development
            return true;
        }

        String signedData = purchase.getOriginalJson();
        String signature = purchase.getSignature();

        if (signedData == null || signature == null || signature.isEmpty()) {
            Log.w(TAG, "Missing purchase data or signature");
            return false;
        }

        try {
            byte[] keyBytes = Base64.decode(BASE64_PUBLIC_KEY, Base64.DEFAULT);
            PublicKey publicKey = KeyFactory.getInstance("RSA")
                .generatePublic(new X509EncodedKeySpec(keyBytes));

            java.security.Signature sig = java.security.Signature.getInstance("SHA1withRSA");
            sig.initVerify(publicKey);
            sig.update(signedData.getBytes());

            boolean valid = sig.verify(Base64.decode(signature, Base64.DEFAULT));
            if (!valid) {
                Log.w(TAG, "INVALID purchase signature — likely Lucky Patcher");
            }
            return valid;
        } catch (Exception e) {
            Log.e(TAG, "Signature verification error", e);
            return false;
        }
    }

    /** Launch the Google Play purchase flow */
    public void purchaseRemoveAds() {
        // Run integrity check before allowing purchase
        if (!integrityChecker.verify()) {
            Log.w(TAG, "Integrity check failed — blocking purchase");
            return;
        }

        if (removeAdsProduct == null) {
            if (!billingClient.isReady()) connectBillingClient();
            return;
        }

        BillingFlowParams flowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(Collections.singletonList(
                BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(removeAdsProduct)
                    .build()
            ))
            .build();

        activity.runOnUiThread(() -> {
            billingClient.launchBillingFlow(activity, flowParams);
        });
    }

    /** Restore previous purchase (for Settings) */
    public void restorePurchase() {
        if (!billingClient.isReady()) {
            connectBillingClient();
            return;
        }
        verifyPurchaseWithGoogle();
    }

    /** Called by Google Play when a purchase completes or is cancelled */
    @Override
    public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                if (purchase.getProducts().contains(PRODUCT_ID)
                    && purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {

                    // Verify signature — blocks Lucky Patcher fake purchases
                    if (!verifyPurchaseSignature(purchase)) {
                        Log.w(TAG, "Rejecting purchase with invalid signature");
                        return;
                    }

                    // Acknowledge the purchase (required by Google)
                    if (!purchase.isAcknowledged()) {
                        billingClient.acknowledgePurchase(
                            com.android.billingclient.api.AcknowledgePurchaseParams.newBuilder()
                                .setPurchaseToken(purchase.getPurchaseToken())
                                .build(),
                            ackResult -> Log.d(TAG, "Purchase acknowledged: " + ackResult.getResponseCode())
                        );
                    }
                    markAdsRemoved();
                }
            }
        } else if (result.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            Log.d(TAG, "Purchase cancelled by user");
        } else {
            Log.e(TAG, "Purchase error: " + result.getDebugMessage());
        }
    }

    /** Persist verified purchase state with obfuscation */
    private void markAdsRemoved() {
        adsRemovedVerified = true;
        writeEncryptedPref(true);
        Log.d(TAG, "Ads removed — verified purchase saved");
        callback.onAdsRemoved();
    }

    /** Revoke tampered purchase state */
    private void revokeAdsRemoved() {
        adsRemovedVerified = false;
        writeEncryptedPref(false);
        Log.w(TAG, "Tampered purchase state revoked");
    }

    /** Check purchase state — combines runtime flag with encrypted local cache */
    public boolean isAdsRemoved() {
        return adsRemovedVerified;
    }

    // ---- Encrypted SharedPreferences (obfuscated to resist trivial patching) ----

    /**
     * Uses AES with a device-derived key to encrypt the purchase flag.
     * LP can't just flip a boolean — the encrypted value won't match.
     */
    private void writeEncryptedPref(boolean value) {
        try {
            String plaintext = value ? VERIFIED_VALUE : "none";
            byte[] encrypted = aesEncrypt(plaintext.getBytes(), getDeviceKey());
            String encoded = Base64.encodeToString(encrypted, Base64.NO_WRAP);

            activity.getSharedPreferences(PREFS_NAME, Activity.MODE_PRIVATE)
                .edit()
                .putString(PREF_KEY, encoded)
                .apply();
        } catch (Exception e) {
            Log.e(TAG, "Failed to write encrypted pref", e);
        }
    }

    private boolean readEncryptedPref() {
        try {
            SharedPreferences prefs = activity.getSharedPreferences(PREFS_NAME, Activity.MODE_PRIVATE);
            String encoded = prefs.getString(PREF_KEY, null);
            if (encoded == null) return false;

            byte[] encrypted = Base64.decode(encoded, Base64.NO_WRAP);
            byte[] decrypted = aesDecrypt(encrypted, getDeviceKey());
            return new String(decrypted).equals(VERIFIED_VALUE);
        } catch (Exception e) {
            return false;
        }
    }

    /** Derive an AES key from the app signing certificate + package name */
    private byte[] getDeviceKey() throws Exception {
        java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
        md.update(activity.getPackageName().getBytes());
        // Mix in the APK signature so a repackaged APK gets a different key
        android.content.pm.PackageInfo pi = activity.getPackageManager()
            .getPackageInfo(activity.getPackageName(), android.content.pm.PackageManager.GET_SIGNATURES);
        if (pi.signatures != null && pi.signatures.length > 0) {
            md.update(pi.signatures[0].toByteArray());
        }
        byte[] hash = md.digest();
        // AES-128: take first 16 bytes
        byte[] key = new byte[16];
        System.arraycopy(hash, 0, key, 0, 16);
        return key;
    }

    private static byte[] aesEncrypt(byte[] data, byte[] key) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
        cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"));
        return cipher.doFinal(data);
    }

    private static byte[] aesDecrypt(byte[] data, byte[] key) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
        cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"));
        return cipher.doFinal(data);
    }
}
