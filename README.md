# Masroof

A private, encrypted money manager for iPhone. It installs on your Home Screen and works fully offline.

- **Private by design.** Everything you record is encrypted on the phone with AES‑256‑GCM. The key comes from your passcode (PBKDF2‑SHA256, 600,000 rounds). Only encrypted data is stored, and nothing is ever sent to a server.
- **Bills read by Claude.** Photograph a bill in the Claude app with the request Masroof copies for you, then paste Claude's answer into the expense. Each item lands in its own category with its quantity and price, and VAT, service charge and discount are filled in. You can add a bill to any expense later, including one imported from a bank SMS.

## What it does

Version 4.1 knows which account each entry belongs to and what it counts as: spending, income, money moved between your own accounts, money between you and a friend, or an investment. See [Several accounts](#several-accounts-which-one-and-what-it-counts-as) below.

Version 4.0 ("Wallet") is a new design: a near-black night edition (the default) and a warm day edition, a gold coin colour for actions, rounded system fonts, Phosphor icons and a coin-fort logo. Every screen works in English and Arabic (right to left), in both editions.

- **Home:** a greeting with your name, the total of all accounts (it counts up), your cards in a stack (swipe or tap for the next one), a liquid orb with what's left of today's limit, spending today and this month, a card for bank messages waiting for you, this month's top categories as bars, today's timeline and a teaser of the spending map. The eye button hides every amount; the logo opens Settings.
- **Add (the gold ＋):** expense, income, transfer, lend/borrow and investments. Type the amount on the keypad at the bottom of the sheet. In *What or where?* you can also type `karak 0.2 cash` or `coffee 15 aed` and the amount, account and currency are filled in. Category tiles, account chips and Today / Yesterday / Other day are one tap each. *More options* holds:
  - split with friends (equally, by amount or by item)
  - another currency, repeating payments and instalments, refunds, tags
  - list items with tax, service and discount
  Tap outside the sheet to close it; an unsaved entry comes back with Undo.
- **Paste a bill read by Claude** (the dashed *Add bill text* row) to fill in the items, categories, VAT and total. A preview shows what was read before you use it.
- **Bank SMS, automatically:** an iPhone Shortcuts automation saves every bank SMS to a file in the background, and Masroof brings it in with one tap. See [Bank SMS](#bank-sms) below.
  - messages Masroof is sure about can go straight in (*Add sure bank messages by itself*)
  - the rest wait in **Bank messages**, one card at a time: swipe right (or ✓) to add it, left (or ×) to skip it, or *Confirm N* to add all the sure ones. Each card shows the SMS, the amount, money in or out, the account (and why Masroof picked it), the category and the bank's balance after it. Fix anything on the card first; Masroof remembers your answer for that kind of message.
  - the queue is saved, encrypted, until you get to it
  - reads English and Arabic messages (including Arabic digits and ر.ع), turns a debit and a credit between your own accounts into one transfer and an ATM withdrawal into a transfer to Cash, ignores OTPs, declined payments and promotions, and never imports the same message twice
- **Activity:** every month, newest first, grouped by day. Search shops, notes or amounts; the pills show All, Spent, Received or With bills. The slider button opens finer filters: month, type, category, account, the spending calendar (each day tinted by how much you spent) and CSV export. Swipe a row to repeat, edit or delete it.
- **Friends** (from You): owed to you and you owe, each friend with their balance, a WhatsApp-ready reminder, settle up, split a bill, lend or borrow. Loans can have a pay-back date that turns red when overdue.
- **Wealth:** net worth split into banks and cash, investments and money owed to you; savings goals with progress, where the money is kept, the plan and when it gets there; investments with gain or loss.
- **New goal in four steps:** what it's for, how much and by when (12 to 48 months or any date), where it's kept (and whether the whole balance counts or only the deposits for it), and how you'll save (weekly, monthly or yearly, from another account, the cash deposit machine or by hand, recorded automatically if you like). A hint works out the monthly amount as you go.
- **You:** Accounts & cards, Friends, Bank messages, Spending map, Reminders and This month (with the monthly report), plus Settings and Lock now.
- **Settings** in five groups: Security (Face ID, auto-lock, passcode), Automatic (Bank SMS setup, adding sure messages by itself, keeping balances matching the bank, repeating payments, reminders), Money (daily limit, budgets, categories, quick-add buttons, currencies and rates), Look (your name, language, Night / Day / Auto) and Your data (backup, restore, reports, privacy, demo data, erase).
- **Lock screen:** a passcode of digits unlocks with a round keypad (6 or more digits; Masroof keeps only how many digits it has, never the digits). Any other passcode uses the keyboard, and you can switch between the two. A short "Opening your ledger" screen follows (tap the fort to stack coins while you wait, or anywhere else to skip).
- **Credit cards:** add the limit, statement day and due day. Each card then shows its statement balance, what's left to pay, the due date, the minimum payment and your available credit.
- **Reminders in Calendar:** Masroof can't send notifications itself, so it exports your bills, card and loan due dates, plus an optional daily "import bank SMS" reminder, to your iPhone Calendar. Calendar then alerts you even when Masroof is closed.
- **Monthly PDF report** (You › This month › PDF report or CSV, or Settings › Your data): a summary, categories against budgets, a day-by-day chart, top places, account balances and every transaction. It's made on the phone, even offline.
- **Bank SMS that read right.** Amounts with OMR, RO, R.O., ر.ع or no currency at all, "Dr"/"Cr", English and Arabic. The account comes from the card or account number, then the balance in the message (the bank's previous balance minus this amount must give the new one), then an account you chose before for the same kind of message, then the bank's name (the automation also saves the sender) or the kind of card. Money in or out is checked against the balance too. OTPs, declined payments and promotions are skipped.
- **Current balances, not opening balances.** Each account takes the balance your bank shows today (for a credit card, what you owe). Older messages imported later don't move it, and the balance in the newest bank message keeps it exact (Settings › Bank SMS › Keep balances matching the bank).
- **Every activity in detail.** Tap one to see it in full. A bill shows the categories it splits into, every item with its quantity and cost, and the VAT, service charge, discount and total. Edit anything from there: changes keep the bank SMS, location and goal it belongs to.
- **Accounts & cards** lists every account with its bank, last four digits and balance. Tap one for its statement (below), or add new ones (bank account, credit card with limit and statement and due days, savings, e-wallet, cash). Adding never changes or removes existing accounts.
- **Savings goals** say what they are for, where the money is kept (an account's whole balance, only the deposits made for the goal, or cash by hand), and the plan: an amount each week, month or year from another account, the cash deposit machine or by hand. Masroof shows what's needed to reach the date and when the plan gets there, and can record each deposit automatically.
- **Any currency, converted:** Masroof recognises about 50 currencies by code, symbol or word, in English and Arabic (AED, Dhs, درهم, $, €, £, ₹, ₺, baht, ريال سعودي…). Each one comes from a bank SMS, from quick add ("coffee 15 aed", "$12 uber") or from the form, and is converted to your currency. Masroof keeps the original amount and remembers the country (from the currency, or from the country code at the end of a card SMS such as "CARREFOUR DUBAI AE"), so the transaction shows its flag and appears there on the map. If the bank's SMS gives the amount in your currency, that exact figure is used. Rates are built in: the Gulf currencies are pegged to the dollar, so their rates are exact, and the others are approximate. In Settings › Exchange rates you can download today's rates (once, or daily when online) or type your own rate for any currency. Downloading the rates fetches a public list and sends nothing about you.
- **Spending map:** a full-screen 3D Earth (WebGL) with city lights at night or a satellite view by day, country borders, a glowing bar for every place you spent money (taller for more money, coloured by category) and arcs from your home city. Spin and zoom it, swipe through the place cards, press play to watch your spending month by month, and tap a place to see when you spent there. A place comes from your iPhone's location if you turn on *Remember where I spend*, from a city named in the note or bank SMS, or from a foreign currency. Anything else shows at your home city. No map service is used.
- **Face ID unlock** (iOS 18 or later): your passcode still works, and backups never include the Face ID key.
- **Arabic:** switch the language in Settings › Look or on the lock screen. The whole app switches to Arabic with a right-to-left layout, and amounts keep Western digits.
- **Also in Settings:** a month that starts on your payday (e.g. 25th to 24th) under Currencies & rates, and budgets that can carry unspent money into next month.

## Security

- Everything is encrypted on the phone with AES‑256‑GCM, with a key from your passcode (PBKDF2‑SHA256, 600,000 rounds). Wrong passcodes slow down after five tries, and you can choose to erase everything after ten.
- Nothing about you is sent anywhere. The app only ever downloads its own files, `version.json` (to offer updates) and, if you ask for them, a public list of exchange rates.
- A strict Content Security Policy allows scripts only from the app itself and connections only to the two exchange-rate addresses.
- Bank SMS, bill text and everything you type are treated as text, never as code, on every screen. CSV exports stop spreadsheets from running text as a formula.
- Only harmless settings are kept unencrypted: language, theme, auto-lock, and how many digits a keypad passcode has (never the digits).

## Files

```
index.html        page shell
sw.js             offline cache (fetches fresh code when online, cached copy offline)
manifest.json     Home Screen app settings
css/app.css       base styles: tokens, forms, dialogs, the map
css/v4.css        the 4.0 "Wallet" design: screens, sheets, motion
js/app.js         the app: storage, encryption, screens, receipt and SMS reading
js/i18n.js        Arabic words for every screen
js/icons.js       the Phosphor icons the app uses (MIT licence, see js/vendor/LICENSE-phosphor.txt)
js/fx.js          currencies: country, flag, words and symbols, built-in rates
js/globe3d.js     the 3D spending map (WebGL, uses the bundled globe.gl)
js/globe.js       a simpler canvas globe, used when WebGL is off (e.g. in Lockdown Mode)
js/globe-countries.js  country borders (Natural Earth, public domain)
js/vendor/        globe.gl (MIT licence, see LICENSE-globe.gl.txt)
images/earth-*.jpg     Earth textures (NASA Blue Marble and Black Marble, public domain)
js/globe-data.js  land dots for the globe (Natural Earth, public domain)
version.json      the newest version, for the in-app update banner
images/           coin-fort logo and Home Screen icons
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

Every bank SMS is now added to *iCloud Drive › Shortcuts › Masroof › bank-sms.txt*, even while Masroof is closed. In Masroof, open **Bank messages** (the card on Home, or You › Bank messages) and tap **Choose the bank SMS file**. The same steps are in the app, under **Settings › Bank SMS setup**.

## Several accounts: which one, and what it counts as

- **Which account.** A bank SMS is matched to an account by its card or account number, then by the balance in the message, then by what you chose before for the same kind of message, then by the bank's name. The card always shows the account and why Masroof picked it.
- **Between your own accounts.** Money out of one of your accounts and the same amount into another becomes one transfer, on the same day or up to two days apart when either message says "transfer". If one side is already in Masroof (added by hand or from an earlier import), the new message turns it into the transfer instead of adding a second entry. Transfers are never counted as spending or income.
- **Credit card payments** (from the bank's message, the card's message, or both) are one transfer from your bank account to the card. **Cash deposits** are a transfer from Cash to the bank, and **ATM withdrawals** a transfer from the bank to Cash.
- **"Transfer" to someone else.** When a message says "transfer", "sent to" or "received from" and no second account of yours matches, the card asks: *To my other account*, *To a friend* or *It was spending* (*From my other account*, *From a friend* or *It was income* for money in). *Friend* records a loan or a pay-back with that person.
- **Counts as.** Every bank message card and every entry's detail shows what it counts as. If an entry was really a transfer to your other account, open it and tap *This was a transfer to my other account* (Undo puts it back).
- **Each account's statement** (tap an account): the card, whether it matches your bank, the credit card's statement and what to pay, money in and out this month, money moved in and out, and every entry with the balance after it. Filter by In, Out or Moved.
- **This month** (You › This month, or See all on Home): income, spending, saved and what's left, each category against its budget, each account's money in and out, where you spent most and what's coming up, with the PDF report or CSV one tap away. Use the arrows for earlier months.
- **Coming up** on Home: bills, credit card payments and loans due in the next seven days.
- **Transfers** has its own pill in Activity.

## Things to know

- Always open Masroof from the Home Screen icon. Safari tabs keep separate data.
- There is no way to recover a forgotten passcode. Save an encrypted backup regularly (**Settings › Encrypted backup**) to Files or iCloud Drive. A backup opens only with the passcode you had when you made it.
- **Never delete the Home Screen icon to update.** On iPhone each Home Screen app has its own storage, so deleting the icon deletes all your data. A new icon starts empty and asks for a new passcode. If you ever have to do it, save a backup first and restore it in the new icon.
- **The Home Screen icon doesn't change with an update.** iOS keeps the icon from the day you added the app. To get a new icon: save an encrypted backup (Settings › Encrypted backup), delete the icon, add Masroof again from Safari, and choose *Restore from a backup file instead* when it asks for a new passcode.
- **To update the app:** push your changes to `main`, then wait a minute or two for GitHub Pages. The next time you open Masroof while online, or come back to it at the lock screen, it loads the new version. Your data and passcode stay the same. No version bump is needed.

## Licences

- [Phosphor Icons](https://phosphoricons.com) (MIT): the icons, bundled in `js/icons.js`. See `js/vendor/LICENSE-phosphor.txt`.
- [globe.gl](https://github.com/vasturiano/globe.gl) (MIT): the 3D map. See `js/vendor/LICENSE-globe.gl.txt`.
- Natural Earth (public domain): country borders and land dots.
- NASA Blue Marble and Black Marble (public domain): Earth textures.
