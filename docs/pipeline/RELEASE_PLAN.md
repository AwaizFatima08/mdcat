# Piece 11: release plan

Locked with Homi on 10 Nov 2026. Modelled on the CSCA kit
(`/mnt/storage/projects/csca/docs/release-and-hosting.md`), which went live on Play 6 Nov 2026.

## Decisions
- **Ads:** AdMob interstitial via `@capacitor-community/admob` (Capacitor 8).
  - Shown only on a results screen: after **every second finished practice set**, and after every
    finished mock's results. Never within **3 minutes** of the previous ad. Never during a question,
    a set or a mock.
  - Debug builds use Google's test unit; only the release build uses
    `ca-app-pub-2087846699268567/6626520380`. A check script fails the release if that is wrong.
  - Google UMP consent at start-up, plus a "Privacy & ad choices" button in About when the form is
    required.
  - No ad in the browser preview: the plugin is absent there and every call is a no-op.
- **Icon and feature graphic:** drawn in code (SVG → PNG), no homidev job.
- **Uploads:** Claude prepares everything. Homi uploads to Play Console and the website, and does
  the AdMob store link and consent message.

## Deliverables
1. About screen: version, privacy/terms links, not-affiliated notice, ad choices, contact.
2. Ads wiring and frequency cap, as above.
3. Launcher icon (all densities + adaptive), splash colour, `store-assets/icon-512.png`,
   `store-assets/feature-graphic.png`.
4. Upload keystore in `.secrets/` (never git), `android/keystore.properties`, signed release
   **.aab** (+ .apk for a sideload test) in `releases/1.0-1/` (gitignored).
5. `website/`: landing, `privacy.html`, `terms.html`, `app-ads.txt` for `mdcat.homilabs.org`.
6. `docs/release-and-hosting.md`: store listing text, Data safety, content rating, target
   audience (16–17 and 18+), and Homi's upload steps.
7. Phone screenshots (2–8) in `store-assets/screenshots/`.
8. Release build smoke-tested on the Tab (ads appear on the test unit in a debug build; release
   build starts and runs).

## Not in this piece
- Homi's content read-throughs (spot checks, cheats, topics) — before production, his call.
- Listing on homilabs.org's portfolio page — after the app is live.
