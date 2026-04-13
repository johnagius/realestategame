package com.propertyempire.game;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {

    private WebView webView;

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

        // Prevent links from opening in external browser
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        // Keep screen on while playing
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Load the game
        webView.loadUrl("file:///android_asset/web/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
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
        webView.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }
}
