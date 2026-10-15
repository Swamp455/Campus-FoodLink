Campus FoodLink+ — Combined Prototype README
============================================

OVERVIEW
--------
This README combines the student order history, dietary manager reports,
IT staff administration portal, and student menu food-image update notes.
Campus FoodLink+ is a static GitHub Pages prototype using browser local storage
for demonstration data. It is not connected to a live MySQL database.

DEPLOYMENT AND MERGING
----------------------
1. Upload the applicable updated application files to the root of the
   Campus FoodLink GitHub repository. The updates reference:
   - account.html: student order history
   - orders.html: dietary manager reports
   - admin.html: IT administration portal
   - menu.html: student vendor menu display
   - app.js and style.css: shared behavior and presentation
2. Keep the images/food/ folder structure and image filenames unchanged.
3. IMPORTANT: Several feature packages modify app.js and style.css. Do not
   overwrite a newer version with an older feature package. Merge all features
   into the same current versions of those files.
4. Preserve any separately installed test-logger.js/test.js and its script
   references in the HTML pages. The feature updates do not replace logging.
5. Commit the changes to GitHub, reload GitHub Pages, and retest in Chrome
   and Microsoft Edge.

STUDENT ORDER HISTORY
---------------------
The Student Dashboard (account.html) includes an All My Orders section with
status filtering, newest orders first. The Latest Order panel and cancellation
button remain. Orders are filtered by the signed-in student ID; the displayed
status comes from the latest OrderStatus history entry.

DIETARY MANAGER REPORTS
-----------------------
Demo login: lhobbs / password
Open orders.html and click Manager Reports. The report uses orders stored in
the same browser. It supports date filtering based on order creation date and
CSV export. Create demonstration student orders in the same browser to populate
reports. These are prototype reports, not centralized MySQL reports.

IT STAFF ADMINISTRATION PORTAL
------------------------------
Demo login: ebrown / password
The IT Staff account opens admin.html.

Existing account management:
- Search and edit student and staff demonstration accounts.
- Change a username; reset a password by entering a new one, or leave the
  password field blank to keep the existing password.
- Change staff roles among Dietary Associate, Dietary Manager, and IT Staff.
- Activate or deactivate demonstration accounts; inactive accounts cannot log in.
- Prevent the signed-in IT administrator from deactivating their own account
  or removing their own IT Staff role.
- Export a local audit CSV without including passwords.

Account creation and removal:
- Add student or staff demonstration accounts using Add New Account.
- Newly created student accounts start with a $0.00 meal-plan balance.
- Removing an account requires confirmation. Accounts with related orders or
  status records cannot be removed; deactivate them instead to preserve
  historical order and transaction information.
- An IT administrator cannot remove their own account.
- Account creation and removal are recorded in the local audit log.

STUDENT VENDOR MENU FOOD IMAGES
-------------------------------
Photos appear on the student vendor menu (menu.html). app.js associates each
image with its MenuItems record using menu_item_id. A data reset is not needed.
Keep the images/food/ directory intact when deploying.

Menu item image mapping:
  991  Tuna Sandwich          Text placeholder; replace with matching photo
  992  Pizza                  Food photo
  993  Roasted Green Beans    Text placeholder; replace with matching photo
  994  Classic Cheeseburger   Food photo
  995  Seasoned Fries         Food photo
  996  Grilled Chicken Sandwich  Food photo
  997  Turkey Club            Provisional generic chicken sandwich photo;
                              replace with an accurate turkey club photo
  998  Chicken Caesar Salad   Food photo
  999  Iced Coffee            Provisional generic iced drink photo;
                              replace with a coffee-specific photo

Use the same filenames when replacing placeholder or provisional images.

RECOMMENDED UNIT 8 TESTING
--------------------------
1. Log in as a student, create several orders, and verify All My Orders and
   status filtering. Refresh the page and verify browser-local persistence.
2. Log in as the dietary manager (lhobbs / password); open Manager Reports,
   verify totals and date filters, and export the report CSV.
3. Log in as IT staff (ebrown / password) and verify admin.html opens.
4. Edit a test username, save, log out, and confirm the new username works.
5. Reset a test password (at least eight characters) and verify the old
   password no longer works.
6. Deactivate and reactivate a test account; verify login behavior.
7. Add a demonstration account and verify it can log in.
8. Remove an eligible demonstration account; verify it is no longer available.
   Confirm an account linked to historical orders is protected from deletion.
9. Export the IT administrative audit CSV and capture test evidence.
10. On the student vendor menu, switch vendors and confirm images correspond
    to their menu items; check placeholders and provisional photos.
11. Repeat key workflows in Google Chrome and Microsoft Edge. Each browser
    has its own local storage data and may show different demonstration records.

PROTOTYPE LIMITATIONS AND SECURITY
----------------------------------
- Data and account changes are stored in browser local storage; they do not
  automatically synchronize across browsers, devices, or users.
- Demonstration credentials are stored as plaintext in local storage. Client-
  side role checks can be manipulated using browser developer tools.
- Never enter real passwords or sensitive personal information into this demo.
- Resetting demonstration data can remove local account changes and orders.
- This is not production-level authentication, authorization, or reporting.
- A production deployment requires server-side identity management, salted
  password hashing, authenticated sessions, server-enforced role-based access,
  protected audit logging, and a centralized MySQL database.
