Campus FoodLink+ — Student Order History and Dietary Manager Reports
====================================================================

OVERVIEW
--------
This README combines the installation notes for the Student Order History
update and the Dietary Manager Reports dashboard.

1. STUDENT ORDER HISTORY
------------------------
The Student Dashboard displays an "All My Orders" section with a status
filter. Orders appear newest first and are limited to the signed-in student
ID. Each order's status is taken from the latest OrderStatus history entry.

The existing Latest Order panel and Cancel Order button remain available.

Files involved:
- account.html
- app.js
- style.css

2. DIETARY MANAGER REPORTS
--------------------------
Dietary managers can open the "Manager Reports" dashboard to view reports
based on the prototype's stored order data.

Demo login: lhobbs / password (demonstration credentials only)
After logging in, click "Manager Reports".

Create student orders in the same browser to populate the reports. Date
filtering uses the order creation date. The "Export CSV" feature exports
the manager report.

Files involved:
- orders.html
- app.js
- style.css

3. DEPLOYMENT TO GITHUB PAGES
-----------------------------
Upload the updated files to the same directory in your GitHub repository:
- account.html
- orders.html
- app.js
- style.css

IMPORTANT: Both updates modify app.js and style.css. Use versions that
contain BOTH sets of changes. Do not upload one update's app.js or style.css
over the other update's versions, as that may remove functionality.

Other application files do not need to be replaced for these two features.
If you have installed a test logger, preserve its JavaScript file and all
existing script references in the HTML pages. The original update packages
were based on the previously uploaded source files, not the logging add-on.

4. PROTOTYPE LIMITATIONS
------------------------
- Data is stored in the browser's localStorage, not on a server or in MySQL.
- Orders from other browsers or devices will not automatically synchronize.
- Reports reflect orders stored in the same browser environment.
- Client-side role controls are for demonstration only and do not provide
  production-level security.

5. SUGGESTED VERIFICATION
-------------------------
- Sign in as a student and confirm all of that student's orders appear,
  newest first, with working status filters.
- Confirm the Latest Order and cancellation functions still work.
- Sign in as a dietary manager, open Manager Reports, and check the date
  filter and CSV export.
- Confirm the existing test logger still loads and records events.
