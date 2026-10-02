/* ============================================================
   Campus FoodLink+
   app.js
   MySQL Schema-Matched Prototype
   ============================================================ */


/* ============================================================
   LOCAL STORAGE KEYS
   ============================================================ */

const DB_KEY = "CampusFoodLinkDB";
const CART_KEY = "CampusFoodLinkCart";


/* ============================================================
   GENERAL DATA FUNCTIONS
   ============================================================ */

const read = (key, defaultValue = null) => {
  try {
    const value = localStorage.getItem(key);

    return value
      ? JSON.parse(value)
      : defaultValue;

  } catch {
    return defaultValue;
  }
};


const saveDB = (db) => {
  localStorage.setItem(
    DB_KEY,
    JSON.stringify(db)
  );
};


const cart = () => {
  return read(CART_KEY, []);
};


const saveCart = (cartData) => {
  localStorage.setItem(
    CART_KEY,
    JSON.stringify(cartData)
  );
};


/* ============================================================
   DATABASE HELPER FUNCTIONS
   ============================================================ */

const next = (array, key, start = 1) => {

  if (!array.length) {
    return start;
  }

  return (
    Math.max(
      ...array.map(item =>
        Number(item[key]) || 0
      )
    ) + 1
  );
};


const byId = (array, key, id) => {

  return array.find(
    item =>
      Number(item[key]) === Number(id)
  );
};


/*
   OrderStatus is a HISTORY table.

   An order can have:

   Pending
   Approved
   Preparing
   Ready
   Cancelled

   This function returns the newest
   status record for an order.
*/

const latestStatus = (db, orderId) => {

  const statuses = db.OrderStatus
    .filter(
      status =>
        Number(status.order_id) ===
        Number(orderId)
    )
    .sort((a, b) => {

      const dateDifference =
        new Date(b.updated_at) -
        new Date(a.updated_at);

      if (dateDifference !== 0) {
        return dateDifference;
      }

      return b.status_id - a.status_id;
    });

  return statuses[0] || null;
};


const currentStudent = (db) => {

  return byId(
    db.Students,
    "student_id",
    sessionStorage.getItem("cflStudentId")
  );
};


const currentStaff = (db) => {

  return byId(
    db.Staff,
    "staff_id",
    sessionStorage.getItem("cflStaffId")
  );
};


/* ============================================================
   PAGE SECURITY
   ============================================================ */

function guard(requiredRole) {

  if (
    sessionStorage.getItem("cflRole")
    !== requiredRole
  ) {

    window.location.href = "index.html";

    return false;
  }

  return true;
}


/* ============================================================
   INITIALIZE DATABASE
   ============================================================ */

async function initDB() {

  let db = read(DB_KEY);

  if (db) {
    return db;
  }

  try {

    const response =
      await fetch("apps.json");

    if (!response.ok) {
      throw new Error(
        "Unable to load apps.json"
      );
    }

    db = await response.json();

    saveDB(db);

    return db;

  } catch (error) {

    alert(
      "Unable to load application data. " +
      "Run Campus FoodLink+ through a web server " +
      "or GitHub Pages."
    );

    return null;
  }
}


/* ============================================================
   RESET DEMO DATA
   ============================================================ */

async function resetDB() {

  const confirmed = confirm(
    "Reset all Campus FoodLink+ demo data?"
  );

  if (!confirmed) {
    return false;
  }

  try {

    const response = await fetch(
      "apps.json?" + Date.now()
    );

    if (!response.ok) {
      throw new Error(
        "Unable to reload apps.json"
      );
    }

    const db = await response.json();

    saveDB(db);

    localStorage.removeItem(CART_KEY);

    sessionStorage.clear();

    return true;

  } catch (error) {

    alert(
      "Unable to reset demo data."
    );

    return false;
  }
}


/* ============================================================
   EXPORT DATABASE FOR GRADING
   ============================================================ */

function exportJSON() {

  const db = read(DB_KEY);

  if (!db) {
    return;
  }

  const copy =
    JSON.parse(
      JSON.stringify(db)
    );


  /*
     DemoAccounts supports prototype login only.
     It is NOT one of the eight MySQL tables.
  */

  delete copy.DemoAccounts;


  const exportData = {

    project:
      "Campus FoodLink+",

    schema:
      "MySQL-matched prototype export",

    exported_at:
      new Date().toISOString(),

    tables:
      copy
  };


  const blob = new Blob(
    [
      JSON.stringify(
        exportData,
        null,
        2
      )
    ],
    {
      type: "application/json"
    }
  );


  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");


  link.href = url;

  link.download =
    "CampusFoodLink_MySQL_Data_" +
    new Date()
      .toISOString()
      .slice(0, 10) +
    ".json";


  link.click();

  URL.revokeObjectURL(url);
}


/* ============================================================
   LOGIN PAGE
   index.html
   ============================================================ */

function loginInit(db) {

  const loginForm =
    document.getElementById(
      "loginForm"
    );

  const loginError =
    document.getElementById(
      "loginError"
    );

  const resetButton =
    document.getElementById(
      "resetDemoBtn"
    );


  /* Reset demo */

  resetButton.addEventListener(
    "click",
    async () => {

      const reset =
        await resetDB();

      if (reset) {
        window.location.reload();
      }
    }
  );


  /* Login */

  loginForm.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();


      const username =
        document
          .getElementById("userId")
          .value
          .trim()
          .toLowerCase();


      const password =
        document
          .getElementById("password")
          .value;


      const account =
        db.DemoAccounts.find(
          item =>
            item.login.toLowerCase()
              === username &&
            item.password
              === password
        );


      if (!account) {

        loginError.textContent =
          "Invalid username or password.";

        return;
      }


      sessionStorage.clear();


      /* Student login */

      if (
        account.account_type
        === "Student"
      ) {

        sessionStorage.setItem(
          "cflRole",
          "student"
        );

        sessionStorage.setItem(
          "cflStudentId",
          account.record_id
        );

        window.location.href =
          "account.html";

        return;
      }


      /* Staff / Professor login */

      sessionStorage.setItem(
        "cflRole",
        "staff"
      );

      sessionStorage.setItem(
        "cflStaffId",
        account.record_id
      );


      /*
         Professor Demo uses an existing
         staff record for demonstration.

         Preserve the original staff ID so
         Student Demo can return correctly.
      */

      if (
        account.account_type
        === "Professor Demo"
      ) {

        sessionStorage.setItem(
          "cflProfessorDemo",
          "true"
        );

        sessionStorage.setItem(
          "cflProfessorStaffId",
          account.record_id
        );
      }


      window.location.href =
        "orders.html";
    }
  );
}


/* ============================================================
   STUDENT DASHBOARD
   account.html
   ============================================================ */

function accountInit(db) {

  if (!guard("student")) {
    return;
  }


  const student =
    currentStudent(db);


  if (!student) {

    sessionStorage.clear();

    window.location.href =
      "index.html";

    return;
  }


  const accountMessage =
    document.getElementById(
      "accountMessage"
    );

  const cancelButton =
    document.getElementById(
      "cancelOrderBtn"
    );


  /* Student information */

  document.getElementById(
    "studentName"
  ).textContent =
    `${student.first_name} ${student.last_name}`;


  document.getElementById(
    "studentEmail"
  ).textContent =
    student.email_address;


  document.getElementById(
    "balance"
  ).textContent =
    Number(
      student.meal_plan_balance
    ).toFixed(2);


  /* ========================================================
     STUDENT LOGOUT
     ======================================================== */

  const studentLogout =
    document.getElementById(
      "studentLogout"
    );


  if (studentLogout) {

    studentLogout.addEventListener(
      "click",
      () => {

        sessionStorage.clear();
      }
    );
  }


  /* ========================================================
     PROFESSOR DEMO RETURN
     ======================================================== */

  const returnStaffButton =
    document.getElementById(
      "returnStaffBtn"
    );


  if (
    sessionStorage.getItem(
      "cflProfessorDemo"
    ) === "true"
  ) {

    returnStaffButton.hidden =
      false;


    returnStaffButton.addEventListener(
      "click",
      () => {

        const professorStaffId =
          sessionStorage.getItem(
            "cflProfessorStaffId"
          );


        sessionStorage.setItem(
          "cflRole",
          "staff"
        );


        sessionStorage.setItem(
          "cflStaffId",
          professorStaffId
        );


        sessionStorage.removeItem(
          "cflStudentId"
        );


        window.location.href =
          "orders.html";
      }
    );
  }


  /* ========================================================
     FIND STUDENT'S LATEST ORDER
     ======================================================== */

  const studentOrders =
    db.Orders
      .filter(
        order =>
          Number(order.student_id)
          === Number(student.student_id)
      )
      .sort(
        (a, b) =>
          new Date(a.order_date) -
          new Date(b.order_date)
      );


  const order =
    studentOrders.at(-1);


  if (!order) {

    cancelButton.hidden = true;

    return;
  }


  const vendor =
    byId(
      db.Vendors,
      "vendor_id",
      order.vendor_id
    );


  const status =
    latestStatus(
      db,
      order.order_id
    );


  document.getElementById(
    "orderId"
  ).textContent =
    order.order_id;


  document.getElementById(
    "orderVendor"
  ).textContent =
    vendor
      ? vendor.vendor_name
      : "Unknown";


  document.getElementById(
    "orderStatus"
  ).textContent =
    status
      ? status.status_name
      : "Pending";


  document.getElementById(
    "statusUpdated"
  ).textContent =
    status
      ? new Date(
          status.updated_at
        ).toLocaleString()
      : "-";


  /* ========================================================
     CANCEL ORDER
     ======================================================== */

  cancelButton.hidden =
    !status ||
    ![
      "Pending",
      "Approved"
    ].includes(
      status.status_name
    );


  cancelButton.addEventListener(
    "click",
    () => {

      const currentStatus =
        latestStatus(
          db,
          order.order_id
        );


      if (
        !currentStatus ||
        ![
          "Pending",
          "Approved"
        ].includes(
          currentStatus.status_name
        )
      ) {

        accountMessage.textContent =
          "This order can no longer be cancelled.";

        return;
      }


      const confirmed =
        confirm(
          `Cancel Order #${order.order_id}?`
        );


      if (!confirmed) {
        return;
      }


      /* Add status-history record */

      db.OrderStatus.push({

        status_id:
          next(
            db.OrderStatus,
            "status_id"
          ),

        order_id:
          order.order_id,

        staff_id:
          null,

        status_name:
          "Cancelled",

        status_description:
          "Cancelled by student",

        updated_at:
          new Date().toISOString()
      });


      /*
         Return the meal-plan amount.

         The supplied Transactions schema
         does not include a separate
         transaction_type field.
      */

      student.meal_plan_balance =
        Number(
          (
            Number(
              student.meal_plan_balance
            ) +
            Number(
              order.total_amount
            )
          ).toFixed(2)
        );


      /*
         Mark the existing transaction
         as Cancelled.
      */

      const transaction =
        db.Transactions.find(
          item =>
            Number(item.order_id)
            === Number(order.order_id)
        );


      if (transaction) {

        transaction.transaction_status =
          "Cancelled";
      }


      saveDB(db);

      window.location.reload();
    }
  );
}


/* ============================================================
   VENDOR MENU
   menu.html
   ============================================================ */

function menuInit(db) {

  if (!guard("student")) {
    return;
  }


  const student =
    currentStudent(db);


  if (!student) {

    sessionStorage.clear();

    window.location.href =
      "index.html";

    return;
  }


  const vendorSelect =
    document.getElementById(
      "vendorSelect"
    );

  const menuItems =
    document.getElementById(
      "menuItems"
    );

  const cartRows =
    document.getElementById(
      "cartRows"
    );

  const cartTotal =
    document.getElementById(
      "cartTotal"
    );


  document.getElementById(
    "menuBalance"
  ).textContent =
    Number(
      student.meal_plan_balance
    ).toFixed(2);


  /* ========================================================
     LOAD ACTIVE VENDORS
     ======================================================== */

  db.Vendors
    .filter(
      vendor =>
        vendor.is_active
    )
    .forEach(
      vendor => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          vendor.vendor_id;


        option.textContent =
          vendor.vendor_name;


        vendorSelect.appendChild(
          option
        );
      }
    );


  vendorSelect.addEventListener(
    "change",
    () => {

      /*
         An order belongs to one vendor,
         so switching vendors clears cart.
      */

      saveCart([]);

      drawMenu();
    }
  );


  /* ========================================================
     DRAW MENU AND CART
     ======================================================== */

  function drawMenu() {

    const vendorId =
      Number(
        vendorSelect.value
      );


    const currentCart =
      cart();


    if (!vendorId) {

      menuItems.innerHTML =
        "<p>Select a vendor to view the menu.</p>";

      cartRows.innerHTML = "";

      cartTotal.textContent =
        "0.00";

      return;
    }


    const availableItems =
      db.MenuItems.filter(
        item =>
          Number(item.vendor_id)
            === vendorId &&
          item.is_available
      );


    menuItems.innerHTML =
      availableItems
        .map(
          item => `

            <div class="menu-item">

              <div>

                <strong>
                  ${item.item_name}
                </strong>

                <br>

                ${item.description || ""}

                <br>

                <small>
                  ${item.category || ""}
                </small>

                <br>

                $${Number(
                  item.price
                ).toFixed(2)}

              </div>

              <button
                class="add"
                type="button"
                data-id="${item.menu_item_id}">
                Add
              </button>

            </div>

          `
        )
        .join("");


    if (!availableItems.length) {

      menuItems.innerHTML =
        "<p>No menu items are currently available.</p>";
    }


    /* Cart table */

    cartRows.innerHTML =
      currentCart
        .map(
          row => {

            const item =
              byId(
                db.MenuItems,
                "menu_item_id",
                row.menu_item_id
              );


            if (!item) {
              return "";
            }


            const lineTotal =
              Number(item.price) *
              Number(row.quantity);


            return `

              <tr>

                <td>
                  ${row.quantity}
                </td>

                <td>
                  ${item.item_name}
                </td>

                <td>
                  $${Number(
                    item.price
                  ).toFixed(2)}
                </td>

                <td>
                  $${lineTotal.toFixed(2)}
                </td>

                <td>

                  <button
                    class="remove"
                    type="button"
                    data-id="${item.menu_item_id}">
                    Remove
                  </button>

                </td>

              </tr>
            `;
          }
        )
        .join("");


    /* Cart total */

    const total =
      currentCart.reduce(
        (sum, row) => {

          const item =
            byId(
              db.MenuItems,
              "menu_item_id",
              row.menu_item_id
            );


          if (!item) {
            return sum;
          }


          return (
            sum +
            Number(item.price) *
            Number(row.quantity)
          );
        },
        0
      );


    cartTotal.textContent =
      total.toFixed(2);


    /* Add item */

    document
      .querySelectorAll(".add")
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              const itemId =
                Number(
                  button.dataset.id
                );


              const currentCart =
                cart();


              const existing =
                currentCart.find(
                  row =>
                    Number(
                      row.menu_item_id
                    ) === itemId
                );


              if (existing) {

                existing.quantity++;

              } else {

                currentCart.push({

                  menu_item_id:
                    itemId,

                  quantity:
                    1
                });
              }


              saveCart(
                currentCart
              );


              drawMenu();
            }
          );
        }
      );


    /* Remove item */

    document
      .querySelectorAll(".remove")
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              const itemId =
                Number(
                  button.dataset.id
                );


              let currentCart =
                cart();


              const existing =
                currentCart.find(
                  row =>
                    Number(
                      row.menu_item_id
                    ) === itemId
                );


              if (!existing) {
                return;
              }


              if (
                existing.quantity > 1
              ) {

                existing.quantity--;

              } else {

                currentCart =
                  currentCart.filter(
                    row =>
                      Number(
                        row.menu_item_id
                      ) !== itemId
                  );
              }


              saveCart(
                currentCart
              );


              drawMenu();
            }
          );
        }
      );
  }


  /* ========================================================
     PLACE ORDER
     ======================================================== */

  document
    .getElementById(
      "placeOrder"
    )
    .addEventListener(
      "click",
      () => {

        const vendorId =
          Number(
            vendorSelect.value
          );


        const currentCart =
          cart();


        const pickupTime =
          document.getElementById(
            "pickupTime"
          ).value;


        const specialInstructions =
          document.getElementById(
            "specialInstructions"
          ).value.trim();


        /* Validation */

        if (
          !vendorId ||
          !currentCart.length
        ) {

          alert(
            "Select a vendor and add at least one item."
          );

          return;
        }


        if (!pickupTime) {

          alert(
            "Select a pickup date and time."
          );

          return;
        }


        /*
           Confirm every item is still
           available and belongs to the
           selected vendor.
        */

        for (
          const row
          of currentCart
        ) {

          const item =
            byId(
              db.MenuItems,
              "menu_item_id",
              row.menu_item_id
            );


          if (
            !item ||
            !item.is_available ||
            Number(item.vendor_id)
              !== vendorId
          ) {

            alert(
              "A selected menu item is no longer available."
            );

            return;
          }
        }


        /* Calculate order total */

        const total =
          Number(
            currentCart
              .reduce(
                (sum, row) => {

                  const item =
                    byId(
                      db.MenuItems,
                      "menu_item_id",
                      row.menu_item_id
                    );


                  return (
                    sum +
                    Number(item.price) *
                    Number(row.quantity)
                  );
                },
                0
              )
              .toFixed(2)
          );


        /* Meal-plan validation */

        if (
          total >
          Number(
            student.meal_plan_balance
          )
        ) {

          alert(
            "Insufficient meal-plan balance."
          );

          return;
        }


        /* Generate IDs */

        const orderId =
          next(
            db.Orders,
            "order_id",
            15559
          );


        const now =
          new Date().toISOString();


        /* ==================================================
           CREATE ORDERS RECORD
           ================================================== */

        db.Orders.push({

          order_id:
            orderId,

          vendor_id:
            vendorId,

          student_id:
            student.student_id,

          order_date:
            now,

          total_amount:
            total,

          pickup_time:
            new Date(
              pickupTime
            ).toISOString(),

          special_instructions:
            specialInstructions
        });


        /* ==================================================
           CREATE ORDERITEMS RECORDS
           ================================================== */

        currentCart.forEach(
          row => {

            const item =
              byId(
                db.MenuItems,
                "menu_item_id",
                row.menu_item_id
              );


            const lineTotal =
              Number(
                (
                  Number(item.price) *
                  Number(row.quantity)
                ).toFixed(2)
              );


            db.OrderItems.push({

              order_item_id:
                next(
                  db.OrderItems,
                  "order_item_id"
                ),

              order_id:
                orderId,

              menu_item_id:
                item.menu_item_id,

              quantity:
                row.quantity,

              unit_price:
                Number(
                  item.price
                ),

              total_price:
                lineTotal
            });
          }
        );


        /* ==================================================
           CREATE INITIAL ORDERSTATUS RECORD
           ================================================== */

        db.OrderStatus.push({

          status_id:
            next(
              db.OrderStatus,
              "status_id"
            ),

          order_id:
            orderId,

          staff_id:
            null,

          status_name:
            "Pending",

          status_description:
            "Order submitted by student",

          updated_at:
            now
        });


        /* ==================================================
           CREATE TRANSACTION RECORD
           ================================================== */

        db.Transactions.push({

          transaction_id:
            next(
              db.Transactions,
              "transaction_id"
            ),

          order_id:
            orderId,

          student_id:
            student.student_id,

          transaction_date:
            now,

          amount:
            total,

          payment_method:
            "Meal Plan",

          meal_plan_used:
            total,

          transaction_status:
            "Complete"
        });


        /* ==================================================
           UPDATE STUDENT MEAL-PLAN BALANCE
           ================================================== */

        student.meal_plan_balance =
          Number(
            (
              Number(
                student.meal_plan_balance
              ) -
              total
            ).toFixed(2)
          );


        saveDB(db);

        saveCart([]);


        sessionStorage.setItem(
          "cflLastOrderId",
          orderId
        );


        window.location.href =
          "confirmation.html";
      }
    );


  drawMenu();
}


/* ============================================================
   ORDER CONFIRMATION
   confirmation.html
   ============================================================ */

function confirmationInit(db) {

  if (!guard("student")) {
    return;
  }


  const orderId =
    sessionStorage.getItem(
      "cflLastOrderId"
    );


  const order =
    byId(
      db.Orders,
      "order_id",
      orderId
    );


  if (!order) {

    window.location.href =
      "account.html";

    return;
  }


  const vendor =
    byId(
      db.Vendors,
      "vendor_id",
      order.vendor_id
    );


  const status =
    latestStatus(
      db,
      order.order_id
    );


  document.getElementById(
    "confirmOrder"
  ).textContent =
    order.order_id;


  document.getElementById(
    "confirmVendor"
  ).textContent =
    vendor
      ? vendor.vendor_name
      : "Unknown";


  document.getElementById(
    "confirmStatus"
  ).textContent =
    status
      ? status.status_name
      : "Pending";


  document.getElementById(
    "confirmPickup"
  ).textContent =
    new Date(
      order.pickup_time
    ).toLocaleString();


  document.getElementById(
    "confirmTotal"
  ).textContent =
    Number(
      order.total_amount
    ).toFixed(2);


  /* Logout */

  document.getElementById(
    "logoutBtn"
  ).addEventListener(
    "click",
    () => {

      sessionStorage.clear();

      window.location.href =
        "index.html";
    }
  );
}


/* ============================================================
   STAFF DASHBOARD
   orders.html
   ============================================================ */

function ordersInit(db) {

  if (!guard("staff")) {
    return;
  }


  const staff =
    currentStaff(db);


  if (
    !staff ||
    !staff.is_active
  ) {

    sessionStorage.clear();

    window.location.href =
      "index.html";

    return;
  }


  document.getElementById(
    "staffName"
  ).textContent =
    `${staff.first_name} ${staff.last_name}`;


  document.getElementById(
    "staffRole"
  ).textContent =
    staff.role;


  const ordersSection =
    document.getElementById(
      "ordersSection"
    );

  const menuSection =
    document.getElementById(
      "menuSection"
    );


  /* ========================================================
     PROFESSOR STUDENT DEMO
     ======================================================== */

  const studentDemoButton =
    document.getElementById(
      "studentDemoBtn"
    );


  if (
    sessionStorage.getItem(
      "cflProfessorDemo"
    ) === "true"
  ) {

    studentDemoButton.hidden =
      false;


    studentDemoButton.addEventListener(
      "click",
      () => {

        /*
           Preserve staff identity before
           entering student demonstration.
        */

        sessionStorage.setItem(
          "cflProfessorStaffId",
          staff.staff_id
        );


        sessionStorage.setItem(
          "cflRole",
          "student"
        );


        sessionStorage.setItem(
          "cflStudentId",
          101
        );


        window.location.href =
          "account.html";
      }
    );
  }


  /* ========================================================
     EXPORT
     ======================================================== */

  document.getElementById(
    "exportDataBtn"
  ).addEventListener(
    "click",
    exportJSON
  );


  /* ========================================================
     STAFF LOGOUT
     ======================================================== */

  document.getElementById(
    "staffLogoutBtn"
  ).addEventListener(
    "click",
    () => {

      sessionStorage.clear();

      window.location.href =
        "index.html";
    }
  );


  /* ========================================================
     PAGE NAVIGATION
     ======================================================== */

  document.getElementById(
    "showOrdersBtn"
  ).addEventListener(
    "click",
    () => {

      ordersSection.hidden =
        false;

      menuSection.hidden =
        true;

      drawOrders();
    }
  );


  document.getElementById(
    "showMenuBtn"
  ).addEventListener(
    "click",
    () => {

      ordersSection.hidden =
        true;

      menuSection.hidden =
        false;

      drawMenuAdmin();
    }
  );


  /* ========================================================
     STAFF ROLE PERMISSIONS
     ======================================================== */

  const canProcessOrders =
    staff.role ===
      "Dietary Associate" ||
    staff.role ===
      "Dietary Manager";


  const canManageMenu =
    staff.role ===
    "Dietary Manager";


  /*
     Only Dietary Managers can change
     menu availability.
  */

  if (!canManageMenu) {

    document.getElementById(
      "showMenuBtn"
    ).hidden = true;
  }


  /* ========================================================
     DRAW ORDERS
     ======================================================== */

  function drawOrders() {

    const ordersBody =
      document.getElementById(
        "ordersBody"
      );


    if (!db.Orders.length) {

      ordersBody.innerHTML = `

        <tr>

          <td colspan="7">
            No current orders.
          </td>

        </tr>
      `;

      return;
    }


    ordersBody.innerHTML =
      db.Orders
        .map(
          order => {

            const student =
              byId(
                db.Students,
                "student_id",
                order.student_id
              );


            const vendor =
              byId(
                db.Vendors,
                "vendor_id",
                order.vendor_id
              );


            const status =
              latestStatus(
                db,
                order.order_id
              );


            const statusControl =
              canProcessOrders
                ? `

                  <select
                    class="new-status"
                    data-id="${order.order_id}">

                    <option value="">
                      Select
                    </option>

                    <option value="Approved">
                      Approved
                    </option>

                    <option value="Preparing">
                      Preparing
                    </option>

                    <option value="Ready">
                      Ready
                    </option>

                    <option value="Cancelled">
                      Cancelled
                    </option>

                  </select>

                `
                : "View Only";


            return `

              <tr>

                <td>
                  ${order.order_id}
                </td>

                <td>
                  ${student
                    ? `${student.first_name} ${student.last_name}`
                    : "Unknown"}
                </td>

                <td>
                  ${vendor
                    ? vendor.vendor_name
                    : "Unknown"}
                </td>

                <td>
                  ${status
                    ? status.status_name
                    : "-"}
                </td>

                <td>
                  ${new Date(
                    order.pickup_time
                  ).toLocaleString()}
                </td>

                <td>
                  ${statusControl}
                </td>

                <td>

                  <button
                    class="details"
                    type="button"
                    data-id="${order.order_id}">
                    View
                  </button>

                </td>

              </tr>
            `;
          }
        )
        .join("");


    /* ======================================================
       UPDATE ORDER STATUS
       ====================================================== */

    if (canProcessOrders) {

      document
        .querySelectorAll(
          ".new-status"
        )
        .forEach(
          select => {

            select.addEventListener(
              "change",
              () => {

                if (!select.value) {
                  return;
                }


                const orderId =
                  Number(
                    select.dataset.id
                  );


                const currentStatus =
                  latestStatus(
                    db,
                    orderId
                  );


                /*
                   Cancelled orders remain
                   cancelled.
                */

                if (
                  currentStatus &&
                  currentStatus.status_name
                    === "Cancelled"
                ) {

                  alert(
                    "Cancelled orders cannot be reopened."
                  );

                  select.value = "";

                  return;
                }


                /*
                   Add a NEW history record.
                   Do not overwrite the
                   previous status.
                */

                db.OrderStatus.push({

                  status_id:
                    next(
                      db.OrderStatus,
                      "status_id"
                    ),

                  order_id:
                    orderId,

                  staff_id:
                    staff.staff_id,

                  status_name:
                    select.value,

                  status_description:
                    `Status updated by ${staff.first_name} ${staff.last_name}`,

                  updated_at:
                    new Date().toISOString()
                });


                saveDB(db);


                document.getElementById(
                  "saveMessage"
                ).textContent =
                  `Order #${orderId} status updated.`;


                drawOrders();
              }
            );
          }
        );
    }


    /* ======================================================
       VIEW ORDER DETAILS
       ====================================================== */

    document
      .querySelectorAll(
        ".details"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              const order =
                byId(
                  db.Orders,
                  "order_id",
                  button.dataset.id
                );


              if (!order) {
                return;
              }


              const student =
                byId(
                  db.Students,
                  "student_id",
                  order.student_id
                );


              const orderItems =
                db.OrderItems.filter(
                  item =>
                    Number(
                      item.order_id
                    ) ===
                    Number(
                      order.order_id
                    )
                );


              const itemLines =
                orderItems
                  .map(
                    row => {

                      const menuItem =
                        byId(
                          db.MenuItems,
                          "menu_item_id",
                          row.menu_item_id
                        );


                      return (
                        `${row.quantity} x ` +
                        `${menuItem
                          ? menuItem.item_name
                          : "Unknown Item"} ` +
                        `= $${Number(
                          row.total_price
                        ).toFixed(2)}`
                      );
                    }
                  )
                  .join("\n");


              alert(

                `Order #${order.order_id}\n` +

                `Student: ${
                  student
                    ? `${student.first_name} ${student.last_name}`
                    : "Unknown"
                }\n` +

                `Special Instructions: ${
                  order.special_instructions
                    || "None"
                }\n\n` +

                `${itemLines}\n\n` +

                `Total: $${Number(
                  order.total_amount
                ).toFixed(2)}`
              );
            }
          );
        }
      );
  }


  /* ========================================================
     MENU AVAILABILITY
     Dietary Manager Only
     ======================================================== */

  function drawMenuAdmin() {

    if (!canManageMenu) {
      return;
    }


    const menuAdminBody =
      document.getElementById(
        "menuAdminBody"
      );


    menuAdminBody.innerHTML =
      db.MenuItems
        .map(
          item => {

            const vendor =
              byId(
                db.Vendors,
                "vendor_id",
                item.vendor_id
              );


            return `

              <tr>

                <td>
                  ${item.menu_item_id}
                </td>

                <td>
                  ${vendor
                    ? vendor.vendor_name
                    : "Unknown"}
                </td>

                <td>
                  ${item.item_name}
                </td>

                <td>
                  ${item.category || ""}
                </td>

                <td>
                  $${Number(
                    item.price
                  ).toFixed(2)}
                </td>

                <td>

                  <select
                    class="avail"
                    data-id="${item.menu_item_id}">

                    <option
                      value="true"
                      ${item.is_available
                        ? "selected"
                        : ""}>
                      Yes
                    </option>

                    <option
                      value="false"
                      ${!item.is_available
                        ? "selected"
                        : ""}>
                      No
                    </option>

                  </select>

                </td>

                <td>

                  <button
                    class="save-menu"
                    type="button"
                    data-id="${item.menu_item_id}">
                    Save
                  </button>

                </td>

              </tr>
            `;
          }
        )
        .join("");


    /* Save availability */

    document
      .querySelectorAll(
        ".save-menu"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              const menuItem =
                byId(
                  db.MenuItems,
                  "menu_item_id",
                  button.dataset.id
                );


              const availability =
                document.querySelector(
                  `.avail[data-id="${menuItem.menu_item_id}"]`
                );


              menuItem.is_available =
                availability.value
                === "true";


              saveDB(db);


              document.getElementById(
                "menuMessage"
              ).textContent =
                `${menuItem.item_name} availability updated.`;
            }
          );
        }
      );
  }


  drawOrders();
}


/* ============================================================
   START APPLICATION
   ============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    const db =
      await initDB();


    if (!db) {
      return;
    }


    const page =
      document.body.dataset.page;


    const pages = {

      login:
        loginInit,

      account:
        accountInit,

      menu:
        menuInit,

      confirmation:
        confirmationInit,

      orders:
        ordersInit
    };


    if (pages[page]) {

      pages[page](db);
    }
  }
);
