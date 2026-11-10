#!/usr/bin/env bash
# Builds the signed release: .aab for Play and .apk for a sideload test, in
# releases/<versionName>-<versionCode>/ (gitignored). Live ad unit only here.
# Usage: bash scripts/release.sh
set -euo pipefail
cd "$(dirname "$0")/.."
LIVE="ca-app-pub-2087846699268567/6626520380"
TEST="ca-app-pub-3940256099942544/1033173712"
APPID="ca-app-pub-2087846699268567~3593162933"

[ -f android/keystore.properties ] || { echo "FAIL: android/keystore.properties missing (see .secrets/)"; exit 1; }
avail=$(free -g | awk '/Mem:/{print $7}')
[ "$avail" -ge 4 ] || { echo "FAIL: only ${avail} GiB RAM available, need 4"; exit 1; }

npm run build:release
grep -q "$LIVE" www/index.html || { echo "FAIL: live ad unit missing from www/index.html"; exit 1; }
! grep -q "$TEST" www/index.html || { echo "FAIL: test ad unit still in www/index.html"; exit 1; }
grep -q "$APPID" android/app/src/main/AndroidManifest.xml || { echo "FAIL: AdMob app id missing from manifest"; exit 1; }
npx cap sync android

ver=$(sed -n 's/.*versionName "\(.*\)".*/\1/p' android/app/build.gradle)
code=$(sed -n 's/.*versionCode \([0-9]*\).*/\1/p' android/app/build.gradle)
out="releases/${ver}-${code}"
jobq run --name mdcat-release -- bash -c "cd android && ./gradlew bundleRelease assembleRelease --no-daemon"
(cd android && ./gradlew --stop >/dev/null)
mkdir -p "$out"
cp android/app/build/outputs/bundle/release/app-release.aab "$out/mdcat-prep-${ver}-${code}.aab"
cp android/app/build/outputs/apk/release/app-release.apk "$out/mdcat-prep-${ver}-${code}.apk"

# Put the test unit back so debug builds and the committed dist never serve live ads.
npm run build >/dev/null
npx cap sync android >/dev/null
echo "OK: $out"; ls -la "$out"
