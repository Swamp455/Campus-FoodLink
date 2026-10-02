/* =========================================================
   CAMPUS FOODLINK+
   APPLICATION JAVASCRIPT
   ========================================================= */


/* =========================================================
   FALLBACK APPLICATION DATA
   Used if apps.json cannot be loaded
   ========================================================= */

const FALLBACK = {

  student: {
    id: 101,
    userId: "aleon",
    password: "password",
    name: "Ale Leon",
    balance: 100.00
  },

  staff: {
    userId: "staff",
    password: "password",
    name: "Dominic Toretto"
  },

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
   LOCAL STORAGE
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
   LOAD APPS.JSON
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
   USER ROLE
   ========================================================= */

function role() {

  return sessionStorage.getItem(
    "cflRole"
  );

}


/* =========================================================
   PAGE ACCESS
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
    document.querySelector(
      "#loginForm"
    );


  /* -------------------------------------------------------
     STUDENT LOGIN
     ------------------------------------------------------- */

  loginForm.onsubmit = event => {

    event.preventDefault();


    const username =
      document
        .getElementById("userId")
        .value
        .trim();


    const enteredPassword =
      document
        .getElementById("password")
        .value;


    const loginError =
      document.getElementById(
        "loginError"
      );


    /* VALIDATE STUDENT CREDENTIALS */

    if (
      username === d.student.userId &&
      enteredPassword === d.student.password
    ) {

      sessionStorage.setItem(
        "cflRole",
        "student"
      );


      loginError.textContent =
        "";


      location.href =
        "account.html";

    } else {

      loginError.textContent =
        "Invalid User ID or password. Please try again.";

    }

  };


  /* -------------------------------------------------------
     STAFF LOGIN
     ------------------------------------------------------- */

  const staffButton =
    document.querySelector(
      "[data-role='staff']"
    );


  staffButton.onclick = () => {

    sessionStorage.setItem(
      "cflRole",
      "staff"
    );


    location.href =
      "orders.html";

  };

}


/* =========================================================
   STUDENT DASHBOARD
   ========================================================= */

function accountInit(d) {

  if (!guard("student")) {

    return;

  }


  const student =
    read(
      "cflStudent",
      d.student
    );


  const currentOrder =
    order();


  /* -------------------------------------------------------
     DISPLAY STUDENT INFORMATION
     ------------------------------------------------------- */

  document.getElementById(
    "studentName"
  ).textContent =
    student.name;


  document.getElementById(
    "balance"
  ).textContent =
    Number(
      student.balance
    ).toFixed(2);


  /* -------------------------------------------------------
     DISPLAY CURRENT ORDER
     ------------------------------------------------------- */

  if (currentOrder) {

    document.getElementById(
      "orderId"
    ).textContent =
      currentOrder.id;


    document.getElementById(
      "orderVendor"
    ).textContent =
      currentOrder.vendor;


    document.getElementById(
      "orderStatus"
    ).textContent =
      currentOrder.status;

  }

}


/* =========================================================
   VENDOR MENU
   USER FLOW 2
   ========================================================= */

function menuInit(d) {

  if (!guard("student")) {

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


  /* -------------------------------------------------------
     CREATE VENDOR DROPDOWN
     ------------------------------------------------------- */

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


  /* -------------------------------------------------------
     VENDOR SELECTION
     ------------------------------------------------------- */

  vendorSelect.onchange = () => {

    const vendorId =
      Number(
        vendorSelect.value
      );


    selectedVendor =
      d.vendors.find(
        vendor =>
          vendor.id === vendorId
      );


    /*
       Clear the cart when switching vendors
       so items from different vendors are
       not placed in the same order.
    */

    localStorage.removeItem(
      "cflCart"
    );


    draw();

  };


  /* =======================================================
     DRAW MENU AND CART
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
       DISPLAY VENDOR MENU
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

              $${item.price.toFixed(2)}

            </div>

            <button
              type="button"
              data-id="${item.id}"
              aria-label="Add ${item.name} to order"
            >
              +
            </button>

          </div>

        `)
        .join("");


    /* -----------------------------------------------------
       DISPLAY SHOPPING CART
       ----------------------------------------------------- */

    const currentCart =
      cart();


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
                item.price *
                item.qty
              ).toFixed(2)}
            </td>

          </tr>

        `)
        .join("");


    /* -----------------------------------------------------
       CALCULATE CART TOTAL
       ----------------------------------------------------- */

    const total =
      currentCart.reduce(
        (sum, item) =>
          sum +
          item.price *
          item.qty,
        0
      );


    cartTotal.textContent =
      total.toFixed(2);


    /* -----------------------------------------------------
       ADD MENU ITEMS TO CART
       ----------------------------------------------------- */

    document
      .querySelectorAll(
        ".menu-item button"
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


          const currentCart =
            cart();


          const existingItem =
            currentCart.find(
              cartItem =>
                cartItem.id ===
                item.id
            );


          /*
             If the item is already in the
             cart, increase its quantity.
          */

          if (existingItem) {

            existingItem.qty++;

          } else {

            currentCart.push({

              ...item,

              qty: 1

            });

          }


          write(
            "cflCart",
            currentCart
          );


          draw();

        };

      });

  }


  /* =======================================================
     CONFIRM / PLACE ORDER
     ======================================================= */

  placeOrder.onclick = () => {


    /* -----------------------------------------------------
       VALIDATE VENDOR
       ----------------------------------------------------- */

    if (!selectedVendor) {

      alert(
        "Please select a vendor."
      );

      return;

    }


    /* -----------------------------------------------------
       VALIDATE CART
       ----------------------------------------------------- */

    const currentCart =
      cart();


    if (!currentCart.length) {

      alert(
        "Select at least one item."
      );

      return;

    }


    /* -----------------------------------------------------
       CALCULATE ORDER TOTAL
       ----------------------------------------------------- */

    const total =
      currentCart.reduce(
        (sum, item) =>
          sum +
          item.price *
          item.qty,
        0
      );


    const student =
      read(
        "cflStudent",
        d.student
      );


    /* -----------------------------------------------------
       VALIDATE MEAL-PLAN BALANCE
       ----------------------------------------------------- */

    if (
      total >
      Number(student.balance)
    ) {

      alert(
        "Insufficient meal-plan balance."
      );

      return;

    }


    /* -----------------------------------------------------
       CREATE UNIQUE ORDER NUMBER
       ----------------------------------------------------- */

    const orderId =
      Date.now()
        .toString()
        .slice(-6);


    /* -----------------------------------------------------
       CREATE ORDER
       ----------------------------------------------------- */

    const newOrder = {

      id:
        orderId,

      studentId:
        student.id,

      studentName:
        student.name,

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
        total

    };


    /* -----------------------------------------------------
       SAVE ORDER
       ----------------------------------------------------- */

    write(
      "cflOrder",
      newOrder
    );


    /* -----------------------------------------------------
       UPDATE STUDENT BALANCE
       ----------------------------------------------------- */

    write(
      "cflStudent",
      {

        ...student,

        balance:
          +(
            Number(
              student.balance
            ) -
            total
          ).toFixed(2)

      }
    );


    /* -----------------------------------------------------
       CLEAR CART
       ----------------------------------------------------- */

    localStorage.removeItem(
      "cflCart"
    );


    /* -----------------------------------------------------
       ORDER CONFIRMATION
       ----------------------------------------------------- */

    location.href =
      "confirmation.html";

  };


  /* INITIAL DRAW */

  draw();

}


/* =========================================================
   ORDER CONFIRMATION
   ========================================================= */

function confirmationInit() {

  if (!guard("student")) {

    return;

  }


  const currentOrder =
    order();


  if (currentOrder) {

    document.getElementById(
      "confirmOrder"
    ).textContent =
      currentOrder.id;


    document.getElementById(
      "confirmStatus"
    ).textContent =
      currentOrder.status === "Ready"
        ? "ready!"
        : currentOrder.status
            .toLowerCase() +
          "!";


    document.getElementById(
      "confirmPickup"
    ).textContent =
      currentOrder.pickup;

  }


  /* -------------------------------------------------------
     LOGOUT
     ------------------------------------------------------- */

  document.getElementById(
    "logoutBtn"
  ).onclick = () => {

    sessionStorage.clear();


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


  const currentOrder =
    order();


  /* -------------------------------------------------------
     DISPLAY STAFF NAME
     ------------------------------------------------------- */

  staffName.textContent =
    d.staff.name;


  /* -------------------------------------------------------
     NO ORDERS
     ------------------------------------------------------- */

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


  /* -------------------------------------------------------
     DISPLAY CURRENT VENDOR
     ------------------------------------------------------- */

  if (staffVendor) {

    staffVendor.textContent =
      `${currentOrder.vendor} Orders`;

  }


  /* -------------------------------------------------------
     BUILD ORDER STATUS OPTIONS
     ------------------------------------------------------- */

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


  /* -------------------------------------------------------
     DISPLAY ORDER
     ------------------------------------------------------- */

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


  /* -------------------------------------------------------
     GET ORDER CONTROLS
     ------------------------------------------------------- */

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
     SELECT / REVIEW ORDER DETAILS
     ======================================================= */

  viewOrder.onclick = () => {

    const itemDetails =
      currentOrder.items
        .map(item =>

          `${item.qty} x ${item.name} - $${(
            item.price *
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
     UPDATE ORDER NOTES
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


    /* -----------------------------------------------------
       LOAD APPLICATION DATA
       ----------------------------------------------------- */

    const d =
      await data();


    /* -----------------------------------------------------
       CREATE STUDENT DATA IF IT DOES NOT EXIST
       ----------------------------------------------------- */

    if (
      !localStorage.getItem(
        "cflStudent"
      )
    ) {

      write(
        "cflStudent",
        d.student
      );

    }


    /* -----------------------------------------------------
       DETERMINE CURRENT PAGE
       ----------------------------------------------------- */

    const page =
      document.body.dataset.page;


    /* -----------------------------------------------------
       PAGE INITIALIZERS
       ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       INITIALIZE CURRENT PAGE
       ----------------------------------------------------- */

    const initialize =
      pages[page];


    if (initialize) {

      initialize(d);

    }

  }
);
