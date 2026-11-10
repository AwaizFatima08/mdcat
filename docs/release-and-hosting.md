# Release and hosting kit: MDCAT Prep

Piece 11, prepared 10 Nov 2026 (plan: `docs/pipeline/RELEASE_PLAN.md`). Claude prepares, Homi uploads.

## Build
- Package `com.homilabs.mdcatprep` (locked after the first Play upload). Version 1.0.0 (versionCode 1).
- Release build: `bash scripts/release.sh`. It:
  - builds the web app with the **live** ad unit and checks the test unit is gone;
  - runs Gradle through `jobq`;
  - writes `releases/1.0.0-1/mdcat-prep-1.0.0-1.aab` (upload this to Play) and `.apk` (sideload test);
  - puts the test unit back.
  Everything else (`npm run build`, debug APKs, the committed `dist/`) always uses Google's test unit.
- Before every release:
  - bump `versionCode`/`versionName` in `android/app/build.gradle` and `version` in `package.json`;
  - `npm run build` must pass all content checks.
- **Signing:**
  - Upload key created 10 Nov 2026: `.secrets/mdcat-upload.keystore`, alias `mdcat-upload`, RSA 2048, valid 10,000 days.
  - Passwords are in `.secrets/mdcat-upload-keystore-credentials.txt`, read via `android/keystore.properties` (gitignored).
  - Certificate SHA-256 `89:48:D3:CB:F9:F3:69:9D:5C:D6:34:57:A3:AA:9E:CC:F7:36:CF:C8:18:15:4B:78:18:7B:38:3B:81:44:0F:B3`.
  - `.secrets/` goes to the local and Drive backups, never GitHub. Losing it means asking Play support for an upload-key reset.

## Ads (AdMob, account homilabs.smc@gmail.com)
- **App and unit:**
  - App `ca-app-pub-2087846699268567~3593162933`, in `AndroidManifest.xml`.
  - Interstitial `mdcat_interstitial_between_sessions` `ca-app-pub-2087846699268567/6626520380`, in `build/build.js`, release only.
- **When ads show:**
  - after every 2nd finished practice set, and after each finished mock;
  - at least 3 minutes apart;
  - never during a question, a set or a mock.
  - Logic: `adBreak()` in `src/app.js`.
- **Consent:**
  - Google UMP runs at start-up.
  - About shows "Privacy & ad choices" when the form is required.
- `app-ads.txt` is already live on homilabs.org for this publisher id, and a copy is in `website/`.

## Website: https://mdcat.homilabs.org
- Folder `website/`, with these files:
  - `index.html` (landing);
  - `privacy.html`;
  - `terms.html`;
  - `app-ads.txt`;
  - `style.css`;
  - `img/`.
- Hostinger subdomain `mdcat.homilabs.org`, document root `public_html/mdcat`, created 9 Nov 2026.
- To publish: upload the **contents** of `website/` to `public_html/mdcat` (hPanel File Manager, or SSH port 65002 as for homilabs.org), then flush the CDN cache.
- After the app is live, replace "Coming soon on Google Play" in `index.html` with the Play link.

## Play Console listing

| Item | Value |
|---|---|
| App name (29/30) | `MDCAT Prep: MCQs & Mock Tests` |
| Short description (79/80) | `5,000 MDCAT MCQs and 20 full mocks on the PM&DC 2025 curriculum. Free, offline.` |
| App icon 512×512 | `store-assets/icon-512.png` |
| Feature graphic 1024×500 | `store-assets/feature-graphic.png` |
| Phone screenshots (6, 1080×1920) | `store-assets/screenshots/` (retake: `node scripts/store_screenshots.js` with the preview server on :8767) |
| Category | Education |
| Contact email | homilabs.smc@gmail.com |
| Website | https://mdcat.homilabs.org |
| Privacy policy URL | https://mdcat.homilabs.org/privacy.html |
| App access | All functionality available without login |
| Ads | Yes |
| Content rating | Reference/educational. No to violence, sexuality, language, drugs, gambling, purchases and user interaction |
| Target audience | 16–17 and 18+ (MDCAT candidates are about 17–20). Not directed at children |
| Data safety | **Collected and shared:** Device or other IDs (advertising ID) and App activity (app interactions) via the Google Mobile Ads SDK, purpose Advertising, shared with Google AdMob. Encrypted in transit. Not required to create an account; no account exists. Practice and mock results stay on the device and are not collected |
| Government apps / financial / health declarations | No / No / No (an education app, not a health service) |

**Full description:**
```
Preparing for MDCAT, Pakistan's entrance test for MBBS and BDS? Practise on the PM&DC 2025 uniform curriculum, unit by unit, and sit full mock papers the way the real test is set.

5,000 PRACTICE MCQs
• Biology, Chemistry, Physics, English and Logical Reasoning, split by unit and topic like the official curriculum.
• Every question is tagged to its learning outcome, with easy, moderate and difficult levels.
• An explanation for every answer.
• A mistakes list to retry, bookmarks, and your accuracy for every unit.

20 FULL MOCK PAPERS
• 180 MCQs in 3 hours, with the official split: Biology 81, Chemistry 45, Physics 36, English 9, Logical Reasoning 9.
• Close to the official difficulty mix: 15% easy, 70% moderate, 15% difficult.
• 3,600 separate questions, so practice never spoils a mock.
• Timer, flags and a question grid; your score, MBBS and BDS pass marks, and results by subject and unit.

MEMORY CHEATS
• 167 one-minute revision cards: mnemonics, comparison tables, formula sheets, reaction maps, English rules and reasoning tricks.

IMPORTANT TOPICS
• Every unit ranked Must-know, Important or Quick win, with the learning outcomes to focus on and your own accuracy next to it.

RULES AND GUIDELINES
• The paper format, passing marks, what to bring and how exam day works.

PRIVATE AND OFFLINE
• No account. Everything works offline and your progress stays on your phone.
• Free, with light ads only between sessions: never during a question, a practice set or a mock.

MDCAT Prep is independent practice material by HomiLabs. It is not affiliated with, endorsed by or connected to the Pakistan Medical & Dental Council (PM&DC), any university or any admissions body. All questions are original practice material, not real or recalled papers. Always check pmdc.pk for official dates, fees and rules.
```

## Homi's steps
1. **Read-throughs (your call how much before production):**
   - spot checks `docs/review/*-spotcheck.md`;
   - `docs/review/cheats-review.md`;
   - `docs/review/topics-review.md`.
2. **Website:** upload `website/` to `public_html/mdcat` and flush the CDN cache. Check that https://mdcat.homilabs.org/privacy.html loads.
3. **AdMob:** Privacy & messaging, then European regulations. Create an "MDCAT Prep consent" message for this app only, with the privacy URL above, and publish it, as was done for CSCA.
4. **Play Console:**
   - create the app "MDCAT Prep: MCQs & Mock Tests" (free, app);
   - fill in App content, using the table above;
   - add the store listing: text, icon, feature graphic and screenshots;
   - upload `releases/1.0.0-1/mdcat-prep-1.0.0-1.aab`, ideally to internal testing first, then production.
5. **After it is live:**
   - in AdMob, use Add store on the app, searching by the full Play URL;
   - add the Play link on the website;
   - list the app on homilabs.org.

## Not checked by Claude
- **Live ads.** The release build uses the live unit, so it can only be ad-tested after the Play store link. The debug build was tested with Google's test unit.
- **The consent form.** It only appears for EEA/UK users once the AdMob message is published.
