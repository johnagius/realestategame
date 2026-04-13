# Property Empire — Android APK Build

Wraps the Property Empire web game in a native Android WebView app.

## Prerequisites

- [Android Studio](https://developer.android.com/studio) (Hedgehog or newer)
- JDK 17+
- Android SDK 34

## Build Steps

### 1. Copy web assets into the Android project

```bash
cd android
./copy-web-assets.sh
```

This copies `index.html`, `css/`, `js/`, and `assets/` into `app/src/main/assets/web/`.

### 2. Open in Android Studio

Open the `android/` folder as a project in Android Studio. Let Gradle sync.

### 3. Generate app icon

Replace the placeholder icons in `app/src/main/res/mipmap-*/` with your own. Use Android Studio's **Image Asset** tool (right-click `res` > New > Image Asset) to generate all densities from a single source image.

### 4. Build the APK

- **Debug APK**: Build > Build Bundle(s) / APK(s) > Build APK(s)
- **Release APK**: Build > Generate Signed Bundle / APK, then follow the signing wizard

The debug APK lands at `app/build/outputs/apk/debug/app-debug.apk`.

## What the app does

- Loads the full web game in a fullscreen WebView
- Enables `localStorage` for game saves (persists across app updates)
- Runs in immersive fullscreen mode (hides status/nav bars)
- Keeps screen awake while playing
- Locks to portrait orientation
- Back button is captured (no accidental exits)

## App icon

For now the mipmap folders are empty — Android Studio will use a default icon. To add your own:

1. Create a 1024x1024 PNG icon
2. In Android Studio: right-click `res` > New > Image Asset
3. Select your PNG and generate all densities

## Signing for release

To publish on the Play Store or sideload a release build:

```bash
# Generate a keystore (one-time)
keytool -genkey -v -keystore property-empire.keystore \
  -alias propertyempire -keyalg RSA -keysize 2048 -validity 10000

# Build signed APK via Android Studio's Generate Signed APK wizard
```

Keep `property-empire.keystore` safe and **never commit it to git**.
