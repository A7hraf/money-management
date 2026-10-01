# Masroof

A private, encrypted money manager for iPhone. It installs on your Home Screen and works fully offline.

- **Private by design.** Everything you record is encrypted on the phone with AES‑256‑GCM. The key comes from your passcode (PBKDF2‑SHA256, 600,000 rounds). Only encrypted data is stored, and nothing is ever sent to a server.
- **Receipt scanning on the phone.** Photos are read by the bundled Tesseract engine in `ocr/` and are never uploaded.

## What it does

- **Home:** a wallet card for each account (swipe to switch, tap to flip). Also on Home:
  - spending for the day, week, month or year, with income, saved and left
  - daily limit (fixed or smart), quick add (`karak 0.2 cash`) and one-tap buttons for frequent purchases
  - budgets, where the money went, "For you" insights, a monthly recap story and a this-month-vs-last chart
  - a month-end forecast of what you'll have left, from your balance, scheduled payments and your usual spending
  - an eye button that hides every amount, for using the app in public
- **Add:** expense, income, transfer, lend/borrow and investments. You can also:
  - list items with tax, service and discount
  - split with friends (equally, by amount or by item)
  - record refunds, foreign currency, repeating payments, installments and tags
- **Scan a receipt** to fill in the items, tax and total.
- **Bank SMS, automatically:** an iPhone Shortcuts automation saves every bank SMS to a file in the background, and Masroof imports it in one tap. See [Bank SMS](#bank-sms) below.
  - reads English and Arabic messages (including Arabic digits and ر.ع)
  - puts each message on the right account using the card or account's last 4 digits, or the bank's name
  - turns a debit from one of your accounts and a credit into another into a single transfer, and an ATM withdrawal into a transfer to Cash
  - ignores OTPs, declined payments and balance amounts
  - skips messages it has already imported, so you can import the same file every time
  - "Add without asking" adds messages from known cards straight away; anything unclear waits for you
  - remembers the balance the bank reports, and shows on each account whether Masroof matches it
- **Activity:** filter by month, type, category or account, or search every month at once. The calendar view tints each day by how much you spent; tap a day to see it. Swipe a row to repeat, edit or delete it.
- **Friends:** who owes whom, settle up, and copy a reminder. Loans can have a pay-back date; it shows on the friend and in "Coming up", and turns red when overdue.
- **Wealth:** net worth, your cards stacked like Apple Wallet, investments with gain/loss, and savings goals. **Add several accounts at once** (bank, type, last 4 digits, balance), from Wealth or Settings → Accounts & cards.
- **Credit cards:** add the limit, statement day and due day. Each card then shows its statement balance, what's left to pay, the due date, the minimum payment and your available credit, with a **Pay** button. Card payments that are due also appear in "Coming up".
- **Reminders in Calendar:** Masroof can't send notifications itself, so it exports your bills, card and loan due dates, plus an optional daily "import bank SMS" reminder, to your iPhone Calendar. Calendar then alerts you even when Masroof is closed.
- **Monthly PDF report** from Activity's export button: a summary, categories against budgets, a day-by-day chart, top places, account balances and every transaction. It's made on the phone, even offline.
- **Spending map:** a full-screen 3D Earth (WebGL) with city lights at night or a satellite view by day, country borders, a glowing bar for every place you spent money (taller for more money, coloured by category) and arcs from your home city. Spin and zoom it, swipe through the place cards, press play to watch your spending month by month, and tap a place to see when you spent there. A place comes from your iPhone's location if you turn on *Remember where I spend*, from a city named in the note or bank SMS, or from a foreign currency. Anything else shows at your home city. No map service is used.
- **Face ID unlock** (iOS 18 or later): your passcode still works, and backups never include the Face ID key.
- **Arabic:** switch the language in Settings → General or on the lock screen. The whole app switches to Arabic with a right-to-left layout, and amounts keep Western digits.
- **Settings:** a month that starts on your payday (e.g. 25th to 24th), budgets that can carry unspent money into next month, repeating payments, categories and items, and Home sections. Security settings are here too: auto-lock, change passcode, and encrypted backup/restore. You can also export a CSV.

## Files

```
index.html        page shell
sw.js             offline cache (fetches fresh code when online, cached copy offline)
manifest.json     Home Screen app settings
css/app.css       design (light + dark)
js/app.js         the app: storage, encryption, screens, receipt and SMS reading
js/i18n.js        Arabic words for every screen
js/globe3d.js     the 3D spending map (WebGL, uses the bundled globe.gl)
js/globe.js       a simpler canvas globe used when WebGL isn't available
js/globe-countries.js  country borders (Natural Earth, public domain)
js/vendor/        globe.gl (MIT licence, see LICENSE-globe.gl.txt)
images/earth-*.jpg     Earth textures (NASA Blue Marble and Black Marble, public domain)
js/globe-data.js  land dots for the globe (Natural Earth, public domain)
version.json      the newest version, for the in-app update banner
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

## Bank SMS

Apple doesn't let any app read your text messages. Your iPhone's Shortcuts app can save them for Masroof instead:

1. Open **Shortcuts → Automation → + → Message**.
2. Set **Message Contains** to `OMR`, choose **Run Immediately**, turn off **Notify When Run**, then tap **Next → New Blank Automation**.
3. Add a **Text** action containing `=====`, a new line, **Current Date** (Date Format: **ISO 8601**), a new line, and **Shortcut Input**.
4. Add **Append to Text File** with the path `Masroof/bank-sms.txt`, and turn on **Make New Line**.
5. If your bank texts in Arabic, make a second automation with **Message Contains** `ر.ع`.

Every bank SMS is now added to *iCloud Drive › Shortcuts › Masroof › bank-sms.txt*, even while Masroof is closed. In Masroof, tap **Import bank SMS** (Home, or Settings → Bank SMS) and pick that file. The same steps are in the app, under **Settings → Bank SMS → Set it up**.

## Things to know

- Always open Masroof from the Home Screen icon. Safari tabs keep separate data.
- There is no way to recover a forgotten passcode. Save an encrypted backup regularly (**Settings → Backups**) to Files or iCloud Drive. A backup opens only with the passcode you had when you made it.
- **Never delete the Home Screen icon to update.** On iPhone each Home Screen app has its own storage, so deleting the icon deletes all your data. A new icon starts empty and asks for a new passcode. If you ever have to do it, save a backup first and restore it in the new icon.
- **To update the app:** push your changes to `main`, then wait a minute or two for GitHub Pages. The next time you open Masroof while online, or come back to it at the lock screen, it loads the new version. Your data and passcode stay the same. No version bump is needed.

## Licences

tesseract.js and tesseract.js-core are Apache-2.0 (see `ocr/LICENSE-*.txt`). The English language data comes from tesseract-ocr.
