# Masroof

A private, encrypted spending tracker. It installs on your iPhone Home Screen and works fully offline.

- Your data is encrypted on the phone (AES-256-GCM, with a key made from your passcode using PBKDF2-SHA256 and 600,000 rounds). Nothing is sent to any server.
- Receipt scanning (OCR) runs on the phone with the bundled Tesseract engine in `ocr/`.

## Files

```
index.html          the whole app
sw.js               offline cache (bump VERSION when you update the app)
manifest.json       Home Screen app settings
icon-*.png          app icons
ocr/                on-device receipt reader (tesseract.js + English language data)
.nojekyll           tells GitHub Pages to serve files as-is
```

## Put it on your iPhone

1. Merge this branch into `main`.
2. On github.com, open the repository and go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, then pick **main** and **/ (root)**, and tap **Save**.
4. After a minute or two the page shows your link:
   `https://a7hraf.github.io/money-management/`
5. Open that link in **Safari** on your iPhone.
6. Tap **Share → Add to Home Screen → Add**.
7. Open **Masroof** from the new icon and create your passcode.
8. Optional offline check: turn on Airplane Mode and open the app again.

GitHub Pages is free for public repositories. For a private repository, it needs a paid GitHub plan. Only the app's code goes on GitHub; your spending data never does.

## Things to know

- Always open Masroof from the Home Screen icon. The Home Screen app keeps its data separate from Safari tabs.
- There is no way to recover a forgotten passcode. Save an encrypted backup regularly (**Settings → Backups**) to Files or iCloud Drive.
- Deleting the Home Screen icon deletes the app's data. Make a backup first.
- **To update the app:** change `index.html`, change `VERSION` in `sw.js` (for example `masroof-v3`), push to `main`, then close and reopen the app twice on the phone.

## Licences

tesseract.js and tesseract.js-core are Apache-2.0 (see `ocr/LICENSE-*.txt`). The English language data comes from tesseract-ocr.
