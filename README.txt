Campus FoodLink+ Prototype 2 — Consistent Wireframe Build

FIXES IN THIS VERSION
- Added minus and Remove controls for cart items.
- Added Clear Cart.
- Cart changes immediately update the displayed quantity and total.
- Checkout also allows item removal.
- All student pages use the same School Logo/header/navigation.
- All vendor pages use the same Vendor Name/header/navigation.
- Vendor Dashboard and Orders navigation now works both directions.
- Student flow works: Login > Dashboard > Vendor Menu > Checkout > Order Confirmation > Dashboard/View Status.
- Vendor flow works: Vendor Login > Dashboard > Orders > Update Status > Dashboard.
- Vendor status changes are stored in localStorage and appear on the student's saved order/status view.
- Styling intentionally remains low-fidelity grayscale to match the supplied wireframes.

TEST
1. Open index.html.
2. Student Login.
3. Place Order.
4. Add an item with +; reduce with -; remove with Remove.
5. Checkout and confirm.
6. Use Dietary Associate Login or open vendor-dashboard.html.
7. Open Orders, change status, Save Update.
8. Return to Student Dashboard/View Status and verify the same status appears.

LOGOUT
- Student and Dietary Associate pages now include a Logout button.
- Logout clears the mock session and returns the user to index.html.
- Saved prototype order/cart data remains in localStorage so persistence can still be demonstrated.

ROLE SWITCHING
- Student pages include a Dietary Associate button.
- Dietary Associate pages include a Student View button.
- Switching roles keeps the same localStorage order data so the workflow can be demonstrated from both perspectives.
- Logout remains available and returns to the login page.

COLOR UPDATE
- Added a consistent campus-style color palette across every screen.
- Navy header, blue navigation accents, green action/confirmation areas, and gold highlights.
- Student and Dietary Associate screens retain the same layout and functional flows.
- Color changes are presentation-only; localStorage persistence, role switching, cart removal, status updates, and logout remain intact.

EXPORT ORDER DATA
- Dietary Associate Dashboard and View Orders now include an Export Order Data button.
- The button reads the current cflOrder record from localStorage.
- It downloads a JSON file named CampusFoodLink_Order_<OrderID>.json.
- The export includes the saved order and an exportedAt timestamp.
- If no order exists, the interface displays an error instead of downloading an empty file.
