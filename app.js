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
        { id: 991, name: "Tuna Sandwich", price: 10.00 },
        { id: 992, name: "Pizza", price: 20.00 },
        { id: 993, name: "Roasted Green Beans", price: 6.00 }
      ]
    },

    {
      id: 2,
      name: "Campus Grill",
      menu: [
        { id: 994, name: "Classic Cheeseburger", price: 8.50 },
        { id: 995, name: "Seasoned Fries", price: 3.50 },
        { id: 996, name: "Grilled Chicken Sandwich", price: 9.00 }
      ]
    },

    {
      id: 3,
      name: "Student Cafe",
      menu: [
        { id: 997, name: "Turkey Club", price: 8.00 },
        { id: 998, name: "Garden Salad", price: 7.00 },
        { id: 999, name: "Fruit Cup", price: 4.00 }
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
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};


/* =========================================================
   LOAD APPLICATION DATA
   ========================================================= */

async function data() {
  try {
    const response = await fetch("apps.json");

    if (response.ok) {
      return await response.json();
    }
  } catch {}

  return FALLBACK;
}


/* =========================================================
   ROLE / LOGIN SECURITY
   ========================================================= */

function role() {
  return sessionStorage.getItem("cflRole");
}

function guard(requiredRole) {
  if (role() !== requiredRole) {
    location.href = "index.html";
    return false;
  }

  return true;
}


/* =========================================================
   ORDER / CART
   ========================================================= */

function order() {
  return read("cflOrder", null);
}

function cart() {
  return read("cflCart", []);
}


/* =========================================================
   LOGIN PAGE
   ========================================================= */

async function loginInit(d) {

  document.querySelector("#loginForm").onsubmit = event => {

    event.preventDefault();

    const username = userId.value.trim();
    const enteredPassword = password.value;

    if (
      username === d.student.userId &&
      enteredPassword === d.student.password
    ) {

      sessionStorage.setItem("cflRole", "student");

      location.href = "account.html";

    } else {

      loginError.textContent =
        "Invalid User ID or password. Please try again.";
    }
  };


  document.querySelector("[data-role=staff]").onclick = () => {

    sessionStorage.setItem("cflRole", "staff");

    location.href = "orders.html";
  };
}


/* =========================================================
   STUDENT DASHBOARD
   ========================================================= */

function accountInit(d) {

  if (!guard("student")) return;

  const student = read("cflStudent", d.student);
  const currentOrder = order();

  studentName.textContent = student.name;

  balance.textContent =
    Number(student.balance).toFixed(2);


  if (currentOrder) {

    orderId.textContent =
      currentOrder.id;

    orderVendor.textContent =
      currentOrder.vendor;

    orderStatus.textContent =
      currentOrder.status;
  }
}


/* =========================================================
   VENDOR MENU
   ========================================================= */

function menuInit(d) {

  if (!guard("student")) return;

  let selectedVendor = null;


  /* -------------------------------------------------------
     BUILD VENDOR DROPDOWN
     ------------------------------------------------------- */

  vendorSelect.innerHTML =
    '<option value="">Select a Vendor</option>';


  d.vendors.forEach(vendor => {

    const option =
      document.createElement("option");

    option.value =
      vendor.id;

    option.textContent =
      vendor.name;

    vendorSelect.appendChild(option);
  });


  /* -------------------------------------------------------
     CHANGE VENDOR
     ------------------------------------------------------- */

  vendorSelect.onchange = () => {

    const vendorId =
      Number(vendorSelect.value);

    selectedVendor =
      d.vendors.find(
        vendor => vendor.id === vendorId
      );

    localStorage.removeItem("cflCart");

    draw();
  };


  /* -------------------------------------------------------
     DRAW MENU AND CART
     ------------------------------------------------------- */

  function draw() {

    if (!selectedVendor) {

      menuItems.innerHTML =
        "<p>Please select a vendor to view the menu.</p>";

      cartRows.innerHTML = "";

      cartTotal.textContent =
        "0.00";

      return;
    }


    menuItems.innerHTML =
      selectedVendor.menu.map(item => `

        <div class="menu-item">

          <div class="food-img"></div>

          <div>
            <b>${item.name}</b>
            <br>
            $${item.price.toFixed(2)}
          </div>

          <button
            data-id="${item.id}"
            aria-label="Add ${item.name}">
            +
          </button>

        </div>

      `).join("");


    const currentCart =
      cart();


    cartRows.innerHTML =
      currentCart.map(item => `

        <tr>

          <td>
            ${item.qty}
          </td>

          <td>
            ${item.name}
          </td>

          <td>
            $${(item.price * item.qty).toFixed(2)}
          </td>

        </tr>

      `).join("");


    const total =
      currentCart.reduce(
        (sum, item) =>
          sum + item.price * item.qty,
        0
      );


    cartTotal.textContent =
      total.toFixed(2);


    /* -----------------------------------------------------
       ADD ITEM BUTTONS
       ----------------------------------------------------- */

    document
      .querySelectorAll(".menu-item button")
      .forEach(button => {

        button.onclick = () => {

          const item =
            selectedVendor.menu.find(
              item =>
                item.id ==
                button.dataset.id
            );


          const currentCart =
            cart();


          const existingItem =
            currentCart.find(
              cartItem =>
                cartItem.id === item.id
            );


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


  /* -------------------------------------------------------
     PLACE ORDER
     ------------------------------------------------------- */

  placeOrder.onclick = () => {

    if (!selectedVendor) {

      alert(
        "Please select a vendor."
      );

      return;
    }


    const currentCart =
      cart();


    if (!currentCart.length) {

      alert(
        "Select at least one item."
      );

      return;
    }


    const total =
      currentCart.reduce(
        (sum, item) =>
          sum + item.price * item.qty,
        0
      );


    const student =
      read(
        "cflStudent",
        d.student
      );


    if (total > student.balance) {

      alert(
        "Insufficient meal-plan balance."
      );

      return;
    }


    const newOrder = {

      id: Date.now(),

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
        new Date().toLocaleDateString(),

      pickup:
        pickupTime.value,

      notes:
        "",

      items:
        currentCart,

      total:
        total
    };


    write(
      "cflOrder",
      newOrder
    );


    write(
      "cflStudent",
      {
        ...student,

        balance:
          +(
            student.balance -
            total
          ).toFixed(2)
      }
    );


    localStorage.removeItem(
      "cflCart"
    );


    location.href =
      "confirmation.html";
  };


  draw();
}


/* =========================================================
   ORDER CONFIRMATION
   ========================================================= */

function confirmationInit() {

  if (!guard("student")) return;


  const currentOrder =
    order();


  if (currentOrder) {

    confirmOrder.textContent =
      currentOrder.id;

    confirmStatus.textContent =
      currentOrder.status === "Ready"
        ? "ready!"
        : currentOrder.status.toLowerCase() + "!";

    confirmPickup.textContent =
      currentOrder.pickup;
  }


  logoutBtn.onclick = () => {

    sessionStorage.clear();

    location.href =
      "index.html";
  };
}


/* =========================================================
   STAFF VIEW ORDERS
   ========================================================= */

function ordersInit(d) {

  if (!guard("staff")) return;


  staffName.textContent =
    d.staff.name;


  const currentOrder =
    order();


  if (!currentOrder) {

    ordersBody.innerHTML =
      '<tr><td colspan="5">No current orders.</td></tr>';

    return;
  }


  const statusOptions =
    d.orderStatus.map(orderStatus => `

      <option
        value="${orderStatus}"
        ${currentOrder.status === orderStatus
          ? "selected"
          : ""}>

        ${orderStatus}

      </option>

    `).join("");


  ordersBody.innerHTML = `

    <tr>

      <td>
        ${currentOrder.id}
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

        <textarea id="notes">${currentOrder.notes || ""}</textarea>

      </td>

    </tr>
  `;


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


  notes.onchange = () => {

    currentOrder.notes =
      notes.value;

    write(
      "cflOrder",
      currentOrder
    );
  };
}


/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    const d =
      await data();


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


    const initialize =
      pages[page];


    if (initialize) {

      initialize(d);
    }
  }
);
