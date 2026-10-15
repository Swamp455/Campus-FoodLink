Campus FoodLink+ — IT Staff Admin Portal (Prototype)
====================================================

Includes student order history and dietary manager reporting from the previous combined package.

DEPLOYMENT
Upload all files in this package to the root of your Campus-FoodLink GitHub repository.
IMPORTANT: Keep any separately installed test-logger.js/test.js and its HTML script references.
If you have made further customizations, merge rather than blindly overwrite those changes.

IT DEMO LOGIN
Username: ebrown
Password: password
After login the IT Staff account is directed to admin.html.

FEATURES
- Search and edit existing student/staff demonstration accounts
- Change username and reset a password (leave blank to keep the existing one)
- Change staff role between Dietary Associate, Dietary Manager, and IT Staff
- Activate/deactivate demo accounts; disabled accounts cannot log in
- Prevent the currently logged-in IT staff account from deactivating itself or losing IT role
- Export a local audit CSV showing changes without recording passwords
- Existing order history and manager reporting remain included

TEST STEPS
1. Log in as ebrown / password and confirm IT portal opens.
2. Edit a test account's username, save, sign out and try the new username.
3. Reset a test password (8+ characters) and verify old credentials fail.
4. Deactivate a test account and confirm login is denied; reactivate it.
5. Verify Dietary Manager reports remain accessible to lhobbs.
6. Verify students can still see all orders and filter by status.
7. Export audit CSV and capture evidence for Unit 8.
8. Repeat in Chrome and Edge. Changes are local to each browser.

LIMITATIONS / SECURITY
This is a STATIC GitHub Pages prototype, not secure account administration.
Credentials are stored as plaintext in browser localStorage; any user with browser
developer tools can tamper with roles or data. Do not use real credentials or personal
information. Changes do not synchronize between devices and are lost on demo reset.
A real production version requires server-side identity management, salted password
hashing, authenticated sessions, server-enforced RBAC, protected audit logs and MySQL.
