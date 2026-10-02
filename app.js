/* =========================================================
   CAMPUS FOODLINK+
   ERD-BASED PROTOTYPE
   ========================================================= */

const DB_KEY = "CampusFoodLinkDB";
const CART_KEY = "CampusFoodLinkCart";


/* =========================================================
   STORAGE
   ========================================================= */

function readStorage(key, fallback = null) {

  try {

    const value =
      localStorage.getItem(key);

    return value
      ? JSON.parse(value)
      : fallback;

  } catch (error) {

    console.error(
      "Storage read error:",
      error
    );

    return fallback;
  }
}


function writeStorage(key, value) {

  localStorage.setItem(
    key,
    JSON.stringify(value)
  );
}


function getDB() {

  return readStorage(
    DB_KEY,
    null
  );
}


function saveDB(db) {

  writeStorage(
    DB_KEY,
    db
  );
}


function getCart() {

  return readStorage(
    CART_KEY,
    []
  );
}


function saveCart(cart) {

  writeStorage(
    CART_KEY,
    cart
  );
}
/* =========================================================
   EXPORT DATABASE FOR GRADING
   ========================================================= */

function exportDatabase() {

  const db =
    getDB();


  if (!db) {

    alert(
      "No Campus FoodLink+ data is available to export."
    );

    return;
  }


  /*
     Make a copy so removing passwords does not
     change the working prototype database.
  */

  const cleanDatabase =
    JSON.parse(
      JSON.stringify(db)
    );


  /* REMOVE STUDENT PASSWORDS */

  if (
    Array.isArray(
      cleanDatabase.Students
    )
  ) {

    cleanDatabase.Students.forEach(
      student => {

        delete student.password;

      }
    );
  }


  /* REMOVE STAFF PASSWORDS */

  if (
    Array.isArray(
      cleanDatabase.Staff
    )
  ) {

    cleanDatabase.Staff.forEach(
      staff => {

        delete staff.password;

      }
    );
  }


  const exportData = {

    project:
      "Campus FoodLink+",

    export_type:
      "Prototype Data",

    exported_at:
      new Date().toISOString(),

    database:
      cleanDatabase
  };


  const json =
    JSON.stringify(
      exportData,
      null,
      2
    );


  const blob =
    new Blob(
      [json],
      {
        type:
          "application/json"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  const date =
    new Date()
      .toISOString()
      .slice(0, 10);


  link.href =
    url;


  link.download =
    `CampusFoodLink_Data_${date}.json`;


  document.body.appendChild(
    link
  );


  link.click();


  document.body.removeChild(
    link
  );


  URL.revokeObjectURL(
    url
  );
}


/* =========================================================
   INITIALIZE DATABASE FROM apps.json
   ========================================================= */

async function initializeDatabase() {

  let db =
    getDB();


  if (db) {
    return db;
  }


  try {

    const response =
      await fetch(
        "apps.json"
      );


    if (!response.ok) {

      throw new Error(
        "Unable to load apps.json."
      );

    }


    db =
      await response.json();


    saveDB(db);


    return db;

  } catch (error) {

    console.error(error);


    alert(
      "Unable to load the Campus FoodLink+ database."
    );


    return null;
  }
}


/* =========================================================
   RESET DEMO DATA
   ========================================================= */

async function resetDemoData() {

  const confirmed =
    confirm(
      "Reset all Campus FoodLink+ demo data?\n\n" +
      "This will remove test orders, transactions, " +
      "balance changes, cart items, notes, and status changes."
    );


  if (!confirmed) {
    return false;
  }


  try {

    /*
       Timestamp prevents browser caching.
    */

    const response =
      await fetch(
        "apps.json?reset=" +
        Date.now()
      );


    if (!response.ok) {

      throw new Error(
        "Unable to reload apps.json."
      );

    }


    const freshDatabase =
      await response.json();


    /* RESTORE ORIGINAL DATABASE */

    saveDB(
      freshDatabase
    );


    /* CLEAR TEMPORARY CART */

    localStorage.removeItem(
      CART_KEY
    );


    /* CLEAR CURRENT SESSION */

    sessionStorage.clear();


    return true;

  } catch (error) {

    console.error(
      "Reset error:",
      error
    );


    alert(
      "Demo data could not be reset."
    );


    return false;
  }
}


/* =========================================================
   SESSION
   ========================================================= */

function getRole() {

  return sessionStorage.getItem(
    "cflRole"
  );
}


function getStudentId() {

  return Number(
    sessionStorage.getItem(
      "cflStudentId"
    )
  );
}


function getStaffId() {

  return Number(
    sessionStorage.getItem(
      "cflStaffId"
    )
  );
}


function guard(requiredRole) {

  if (
    getRole() !==
    requiredRole
  ) {

    window.location.href =
      "index.html";

    return false;
  }


  return true;
}


/* =========================================================
   ERD LOOKUPS
   ========================================================= */

function findStudent(
  db,
  studentId
) {

  return db.Students.find(
    student =>
      student.student_id ===
      Number(studentId)
  );
}


function findStaff(
  db,
  staffId
) {

  return db.Staff.find(
    staff =>
      staff.staff_id ===
      Number(staffId)
  );
}


function findVendor(
  db,
  vendorId
) {

  return db.Vendors.find(
    vendor =>
      vendor.vendor_id ===
      Number(vendorId)
  );
}


function findMenuItem(
  db,
  menuItemId
) {

  return db.MenuItems.find(
    item =>
      item.menu_item_id ===
      Number(menuItemId)
  );
}


function findStatus(
  db,
  statusId
) {

  return db.OrderStatus.find(
    status =>
      status.status_id ===
      Number(statusId)
  );
}


function findStatusByName(
  db,
  name
) {

  return db.OrderStatus.find(
    status =>
      status.status_name
        .toLowerCase() ===
      name.toLowerCase()
  );
}


/* =========================================================
   LOGIN
   ========================================================= */

function loginInit(db) {

  const form =
    document.getElementById(
      "loginForm"
    );


  const username =
    document.getElementById(
      "userId"
    );


  const password =
    document.getElementById(
      "password"
    );


  const error =
    document.getElementById(
      "loginError"
    );


  const resetDemoBtn =
    document.getElementById(
      "resetDemoBtn"
    );


  const resetMessage =
    document.getElementById(
      "resetMessage"
    );


  /* =======================================================
     RESET BUTTON
     ======================================================= */

  if (resetDemoBtn) {

    resetDemoBtn.addEventListener(
      "click",
      async () => {

        resetDemoBtn.disabled =
          true;


        resetDemoBtn.textContent =
          "Resetting...";


        const success =
          await resetDemoData();


        if (success) {

          resetMessage.textContent =
            "Demo data successfully reset.";


          resetDemoBtn.textContent =
            "Reset Complete";


          setTimeout(
            () => {

              window.location.reload();

            },
            800
          );


          return;
        }


        resetDemoBtn.disabled =
          false;


        resetDemoBtn.textContent =
          "Reset Demo Data";
      }
    );
  }


  /* =======================================================
     LOGIN VALIDATION
     ======================================================= */

  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      error.textContent =
        "";


      const enteredUsername =
        username.value
          .trim()
          .toLowerCase();


      const enteredPassword =
        password.value;


      /* ---------------------------------------------------
         STUDENTS TABLE
         --------------------------------------------------- */

      const student =
        db.Students.find(
          record =>
            record.username
              .toLowerCase() ===
              enteredUsername &&
            record.password ===
              enteredPassword
        );


      if (student) {

        sessionStorage.clear();


        sessionStorage.setItem(
          "cflRole",
          "student"
        );


        sessionStorage.setItem(
          "cflStudentId",
          student.student_id
        );


        localStorage.removeItem(
          CART_KEY
        );


        window.location.href =
          "account.html";


        return;
      }


      /* ---------------------------------------------------
         STAFF TABLE
         --------------------------------------------------- */

      const staff =
        db.Staff.find(
          record =>
            record.username
              .toLowerCase() ===
              enteredUsername &&
            record.password ===
              enteredPassword &&
            record.is_active ===
              true
        );


      if (staff) {

        sessionStorage.clear();


        sessionStorage.setItem(
          "cflRole",
          "staff"
        );


        sessionStorage.setItem(
          "cflStaffId",
          staff.staff_id
        );


        window.location.href =
          "orders.html";


        return;
      }


      /* ---------------------------------------------------
         INVALID LOGIN
         --------------------------------------------------- */

      error.textContent =
        "Invalid username or password.";


      password.value =
        "";


      password.focus();
    }
  );
}


/* =========================================================
   STUDENT DASHBOARD
   ========================================================= */

function accountInit(db) {

  if (!guard("student")) {
    return;
  }


  const student =
    findStudent(
      db,
      getStudentId()
    );


  if (!student) {

    sessionStorage.clear();

    window.location.href =
      "index.html";

    return;
  }


  const studentName =
    document.getElementById(
      "studentName"
    );


  const balance =
    document.getElementById(
      "balance"
    );


  const orderId =
    document.getElementById(
      "orderId"
    );


  const orderVendor =
    document.getElementById(
      "orderVendor"
    );


  const orderStatus =
    document.getElementById(
      "orderStatus"
    );


  const fundAmount =
    document.getElementById(
      "fundAmount"
    );


  const addFundsBtn =
    document.getElementById(
      "addFundsBtn"
    );


  const cancelOrderBtn =
    document.getElementById(
      "cancelOrderBtn"
    );


  const accountMessage =
    document.getElementById(
      "accountMessage"
    );


  function displayStudent() {

    studentName.textContent =
      `${student.first_name} ${student.last_name}`;


    balance.textContent =
      Number(
        student.balance
      ).toFixed(2);
  }


  function getCurrentOrder() {

    const studentOrders =
      db.Orders.filter(
        order =>
          order.student_id ===
          student.student_id
      );


    if (
      studentOrders.length === 0
    ) {

      return null;
    }


    return studentOrders[
      studentOrders.length - 1
    ];
  }


  function displayOrder() {

    const currentOrder =
      getCurrentOrder();


    if (!currentOrder) {

      orderId.textContent =
        "No Current Order";


      orderVendor.textContent =
        "-";


      orderStatus.textContent =
        "-";


      cancelOrderBtn.style.display =
        "none";


      return;
    }


    const vendor =
      findVendor(
        db,
        currentOrder.vendor_id
      );


    const status =
      findStatus(
        db,
        currentOrder.status_id
      );


    orderId.textContent =
      currentOrder.order_id;


    orderVendor.textContent =
      vendor
        ? vendor.vendor_name
        : "Unknown Vendor";


    orderStatus.textContent =
      status
        ? status.status_name
        : "Unknown";


    const canCancel =
      status &&
      (
        status.status_name ===
          "Pending" ||
        status.status_name ===
          "Approved"
      );


    cancelOrderBtn.style.display =
      canCancel
        ? "inline-block"
        : "none";
  }


  /* =======================================================
     ADD FUNDS
     Students + Transactions
     ======================================================= */

  addFundsBtn.addEventListener(
    "click",
    () => {

      const amount =
        Number(
          fundAmount.value
        );


      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {

        accountMessage.textContent =
          "Please enter a valid amount greater than $0.00.";


        fundAmount.focus();


        return;
      }


      /* UPDATE STUDENT */

      student.balance =
        Number(
          (
            Number(student.balance) +
            amount
          ).toFixed(2)
        );


      /* CREATE TRANSACTION */

      db.Transactions.push({

        transaction_id:
          Date.now(),

        order_id:
          null,

        student_id:
          student.student_id,

        transaction_type:
          "DEPOSIT",

        amount:
          amount,

        transaction_status:
          "COMPLETE",

        transaction_date:
          new Date().toISOString()
      });


      saveDB(db);


      displayStudent();


      fundAmount.value =
        "";


      accountMessage.textContent =
        `$${amount.toFixed(2)} was added. ` +
        `New balance: $${student.balance.toFixed(2)}.`;
    }
  );


  /* =======================================================
     CANCEL ORDER
     ======================================================= */

  cancelOrderBtn.addEventListener(
    "click",
    () => {

      const currentOrder =
        getCurrentOrder();


      if (!currentOrder) {
        return;
      }


      const currentStatus =
        findStatus(
          db,
          currentOrder.status_id
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
          "This order can no longer be canceled.";


        return;
      }


      const confirmed =
        confirm(
          `Cancel Order #${currentOrder.order_id}?`
        );


      if (!confirmed) {
        return;
      }


      const canceledStatus =
        findStatusByName(
          db,
          "Canceled"
        );


      currentOrder.status_id =
        canceledStatus.status_id;


      /* REFUND */

      student.balance =
        Number(
          (
            Number(student.balance) +
            Number(
              currentOrder.total_amount
            )
          ).toFixed(2)
        );


      /* REFUND TRANSACTION */

      db.Transactions.push({

        transaction_id:
          Date.now(),

        order_id:
          currentOrder.order_id,

        student_id:
          student.student_id,

        transaction_type:
          "REFUND",

        amount:
          Number(
            currentOrder.total_amount
          ),

        transaction_status:
          "COMPLETE",

        transaction_date:
          new Date().toISOString()
      });


      saveDB(db);


      displayStudent();

      displayOrder();


      accountMessage.textContent =
        `Order #${currentOrder.order_id} was canceled. ` +
        `$${Number(
          currentOrder.total_amount
        ).toFixed(2)} was returned to your balance.`;
    }
  );


  displayStudent();

  displayOrder();
}


/* =========================================================
   VENDOR MENU / CART
   ========================================================= */

function menuInit(db) {

  if (!guard("student")) {
    return;
  }


  const student =
    findStudent(
      db,
      getStudentId()
    );


  if (!student) {

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


  const pickupTime =
    document.getElementById(
      "pickupTime"
    );


  const placeOrder =
    document.getElementById(
      "placeOrder"
    );


  /* LOAD VENDORS */

  vendorSelect.innerHTML =
    '<option value="">Select a Vendor</option>';


  db.Vendors.forEach(
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

      saveCart([]);

      draw();
    }
  );


  function draw() {

    const vendorId =
      Number(
        vendorSelect.value
      );


    if (!vendorId) {

      menuItems.innerHTML =
        "<p>Please select a vendor to view the menu.</p>";


      cartRows.innerHTML =
        "";


      cartTotal.textContent =
        "0.00";


      return;
    }


    /* MENU ITEMS FOR SELECTED VENDOR */

    const vendorMenu =
      db.MenuItems.filter(
        item =>
          item.vendor_id ===
            vendorId &&
          item.is_available ===
            true
      );


    menuItems.innerHTML =
      vendorMenu
        .map(
          item => `

            <div class="menu-item">

              <div class="food-img"></div>

              <div>

                <b>
                  ${item.item_name}
                </b>

                <br>

                $${Number(
                  item.price
                ).toFixed(2)}

              </div>

              <button
                type="button"
                class="add-item"
                data-id="${item.menu_item_id}"
              >
                +
              </button>

            </div>

          `
        )
        .join("");


    const cart =
      getCart();


    cartRows.innerHTML =
      cart
        .map(
          cartItem => {

            const menuItem =
              findMenuItem(
                db,
                cartItem.menu_item_id
              );


            if (!menuItem) {
              return "";
            }


            return `

              <tr>

                <td>
                  ${cartItem.quantity}
                </td>

                <td>
                  ${menuItem.item_name}
                </td>

                <td>

                  $${(
                    Number(
                      menuItem.price
                    ) *
                    cartItem.quantity
                  ).toFixed(2)}

                </td>

                <td>

                  <button
                    type="button"
                    class="remove-item"
                    data-id="${menuItem.menu_item_id}"
                  >
                    Remove
                  </button>

                </td>

              </tr>

            `;
          }
        )
        .join("");


    /* CALCULATE TOTAL */

    const total =
      cart.reduce(
        (sum, cartItem) => {

          const menuItem =
            findMenuItem(
              db,
              cartItem.menu_item_id
            );


          if (!menuItem) {
            return sum;
          }


          return (
            sum +
            Number(menuItem.price) *
            cartItem.quantity
          );
        },
        0
      );


    cartTotal.textContent =
      total.toFixed(2);


    /* ADD ITEMS */

    document
      .querySelectorAll(
        ".add-item"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              const menuItemId =
                Number(
                  button.dataset.id
                );


              const cart =
                getCart();


              const existing =
                cart.find(
                  item =>
                    item.menu_item_id ===
                    menuItemId
                );


              if (existing) {

                existing.quantity +=
                  1;

              } else {

                cart.push({

                  menu_item_id:
                    menuItemId,

                  quantity:
                    1

                });
              }


              saveCart(cart);

              draw();
            }
          );
        }
      );


    /* REMOVE ITEMS */

    document
      .querySelectorAll(
        ".remove-item"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              const menuItemId =
                Number(
                  button.dataset.id
                );


              let cart =
                getCart();


              const existing =
                cart.find(
                  item =>
                    item.menu_item_id ===
                    menuItemId
                );


              if (!existing) {
                return;
              }


              if (
                existing.quantity >
                1
              ) {

                existing.quantity -=
                  1;

              } else {

                cart =
                  cart.filter(
                    item =>
                      item.menu_item_id !==
                      menuItemId
                  );
              }


              saveCart(cart);

              draw();
            }
          );
        }
      );
  }


  /* =======================================================
     PLACE ORDER
     ======================================================= */

  placeOrder.addEventListener(
    "click",
    () => {

      const vendorId =
        Number(
          vendorSelect.value
        );


      const cart =
        getCart();


      if (!vendorId) {

        alert(
          "Please select a vendor."
        );

        return;
      }


      if (!cart.length) {

        alert(
          "Please add at least one item."
        );

        return;
      }


      let total = 0;


      for (
        const cartItem of cart
      ) {

        const menuItem =
          findMenuItem(
            db,
            cartItem.menu_item_id
          );


        if (!menuItem) {
          continue;
        }


        total +=
          Number(menuItem.price) *
          cartItem.quantity;
      }


      total =
        Number(
          total.toFixed(2)
        );


      /* CHECK BALANCE */

      if (
        total >
        Number(student.balance)
      ) {

        alert(
          "Insufficient balance. Please add funds to your account."
        );

        return;
      }


      const pendingStatus =
        findStatusByName(
          db,
          "Pending"
        );


      const orderId =
        Number(
          Date.now()
            .toString()
            .slice(-8)
        );


      /* CREATE ORDER */

      db.Orders.push({

        order_id:
          orderId,

        student_id:
          student.student_id,

        vendor_id:
          vendorId,

        status_id:
          pendingStatus.status_id,

        handled_by:
          null,

        order_date:
          new Date().toISOString(),

        pickup_time:
          pickupTime.value,

        notes:
          "",

        total_amount:
          total
      });


      /* CREATE ORDER ITEMS */

      cart.forEach(
        (cartItem, index) => {

          const menuItem =
            findMenuItem(
              db,
              cartItem.menu_item_id
            );


          if (!menuItem) {
            return;
          }


          db.OrderItems.push({

            order_item_id:
              Number(
                `${orderId}${index + 1}`
              ),

            order_id:
              orderId,

            menu_item_id:
              menuItem.menu_item_id,

            quantity:
              cartItem.quantity,

            unit_price:
              Number(
                menuItem.price
              )
          });
        }
      );


      /* DEDUCT BALANCE */

      student.balance =
        Number(
          (
            Number(student.balance) -
            total
          ).toFixed(2)
        );


      /* CREATE PURCHASE TRANSACTION */

      db.Transactions.push({

        transaction_id:
          Date.now(),

        order_id:
          orderId,

        student_id:
          student.student_id,

        transaction_type:
          "PURCHASE",

        amount:
          total,

        transaction_status:
          "COMPLETE",

        transaction_date:
          new Date().toISOString()
      });


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


  draw();
}


/* =========================================================
   CONFIRMATION
   ========================================================= */

function confirmationInit(db) {

  if (!guard("student")) {
    return;
  }


  const orderId =
    Number(
      sessionStorage.getItem(
        "cflLastOrderId"
      )
    );


  const currentOrder =
    db.Orders.find(
      order =>
        order.order_id ===
          orderId &&
        order.student_id ===
          getStudentId()
    );


  if (!currentOrder) {

    window.location.href =
      "account.html";

    return;
  }


  const status =
    findStatus(
      db,
      currentOrder.status_id
    );


  document
    .getElementById(
      "confirmOrder"
    )
    .textContent =
      currentOrder.order_id;


  document
    .getElementById(
      "confirmStatus"
    )
    .textContent =
      status
        ? `${status.status_name.toLowerCase()}!`
        : "unknown";


  document
    .getElementById(
      "confirmPickup"
    )
    .textContent =
      currentOrder.pickup_time;


  document
    .getElementById(
      "logoutBtn"
    )
    .addEventListener(
      "click",
      () => {

        sessionStorage.clear();

        localStorage.removeItem(
          CART_KEY
        );


        window.location.href =
          "index.html";
      }
    );
}


/* =========================================================
   STAFF ORDERS
   ========================================================= */

function ordersInit(db) {

  if (!guard("staff")) {
    return;
  }


  const staff =
    findStaff(
      db,
      getStaffId()
    );


  if (!staff) {

    sessionStorage.clear();

    window.location.href =
      "index.html";

    return;
  }


  const staffName =
    document.getElementById(
      "staffName"
    );


  const ordersBody =
    document.getElementById(
      "ordersBody"
    );


  const saveMessage =
    document.getElementById(
      "saveMessage"
    );


  const staffVendor =
    document.getElementById(
      "staffVendor"
    );


  staffName.textContent =
    `${staff.first_name} ${staff.last_name}`;


  staffVendor.textContent =
    "Vendor Orders";


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


  /* DISPLAY ORDERS */

  ordersBody.innerHTML =
    db.Orders
      .map(
        order => {

          const vendor =
            findVendor(
              db,
              order.vendor_id
            );


          const statusOptions =
            db.OrderStatus
              .map(
                option => `

                  <option
                    value="${option.status_id}"
                    ${
                      option.status_id ===
                      order.status_id
                        ? "selected"
                        : ""
                    }
                  >
                    ${option.status_name}
                  </option>

                `
              )
              .join("");


          return `

            <tr>

              <td>
                ${order.order_id}
              </td>

              <td>
                ${
                  vendor
                    ? vendor.vendor_name
                    : "Unknown"
                }
              </td>

              <td>

                <select
                  class="status-select"
                  data-order-id="${order.order_id}"
                >
                  ${statusOptions}
                </select>

              </td>

              <td>

                ${new Date(
                  order.order_date
                ).toLocaleDateString()}

              </td>

              <td>
                ${order.pickup_time}
              </td>

              <td>

                <textarea
                  class="order-notes"
                  data-order-id="${order.order_id}"
                >${order.notes || ""}</textarea>

              </td>

              <td>

                <button
                  type="button"
                  class="view-order"
                  data-order-id="${order.order_id}"
                >
                  View Order
                </button>

              </td>

            </tr>

          `;
        }
      )
      .join("");


  /* UPDATE STATUS */

  document
    .querySelectorAll(
      ".status-select"
    )
    .forEach(
      select => {

        select.addEventListener(
          "change",
          () => {

            const orderId =
              Number(
                select.dataset.orderId
              );


            const order =
              db.Orders.find(
                record =>
                  record.order_id ===
                  orderId
              );


            if (!order) {
              return;
            }


            order.status_id =
              Number(
                select.value
              );


            order.handled_by =
              staff.staff_id;


            saveDB(db);


            const status =
              findStatus(
                db,
                order.status_id
              );


            saveMessage.textContent =
              `Order #${order.order_id} updated to ${status.status_name}.`;
          }
        );
      }
    );


  /* SAVE NOTES */

  document
    .querySelectorAll(
      ".order-notes"
    )
    .forEach(
      textarea => {

        textarea.addEventListener(
          "change",
          () => {

            const orderId =
              Number(
                textarea.dataset.orderId
              );


            const order =
              db.Orders.find(
                record =>
                  record.order_id ===
                  orderId
              );


            if (!order) {
              return;
            }


            order.notes =
              textarea.value;


            order.handled_by =
              staff.staff_id;


            saveDB(db);


            saveMessage.textContent =
              `Notes saved for Order #${order.order_id}.`;
          }
        );
      }
    );


  /* VIEW ORDER */

  document
    .querySelectorAll(
      ".view-order"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const orderId =
              Number(
                button.dataset.orderId
              );


            const order =
              db.Orders.find(
                record =>
                  record.order_id ===
                  orderId
              );


            if (!order) {
              return;
            }


            const student =
              findStudent(
                db,
                order.student_id
              );


            const vendor =
              findVendor(
                db,
                order.vendor_id
              );


            const status =
              findStatus(
                db,
                order.status_id
              );


            const orderItems =
              db.OrderItems.filter(
                item =>
                  item.order_id ===
                  order.order_id
              );


            const itemText =
              orderItems
                .map(
                  orderItem => {

                    const menuItem =
                      findMenuItem(
                        db,
                        orderItem.menu_item_id
                      );


                    return (
                      `${orderItem.quantity} x ` +
                      `${menuItem
                        ? menuItem.item_name
                        : "Unknown Item"} - ` +
                      `$${(
                        Number(
                          orderItem.unit_price
                        ) *
                        orderItem.quantity
                      ).toFixed(2)}`
                    );
                  }
                )
                .join("\n");


            alert(

              `Order #${order.order_id}\n\n` +

              `Student: ${
                student
                  ? student.first_name +
                    " " +
                    student.last_name
                  : "Unknown"
              }\n` +

              `Vendor: ${
                vendor
                  ? vendor.vendor_name
                  : "Unknown"
              }\n` +

              `Pickup: ${order.pickup_time}\n` +

              `Status: ${
                status
                  ? status.status_name
                  : "Unknown"
              }\n\n` +

              `Items:\n${itemText}\n\n` +

              `Total: $${Number(
                order.total_amount
              ).toFixed(2)}`
            );
          }
        );
      }
    );
}


/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    const db =
      await initializeDatabase();


    if (!db) {
      return;
    }


    const page =
      document.body.dataset.page;


    switch (page) {

      case "login":

        loginInit(db);

        break;


      case "account":

        accountInit(db);

        break;


      case "menu":

        menuInit(db);

        break;


      case "confirmation":

        confirmationInit(db);

        break;


      case "orders":

        ordersInit(db);

        break;
    }
  }
);
