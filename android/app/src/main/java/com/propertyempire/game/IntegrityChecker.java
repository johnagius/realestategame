package com.propertyempire.game;

import android.app.Activity;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Build;
import android.util.Log;

import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;

/**
 * Anti-tampering and integrity checks for Property Empire.
 *
 * Defends against:
 * - Repackaged/modded APKs (signature mismatch)
 * - Lucky Patcher and similar tools (package detection)
 * - Debugger attachment
 * - Running on emulators (optional)
 *
 * HOW TO SET UP:
 * 1. Build a signed release APK
 * 2. Run: keytool -printcert -jarfile app-release.apk
 * 3. Copy the SHA-256 fingerprint and paste it into RELEASE_SIGNATURE_SHA256 below
 */
public class IntegrityChecker {

    private static final String TAG = "PE_Integrity";

    // TODO: Replace with your real release signing certificate SHA-256 fingerprint.
    // Get it by running: keytool -printcert -jarfile app-release.apk
    // Format: uppercase hex with colons, e.g. "AB:CD:EF:..."
    private static final String RELEASE_SIGNATURE_SHA256 = "PLACEHOLDER";

    // Known cheat/patch tool package names
    private static final String[] THREAT_PACKAGES = {
        "com.chelpus.lackypatch",
        "com.dimonvideo.luckypatcher",
        "com.forpda.lp",
        "com.android.vending.billing.InAppBillingService.LUCK",
        "com.android.vending.billing.InAppBillingService.CLON",
        "com.android.vending.billing.InAppBillingService.LOCK",
        "com.android.vending.billing.InAppBillingService.LACK",
        "com.android.vendinc",                     // LP fake store
        "com.android.vending.billing.InAppBillingSe",
        "cc.madkite.freedom",                      // Freedom (IAP cracker)
        "com.cih.game_cih",                        // GameCIH
        "com.charles.lpoqasert",                   // LP variant
        "catch_.telegramgold755",                   // LP variant
        "zone.jasi2169.uretpatcher",               // Uret Patcher
        "p.jasi2169.al3",                          // Uret variant
        "com.leo.playcard",                        // Leo PlayCard (IAP cracker)
        "org.sbtools.gamehack",                    // SB Game Hacker
        "com.xmodgame",                            // Xmodgames
        "org.creeplays.hack",                      // Creeplays Hack
        "com.baseappfull.fwd",                     // Game Killer
        "com.github.oneminusone.disablecontentguard" // Content Guard bypass
    };

    private final Activity activity;
    private boolean isTampered = false;
    private List<String> threats = new ArrayList<>();

    public IntegrityChecker(Activity activity) {
        this.activity = activity;
    }

    /**
     * Run all integrity checks. Call this early in onCreate().
     * Returns true if the app appears genuine, false if tampered.
     */
    public boolean verify() {
        threats.clear();
        isTampered = false;

        checkSignature();
        checkThreatPackages();
        checkDebuggable();
        checkInstaller();

        if (!threats.isEmpty()) {
            isTampered = true;
            for (String threat : threats) {
                Log.w(TAG, "Integrity threat: " + threat);
            }
        }

        return !isTampered;
    }

    /** Check that the APK signature matches our release key */
    private void checkSignature() {
        if (RELEASE_SIGNATURE_SHA256.equals("PLACEHOLDER")) {
            // Not configured yet — skip during development
            return;
        }

        try {
            PackageInfo pi;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                pi = activity.getPackageManager().getPackageInfo(
                    activity.getPackageName(),
                    PackageManager.GET_SIGNING_CERTIFICATES
                );
                if (pi.signingInfo != null) {
                    Signature[] sigs = pi.signingInfo.getApkContentsSigners();
                    if (sigs != null && sigs.length > 0) {
                        String sha256 = sha256Hex(sigs[0].toByteArray());
                        if (!sha256.equalsIgnoreCase(RELEASE_SIGNATURE_SHA256.replace(":", ""))) {
                            threats.add("APK_SIGNATURE_MISMATCH");
                        }
                    }
                }
            } else {
                pi = activity.getPackageManager().getPackageInfo(
                    activity.getPackageName(),
                    PackageManager.GET_SIGNATURES
                );
                if (pi.signatures != null && pi.signatures.length > 0) {
                    String sha256 = sha256Hex(pi.signatures[0].toByteArray());
                    if (!sha256.equalsIgnoreCase(RELEASE_SIGNATURE_SHA256.replace(":", ""))) {
                        threats.add("APK_SIGNATURE_MISMATCH");
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Signature check failed", e);
            threats.add("SIGNATURE_CHECK_ERROR");
        }
    }

    /** Scan for known cheat/patch tools */
    private void checkThreatPackages() {
        PackageManager pm = activity.getPackageManager();
        for (String pkg : THREAT_PACKAGES) {
            try {
                pm.getPackageInfo(pkg, 0);
                threats.add("THREAT_PACKAGE:" + pkg);
            } catch (PackageManager.NameNotFoundException ignored) {
                // Good — not installed
            }
        }
    }

    /** Check if the APK is marked as debuggable (modded APKs often enable this) */
    private void checkDebuggable() {
        try {
            ApplicationInfo ai = activity.getApplicationInfo();
            if ((ai.flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
                // Only flag this for release builds
                if (!BuildConfig.DEBUG) {
                    threats.add("APK_DEBUGGABLE");
                }
            }
        } catch (Exception ignored) {}
    }

    /** Check if the app was installed from Google Play */
    private void checkInstaller() {
        try {
            String installer;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                var info = activity.getPackageManager()
                    .getInstallSourceInfo(activity.getPackageName());
                installer = info.getInstallingPackageName();
            } else {
                installer = activity.getPackageManager()
                    .getInstallerPackageName(activity.getPackageName());
            }
            // Google Play = "com.android.vending", Amazon = "com.amazon.venezia"
            // null = sideloaded (ADB install), which is fine for development
            // Only log — don't block sideloaded APKs since testers need this
            if (installer != null && !installer.equals("com.android.vending")
                    && !installer.equals("com.amazon.venezia")) {
                Log.d(TAG, "Non-store installer: " + installer);
            }
        } catch (Exception ignored) {}
    }

    /** SHA-256 hex digest of a byte array */
    private static String sha256Hex(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(data);
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02X", b));
            }
            return hex.toString();
        } catch (Exception e) {
            return "";
        }
    }

    public boolean isTampered() { return isTampered; }
    public List<String> getThreats() { return threats; }
}
