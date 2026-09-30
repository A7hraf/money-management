MASROOF - private spending tracker for iPhone
=============================================

What this is
- A web app that installs on your iPhone Home Screen and runs fully offline.
- Everything you record is encrypted on the phone (AES-256-GCM, key derived
  from your passcode with PBKDF2-SHA256, 600,000 rounds). Only encrypted data
  is ever stored. Nothing is sent to any server - the app blocks all network
  requests except loading its own files.
- Receipt reading (OCR) runs on the phone using the bundled Tesseract engine
  in the "ocr" folder. Photos are never uploaded.

Install (one time, about 10 minutes)
The files must be served over https once so iPhone can install them. The free
way is GitHub Pages:
 1. Create a free account at github.com and turn on two-factor login.
 2. Create a new repository (e.g. "masroof").
 3. Upload ALL files and folders from this zip, keeping the "ocr" folder.
 4. In the repository: Settings > Pages > Deploy from branch > main > / (root) > Save.
 5. After a minute you get a link like https://yourname.github.io/masroof/
 6. Open that link in SAFARI on your iPhone.
 7. Tap Share > Add to Home Screen > Add.
 8. Open Masroof from the new icon, create your passcode, and (optionally)
    turn on Airplane Mode once and reopen it to confirm it works offline.

Only code lives on GitHub. Your data never goes there.

Important
- Always open Masroof from the Home Screen icon. The Home Screen app keeps its
  own data, separate from Safari tabs.
- There is no passcode recovery. Save an encrypted backup (Settings > Backups)
  to Files / iCloud Drive regularly. It opens only with the passcode you had
  when you made it.
- Deleting the Home Screen icon deletes its data. Back up first.
- Updating: replace index.html (and change VERSION in sw.js) in the repository,
  then close and reopen the app twice.

Open-source components: tesseract.js and tesseract.js-core (Apache-2.0),
English language data from tesseract-ocr. Licences are in the ocr folder.
