package com.propertyempire.game;

import android.app.Activity;
import android.content.SharedPreferences;
import android.util.Log;

import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.ProductDetailsResponseListener;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import java.util.Collections;
import java.util.List;

/**
 * Manages Google Play Billing for the "Remove Ads" in-app purchase ($3.99).
 *
 * Product ID: "remove_ads" — configure this in Google Play Console as a
 * one-time (non-consumable) in-app product at $3.99.
 */
public class NativeBillingManager implements PurchasesUpdatedListener {

    private static final String TAG = "PE_Billing";
    private static final String PRODUCT_ID = "remove_ads";
    private static final String PREFS_NAME = "pe_billing";
    private static final String PREF_ADS_REMOVED = "ads_removed";

    private final Activity activity;
    private final Callback callback;
    private BillingClient billingClient;
    private ProductDetails removeAdsProduct;

    public interface Callback {
        void onAdsRemoved();
    }

    public NativeBillingManager(Activity activity, Callback callback) {
        this.activity = activity;
        this.callback = callback;

        billingClient = BillingClient.newBuilder(activity)
            .setListener(this)
            .enablePendingPurchases()
            .build();

        connectBillingClient();
    }

    private void connectBillingClient() {
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    Log.d(TAG, "Billing client connected");
                    queryProduct();
                    checkExistingPurchases();
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
            } else {
                Log.e(TAG, "Failed to query product: " + result.getDebugMessage());
            }
        });
    }

    /** Check if user already purchased "remove_ads" (e.g., reinstall) */
    private void checkExistingPurchases() {
        billingClient.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build(),
            (result, purchases) -> {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    for (Purchase purchase : purchases) {
                        if (purchase.getProducts().contains(PRODUCT_ID)
                            && purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                            markAdsRemoved();
                            return;
                        }
                    }
                }
            }
        );
    }

    /** Launch the Google Play purchase flow */
    public void purchaseRemoveAds() {
        if (removeAdsProduct == null) {
            Log.e(TAG, "Product not loaded yet");
            // Try reconnecting
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
        checkExistingPurchases();
    }

    /** Called by Google Play when a purchase completes or is cancelled */
    @Override
    public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                if (purchase.getProducts().contains(PRODUCT_ID)
                    && purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
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

    /** Persist "ads removed" and notify callback */
    private void markAdsRemoved() {
        SharedPreferences prefs = activity.getSharedPreferences(PREFS_NAME, Activity.MODE_PRIVATE);
        prefs.edit().putBoolean(PREF_ADS_REMOVED, true).apply();
        Log.d(TAG, "Ads removed — purchase saved");
        callback.onAdsRemoved();
    }

    /** Check stored purchase state */
    public boolean isAdsRemoved() {
        SharedPreferences prefs = activity.getSharedPreferences(PREFS_NAME, Activity.MODE_PRIVATE);
        return prefs.getBoolean(PREF_ADS_REMOVED, false);
    }
}
