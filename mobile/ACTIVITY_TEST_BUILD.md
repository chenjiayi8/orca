# Android Activity View test build

The host sidebar bell and **View activity** menu switch between workspaces and individual agent sessions. Waiting, Working, Monitoring and Done groups show session counts. Cards open the exact session. Search includes conversation titles, messages, projects and branches. The selected view is stored separately for each paired host.

The list uses the existing unfiltered `worktree.ps` catalog, including its completed agent rows. It does not reconstruct sessions the paired host no longer publishes. Status freshness and failure indicators use the existing desktop/mobile rules.

## Build

Install root and mobile dependencies with their committed lockfiles. With JDK 21 and Android SDK 36 available:

```sh
pnpm build:mobile-web
node mobile/scripts/bundle-activity-test-page.mjs
cd mobile
ORCA_ACTIVITY_TEST_BUILD=1 pnpm exec expo prebuild --platform android --no-install --clean
ORCA_ACTIVITY_TEST_BUILD=1 ./android/gradlew -p android assembleRelease \
  -PreactNativeArchitectures=arm64-v8a,x86_64 --max-workers=4
```

Set `ANDROID_HOME` to the SDK directory when it is not already configured. The APK is `android/app/build/outputs/apk/release/app-release.apk`.

The bundling script temporarily replaces `src/mobile-web-shell/bundled-activity-page-data.json` (normally `null`) with the verified web page bytes. Restore that file to `null` after building; generated payloads should not be committed. Ordinary builds with `null` continue using the host-delivered web page. To ship this feature normally, the desktop's mobile web bundle must include these changes.

## Install and test

The test variant is named **Orca Activity**, package `com.chenjiayi8.orca.activity`, so it installs alongside official Orca. Pair it to your desktop using the existing QR/paste flow, open the host and tap the bell or **⋯ → View activity**. Test builds use the local Android debug signing key. Firebase push notifications are unavailable in this separate package; foreground activity and sessions use the normal authenticated connection.

For isolated emulator testing, run:

```sh
MOCK_ACTIVITY_VIEW=1 PORT=16768 MOCK_SERVER_KEY_FILE=/tmp/orca-activity-mock-key pnpm mock-server
```

The scenario exposes fourteen sessions sharing one workspace: two needing input, five working, one monitoring and six done. Use the mock server's printed public key, endpoint and `mock-device-token` to pair. `adb reverse tcp:16768 tcp:16768` makes the host endpoint reachable as `ws://127.0.0.1:16768` inside the emulator.
