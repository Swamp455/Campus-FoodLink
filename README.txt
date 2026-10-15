Campus FoodLink+ login and demo reset recovery

DIAGNOSIS:
The uploaded app(6).js contains JSON rather than executable JavaScript, causing
Uncaught SyntaxError: Unexpected token ':' (app.js:2:13).
The uploaded apps(2).json is actually a JPEG image (not JSON). Both files are
incorrect for their intended roles.

RECOVERY:
1. Back up existing files and browser demo data before changing anything.
2. Upload the app.js and apps.json included here to the ROOT of the
   Swamp455/Campus-FoodLink GitHub repository, replacing the two broken files.
   Keep these exact filenames (not app(6).js or apps(2).json).
3. Commit changes. Wait for GitHub Pages deployment, then hard-refresh
   https://swamp455.github.io/Campus-FoodLink/ with Ctrl+Shift+R.
4. Check browser console; the app.js SyntaxError should disappear.
5. Test login with ebrown / password or pparker / password.
6. Only after backing up browser-local demo orders, test Reset Demo Data.
   Reset discards modified demo accounts and orders stored in this browser.

SOURCE:
Recovered from the previously prepared CampusFoodLink_Food_Images_Updated.zip,
which includes the earlier IT admin, dietary manager, student order history,
and menu food image changes. If you have modified app.js since that package,
merge those changes rather than replacing them without review.

This is a GitHub Pages/localStorage demonstration, not a production database.
