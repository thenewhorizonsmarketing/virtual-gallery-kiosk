# Offline Alumni Gallery Plan (Beginner Friendly)

This guide walks through the exact steps required to run the alumni section completely offline on a kiosk. Every task is written for non-coders—follow it line by line and you will end up with a locally stored database, an easy CSV import flow, and clear instructions for future updates.

---

## 1. Understand the Offline Setup

1. **Confirm the kiosk runs a modern browser.** IndexedDB storage (built into Chrome, Edge, and Firefox) powers the offline database. If you are unsure, open the browser’s settings and confirm it is less than two years old.
2. **Decide who should manage updates.** Pick one or two people who will load CSV files and photos using the kiosk.
3. **Print this document.** Keep a physical copy near the kiosk so anyone can follow the steps without logging into extra accounts.

---

## 2. Prepare Admin Access

1. Open the project folder and copy `.env.example` to `.env.local`.
2. Pick a four-to-six digit PIN that only editors know. Set `VITE_ADMIN_PIN` to that value.
3. Optionally add a friendly hint in `VITE_ADMIN_HINT` (for example, `Ask Communications Team`). The hint shows on the login screen to jog an editor’s memory.
4. Save the file. The kiosk will read these settings the next time the site is built or refreshed.

---

## 3. Build the Offline Database

> A developer should do this step once. After it is in place, editors simply use the admin tools page.

1. Run `npm install` if dependencies are not installed yet.
2. Start the local dev server with `npm run dev` and open the site in the browser.
3. Visit `/admin/login`, enter the PIN from Step 2, and make sure you can reach the “Alumni CSV Import” page.
4. Import a tiny CSV (1–2 rows) and one sample photo to confirm the data appears on `/alumni`.
5. The browser now creates an IndexedDB database named **`virtual-gallery-alumni`** on the kiosk. This database lives entirely on the device and keeps working without internet access.

---

## 4. Gather Alumni Data for Uploads

1. Download or create a spreadsheet with these column headers: `full_name`, `title`, `class_year`, `bio`, `photo_filename`.
2. Fill in one row per alumnus. Leave `photo_filename` blank if you do not have a matching image.
3. Save the spreadsheet as a **CSV file** (comma separated values). Most spreadsheet tools have “File → Export → CSV”.
4. Collect photos in a single folder. Rename each photo to exactly match the `photo_filename` column (for example, `jane-doe.jpg`). Keep all files as JPG or PNG.

---

## 5. Import Data on the Kiosk

1. On the kiosk, open `/admin/login` in the browser.
2. Enter the admin PIN. The import page will appear.
3. Step through the wizard:
   - **Upload CSV:** select the CSV you created in Step 4.
   - **Upload Photos:** select the matching JPG/PNG files (you can select multiple at once).
   - **Review:** scroll through the preview table. Confirm names, years, and filenames look correct.
4. Press **Start import**. The page shows progress for each row. Photos are converted to offline data URLs and stored inside the browser’s database.
5. When the import finishes, press **Refresh list** on the Alumni page to see the new entries immediately.

---

## 6. Keep Things Running Smoothly

1. **Back up after each import.** Use the “Export data” button (coming soon) or copy the CSV/photos you used into a cloud drive so you have a record.
2. **Re-run the import for updates.** Importing the same CSV again overwrites matching names, so you can fix typos or add new graduates any time.
3. **Clear space yearly.** If the kiosk ever feels slow, open the browser settings and clear the site data to reset the database, then re-import the latest CSV.
4. **Document the PIN.** Store the PIN and these instructions in a sealed envelope or secure notes app so a future staff member can take over.

---

## 7. Troubleshooting Checklist

| Problem | Quick Fix |
|---------|-----------|
| Photos are missing after import | Make sure the `photo_filename` in the CSV exactly matches the file name (including `.jpg` or `.png`). |
| Alumni list is empty | Verify you ran an import on this kiosk. IndexedDB is per-device, so each kiosk needs the CSV loaded locally. |
| Forgot the PIN | Rebuild the site or edit `.env.local` to set a new `VITE_ADMIN_PIN`, then redeploy to the kiosk. |
| Browser says storage is full | Delete unused photos from previous imports and rerun the import with optimized (under 1 MB) images. |

---

### Done! 🎉

Once you complete these steps, the alumni gallery works offline, updates in minutes, and stays under the control of your kiosk administrators.
