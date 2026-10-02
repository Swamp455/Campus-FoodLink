/* =========================================================
   CAMPUS FOODLINK+
   APPLICATION JAVASCRIPT
   ========================================================= */


/* =========================================================
   FALLBACK APPLICATION DATA
   Used if apps.json cannot be loaded
   ========================================================= */

const FALLBACK = {

  students: [
    {
      id: 101,
      userId: "aleon",
      password: "password",
      name: "Ale Leon",
      balance: 100.00
    },
    {
      id: 102,
      userId: "pparker",
      password: "password",
      name: "Peter Parker",
      balance: 75.00
    }
  ],

  staff: [
    {
      id: 113,
      userId: "dtoretto",
      password: "password",
      name: "Dominic Toretto",
      role: "DIETARY ASSOCIATE"
    },
    {
      id: 114,
      userId: "lhobbs",
      password: "password",
      name: "Luke Hobbs",
      role: "DIETARY MANAGER"
    },
    {
      id: 115,
      userId: "ebrown",
      password: "password",
      name: "Emmett Brown",
      role: "IT STAFF"
    }
  ],

  vendors: [
    {
      id: 1,
      name: "Frenchies",
      menu: [
        {
          id: 991,
          name: "Tuna Sandwich",
          price: 10.00
        },
        {
          id: 992,
          name: "Pizza",
          price: 20.00
        },
        {
          id: 993,
          name: "Roasted Green Beans",
          price: 6.00
        }
      ]
    },

    {
      id: 2,
      name: "Campus Grill",
      menu: [
        {
          id: 994,
          name: "Classic Cheeseburger",
          price: 8.50
        },
        {
          id: 995,
          name: "Seasoned Fries",
          price: 3.50
        },
        {
          id: 996,
          name: "Grilled Chicken Sandwich",
          price: 9.00
        }
      ]
    },

    {
      id: 3,
      name: "Student Cafe",
      menu: [
        {
          id: 997,
          name: "Turkey Club",
          price: 8.00
        },
        {
          id: 998,
          name: "Garden Salad",
          price: 7.00
        },
        {
          id: 999,
          name: "Fruit Cup",
          price: 4.00
        }
      ]
    }
  ],

  orderStatus: [
    "Pending",
    "Approved",
    "Preparing",
    "Ready",
    "Canceled"
  ]
};


/* =========================================================
   LOCAL STORAGE FUNCTIONS
   ========================================================= */

const read = (key, fallback = null) => {

  try {

    return JSON.parse(
      localStorage.getItem(key)
    ) ?? fallback;

  } catch {

    return fallback;

  }

};


const write = (key, value) => {

  localStorage.setItem(
    key,
    JSON.stringify(value)
  );

};


/* =========================================================
   LOAD apps.json
   ========================================================= */

async function data() {

  try {

    const response =
      await fetch("apps.json");


    if (response.ok) {

      return await response.json();

    }

  } catch {

    console.warn(
      "apps.json could not be loaded. Using fallback data."
    );

  }


  return FALLBACK;

}


/* =========================================================
   CURRENT USER ROLE
   ========================================================= */

function role() {

  return sessionStorage.getItem(
    "cflRole"
  );

}


/* =========================================================
   PAGE ACCESS CONTROL
   ========================================================= */

function guard(requiredRole) {

  if (role() !== requiredRole) {

    location.href =
      "index.html";

    return false;

  }


  return true;

}


/* =========================================================
   CURRENT STUDENT
   ========================================================= */

function currentStudent() {

  return read(
    "cflStudent",
    null
  );

}


/* =========================================================
   CURRENT ORDER
   ========================================================= */

function order() {

  return read(
    "cflOrder",
    null
  );

}


/* =========================================================
   SHOPPING CART
   ========================================================= */

function cart() {

  return read(
    "cflCart",
    []
  );

}


/* =========================================================
   LOGIN PAGE
   USER FLOW 1
   ========================================================= */

function loginInit(d) {

  const loginForm =
    document.getElementById(
      "loginForm"
    );


  const userIdInput =
    document.getElementById(
      "userId"
    );


  const passwordInput =
    document.getElementById(
      "password"
    );


  const loginError =
    document.getElementById(
      "loginError"
    );


  loginForm.onsubmit = event => {

    event.preventDefault();


    /* -----------------------------------------------------
       GET USERNAME AND PASSWORD
       ----------------------------------------------------- */

    const enteredUserId =
      userIdInput.value.trim();


    const enteredPassword =
      passwordInput.value;


    loginError.textContent =
      "";


    /* -----------------------------------------------------
       CHECK STUDENT TABLE
       ----------------------------------------------------- */

    const student =
      d.students.find(
        student =>
          student.userId.toLowerCase() ===
          enteredUserId.toLowerCase()
      );


    /* -----------------------------------------------------
       CHECK STAFF TABLE
       ----------------------------------------------------- */

    const staffMember =
      d.staff.find(
        staff =>
          staff.userId.toLowerCase() ===
          enteredUserId.toLowerCase()
      );


    /* =====================================================
       VALID STUDENT LOGIN
       ===================================================== */

    if (
      student &&
      student.password === enteredPassword
    ) {

      sessionStorage.setItem(
        "cflRole",
        "student"
      );


      sessionStorage.setItem(
        "cflUserId",
        student.userId
      );


      sessionStorage.setItem(
        "cflStudentId",
        student.id
      );


      /*
         Check whether this student already has
         locally saved account information.
      */

      const savedStudent =
        read(
          `cflStudent_${student.id}`,
          null
        );


      if (savedStudent) {

        write(
          "cflStudent",
          savedStudent
        );

      } else {

        write(
          "cflStudent",
          student
        );


        write(
          `cflStudent_${student.id}`,
          student
        );

      }


      /* CLEAR OLD CART */

      localStorage.removeItem(
        "cflCart"
      );


      location.href =
        "account.html";


      return;

    }


    /* =====================================================
       VALID STAFF LOGIN
       ===================================================== */

    if (
      staffMember &&
      staffMember.password === enteredPassword
    ) {

      sessionStorage.setItem(
        "cflRole",
        "staff"
      );


      sessionStorage.setItem(
        "cflUserId",
        staffMember.userId
      );


      sessionStorage.setItem(
        "cflStaffId",
        staffMember.id
      );


      sessionStorage.setItem(
        "cflStaffName",
        staffMember.name
      );


      sessionStorage.setItem(
        "cflStaffRole",
        staffMember.role
      );


      location.href =
        "orders.html";


      return;

    }


    /* =====================================================
       INVALID USERNAME OR PASSWORD
       ===================================================== */

    loginError.textContent =
      "Invalid username or password.";


    /*
       Clear password after failed login.
    */

    passwordInput.value =
      "";


    passwordInput.focus();

  };

}


/* =========================================================
   STUDENT DASHBOARD
   ========================================================= */

function accountInit() {

  if (!guard("student")) {

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


  /* =======================================================
     DISPLAY STUDENT INFORMATION
     ======================================================= */

  function displayStudent() {

    const student =
      currentStudent();


    if (!student) {

      location.href =
        "index.html";

      return;

    }


    studentName.textContent =
      student.name;


    balance.textContent =
      Number(
        student.balance
      ).toFixed(2);

  }


  /* =======================================================
     DISPLAY CURRENT ORDER
     ======================================================= */

  function displayOrder() {

    const student =
      currentStudent();


    const currentOrder =
      order();


    /*
       Only display the order if it belongs
       to the currently logged-in student.
    */

    if (
      !currentOrder ||
      !student ||
      currentOrder.studentId !== student.id
    ) {

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


    orderId.textContent =
      currentOrder.id;


    orderVendor.textContent =
      currentOrder.vendor;


    orderStatus.textContent =
      currentOrder.status;


    /*
       Student may cancel Pending or Approved orders.

       Preparing, Ready, and Canceled orders
       cannot be canceled by the student.
    */

    if (
      currentOrder.status === "Preparing" ||
      currentOrder.status === "Ready" ||
      currentOrder.status === "Canceled"
    ) {

      cancelOrderBtn.style.display =
        "none";

    } else {

      cancelOrderBtn.style.display =
        "inline-block";

    }

  }


  /* =======================================================
     ADD FUNDS
     ======================================================= */

  addFundsBtn.onclick = () => {

    const amount =
      prompt(
        "Enter the amount you would like to add:"
      );


    if (amount === null) {

      return;

    }


    const funds =
      Number(amount);


    /* VALIDATE AMOUNT */

    if (
      !Number.isFinite(funds) ||
      funds <= 0
    ) {

      alert(
        "Please enter a valid amount greater than $0."
      );


      return;

    }


    const student =
      currentStudent();


    if (!student) {

      return;

    }


    student.balance =
      +(
        Number(student.balance) +
        funds
      ).toFixed(2);


    /* SAVE STUDENT */

    write(
      "cflStudent",
      student
    );


    write(
      `cflStudent_${student.id}`,
      student
    );


    accountMessage.textContent =
      `$${funds.toFixed(2)} was added to your account.`;


    displayStudent();

  };


  /* =======================================================
     CANCEL ORDER
     ======================================================= */

  cancelOrderBtn.onclick = () => {

    const student =
      currentStudent();


    const currentOrder =
      order();


    if (
      !student ||
      !currentOrder
    ) {

      return;

    }


    /*
       Make sure the order belongs to
       the logged-in student.
    */

    if (
      currentOrder.studentId !== student.id
    ) {

      return;

    }


    /* CHECK ORDER STATUS */

    if (
      currentOrder.status === "Preparing" ||
      currentOrder.status === "Ready" ||
      currentOrder.status === "Canceled"
    ) {

      alert(
        "This order can no longer be canceled."
      );


      return;

    }


    /* CONFIRM CANCELLATION */

    const confirmed =
      confirm(
        `Are you sure you want to cancel Order #${currentOrder.id}?`
      );


    if (!confirmed) {

      return;

    }


    /* CHANGE STATUS */

    currentOrder.status =
      "Canceled";


    write(
      "cflOrder",
      currentOrder
    );


    /* REFUND ORDER */

    student.balance =
      +(
        Number(student.balance) +
        Number(currentOrder.total)
      ).toFixed(2);


    /* SAVE UPDATED STUDENT */

    write(
      "cflStudent",
      student
    );


    write(
      `cflStudent_${student.id}`,
      student
    );


    accountMessage.textContent =
      `Order #${currentOrder.id} was canceled. ` +
      `$${Number(currentOrder.total).toFixed(2)} ` +
      `was returned to your balance.`;


    displayStudent();

    displayOrder();

  };


  /* =======================================================
     INITIAL DISPLAY
     ======================================================= */

  displayStudent();

  displayOrder();

}


/* =========================================================
   VENDOR MENU
   USER FLOW 2
   ========================================================= */

function menuInit(d) {

  if (!guard("student")) {

    return;

  }


  const student =
    currentStudent();


  if (!student) {

    location.href =
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


  let selectedVendor =
    null;


  /* =======================================================
     BUILD VENDOR DROPDOWN
     ======================================================= */

  vendorSelect.innerHTML =
    '<option value="">Select a Vendor</option>';


  d.vendors.forEach(vendor => {

    const option =
      document.createElement(
        "option"
      );


    option.value =
      vendor.id;


    option.textContent =
      vendor.name;


    vendorSelect.appendChild(
      option
    );

  });


  /* =======================================================
     VENDOR SELECTION
     ======================================================= */

  vendorSelect.onchange = () => {

    const vendorId =
      Number(
        vendorSelect.value
      );


    selectedVendor =
      d.vendors.find(
        vendor =>
          vendor.id === vendorId
      ) || null;


    /*
       Clear cart when changing vendors.
       This prevents items from multiple
       vendors being placed in one order.
    */

    localStorage.removeItem(
      "cflCart"
    );


    draw();

  };


  /* =======================================================
     DRAW MENU AND SHOPPING CART
     ======================================================= */

  function draw() {


    /* -----------------------------------------------------
       NO VENDOR SELECTED
       ----------------------------------------------------- */

    if (!selectedVendor) {

      menuItems.innerHTML =
        "<p>Please select a vendor to view the menu.</p>";


      cartRows.innerHTML =
        "";


      cartTotal.textContent =
        "0.00";


      return;

    }


    /* -----------------------------------------------------
       DISPLAY MENU
       ----------------------------------------------------- */

    menuItems.innerHTML =
      selectedVendor.menu
        .map(item => `

          <div class="menu-item">

            <div class="food-img"></div>

            <div>

              <b>
                ${item.name}
              </b>

              <br>

              $${Number(
                item.price
              ).toFixed(2)}

            </div>

            <button
              type="button"
              class="add-item"
              data-id="${item.id}"
              aria-label="Add ${item.name}"
            >
              +
            </button>

          </div>

        `)
        .join("");


    /* -----------------------------------------------------
       CURRENT CART
       ----------------------------------------------------- */

    const currentCart =
      cart();


    /* -----------------------------------------------------
       DISPLAY CART
       ----------------------------------------------------- */

    cartRows.innerHTML =
      currentCart
        .map(item => `

          <tr>

            <td>
              ${item.qty}
            </td>

            <td>
              ${item.name}
            </td>

            <td>
              $${(
                Number(item.price) *
                item.qty
              ).toFixed(2)}
            </td>

            <td>

              <button
                type="button"
                class="remove-item"
                data-id="${item.id}"
                aria-label="Remove ${item.name}"
              >
                Remove
              </button>

            </td>

          </tr>

        `)
        .join("");


    /* =====================================================
       REMOVE ITEM FROM CART
       ===================================================== */

    document
      .querySelectorAll(
        ".remove-item"
      )
      .forEach(button => {

        button.onclick = () => {

          const itemId =
            Number(
              button.dataset.id
            );


          let updatedCart =
            cart();


          const item =
            updatedCart.find(
              cartItem =>
                cartItem.id === itemId
            );


          if (!item) {

            return;

          }


          /*
             If quantity is greater than 1,
             remove one.
          */

          if (item.qty > 1) {

            item.qty--;

          } else {

            /*
               If quantity is 1,
               remove the item completely.
            */

            updatedCart =
              updatedCart.filter(
                cartItem =>
                  cartItem.id !== itemId
              );

          }


          write(
            "cflCart",
            updatedCart
          );


          draw();

        };

      });


    /* =====================================================
       CALCULATE TOTAL
       ===================================================== */

    const total =
      currentCart.reduce(
        (sum, item) =>
          sum +
          Number(item.price) *
          item.qty,
        0
      );


    cartTotal.textContent =
      total.toFixed(2);


    /* =====================================================
       ADD ITEM TO CART
       ===================================================== */

    document
      .querySelectorAll(
        ".add-item"
      )
      .forEach(button => {

        button.onclick = () => {

          const item =
            selectedVendor.menu.find(
              menuItem =>
                menuItem.id ===
                Number(
                  button.dataset.id
                )
            );


          if (!item) {

            return;

          }


          const updatedCart =
            cart();


          const existingItem =
            updatedCart.find(
              cartItem =>
                cartItem.id === item.id
            );


          if (existingItem) {

            existingItem.qty++;

          } else {

            updatedCart.push({

              ...item,

              qty: 1

            });

          }


          write(
            "cflCart",
            updatedCart
          );


          draw();

        };

      });

  }


  /* =======================================================
     CONFIRM ORDER
     ======================================================= */

  placeOrder.onclick = () => {


    /* VALIDATE VENDOR */

    if (!selectedVendor) {

      alert(
        "Please select a vendor."
      );


      return;

    }


    /* VALIDATE CART */

    const currentCart =
      cart();


    if (!currentCart.length) {

      alert(
        "Select at least one item."
      );


      return;

    }


    /* CALCULATE TOTAL */

    const total =
      currentCart.reduce(
        (sum, item) =>
          sum +
          Number(item.price) *
          item.qty,
        0
      );


    const currentStudentData =
      currentStudent();


    if (!currentStudentData) {

      location.href =
        "index.html";

      return;

    }


    /* VALIDATE BALANCE */

    if (
      total >
      Number(
        currentStudentData.balance
      )
    ) {

      alert(
        "Insufficient meal-plan balance. Please add funds to your account."
      );


      return;

    }


    /* =====================================================
       CREATE ORDER
       ===================================================== */

    const orderId =
      Date.now()
        .toString()
        .slice(-6);


    const newOrder = {

      id:
        orderId,

      studentId:
        currentStudentData.id,

      studentName:
        currentStudentData.name,

      vendorId:
        selectedVendor.id,

      vendor:
        selectedVendor.name,

      status:
        "Pending",

      date:
        new Date()
          .toLocaleDateString(),

      pickup:
        pickupTime.value,

      notes:
        "",

      items:
        currentCart,

      total:
        +total.toFixed(2)

    };


    /* SAVE ORDER */

    write(
      "cflOrder",
      newOrder
    );


    /* =====================================================
       DEDUCT ORDER FROM BALANCE
       ===================================================== */

    currentStudentData.balance =
      +(
        Number(
          currentStudentData.balance
        ) -
        total
      ).toFixed(2);


    write(
      "cflStudent",
      currentStudentData
    );


    write(
      `cflStudent_${currentStudentData.id}`,
      currentStudentData
    );


    /* CLEAR CART */

    localStorage.removeItem(
      "cflCart"
    );


    /* GO TO CONFIRMATION */

    location.href =
      "confirmation.html";

  };


  /* INITIAL DISPLAY */

  draw();

}


/* =========================================================
   ORDER CONFIRMATION
   ========================================================= */

function confirmationInit() {

  if (!guard("student")) {

    return;

  }


  const student =
    currentStudent();


  const currentOrder =
    order();


  if (
    !student ||
    !currentOrder ||
    currentOrder.studentId !== student.id
  ) {

    location.href =
      "account.html";

    return;

  }


  document.getElementById(
    "confirmOrder"
  ).textContent =
    currentOrder.id;


  document.getElementById(
    "confirmStatus"
  ).textContent =
    currentOrder.status.toLowerCase() +
    "!";


  document.getElementById(
    "confirmPickup"
  ).textContent =
    currentOrder.pickup;


  /* =======================================================
     LOGOUT
     ======================================================= */

  document.getElementById(
    "logoutBtn"
  ).onclick = () => {

    sessionStorage.clear();


    /*
       cflStudent is only the active student
       session copy. The student's persistent
       account remains in cflStudent_ID.
    */

    localStorage.removeItem(
      "cflStudent"
    );


    localStorage.removeItem(
      "cflCart"
    );


    location.href =
      "index.html";

  };

}


/* =========================================================
   STAFF / DIETARY ASSOCIATE ORDERS
   USER FLOW 3
   ========================================================= */

function ordersInit(d) {

  if (!guard("staff")) {

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


  /* =======================================================
     DISPLAY LOGGED-IN STAFF MEMBER
     ======================================================= */

  staffName.textContent =
    sessionStorage.getItem(
      "cflStaffName"
    ) ||
    "Staff Member";


  const currentOrder =
    order();


  /* =======================================================
     NO CURRENT ORDERS
     ======================================================= */

  if (!currentOrder) {

    ordersBody.innerHTML = `

      <tr>

        <td colspan="7">
          No current orders.
        </td>

      </tr>

    `;


    if (staffVendor) {

      staffVendor.textContent =
        "Vendor Orders";

    }


    return;

  }


  /* =======================================================
     DISPLAY VENDOR
     ======================================================= */

  if (staffVendor) {

    staffVendor.textContent =
      `${currentOrder.vendor} Orders`;

  }


  /* =======================================================
     BUILD STATUS OPTIONS
     ======================================================= */

  const statusOptions =
    d.orderStatus
      .map(orderStatus => `

        <option
          value="${orderStatus}"
          ${
            currentOrder.status ===
            orderStatus
              ? "selected"
              : ""
          }
        >
          ${orderStatus}
        </option>

      `)
      .join("");


  /* =======================================================
     DISPLAY ORDER
     ======================================================= */

  ordersBody.innerHTML = `

    <tr>

      <td>
        ${currentOrder.id}
      </td>

      <td>
        ${currentOrder.vendor}
      </td>

      <td>

        <select id="status">

          ${statusOptions}

        </select>

      </td>

      <td>
        ${currentOrder.date}
      </td>

      <td>
        ${currentOrder.pickup}
      </td>

      <td>

        <textarea
          id="notes"
          aria-label="Order notes"
        >${currentOrder.notes || ""}</textarea>

      </td>

      <td>

        <button
          id="viewOrder"
          type="button"
        >
          View Order
        </button>

      </td>

    </tr>

  `;


  const status =
    document.getElementById(
      "status"
    );


  const notes =
    document.getElementById(
      "notes"
    );


  const viewOrder =
    document.getElementById(
      "viewOrder"
    );


  /* =======================================================
     VIEW / REVIEW ORDER
     ======================================================= */

  viewOrder.onclick = () => {

    const itemDetails =
      currentOrder.items
        .map(item =>

          `${item.qty} x ${item.name} - $${(
            Number(item.price) *
            item.qty
          ).toFixed(2)}`

        )
        .join("\n");


    alert(

      `Order #${currentOrder.id}\n\n` +

      `Student: ${currentOrder.studentName}\n` +

      `Vendor: ${currentOrder.vendor}\n` +

      `Pickup Time: ${currentOrder.pickup}\n` +

      `Status: ${currentOrder.status}\n\n` +

      `Order Items:\n${itemDetails}\n\n` +

      `Total: $${Number(
        currentOrder.total
      ).toFixed(2)}`

    );

  };


  /* =======================================================
     UPDATE ORDER STATUS
     ======================================================= */

  status.onchange = () => {

    currentOrder.status =
      status.value;


    currentOrder.notes =
      notes.value;


    write(
      "cflOrder",
      currentOrder
    );


    saveMessage.textContent =
      `Order #${currentOrder.id} updated to ${currentOrder.status}.`;

  };


  /* =======================================================
     SAVE STAFF NOTES
     ======================================================= */

  notes.onchange = () => {

    currentOrder.notes =
      notes.value;


    write(
      "cflOrder",
      currentOrder
    );


    saveMessage.textContent =
      `Notes saved for Order #${currentOrder.id}.`;

  };

}


/* =========================================================
   START CAMPUS FOODLINK+
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {


    /* LOAD APPLICATION DATA */

    const d =
      await data();


    /* DETERMINE CURRENT PAGE */

    const page =
      document.body.dataset.page;


    /* PAGE FUNCTIONS */

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


    /* START CURRENT PAGE */

    const initialize =
      pages[page];


    if (initialize) {

      initialize(d);

    }

  }
);
