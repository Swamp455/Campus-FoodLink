/* =========================================================
   CAMPUS FOODLINK+
   PROTOTYPE APPLICATION
   ERD-BASED JSON / LOCALSTORAGE DATA MODEL
   ========================================================= */

const DB_KEY = "CampusFoodLinkDB";
const CART_KEY = "CampusFoodLinkCart";


/* =========================================================
   STORAGE FUNCTIONS
   ========================================================= */

function readStorage(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);

    return value
      ? JSON.parse(value)
      : fallback;

  } catch (error) {
    console.error("Storage read error:", error);
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

  const db = getDB();


  if (!db) {
    alert(
      "No Campus FoodLink+ data is available to export."
    );

    return;
  }


  /*
     Create a copy so passwords can be removed
     without changing the working database.
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


  /*
     Add basic information to help identify
     the grading export.
  */

  const exportData = {

    project:
      "Campus FoodLink+",

    export_type:
      "Prototype Grading Data",

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
        type: "application/json"
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


  link.href = url;

  link.download =
    `CampusFoodLink_Grading_Data_${date}.json`;


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
   INITIALIZE DATABASE

   apps.json = original seed database
   localStorage = working persistent database
   ========================================================= */

async function initializeDatabase() {

  let db = getDB();


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

    console.error(
      "Database initialization error:",
      error
    );


    alert(
      "Unable to load the Campus FoodLink+ database. " +
      "Make sure the project is running through a web server."
    );


    return null;
  }
}


/* =========================================================
   RESET DEMO DATABASE

   Reloads the original apps.json data.

   Restores:
   - Students
   - Staff
   - Vendors
   - MenuItems
   - OrderStatus
   - Original balances
   - Original inventory
   - Original availability

   Clears:
   - Orders
   - OrderItems
   - Transactions
   - Cart
   - Login session
   ========================================================= */

async function resetDemoData() {

  const confirmed =
    confirm(
      "Reset all Campus FoodLink+ demo data?\n\n" +
      "This will restore balances and inventory and remove " +
      "test orders, transactions, cart items, notes, and " +
      "status changes."
    );


  if (!confirmed) {
    return false;
  }


  try {

    /*
       Timestamp prevents the browser from
       returning a cached copy.
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


    /* REPLACE WORKING DATABASE */

    saveDB(
      freshDatabase
    );


    /* CLEAR CART */

    localStorage.removeItem(
      CART_KEY
    );


    /* CLEAR LOGIN SESSION */

    sessionStorage.clear();


    return true;

  } catch (error) {

    console.error(
      "Demo reset error:",
      error
    );


    alert(
      "Demo data could not be reset."
    );


    return false;
  }
}


/* =========================================================
   SESSION FUNCTIONS
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
   ERD LOOKUP FUNCTIONS
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
   LOGIN PAGE
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
     RESET DEMO DATA
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

          if (resetMessage) {
            resetMessage.textContent =
              "Demo data successfully reset.";
          }


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


  if (!form) {
    return;
  }


  /* =======================================================
     LOGIN VALIDATION
     ======================================================= */

  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      error.textContent = "";


      const enteredUsername =
        username.value
          .trim()
          .toLowerCase();


      const enteredPassword =
        password.value;


      /* ---------------------------------------------------
         CHECK STUDENTS
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
         CHECK STAFF
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


      password.value = "";


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


  const returnStaffBtn =
    document.getElementById(
      "returnStaffBtn"
    );


  /* =======================================================
     PROFESSOR DEMO MODE
     ======================================================= */

  if (
    returnStaffBtn &&
    sessionStorage.getItem(
      "cflProfessorDemo"
    ) ===
    "true"
  ) {

    returnStaffBtn.hidden =
      false;


    returnStaffBtn.addEventListener(
      "click",
      () => {

        const professorStaffId =
          sessionStorage.getItem(
            "cflProfessorStaffId"
          );


        if (!professorStaffId) {

          sessionStorage.clear();

          window.location.href =
            "index.html";

          return;
        }


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


  /* =======================================================
     DISPLAY STUDENT
     ======================================================= */

  function displayStudent() {

    if (studentName) {

      studentName.textContent =
        `${student.first_name} ${student.last_name}`;
    }


    if (balance) {

      balance.textContent =
        Number(
          student.balance
        ).toFixed(2);
    }
  }


  /* =======================================================
     GET MOST RECENT STUDENT ORDER
     ======================================================= */

  function getCurrentOrder() {

    const studentOrders =
      db.Orders.filter(
        order =>
          order.student_id ===
          student.student_id
      );


    if (
      studentOrders.length ===
      0
    ) {

      return null;
    }


    return studentOrders[
      studentOrders.length - 1
    ];
  }


  /* =======================================================
     DISPLAY CURRENT ORDER
     ======================================================= */

  function displayOrder() {

    const currentOrder =
      getCurrentOrder();


    if (!currentOrder) {

      if (orderId) {
        orderId.textContent =
          "No Current Order";
      }


      if (orderVendor) {
        orderVendor.textContent =
          "-";
      }


      if (orderStatus) {
        orderStatus.textContent =
          "-";
      }


      if (cancelOrderBtn) {
        cancelOrderBtn.style.display =
          "none";
      }


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


    if (orderId) {

      orderId.textContent =
        currentOrder.order_id;
    }


    if (orderVendor) {

      orderVendor.textContent =
        vendor
          ? vendor.vendor_name
          : "Unknown Vendor";
    }


    if (orderStatus) {

      orderStatus.textContent =
        status
          ? status.status_name
          : "Unknown";
    }


    const canCancel =
      status &&
      (
        status.status_name ===
          "Pending" ||

        status.status_name ===
          "Approved"
      );


    if (cancelOrderBtn) {

      cancelOrderBtn.style.display =
        canCancel
          ? "inline-block"
          : "none";
    }
  }


  /* =======================================================
     ADD FUNDS
     ======================================================= */

  if (
    addFundsBtn &&
    fundAmount
  ) {

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


        /* UPDATE STUDENT BALANCE */

        student.balance =
          Number(
            (
              Number(
                student.balance
              ) +
              amount
            ).toFixed(2)
          );


        /* CREATE DEPOSIT TRANSACTION */

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


        fundAmount.value = "";


        accountMessage.textContent =
          `$${amount.toFixed(2)} was added. ` +
          `New balance: $${student.balance.toFixed(2)}.`;
      }
    );
  }


  /* =======================================================
     CANCEL ORDER
     ======================================================= */

  if (cancelOrderBtn) {

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


        /*
           Only Pending and Approved
           orders can be canceled.
        */

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


        /*
           Prevent duplicate refund transactions.
        */

        const existingRefund =
          db.Transactions.find(
            transaction =>
              transaction.order_id ===
                currentOrder.order_id &&
              transaction.transaction_type ===
                "REFUND" &&
              transaction.transaction_status ===
                "COMPLETE"
          );


        if (existingRefund) {

          accountMessage.textContent =
            "This order has already been refunded.";


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


        if (!canceledStatus) {

          accountMessage.textContent =
            "Canceled order status could not be found.";


          return;
        }


        /* -------------------------------------------------
           UPDATE ORDER STATUS
           ------------------------------------------------- */

        currentOrder.status_id =
          canceledStatus.status_id;


        /* -------------------------------------------------
           RESTORE INVENTORY
           ------------------------------------------------- */

        const canceledItems =
          db.OrderItems.filter(
            item =>
              item.order_id ===
              currentOrder.order_id
          );


        canceledItems.forEach(
          orderItem => {

            const menuItem =
              findMenuItem(
                db,
                orderItem.menu_item_id
              );


            if (!menuItem) {
              return;
            }


            menuItem.inventory_quantity =
              Number(
                menuItem.inventory_quantity
              ) +
              Number(
                orderItem.quantity
              );


            /*
               Restore availability if inventory
               now exists.
            */

            if (
              menuItem.inventory_quantity >
              0
            ) {

              menuItem.is_available =
                true;
            }
          }
        );


        /* -------------------------------------------------
           REFUND STUDENT
           ------------------------------------------------- */

        student.balance =
          Number(
            (
              Number(
                student.balance
              ) +
              Number(
                currentOrder.total_amount
              )
            ).toFixed(2)
          );


        /* -------------------------------------------------
           CREATE REFUND TRANSACTION
           ------------------------------------------------- */

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
  }


  displayStudent();

  displayOrder();
}


/* =========================================================
   STUDENT MENU
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


  const pickupTime =
    document.getElementById(
      "pickupTime"
    );


  const placeOrder =
    document.getElementById(
      "placeOrder"
    );


  /* =======================================================
     LOAD VENDORS
     ======================================================= */

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


  /* =======================================================
     CHANGE VENDOR
     ======================================================= */

  vendorSelect.addEventListener(
    "change",
    () => {

      /*
         Clear cart when changing vendors so
         items from different vendors cannot
         be mixed into one order.
      */

      saveCart([]);


      draw();
    }
  );


  /* =======================================================
     DRAW MENU AND CART
     ======================================================= */

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


    /* ---------------------------------------------------
       AVAILABLE MENU ITEMS
       --------------------------------------------------- */

    const vendorMenu =
      db.MenuItems.filter(
        item =>
          item.vendor_id ===
            vendorId &&

          item.is_available ===
            true &&

          Number(
            item.inventory_quantity
          ) > 0
      );


    if (
      vendorMenu.length ===
      0
    ) {

      menuItems.innerHTML =
        "<p>No menu items are currently available from this vendor.</p>";

    } else {

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

                  <br>

                  <small>
                    ${item.inventory_quantity} available
                  </small>

                </div>

                <button
                  type="button"
                  class="add-item"
                  data-id="${item.menu_item_id}"
                  aria-label="Add ${item.item_name}"
                >
                  +
                </button>

              </div>

            `
          )
          .join("");
    }


    /* ---------------------------------------------------
       DRAW CART
       --------------------------------------------------- */

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
                    Number(
                      cartItem.quantity
                    )
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


    /* ---------------------------------------------------
       CART TOTAL
       --------------------------------------------------- */

    const total =
      cart.reduce(
        (
          sum,
          cartItem
        ) => {

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
            Number(
              menuItem.price
            ) *
            Number(
              cartItem.quantity
            )
          );
        },
        0
      );


    cartTotal.textContent =
      total.toFixed(2);


    /* =====================================================
       ADD ITEM
       ===================================================== */

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


              const menuItem =
                findMenuItem(
                  db,
                  menuItemId
                );


              if (!menuItem) {
                return;
              }


              let cart =
                getCart();


              const existing =
                cart.find(
                  item =>
                    item.menu_item_id ===
                    menuItemId
                );


              const currentQuantity =
                existing
                  ? Number(
                      existing.quantity
                    )
                  : 0;


              /*
                 Do not allow the cart quantity
                 to exceed inventory.
              */

              if (
                currentQuantity >=
                Number(
                  menuItem.inventory_quantity
                )
              ) {

                alert(
                  `Only ${menuItem.inventory_quantity} ` +
                  `${menuItem.item_name} are available.`
                );


                return;
              }


              if (existing) {

                existing.quantity += 1;

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


    /* =====================================================
       REMOVE ITEM
       ===================================================== */

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

                existing.quantity -= 1;

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


      /* VALIDATE VENDOR */

      if (!vendorId) {

        alert(
          "Please select a vendor."
        );

        return;
      }


      /* VALIDATE CART */

      if (
        cart.length ===
        0
      ) {

        alert(
          "Please add at least one item."
        );

        return;
      }


      /* VALIDATE INVENTORY */

      for (
        const cartItem of cart
      ) {

        const menuItem =
          findMenuItem(
            db,
            cartItem.menu_item_id
          );


        if (!menuItem) {

          alert(
            "One of the selected menu items could not be found."
          );

          return;
        }


        if (
          menuItem.vendor_id !==
          vendorId
        ) {

          alert(
            "The cart contains an item from another vendor."
          );

          return;
        }


        if (
          menuItem.is_available !==
          true
        ) {

          alert(
            `${menuItem.item_name} is no longer available.`
          );

          return;
        }


        if (
          Number(
            cartItem.quantity
          ) >
          Number(
            menuItem.inventory_quantity
          )
        ) {

          alert(
            `Only ${menuItem.inventory_quantity} ` +
            `${menuItem.item_name} are currently available.`
          );

          return;
        }
      }


      /* CALCULATE TOTAL */

      let total = 0;


      for (
        const cartItem of cart
      ) {

        const menuItem =
          findMenuItem(
            db,
            cartItem.menu_item_id
          );


        total +=
          Number(
            menuItem.price
          ) *
          Number(
            cartItem.quantity
          );
      }


      total =
        Number(
          total.toFixed(2)
        );


      /* VALIDATE BALANCE */

      if (
        total >
        Number(
          student.balance
        )
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


      if (!pendingStatus) {

        alert(
          "Pending order status could not be found."
        );

        return;
      }


      /* ---------------------------------------------------
         CREATE UNIQUE ORDER ID
         --------------------------------------------------- */

      let orderId =
        Number(
          Date.now()
            .toString()
            .slice(-8)
        );


      while (
        db.Orders.some(
          order =>
            order.order_id ===
            orderId
        )
      ) {

        orderId += 1;
      }


      /* ===================================================
         CREATE ORDER
         =================================================== */

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


      /* ===================================================
         CREATE ORDER ITEMS AND REDUCE INVENTORY
         =================================================== */

      cart.forEach(
        (
          cartItem,
          index
        ) => {

          const menuItem =
            findMenuItem(
              db,
              cartItem.menu_item_id
            );


          if (!menuItem) {
            return;
          }


          /* CREATE ORDER ITEM */

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
              Number(
                cartItem.quantity
              ),

            unit_price:
              Number(
                menuItem.price
              )
          });


          /* REDUCE INVENTORY */

          menuItem.inventory_quantity =
            Number(
              menuItem.inventory_quantity
            ) -
            Number(
              cartItem.quantity
            );


          /* AUTO MARK OUT OF STOCK */

          if (
            menuItem.inventory_quantity <=
            0
          ) {

            menuItem.inventory_quantity =
              0;


            menuItem.is_available =
              false;
          }
        }
      );


      /* ===================================================
         DEDUCT STUDENT BALANCE
         =================================================== */

      student.balance =
        Number(
          (
            Number(
              student.balance
            ) -
            total
          ).toFixed(2)
        );


      /* ===================================================
         CREATE PURCHASE TRANSACTION
         =================================================== */

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


      /* SAVE DATABASE */

      saveDB(db);


      /* CLEAR CART */

      saveCart([]);


      /* REMEMBER ORDER */

      sessionStorage.setItem(
        "cflLastOrderId",
        orderId
      );


      /* OPEN CONFIRMATION */

      window.location.href =
        "confirmation.html";
    }
  );


  draw();
}


/* =========================================================
   ORDER CONFIRMATION
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


  const confirmOrder =
    document.getElementById(
      "confirmOrder"
    );


  const confirmStatus =
    document.getElementById(
      "confirmStatus"
    );


  const confirmPickup =
    document.getElementById(
      "confirmPickup"
    );


  const logoutBtn =
    document.getElementById(
      "logoutBtn"
    );


  if (confirmOrder) {

    confirmOrder.textContent =
      currentOrder.order_id;
  }


  if (confirmStatus) {

    confirmStatus.textContent =
      status
        ? `${status.status_name.toLowerCase()}!`
        : "unknown";
  }


  if (confirmPickup) {

    confirmPickup.textContent =
      currentOrder.pickup_time;
  }


  if (logoutBtn) {

    logoutBtn.addEventListener(
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
}


/* =========================================================
   STAFF DASHBOARD
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


  const staffVendor =
    document.getElementById(
      "staffVendor"
    );


  const ordersBody =
    document.getElementById(
      "ordersBody"
    );


  const saveMessage =
    document.getElementById(
      "saveMessage"
    );


  const inventoryBody =
    document.getElementById(
      "inventoryBody"
    );


  const inventoryMessage =
    document.getElementById(
      "inventoryMessage"
    );


  const ordersSection =
    document.getElementById(
      "ordersSection"
    );


  const inventorySection =
    document.getElementById(
      "inventorySection"
    );


  const showOrdersBtn =
    document.getElementById(
      "showOrdersBtn"
    );


  const showInventoryBtn =
    document.getElementById(
      "showInventoryBtn"
    );


  const studentDemoBtn =
    document.getElementById(
      "studentDemoBtn"
    );


  const exportDataBtn =
    document.getElementById(
      "exportDataBtn"
    );


  const staffLogoutBtn =
    document.getElementById(
      "staffLogoutBtn"
    );


  /* =======================================================
     STAFF INFORMATION
     ======================================================= */

  if (staffName) {

    staffName.textContent =
      `${staff.first_name} ${staff.last_name}`;
  }


  if (staffVendor) {

    staffVendor.textContent =
      "Campus FoodLink+";
  }


  /* =======================================================
     PROFESSOR DEMO ACCESS
     ======================================================= */

  if (
    staff.role ===
      "PROFESSOR DEMO" &&
    studentDemoBtn
  ) {

    studentDemoBtn.hidden =
      false;


    studentDemoBtn.addEventListener(
      "click",
      () => {

        /*
           Preserve the professor's actual
           Staff primary key.
        */

        sessionStorage.setItem(
          "cflProfessorDemo",
          "true"
        );


        sessionStorage.setItem(
          "cflProfessorStaffId",
          staff.staff_id
        );


        /*
           Switch to Ale Leon for the
           student demonstration.
        */

        sessionStorage.setItem(
          "cflRole",
          "student"
        );


        sessionStorage.setItem(
          "cflStudentId",
          101
        );


        localStorage.removeItem(
          CART_KEY
        );


        window.location.href =
          "account.html";
      }
    );
  }


  /* =======================================================
     EXPORT GRADING DATA
     ======================================================= */

  if (exportDataBtn) {

    exportDataBtn.addEventListener(
      "click",
      () => {

        const confirmed =
          confirm(
            "Export the current Campus FoodLink+ " +
            "database as a JSON file for grading?"
          );


        if (!confirmed) {
          return;
        }


        exportDatabase();
      }
    );
  }


  /* =======================================================
     STAFF LOGOUT
     ======================================================= */

  if (staffLogoutBtn) {

    staffLogoutBtn.addEventListener(
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


  /* =======================================================
     STAFF DASHBOARD NAVIGATION
     ======================================================= */

  if (
    showOrdersBtn &&
    showInventoryBtn &&
    ordersSection &&
    inventorySection
  ) {

    showOrdersBtn.addEventListener(
      "click",
      () => {

        ordersSection.hidden =
          false;


        inventorySection.hidden =
          true;


        showOrdersBtn.classList.add(
          "active"
        );


        showInventoryBtn.classList.remove(
          "active"
        );


        drawOrders();
      }
    );


    showInventoryBtn.addEventListener(
      "click",
      () => {

        ordersSection.hidden =
          true;


        inventorySection.hidden =
          false;


        showInventoryBtn.classList.add(
          "active"
        );


        showOrdersBtn.classList.remove(
          "active"
        );


        drawInventory();
      }
    );
  }


  /* =======================================================
     DRAW ORDERS
     ======================================================= */

  function drawOrders() {

    if (!ordersBody) {
      return;
    }


    if (
      db.Orders.length ===
      0
    ) {

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


    /* =====================================================
       UPDATE ORDER STATUS
       ===================================================== */

    document
      .querySelectorAll(
        ".status-select"
      )
      .forEach(
        select => {

          select.addEventListener(
            "change",
            () => {

              const selectedOrderId =
                Number(
                  select.dataset.orderId
                );


              const order =
                db.Orders.find(
                  record =>
                    record.order_id ===
                    selectedOrderId
                );


              if (!order) {
                return;
              }


              const oldStatus =
                findStatus(
                  db,
                  order.status_id
                );


              const newStatus =
                findStatus(
                  db,
                  Number(
                    select.value
                  )
                );


              /*
                 Prevent a canceled order from
                 being reopened. This also helps
                 prevent duplicate refunds.
              */

              if (
                oldStatus &&
                oldStatus.status_name ===
                  "Canceled"
              ) {

                alert(
                  "Canceled orders cannot be reopened."
                );


                select.value =
                  order.status_id;


                return;
              }


              order.status_id =
                Number(
                  select.value
                );


              order.handled_by =
                staff.staff_id;


              saveDB(db);


              if (saveMessage) {

                saveMessage.textContent =
                  `Order #${order.order_id} updated to ` +
                  `${newStatus
                    ? newStatus.status_name
                    : "Unknown"}.`;
              }
            }
          );
        }
      );


    /* =====================================================
       SAVE ORDER NOTES
       ===================================================== */

    document
      .querySelectorAll(
        ".order-notes"
      )
      .forEach(
        textarea => {

          textarea.addEventListener(
            "change",
            () => {

              const selectedOrderId =
                Number(
                  textarea.dataset.orderId
                );


              const order =
                db.Orders.find(
                  record =>
                    record.order_id ===
                    selectedOrderId
                );


              if (!order) {
                return;
              }


              order.notes =
                textarea.value;


              order.handled_by =
                staff.staff_id;


              saveDB(db);


              if (saveMessage) {

                saveMessage.textContent =
                  `Notes saved for Order #${order.order_id}.`;
              }
            }
          );
        }
      );


    /* =====================================================
       VIEW ORDER DETAILS
       ===================================================== */

    document
      .querySelectorAll(
        ".view-order"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              const selectedOrderId =
                Number(
                  button.dataset.orderId
                );


              const order =
                db.Orders.find(
                  record =>
                    record.order_id ===
                    selectedOrderId
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
                          Number(
                            orderItem.quantity
                          )
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


  /* =======================================================
     DRAW INVENTORY
     ======================================================= */

  function drawInventory() {

    if (!inventoryBody) {
      return;
    }


    if (
      db.MenuItems.length ===
      0
    ) {

      inventoryBody.innerHTML = `

        <tr>
          <td colspan="7">
            No menu items found.
          </td>
        </tr>

      `;


      return;
    }


    inventoryBody.innerHTML =
      db.MenuItems
        .map(
          item => {

            const vendor =
              findVendor(
                db,
                item.vendor_id
              );


            const actualAvailable =
              item.is_available ===
                true &&
              Number(
                item.inventory_quantity
              ) > 0;


            return `

              <tr>

                <td>
                  ${item.menu_item_id}
                </td>

                <td>
                  ${
                    vendor
                      ? vendor.vendor_name
                      : "Unknown"
                  }
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

                  <input
                    type="number"
                    class="inventory-quantity"
                    data-item-id="${item.menu_item_id}"
                    min="0"
                    step="1"
                    value="${item.inventory_quantity}"
                  >

                </td>

                <td>

                  <select
                    class="availability-select"
                    data-item-id="${item.menu_item_id}"
                  >

                    <option
                      value="true"
                      ${
                        item.is_available
                          ? "selected"
                          : ""
                      }
                    >
                      Yes
                    </option>

                    <option
                      value="false"
                      ${
                        !item.is_available
                          ? "selected"
                          : ""
                      }
                    >
                      No
                    </option>

                  </select>

                  <small>
                    Currently:
                    ${
                      actualAvailable
                        ? "Available"
                        : "Unavailable"
                    }
                  </small>

                </td>

                <td>

                  <button
                    type="button"
                    class="save-inventory"
                    data-item-id="${item.menu_item_id}"
                  >
                    Save
                  </button>

                </td>

              </tr>

            `;
          }
        )
        .join("");


    /* =====================================================
       SAVE INVENTORY
       ===================================================== */

    document
      .querySelectorAll(
        ".save-inventory"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              const itemId =
                Number(
                  button.dataset.itemId
                );


              const menuItem =
                findMenuItem(
                  db,
                  itemId
                );


              if (!menuItem) {
                return;
              }


              const quantityInput =
                document.querySelector(
                  `.inventory-quantity[data-item-id="${itemId}"]`
                );


              const availabilityInput =
                document.querySelector(
                  `.availability-select[data-item-id="${itemId}"]`
                );


              if (
                !quantityInput ||
                !availabilityInput
              ) {

                return;
              }


              const quantity =
                Number(
                  quantityInput.value
                );


              /* VALIDATE QUANTITY */

              if (
                !Number.isInteger(
                  quantity
                ) ||
                quantity < 0
              ) {

                if (inventoryMessage) {

                  inventoryMessage.textContent =
                    "Inventory must be a whole number of 0 or greater.";
                }


                return;
              }


              /* UPDATE INVENTORY */

              menuItem.inventory_quantity =
                quantity;


              /* UPDATE AVAILABILITY */

              menuItem.is_available =
                availabilityInput.value ===
                "true";


              /*
                 Zero inventory always means
                 unavailable.
              */

              if (
                menuItem.inventory_quantity ===
                0
              ) {

                menuItem.is_available =
                  false;
              }


              saveDB(db);


              if (inventoryMessage) {

                inventoryMessage.textContent =
                  `${menuItem.item_name} inventory updated successfully.`;
              }


              drawInventory();
            }
          );
        }
      );
  }


  /* =======================================================
     INITIAL STAFF VIEW
     ======================================================= */

  drawOrders();
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


      default:

        console.warn(
          "Unknown Campus FoodLink+ page:",
          page
        );
    }
  }
);
