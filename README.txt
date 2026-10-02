Campus FoodLink+ — MySQL Schema-Matched Prototype

This version is aligned to the eight supplied MySQL tables:
1. Students
2. Staff
3. Vendors
4. MenuItems
5. Orders
6. OrderItems
7. OrderStatus
8. Transactions

Important corrections:
- Students uses meal_plan_balance.
- Orders contains no status_id or handled_by.
- OrderStatus is a history table linked by order_id and staff_id.
- OrderItems includes total_price.
- Orders uses special_instructions.
- Transactions uses payment_method, meal_plan_used and transaction_status.
- Menu management uses is_available only. inventory_quantity was removed because it is not in the supplied schema.
- Status spelling is Cancelled.
- DemoAccounts is prototype-only authentication data and is removed from the grading JSON export.
- Add Funds was removed because the supplied Transactions table requires order_id NOT NULL and does not define deposit transactions.

Demo accounts:
Student: aleon / password
Student: pparker / password
Staff: dtoretto / password
Manager: lhobbs / password
IT: ebrown / password
Professor demo: professor / demo

Professor demo maps to staff_id 113 for demonstration purposes, then can switch to student_id 101.

Export JSON:
Use Export JSON on the Staff Dashboard. The downloaded file contains only the eight MySQL-shaped tables and omits DemoAccounts.

Run through a local web server or GitHub Pages because apps.json is loaded with fetch().
