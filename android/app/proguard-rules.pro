# ===== Property Empire — ProGuard / R8 Rules =====

# Keep the JS bridge methods (called by name from JavaScript)
-keepclassmembers class com.propertyempire.game.MainActivity$JSBridge {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep WebView JavaScript interface annotation
-keepattributes JavascriptInterface

# Google Play Billing — keep billing classes
-keep class com.android.billingclient.** { *; }
-keep interface com.android.billingclient.** { *; }

# Google Mobile Ads (AdMob)
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.ads.** { *; }

# Keep our integrity/billing classes but obfuscate their internals
-keep class com.propertyempire.game.IntegrityChecker { public *; }
-keep class com.propertyempire.game.NativeBillingManager { public *; }
-keep class com.propertyempire.game.NativeAdManager { public *; }
-keep class com.propertyempire.game.MainActivity { public *; }

# Obfuscate everything else aggressively
-optimizationpasses 5
-allowaccessmodification
-mergeinterfacesaggressively

# Remove all Log calls in release builds (don't leak info to attackers)
-assumenosideeffects class android.util.Log {
    public static int v(...);
    public static int d(...);
    public static int i(...);
    public static int w(...);
}
# Keep Log.e for crash diagnostics
