package com.propertyempire.game;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity
        implements NativeBillingManager.Callback, NativeAdManager.DismissListener {

    private static final String TAG = "PE_Main";

    private WebView webView;
    private NativeAdManager adManager;
    private NativeBillingManager billingManager;
    private boolean appIsGenuine = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Fullscreen immersive mode
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );

        // Set status bar color to match game theme
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().setStatusBarColor(0xFF2B1810);
        }

        setContentView(R.layout.activity_main);

        // Run integrity checks before initializing monetization
        IntegrityChecker integrity = new IntegrityChecker(this);
        boolean isGenuine = integrity.verify();

        // Initialize ads and billing
        adManager = new NativeAdManager(this, this);
        billingManager = new NativeBillingManager(this, this);

        // If tampered, force ads on and block ad removal purchases
        appIsGenuine = isGenuine;
        if (!isGenuine) {
            Log.w(TAG, "Integrity check failed — app may be tampered");
        }

        webView = findViewById(R.id.webview);

        // Configure WebView settings
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);          // localStorage for game saves
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMediaPlaybackRequiresUserGesture(false); // allow game audio
        settings.setTextZoom(100);                     // prevent system font scaling

        // Register the JS-to-native bridge
        webView.addJavascriptInterface(new JSBridge(), "PropertyEmpireBridge");

        // Prevent links from opening in external browser
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        // Keep screen on while playing
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Load the game
        webView.loadUrl("file:///android_asset/web/index.html");
    }

    /**
     * JavaScript bridge — exposed to the web game as window.PropertyEmpireBridge.
     * The JS AdManager calls these methods to show ads and handle purchases.
     */
    private class JSBridge {

        @JavascriptInterface
        public void showInterstitial() {
            // Tampered apps always see ads
            if (!appIsGenuine || !billingManager.isAdsRemoved()) {
                adManager.showInterstitial();
            }
        }

        @JavascriptInterface
        public boolean isAdsRemoved() {
            // Tampered apps never get ad-free status
            return appIsGenuine && billingManager.isAdsRemoved();
        }

        @JavascriptInterface
        public void purchaseRemoveAds() {
            billingManager.purchaseRemoveAds();
        }

        @JavascriptInterface
        public void restorePurchase() {
            billingManager.restorePurchase();
        }
    }

    /** Called by NativeAdManager when an interstitial is dismissed or fails to show */
    @Override
    public void onAdDismissed() {
        runOnUiThread(() -> {
            if (isFinishing() || webView == null) return;
            webView.evaluateJavascript(
                "if(typeof AdManager!=='undefined'){AdManager._onAdDismissed();}",
                null
            );
        });
    }

    /** Called by NativeAdManager when no ad is available — JS shows web fallback */
    @Override
    public void onAdNotAvailable() {
        runOnUiThread(() -> {
            if (isFinishing() || webView == null) return;
            webView.evaluateJavascript(
                "if(typeof AdManager!=='undefined'){AdManager._showWebInterstitial();}",
                null
            );
        });
    }

    /** Called by NativeBillingManager when "Remove Ads" purchase is confirmed */
    @Override
    public void onAdsRemoved() {
        Log.d(TAG, "Ads removed — notifying WebView");
        runOnUiThread(() -> {
            if (isFinishing() || webView == null) return;
            webView.evaluateJavascript(
                "if(typeof AdManager!=='undefined'){AdManager._onAdsRemoved();}",
                null
            );
        });
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        }
        // Don't call super — prevent accidental exit while playing
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            // Re-enter immersive mode
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            );
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) webView.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }
}
