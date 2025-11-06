# Offline Alumni Import Guide

Follow these steps each time you need to update the alumni list on the kiosk. No coding or internet connection required.

---

## Before You Begin

- You need the **admin PIN** (ask Communications if you do not know it).
- Prepare two things on a USB drive:
  1. A CSV file with columns `full_name`, `title`, `class_year`, `bio`, `photo_filename`.
  2. A folder containing JPG or PNG images whose filenames match the `photo_filename` column.

---

## Step 1 – Unlock the Admin Tools

1. Plug your USB drive into the kiosk.
2. In the browser, go to `https://<kiosk-address>/admin/login` (or use the “Admin tools” button on the Alumni page).
3. Enter the admin PIN and press **Unlock admin tools**.
4. You should now see the **Alumni CSV Import** screen.

---

## Step 2 – Load the CSV

1. Under “1. Upload CSV”, click **Choose CSV file**.
2. Browse to your USB drive and pick the CSV you prepared.
3. Wait a moment while the kiosk reads the file. You will see a preview of every row.

> **Tip:** If the preview table stays empty, open the CSV on another computer to make sure it actually has data.

---

## Step 3 – Add Photos (Optional but Recommended)

1. Under “2. Upload Photos”, click **Select photo files**.
2. Multi-select every photo that belongs in this batch. Hold `Shift` or `Ctrl`/`Cmd` to select several at once.
3. The counter below the field shows how many photos you picked.
4. If a row has no matching photo, the kiosk keeps whatever photo was already stored (or leaves it blank for new alumni).

---

## Step 4 – Review the Data

1. Scroll through the table in section 3.
2. Confirm each name, title, and year looks right.
3. Double-check that the `photo_filename` column lines up with the photos you selected.
4. Fix any mistakes in the CSV on another computer, save, and re-upload before continuing.

---

## Step 5 – Start the Import

1. Press **Start import**.
2. A progress bar shows how many rows have been processed.
3. If the kiosk encounters a problem (for example, a missing photo), it displays an error message but keeps going with the rest of the rows.
4. When the import is complete you will see “Alumni records imported to the kiosk successfully.”

---

## Step 6 – Verify the Gallery

1. Click **Refresh list** on the Alumni page.
2. Scroll through the gallery to make sure every update looks correct.
3. If something is wrong, fix the CSV or photos and run the import again. Existing rows with the same name are overwritten, so you can safely retry.

---

## Step 7 – Lock the Admin Tools

1. Back on the import page, press **Lock tools**.
2. This signs you out so casual visitors cannot access the admin flow.
3. Remove your USB drive.

---

## Troubleshooting

| Issue | What to Try |
|-------|-------------|
| “Incorrect PIN” | Confirm you typed the latest PIN. If the PIN changed, update `.env.local` and redeploy the kiosk build. |
| Photos still missing | Check the filename spelling and extension. `JaneDoe.JPG` and `jane-doe.jpg` are different. |
| Nothing changes after import | Make sure you are running the import on the kiosk that visitors use. Each kiosk stores its own offline database. |
| Browser says storage is full | Resize large photos to under 1 MB and rerun the import. Older entries will be overwritten by the new batch. |

---

Happy importing! 🎉
