# AdMob — MDCAT Prep

Created 9 Nov 2026 in the AdMob account **homilabs.smc@gmail.com** (publisher `pub-2087846699268567`).

| What | ID |
|---|---|
| App (Android) | `ca-app-pub-2087846699268567~3593162933` |
| Interstitial ad unit `mdcat_interstitial_between_sessions` | `ca-app-pub-2087846699268567/6626520380` |

These IDs are not secrets: they ship inside the APK.

## Status
- The AdMob app is not yet linked to a store, so ad serving is **limited** ("Requires review"). After the app is live on Google Play, use **Add store** in AdMob to link the Play listing; review usually takes a few days.
- The SDK is wired in during piece 11 (Capacitor Android). Rules from the locked scope (`docs/scope-v1.md`):
  - interstitial only **between sessions** (after a practice set's results or a mock's results), never during a question set or a mock;
  - use Google's **test** ad unit while developing; switch to the real unit only for the release build;
  - add `app-ads.txt` on homilabs.org if not already covering this publisher ID.
