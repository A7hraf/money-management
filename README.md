# Masroof

A private, encrypted money manager for iPhone. It installs on your Home Screen and works fully offline.

- **Private by design.** Everything you record is encrypted on the phone with AES‑256‑GCM. The key comes from your passcode (PBKDF2‑SHA256, 600,000 rounds). Only encrypted data is stored, and nothing is ever sent to a server.
- **Receipt scanning on the phone.** Photos are read by the bundled Tesseract engine in `ocr/` and are never uploaded.

## What it does

- **Home:** a wallet card for each account (swipe to switch, tap to flip). Also on Home:
  - spending for the day, week, month or year, with income, saved and left
  - daily limit (fixed or smart), quick add (`karak 0.2 cash`) and one-tap buttons for frequent purchases
  - budgets, where the money went, "For you" insights, a monthly recap story and a this-month-vs-last chart
- **Add:** expense, income, transfer, lend/borrow and investments. You can also:
  - list items with tax, service and discount
  - split with friends (equally, by amount or by item)
  - record refunds, foreign currency, repeating payments, installments and tags
- **Scan a receipt** to fill in the items, tax and total, or **paste bank SMS** messages to import them.
- **Activity:** search and filter by month, type, category or account. Swipe a row to repeat, edit or delete it.
- **Friends:** who owes whom, settle up, and copy a reminder.
- **Wealth:** net worth, account cards, investments with gain/loss, and savings goals.
- **Settings:** budgets, repeating payments, categories and items, and Home sections. Security settings are here too: auto-lock, change passcode, and encrypted backup/restore. You can also export a CSV.

## Files

```
index.html        page shell
sw.js             offline cache — bump VERSION when you update the app
manifest.json     Home Screen app settings
css/app.css       design (light + dark)
js/app.js         the app: storage, encryption, screens, receipt and SMS reading
images/           logo and Home Screen icons
ocr/              on-device receipt reader (tesseract.js + English data, with licences)
.nojekyll         tells GitHub Pages to serve files as-is
```

## Put it on your iPhone

1. The repository must be **public** for free GitHub Pages: **Settings → General → Danger Zone → Change visibility → Public**.
2. **Settings → Pages →** Build and deployment: **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
3. After a minute or two, open **https://a7hraf.github.io/money-management/** in **Safari** on the iPhone.
4. Tap **Share → Add to Home Screen → Add**.
5. Open **Masroof** from the new icon and create your passcode.

Only the app's code is on GitHub. Your data never goes there.

## Things to know

- Always open Masroof from the Home Screen icon. Safari tabs keep separate data.
- There is no way to recover a forgotten passcode. Save an encrypted backup regularly (**Settings → Backups**) to Files or iCloud Drive. A backup opens only with the passcode you had when you made it.
- Deleting the Home Screen icon deletes the app's data, so make a backup first.
- **To update the app:** change the files, bump `VERSION` in `sw.js`, push to `main`, then close and reopen the app twice.

## Licences

tesseract.js and tesseract.js-core are Apache-2.0 (see `ocr/LICENSE-*.txt`). The English language data comes from tesseract-ocr.
