package com.propertyempire.game;

import android.app.Activity;
import android.util.Log;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;

/**
 * Manages AdMob interstitial ads for Property Empire.
 *
 * TODO: Replace the test ad unit ID with your real one from AdMob console.
 */
public class NativeAdManager {

    private static final String TAG = "PE_Ads";

    // Property Empire interstitial ad unit (Month Advance)
    private static final String INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-4133931500169713/4880162901";

    private final Activity activity;
    private final DismissListener dismissListener;
    private InterstitialAd interstitialAd;
    private boolean isLoading = false;

    public interface DismissListener {
        void onAdDismissed();
    }

    public NativeAdManager(Activity activity, DismissListener listener) {
        this.activity = activity;
        this.dismissListener = listener;

        // Initialize the Mobile Ads SDK
        MobileAds.initialize(activity, initStatus -> {
            Log.d(TAG, "AdMob SDK initialized");
            loadInterstitial();
        });
    }

    /** Pre-load an interstitial so it's ready when needed */
    public void loadInterstitial() {
        if (isLoading || interstitialAd != null) return;

        isLoading = true;
        AdRequest adRequest = new AdRequest.Builder().build();

        InterstitialAd.load(activity, INTERSTITIAL_AD_UNIT_ID, adRequest,
            new InterstitialAdLoadCallback() {
                @Override
                public void onAdLoaded(InterstitialAd ad) {
                    Log.d(TAG, "Interstitial loaded");
                    interstitialAd = ad;
                    isLoading = false;

                    ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                        @Override
                        public void onAdDismissedFullScreenContent() {
                            Log.d(TAG, "Interstitial dismissed");
                            interstitialAd = null;
                            loadInterstitial();
                            dismissListener.onAdDismissed();
                        }

                        @Override
                        public void onAdFailedToShowFullScreenContent(AdError error) {
                            Log.e(TAG, "Interstitial failed to show: " + error.getMessage());
                            interstitialAd = null;
                            loadInterstitial();
                            dismissListener.onAdDismissed();
                        }
                    });
                }

                @Override
                public void onAdFailedToLoad(LoadAdError error) {
                    Log.e(TAG, "Interstitial failed to load: " + error.getMessage());
                    interstitialAd = null;
                    isLoading = false;
                }
            });
    }

    /** Show the interstitial ad if one is loaded */
    public void showInterstitial() {
        activity.runOnUiThread(() -> {
            if (activity.isFinishing()) return;
            if (interstitialAd != null) {
                interstitialAd.show(activity);
            } else {
                Log.d(TAG, "Interstitial not ready, loading for next time");
                loadInterstitial();
                // No ad to show — notify immediately so _adShowing gets cleared
                dismissListener.onAdDismissed();
            }
        });
    }
}
