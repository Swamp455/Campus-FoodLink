Campus FoodLink+ — IT Administration Popup Update
=================================================
Includes app.js, admin.html, and style.css.

Features
- Edit opens a centered dialog showing the selected account and its current details.
- Save updates the account and closes the dialog; X or Escape cancels editing.
- Remove opens a confirmation dialog showing the name, username, role, and status.
- Active-order protections and audit logging remain in place.
- Clear Display for audit history remains available.

Install
1. Back up the three current GitHub files first.
2. Compare the included app.js, admin.html, and style.css against the latest repository versions.
   The app.js is based on the earlier BUG-005 through BUG-008 corrected version.
   Do not overwrite any newer changes without merging them.
3. Upload the three files to the root of your Campus-FoodLink repository.
4. Commit, wait for GitHub Pages deployment, then hard-refresh.
5. Log in as IT Staff and test Edit, Cancel, Save, Remove, and blocked removal
   for a student with a pending/approved/ready order.

Prototype security note: The admin interface is browser-only and stores demonstration
credentials in localStorage. It is not a secure production account manager.
