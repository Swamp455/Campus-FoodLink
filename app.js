/* =========================================================
   CAMPUS FOODLINK+ - PROTOTYPE 2
   APPLICATION LOGIC AND BROWSER DATA MANAGEMENT
   ========================================================= */

/* =========================================================
   GLOBAL CONSTANTS AND HELPER FUNCTIONS
   ========================================================= */

const DB_KEY="CampusFoodLinkDB",CART_KEY="CampusFoodLinkCart";
const ORDER_SEQUENCE_KEY = "CampusFoodLinkOrderSequence";

const read=(k,d=null)=>{
 try{
  const v=localStorage.getItem(k);
  return v?JSON.parse(v):d;
 }catch{
  return d;
 }
};

const saveDB=db=>localStorage.setItem(DB_KEY,JSON.stringify(db));

const cart=()=>read(CART_KEY,[]);
const saveCart=c=>localStorage.setItem(CART_KEY,JSON.stringify(c));

const next=(a,k,s=1)=>
 a.length
 ?Math.max(...a.map(x=>Number(x[k])||0))+1
 :s;

/* Generate a unique order ID */
function nextOrderId(db) {

  const highestExisting =
    db.Orders.length
      ? Math.max(
          ...db.Orders.map(
            order => Number(order.order_id) || 0
          )
        )
      : 15558;

  const storedSequence =
    Number(
      localStorage.getItem(ORDER_SEQUENCE_KEY)
    ) || 15558;

  const nextId =
    Math.max(
      highestExisting,
      storedSequence
    ) + 1;

  localStorage.setItem(
    ORDER_SEQUENCE_KEY,
    String(nextId)
  );

  return nextId;
}

const byId=(a,k,id)=>
 a.find(x=>Number(x[k])===Number(id));

const latestStatus=(db,orderId)=>
 db.OrderStatus
 .filter(x=>Number(x.order_id)===Number(orderId))
 .sort(
  (a,b)=>
   new Date(b.updated_at)-new Date(a.updated_at)||
   b.status_id-a.status_id
 )[0]||null;

const currentStudent=db=>
 byId(
  db.Students,
  "student_id",
  sessionStorage.getItem("cflStudentId")
 );

const currentStaff=db=>
 byId(
  db.Staff,
  "staff_id",
  sessionStorage.getItem("cflStaffId")
 );


/* =========================================================
   SAFE HTML TEXT HANDLING
   ========================================================= */

function escapeHTML(value){
 return String(value??"")
  .replaceAll("&","&amp;")
  .replaceAll("<","&lt;")
  .replaceAll(">","&gt;")
  .replaceAll('"',"&quot;")
  .replaceAll("'","&#039;");
}


/* =========================================================
   ROLE-BASED PAGE ACCESS
   ========================================================= */

function guard(r){

 if(sessionStorage.getItem("cflRole")!==r){

  location.href="index.html";

  return false;
 }

 return true;
}


/* =========================================================
   DATABASE INITIALIZATION
   ========================================================= */

async function initDB(){

 let db=read(DB_KEY);

 if(db)return db;

 try{

  let r=await fetch("apps.json");

  if(!r.ok)throw 0;

  db=await r.json();

  saveDB(db);

  return db;

 }catch{

  alert(
   "Run this project through a web server or GitHub Pages."
  );

  return null;
 }
}


/* =========================================================
   RESET DEMO DATA
   ========================================================= */

async function resetDB(){

 if(!confirm("Reset all demo data to apps.json?")){
  return false;
 }

 let r=await fetch(
  "apps.json?"+Date.now()
 );

 if(!r.ok)return false;

 saveDB(await r.json());

 localStorage.removeItem(CART_KEY);

 sessionStorage.clear();

 return true;
}


/* =========================================================
   EXPORT PROTOTYPE DATABASE
   ========================================================= */

function exportJSON(){

 let db=read(DB_KEY);

 if(!db)return;

 let copy=
  JSON.parse(
   JSON.stringify(db)
  );

 delete copy.DemoAccounts;

 let out={
  project:"Campus FoodLink+",
  schema:"MySQL-matched prototype export",
  exported_at:new Date().toISOString(),
  tables:copy
 };

 let blob=
  new Blob(
   [JSON.stringify(out,null,2)],
   {type:"application/json"}
  );

 let url=
  URL.createObjectURL(blob);

 let a=
  document.createElement("a");

 a.href=url;

 a.download=
  `CampusFoodLink_MySQL_Data_${
   new Date().toISOString().slice(0,10)
  }.json`;

 a.click();

 URL.revokeObjectURL(url);
}


/* =========================================================
   LOGIN AND DEMO AUTHENTICATION
   ========================================================= */

function loginInit(db){

 const f=
  document.getElementById("loginForm");

 const err=
  document.getElementById("loginError");

 document.getElementById("resetDemoBtn").onclick=
  async()=>{

   if(await resetDB()){
    location.reload();
   }
  };


 f.onsubmit=e=>{

  e.preventDefault();

  const u=
   document
   .getElementById("userId")
   .value
   .trim()
   .toLowerCase();

  const p=
   document.getElementById("password").value;

  const a=
   db.DemoAccounts.find(
    x=>
     x.login.toLowerCase()===u &&
     x.password===p
   );

  const linkedStaff=a && a.account_type!=="Student" ? byId(db.Staff,"staff_id",a.record_id) : null;
  if(a && ((linkedStaff && linkedStaff.is_active===false) || (a.account_type==="Student" && a.is_active===false))){
   err.textContent="This account is inactive. Contact IT staff.";
   return;
  }
  if(!a){

   err.textContent=
    "Invalid demo username or password.";

   return;
  }


  // Authenticate using username and password; the account determines its role.

  sessionStorage.clear();


  if(a.account_type==="Student"){

   sessionStorage.setItem(
    "cflRole",
    "student"
   );

   sessionStorage.setItem(
    "cflStudentId",
    a.record_id
   );

   location.href="account.html";

   return;
  }


  sessionStorage.setItem(
   "cflRole",
   "staff"
  );

  sessionStorage.setItem(
   "cflStaffId",
   a.record_id
  );


  if(a.account_type==="Professor Demo"){

   sessionStorage.setItem(
    "cflProfessorDemo",
    "true"
   );
  }


  if(linkedStaff && String(linkedStaff.role).toLowerCase()==="it staff" && a.account_type!=="Professor Demo"){
   location.href="admin.html";
  }else{
   location.href="orders.html";
  }
 }
}


/* =========================================================
   STUDENT ACCOUNT DASHBOARD
   ========================================================= */

function accountInit(db){

 if(!guard("student"))return;


 const s=currentStudent(db);

 const msg=
  document.getElementById("accountMessage");

 const cancel=
  document.getElementById("cancelOrderBtn");


 /* ---------------------------------------------------------
    STUDENT INFORMATION
    --------------------------------------------------------- */

 document.getElementById("studentName").textContent=
  `${s.first_name} ${s.last_name}`;

 document.getElementById("studentEmail").textContent=
  s.email_address;

 document.getElementById("balance").textContent=
  Number(s.meal_plan_balance).toFixed(2);


 /* ---------------------------------------------------------
    STUDENT LOGOUT
    --------------------------------------------------------- */

 const studentLogoutBtn=
  document.getElementById("studentLogoutBtn");

 if(studentLogoutBtn){

  studentLogoutBtn.onclick=()=>{

   sessionStorage.clear();

   location.href="index.html";
  };
 }

    /* ---------------------------------------------------------
    ADD FUNDS TO MEAL PLAN
    --------------------------------------------------------- */

 const fundAmount=
  document.getElementById("fundAmount");

 const addFundsBtn=
  document.getElementById("addFundsBtn");

 const fundMessage=
  document.getElementById("fundMessage");


 if(addFundsBtn){

  addFundsBtn.onclick=()=>{

   fundMessage.textContent="";

   const amount=
    Number(fundAmount.value);


   /* Validate the amount */

   if(
    !Number.isFinite(amount) ||
    amount<=0
   ){

    fundMessage.textContent=
     "Enter a valid amount greater than $0.";

    return;
   }


   /* Maximum amount that can be added at one time */

   if(amount>500){

    fundMessage.textContent=
     "A maximum of $500 can be added at one time.";

    return;
   }


   /* Add funds to the student's meal-plan balance */

   s.meal_plan_balance=
    Number(
     (
      Number(s.meal_plan_balance)+
      amount
     ).toFixed(2)
    );


   /* Save the updated database */

   saveDB(db);


   /* Update the balance displayed on the page */

   document
   .getElementById("balance")
   .textContent=
    Number(s.meal_plan_balance).toFixed(2);


   /* Clear the amount field */

   fundAmount.value="";


   /* Tell the student the funds were added */

   fundMessage.textContent=
    `$${amount.toFixed(2)} was added to your meal-plan balance.`;
  };
 }

 /* ---------------------------------------------------------
    PROFESSOR DEMO
    --------------------------------------------------------- */

 const back=
  document.getElementById("returnStaffBtn");


 if(
  sessionStorage.getItem(
   "cflProfessorDemo"
  )==="true"
 ){

  back.hidden=false;

  back.onclick=()=>{

   sessionStorage.setItem(
    "cflRole",
    "staff"
   );

   sessionStorage.setItem(
    "cflStaffId",
    sessionStorage.getItem(
     "cflProfessorStaffId"
    )||113
   );

   sessionStorage.removeItem(
    "cflStudentId"
   );

   location.href="orders.html";
  };
 }


 /* ---------------------------------------------------------
    STUDENT ORDERS
    --------------------------------------------------------- */

 const orders=
  db.Orders.filter(
   x=>x.student_id===s.student_id
  );
  // Student order history: current student only, latest status from OrderStatus.
  const historyBody=document.getElementById("studentAllOrdersBody");
  const statusFilter=document.getElementById("studentOrderStatusFilter");
  const historyCount=document.getElementById("studentOrderCount");
  const historyEmpty=document.getElementById("studentOrdersEmpty");
  if(historyBody && statusFilter){
    const orderRows=orders.map(order=>({
      order,
      status:latestStatus(db,order.order_id)
    })).sort((a,b)=>new Date(b.order.order_date)-new Date(a.order.order_date) || Number(b.order.order_id)-Number(a.order.order_id));
    const statuses=[...new Set(orderRows.map(row=>row.status?.status_name||"Pending"))].sort();
    statuses.forEach(status=>{
      const option=document.createElement("option");
      option.value=status;
      option.textContent=status;
      statusFilter.appendChild(option);
    });
    const fmtDate=value=>{
      if(!value)return "-";
      const d=new Date(value);
      return Number.isNaN(d.getTime())?"-":d.toLocaleString();
    };
    const renderHistory=()=>{
      const selected=statusFilter.value;
      const visible=orderRows.filter(row=>selected==="All" || (row.status?.status_name||"Pending")===selected);
      historyBody.replaceChildren();
      visible.forEach(({order,status})=>{
        const vendor=byId(db.Vendors,"vendor_id",order.vendor_id);
        const tr=document.createElement("tr");
        [order.order_id,fmtDate(order.order_date),vendor?.vendor_name||"Unknown",
         "$"+Number(order.total_amount||0).toFixed(2),fmtDate(order.pickup_time),
         status?.status_name||"Pending",fmtDate(status?.updated_at)].forEach(value=>{
          const td=document.createElement("td");td.textContent=String(value);tr.appendChild(td);
        });
        historyBody.appendChild(tr);
      });
      historyCount.textContent=`Showing ${visible.length} of ${orderRows.length} orders`;
      historyEmpty.hidden=visible.length!==0;
    };
    statusFilter.addEventListener("change",renderHistory);
    renderHistory();
  }



 const o=orders.at(-1);


 if(!o){

  cancel.hidden=true;

  return;
 }


 const v=
  byId(
   db.Vendors,
   "vendor_id",
   o.vendor_id
  );

 const st=
  latestStatus(
   db,
   o.order_id
  );


 document.getElementById("orderId").textContent=
  o.order_id;

 document.getElementById("orderVendor").textContent=
  v?.vendor_name||"Unknown";

 document.getElementById("orderStatus").textContent=
  st?.status_name||"Pending";

 document.getElementById("statusUpdated").textContent=
  st
   ?new Date(st.updated_at).toLocaleString()
   :"-";


 cancel.hidden=
  !st ||
  !["Pending","Approved"]
   .includes(st.status_name);


 /* ---------------------------------------------------------
    STUDENT CANCEL ORDER
    --------------------------------------------------------- */

 cancel.onclick=()=>{

  const now=
   latestStatus(
    db,
    o.order_id
   );


  if(
   !now ||
   !["Pending","Approved"]
    .includes(now.status_name)
  ){

   msg.textContent=
    "This order can no longer be cancelled.";

   return;
  }


  if(
   !confirm(
    `Cancel Order #${o.order_id}?`
   )
  ){
   return;
  }


  db.OrderStatus.push({

   status_id:
    next(
     db.OrderStatus,
     "status_id"
    ),

   order_id:o.order_id,

   staff_id:null,

   status_name:"Cancelled",

   status_description:
    "Cancelled by student",

   updated_at:
    new Date().toISOString()
  });


  const t=
   db.Transactions.find(
    x=>x.order_id===o.order_id
   );


  if(
   t &&
   t.transaction_status==="Complete"
  ){

   s.meal_plan_balance=
    Number(
     (
      Number(s.meal_plan_balance)+
      Number(t.meal_plan_used)
     ).toFixed(2)
    );

   t.transaction_status=
    "Cancelled";
  }


  saveDB(db);

  location.reload();
 };
}


/* =========================================================
   STUDENT MENU AND ORDERING WORKFLOW
   ========================================================= */

function menuInit(db){

 if(!guard("student"))return;


 const s=currentStudent(db),

       vs=
        document.getElementById("vendorSelect"),

       items=
        document.getElementById("menuItems"),

       rows=
        document.getElementById("cartRows"),

       tot=
        document.getElementById("cartTotal"),

       pickupInput=
        document.getElementById("pickupTime"),

       orderMessage=
        document.getElementById("orderMessage");


 document.getElementById("menuBalance").textContent=
  Number(s.meal_plan_balance).toFixed(2);


 /* ---------------------------------------------------------
    SAFE VENDOR RENDERING
    --------------------------------------------------------- */

 db.Vendors
 .filter(v=>v.is_active)
 .forEach(v=>{

  const option=
   document.createElement("option");

  option.value=
   v.vendor_id;

  option.textContent=
   v.vendor_name;

  vs.appendChild(option);
 });


 /* ---------------------------------------------------------
    PICKUP-TIME VALIDATION
    --------------------------------------------------------- */

 function updatePickupMinimum(){

  const now=new Date();

  now.setMinutes(
   now.getMinutes()-
   now.getTimezoneOffset()
  );

  pickupInput.min=
   now.toISOString().slice(0,16);
 }

 updatePickupMinimum();


 let currentVendorValue=
  vs.value;


 /* ---------------------------------------------------------
    VENDOR CHANGE / CART PROTECTION
    --------------------------------------------------------- */

 vs.onchange=()=>{

  const previous=
   currentVendorValue;

  const existingCart=
   cart();


  if(existingCart.length>0){

   const changeVendor=
    confirm(
     "Changing vendors will remove the items currently in your order. Continue?"
    );


   if(!changeVendor){

    vs.value=previous;

    return;
   }


   saveCart([]);

   orderMessage.textContent=
    "Cart cleared because the vendor was changed.";

  }else{

   orderMessage.textContent="";
  }


  currentVendorValue=
   vs.value;

  draw();
 };


 /* ---------------------------------------------------------
    DRAW MENU AND CART
    --------------------------------------------------------- */

 function draw(){

  const vid=
   Number(vs.value);

  const c=
   cart();


  if(!vid){

   items.textContent="";

   const p=
    document.createElement("p");

   p.textContent=
    "Select an active vendor.";

   items.appendChild(p);

   rows.textContent="";

   tot.textContent="0.00";

   return;
  }


  items.textContent="";


  const menu=
   db.MenuItems.filter(
    x=>
     x.vendor_id===vid &&
     x.is_available
   );


  if(!menu.length){

   const p=
    document.createElement("p");

   p.textContent=
    "No available items.";

   items.appendChild(p);

  }else{

   menu.forEach(x=>{

    const box=
     document.createElement("div");

    box.className=
     "menu-item";

    // Static menu imagery mapped by stable menu item ID; works with saved localStorage data.
    const foodImagePaths={
      991:"tuna-sandwich.jpg",992:"pizza.jpg",993:"roasted-green-beans.jpg",
      994:"cheeseburger.jpg",995:"fries.jpg",996:"grilled-chicken-sandwich.jpg",
      997:"turkey-club.jpg",998:"chicken-caesar-salad.jpg",999:"iced-coffee.jpg"
    };
    const foodPhoto=document.createElement("img");
    foodPhoto.className="menu-food-image";
    foodPhoto.src=""+(foodImagePaths[x.menu_item_id]||"food-placeholder.jpg");
    foodPhoto.alt=x.item_name;
    foodPhoto.loading="lazy";
    foodPhoto.onerror=()=>{foodPhoto.onerror=null;foodPhoto.src="food-placeholder.jpg";};


    const info=
     document.createElement("div");

    const name=
     document.createElement("b");

    name.textContent=
     x.item_name;

    info.appendChild(name);

    info.appendChild(
     document.createElement("br")
    );


    const description=
     document.createTextNode(
      x.description||""
     );

    info.appendChild(description);

    info.appendChild(
     document.createElement("br")
    );


    const category=
     document.createElement("small");

    category.textContent=
     x.category||"";

    info.appendChild(category);

    info.appendChild(
     document.createElement("br")
    );


    info.appendChild(
     document.createTextNode(
      `$${Number(x.price).toFixed(2)}`
     )
    );


    info.className="menu-item-details";
    const controls=document.createElement("div");
    controls.className="menu-qty-controls";
    const existing=c.find(r=>Number(r.menu_item_id)===Number(x.menu_item_id));
    const qty=Number(existing?.quantity||0);
    const minus=document.createElement("button");
    minus.type="button"; minus.className="qty-minus";
    minus.dataset.id=x.menu_item_id;
    minus.textContent="−";
    minus.disabled=qty===0;
    minus.setAttribute("aria-label",`Remove one ${x.item_name}`);
    const count=document.createElement("span");
    count.className="menu-qty-value";
    count.textContent=String(qty);
    count.setAttribute("aria-label",`${x.item_name} quantity: ${qty}`);
    const plus=document.createElement("button");
    plus.type="button"; plus.className="qty-plus";
    plus.dataset.id=x.menu_item_id;
    plus.textContent="+";
    plus.disabled=qty>=10;
    plus.setAttribute("aria-label",`Add one ${x.item_name}`);
    controls.append(minus,count,plus);
    box.append(foodPhoto,info,controls);
    items.appendChild(box);
   });
  }


  /* -------------------------------------------------------
     CART
     ------------------------------------------------------- */

  rows.textContent="";


  c.forEach(r=>{

   const x=
    byId(
     db.MenuItems,
     "menu_item_id",
     r.menu_item_id
    );


   if(!x)return;


   const line=
    Math.round(Number(x.price)*100)*
    Number(r.quantity)/100;


   const tr=
    document.createElement("tr");


   [
    r.quantity,
    x.item_name,
    `$${Number(x.price).toFixed(2)}`,
    `$${line.toFixed(2)}`
   ]
   .forEach(value=>{

    const td=
     document.createElement("td");

    td.textContent=
     value;

    tr.appendChild(td);
   });


   const action=
    document.createElement("td");

   const remove=
    document.createElement("button");

   remove.className=
    "remove";

   remove.dataset.id=
    x.menu_item_id;

   remove.type=
    "button";

   remove.textContent=
    "Remove";


   action.appendChild(remove);

   tr.appendChild(action);

   rows.appendChild(tr);
  });


  tot.textContent=(c.reduce((cents,r)=>{
    const x=byId(db.MenuItems,"menu_item_id",r.menu_item_id);
    return cents+(x?Math.round(Number(x.price)*100)*Number(r.quantity):0);
  },0)/100).toFixed(2);

  /* MENU QUANTITY CONTROLS */
  items.querySelectorAll(".qty-plus, .qty-minus").forEach(button=>{
    button.onclick=()=>{
      const id=Number(button.dataset.id);
      let current=cart();
      const row=current.find(r=>Number(r.menu_item_id)===id);
      const quantity=Number(row?.quantity||0);
      const updated=quantity+(button.classList.contains("qty-plus")?1:-1);
      if(updated>10){
        orderMessage.textContent="Maximum quantity is 10 of the same menu item.";
        return;
      }
      if(updated<0)return;
      if(updated===0){
        current=current.filter(r=>Number(r.menu_item_id)!==id);
      }else if(row){
        row.quantity=updated;
      }else{
        current.push({menu_item_id:id,quantity:1});
      }
      orderMessage.textContent="";
      saveCart(current);
      draw();
    };
  });

  /* -------------------------------------------------------
     REMOVE ITEM
     ------------------------------------------------------- */

  document
  .querySelectorAll(".remove")
  .forEach(
   b=>b.onclick=()=>{

    let c=cart();

    let id=
     Number(b.dataset.id);

    let r=
     c.find(
      x=>x.menu_item_id===id
     );


    if(!r)return;


    if(r.quantity>1){

     r.quantity--;

    }else{

     c=
      c.filter(
       x=>x.menu_item_id!==id
      );
    }


    saveCart(c);

    draw();
   }
  );
 }
     /* ---------------------------------------------------------
     CANCEL CURRENT ORDER
     --------------------------------------------------------- */

  const cancelCurrentOrder =
    document.getElementById("cancelCurrentOrder");

  if (cancelCurrentOrder) {

    cancelCurrentOrder.onclick = () => {

      const currentCart = cart();

      if (!currentCart.length) {
        orderMessage.textContent =
          "There is no order to cancel.";

        return;
      }

      const confirmed = confirm(
        "Are you sure you want to cancel this order?"
      );

      if (!confirmed) {
        return;
      }

      saveCart([]);

      const instructions =
        document.getElementById("specialInstructions");

      if (instructions) {
        instructions.value = "";
      }

      pickupInput.value = "";

      updatePickupMinimum();

      draw();

      orderMessage.textContent =
        "Your order has been cancelled.";
    };
  }

 /* ---------------------------------------------------------
    PLACE ORDER / FINAL VALIDATION
    --------------------------------------------------------- */

 document.getElementById("placeOrder").onclick=()=>{

  const vid=
   Number(vs.value);

  const c=
   cart();

  const pickup=
   pickupInput.value;


  orderMessage.textContent="";


  if(!vid||!c.length){

   orderMessage.textContent=
    "Select a vendor and add at least one item.";

   return;
  }


  if(!pickup){

   orderMessage.textContent=
    "Select a pickup date and time.";

   return;
  }


  /* -------------------------------------------------------
     FUTURE PICKUP VALIDATION
     ------------------------------------------------------- */

  const pickupDate=
   new Date(pickup);


  if(
   Number.isNaN(
    pickupDate.getTime()
   ) ||
   pickupDate<=new Date()
  ){

   orderMessage.textContent=
    "Pickup time must be in the future. Please select a new pickup time.";

   updatePickupMinimum();

   return;
  }


  /* -------------------------------------------------------
     QUANTITY AND AVAILABILITY VALIDATION
     ------------------------------------------------------- */

  for(const r of c){

   if(
    !Number.isInteger(
     Number(r.quantity)
    ) ||
    Number(r.quantity)<1 ||
    Number(r.quantity)>10
   ){

    orderMessage.textContent=
     "Each item quantity must be between 1 and 10.";

    return;
   }


   const x=
    byId(
     db.MenuItems,
     "menu_item_id",
     r.menu_item_id
    );


   if(
    !x ||
    !x.is_available ||
    x.vendor_id!==vid
   ){

    const itemName=
     x?.item_name||
     "A selected item";

    orderMessage.textContent=
     `${itemName} is no longer available. Remove it from the order or select another available item, then try again.`;

    return;
   }
  }


  /* -------------------------------------------------------
     SPECIAL INSTRUCTIONS VALIDATION
     ------------------------------------------------------- */

  const instructions=
   document
   .getElementById(
    "specialInstructions"
   )
   .value
   .trim();


  if(instructions.length>255){

   orderMessage.textContent=
    "Special instructions cannot exceed 255 characters.";

   return;
  }


  // BUG-006: Calculate prices in integer cents to preserve decimals.
  const totalCents = c.reduce((sum, r) => {
    const x = byId(db.MenuItems, "menu_item_id", r.menu_item_id);
    return sum + Math.round(Number(x.price) * 100) * Number(r.quantity);
  }, 0);
  const total = totalCents / 100;


  /* -------------------------------------------------------
     INSUFFICIENT FUNDS VALIDATION
     ------------------------------------------------------- */

if (
  total > Number(s.meal_plan_balance)
) {
  // BUG-005: Interpolate actual dollar amounts.
  orderMessage.textContent =
    `Insufficient meal-plan funds. Order total is $${total.toFixed(2)} ` +
    `and available balance is $${Number(s.meal_plan_balance).toFixed(2)}. ` +
    `Remove an item, reduce the quantity, or return to your account to add funds and try again.`;

  return;
}


// Generate the next unique order ID
const oid = nextOrderId(db);

// Record the order creation time
const now = new Date().toISOString();

  /* -------------------------------------------------------
     CREATE ORDER
     ------------------------------------------------------- */

  db.Orders.push({

   order_id:oid,

   vendor_id:vid,

   student_id:
    s.student_id,

   order_date:now,

   total_amount:
    total,

   pickup_time:
    pickupDate.toISOString(),

   special_instructions:
    instructions
  });


  /* -------------------------------------------------------
     CREATE ORDER ITEMS
     ------------------------------------------------------- */

  c.forEach(r=>{

   const x=
    byId(
     db.MenuItems,
     "menu_item_id",
     r.menu_item_id
    );

   // BUG-006: Preserve cents in the saved OrderItems line total.
   const line = (
     Math.round(Number(x.price) * 100) * Number(r.quantity)
   ) / 100;


   db.OrderItems.push({

    order_item_id:
     next(
      db.OrderItems,
      "order_item_id"
     ),

    order_id:
     oid,

    menu_item_id:
     x.menu_item_id,

    quantity:
     Number(r.quantity),

    unit_price:
     Number(x.price),

    total_price:
     line
   });
  });


  /* -------------------------------------------------------
     CREATE INITIAL ORDER STATUS
     ------------------------------------------------------- */

  db.OrderStatus.push({

   status_id:
    next(
     db.OrderStatus,
     "status_id"
    ),

   order_id:
    oid,

   staff_id:
    null,

   status_name:
    "Pending",

   status_description:
    "Order submitted by student",

   updated_at:
    now
  });


  /* -------------------------------------------------------
     CREATE MEAL-PLAN TRANSACTION
     ------------------------------------------------------- */

  db.Transactions.push({

   transaction_id:
    next(
     db.Transactions,
     "transaction_id"
    ),

   order_id:
    oid,

   student_id:
    s.student_id,

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


  /* -------------------------------------------------------
     UPDATE STUDENT MEAL-PLAN BALANCE
     ------------------------------------------------------- */

  s.meal_plan_balance=
   Number(
    (
     Number(s.meal_plan_balance)-
     total
    ).toFixed(2)
   );


  saveDB(db);

  saveCart([]);

  sessionStorage.setItem(
   "cflLastOrderId",
   oid
  );

  location.href=
   "confirmation.html";
 };


 draw();
}


/* =========================================================
   ORDER CONFIRMATION
   ========================================================= */

function confirmationInit(db){

 if(!guard("student"))return;


 const o=
  byId(
   db.Orders,
   "order_id",
   sessionStorage.getItem(
    "cflLastOrderId"
   )
  );


 if(!o){

  location.href=
   "account.html";

  return;
 }


 document
 .getElementById(
  "confirmOrder"
 )
 .textContent=
  o.order_id;


 document
 .getElementById(
  "confirmVendor"
 )
 .textContent=
  byId(
   db.Vendors,
   "vendor_id",
   o.vendor_id
  )?.vendor_name||
  "Unknown";


 document
 .getElementById(
  "confirmStatus"
 )
 .textContent=
  latestStatus(
   db,
   o.order_id
  )?.status_name||
  "Pending";


 document
 .getElementById(
  "confirmPickup"
 )
 .textContent=
  new Date(
   o.pickup_time
  ).toLocaleString();


 document
 .getElementById(
  "confirmTotal"
 )
 .textContent=
  Number(
   o.total_amount
  ).toFixed(2);


 document
 .getElementById(
  "logoutBtn"
 )
 .onclick=()=>{

  sessionStorage.clear();

  location.href=
   "index.html";
 };
}


/* =========================================================
   STAFF DASHBOARD AND ORDER MANAGEMENT

   Staff can:
   - View student orders
   - View order details
   - Update order status
   - Cancel an order
   - Update menu availability
   - Export prototype data
   ========================================================= */

function ordersInit(db){

 if(!guard("staff"))return;


 const st=
  currentStaff(db);


 if(
  !st ||
  !st.is_active
 ){

  sessionStorage.clear();

  location.href=
   "index.html";

  return;
 }


 document
 .getElementById(
  "staffName"
 )
 .textContent=
  `${st.first_name} ${st.last_name}`;


 document
 .getElementById(
  "staffRole"
 )
 .textContent=
  st.role;



 const managerBtn=document.getElementById("showReportsBtn");
 const reportsSection=document.getElementById("reportsSection");
 const isManager=String(st.role).trim().toLowerCase()==="dietary manager";
 if(isManager){
  managerBtn.hidden=false;
  managerBtn.onclick=()=>{document.getElementById("ordersSection").hidden=true;document.getElementById("menuSection").hidden=true;reportsSection.hidden=false;drawManagerReports();};
  document.getElementById("reportApplyBtn").onclick=drawManagerReports;
  document.getElementById("reportClearBtn").onclick=()=>{document.getElementById("reportFrom").value="";document.getElementById("reportTo").value="";drawManagerReports();};
  document.getElementById("reportExportBtn").onclick=exportManagerReport;
 }
 const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
 function managerData(){
  const from=document.getElementById("reportFrom").value,to=document.getElementById("reportTo").value;
  const orders=db.Orders.filter(o=>{const raw=o.order_date||o.created_at||o.ordered_at||o.order_datetime;const date=raw?new Date(raw):null;if((from||to)&&(!date||isNaN(date)))return false;const day=date?date.toISOString().slice(0,10):"";return (!from||day>=from)&&(!to||day<=to);});
  const statuses=new Map(),vendors=new Map(),items=new Map();let sales=0,cancelled=0,active=0;
  orders.forEach(o=>{
   const status=latestStatus(db,o.order_id)?.status_name||"Unknown";
   statuses.set(status,(statuses.get(status)||0)+1);
   const cancel=/^cancel(l)?ed$/i.test(status);if(cancel)cancelled++;
   const amount=Number(o.total_amount??o.total_price??o.total??0)||0;
   const vendor=byId(db.Vendors,"vendor_id",o.vendor_id)?.vendor_name||"Unknown";
   const v=vendors.get(vendor)||{count:0,sales:0};v.count++;if(!cancel){sales+=amount;active++;v.sales+=amount;}vendors.set(vendor,v);
   if(!cancel)db.OrderItems.filter(i=>Number(i.order_id)===Number(o.order_id)).forEach(i=>{const item=byId(db.MenuItems,"menu_item_id",i.menu_item_id);const name=item?.item_name||"Unknown";const qty=Number(i.quantity)||0;const price=Number(i.unit_price??i.price_at_order??item?.price??0)||0;const v=items.get(name)||{qty:0,sales:0};v.qty+=qty;v.sales+=qty*price;items.set(name,v);});
  });return {orders,statuses,vendors,items,sales,cancelled,active};
 }
 function fillReport(id,rows,cols){const body=document.getElementById(id);body.replaceChildren();if(!rows.length){const tr=body.insertRow(),td=tr.insertCell();td.colSpan=cols;td.textContent="No matching data";return;}rows.forEach(values=>{const tr=body.insertRow();values.forEach(v=>tr.insertCell().textContent=String(v));});}
 function drawManagerReports(){if(!isManager)return;const from=document.getElementById("reportFrom").value,to=document.getElementById("reportTo").value;const message=document.getElementById("reportMessage");if(from&&to&&from>to){message.textContent="Start date cannot be after end date.";return;}message.textContent="Prototype data from this browser.";const r=managerData();document.getElementById("reportOrders").textContent=r.orders.length;document.getElementById("reportSales").textContent=money(r.sales);document.getElementById("reportAvg").textContent=money(r.active?r.sales/r.active:0);document.getElementById("reportCancelled").textContent=r.cancelled;fillReport("reportStatusBody",[...r.statuses].map(([name,n])=>[name,n]),2);fillReport("reportVendorBody",[...r.vendors].map(([name,v])=>[name,v.count,money(v.sales)]),3);fillReport("reportItemsBody",[...r.items].sort((a,b)=>b[1].qty-a[1].qty).map(([name,v])=>[name,v.qty,money(v.sales)]),3);}
 function exportManagerReport(){if(!isManager)return;const from=document.getElementById("reportFrom").value,to=document.getElementById("reportTo").value;if(from&&to&&from>to)return;const r=managerData();const rows=[["Section","Name","Count","Value"],["Summary","Orders",r.orders.length,""],["Summary","Order Value","",r.sales.toFixed(2)],["Summary","Cancelled",r.cancelled,""]];r.statuses.forEach((n,k)=>rows.push(["Status",k,n,""]));r.vendors.forEach((v,k)=>rows.push(["Vendor",k,v.count,v.sales.toFixed(2)]));r.items.forEach((v,k)=>rows.push(["Item",k,v.qty,v.sales.toFixed(2)]));const csv=rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(",")).join("\r\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));const a=document.createElement("a");a.href=url;a.download="CampusFoodLink_Manager_Report.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 /* ---------------------------------------------------------
    PROFESSOR STUDENT DEMO
    --------------------------------------------------------- */

 const demo=
  document.getElementById(
   "studentDemoBtn"
  );


 if(
  sessionStorage.getItem(
   "cflProfessorDemo"
  )==="true"
 ){

  demo.hidden=false;


  demo.onclick=()=>{

   sessionStorage.setItem(
    "cflProfessorStaffId",
    st.staff_id
   );

   sessionStorage.setItem(
    "cflRole",
    "student"
   );

   sessionStorage.setItem(
    "cflStudentId",
    101
   );

   location.href=
    "account.html";
  };
 }


 /* ---------------------------------------------------------
    STAFF NAVIGATION / EXPORT / LOGOUT
    --------------------------------------------------------- */

 document
 .getElementById(
  "exportDataBtn"
 )
 .onclick=
  exportJSON;


 document
 .getElementById(
  "staffLogoutBtn"
 )
 .onclick=()=>{

  sessionStorage.clear();

  location.href=
   "index.html";
 };


 const os=
  document.getElementById(
   "ordersSection"
  );

 const ms=
  document.getElementById(
   "menuSection"
  );


 document
 .getElementById(
  "showOrdersBtn"
 )
 .onclick=()=>{

  os.hidden=false;

  ms.hidden=true;
  reportsSection.hidden=true;

  drawOrders();
 };


 document
 .getElementById(
  "showMenuBtn"
 )
 .onclick=()=>{

  os.hidden=true;

  ms.hidden=false;
  reportsSection.hidden=true;

  drawMenu();
 };


 /* ---------------------------------------------------------
    DRAW STAFF ORDERS
    --------------------------------------------------------- */

 function drawOrders(){

  const body=
   document.getElementById(
    "ordersBody"
   );

  body.textContent="";


  if(!db.Orders.length){

   const tr=
    document.createElement("tr");

   const td=
    document.createElement("td");

   td.colSpan=7;

   td.textContent=
    "No current orders.";

   tr.appendChild(td);

   body.appendChild(tr);

   return;
  }


  db.Orders.forEach(o=>{

   const student=
    byId(
     db.Students,
     "student_id",
     o.student_id
    );

   const vendor=
    byId(
     db.Vendors,
     "vendor_id",
     o.vendor_id
    );

   const ls=
    latestStatus(
     db,
     o.order_id
    );

   const tr=
    document.createElement("tr");


   const values=[

    o.order_id,

    student
     ?`${student.first_name} ${student.last_name}`
     :"Unknown",

    vendor?.vendor_name||
     "Unknown",

    ls?.status_name||
     "-",

    new Date(
     o.pickup_time
    ).toLocaleString()
   ];


   values.forEach(value=>{

    const td=
     document.createElement("td");

    td.textContent=
     value;

    tr.appendChild(td);
   });


   /* -------------------------------------------------------
      STATUS SELECTION
      ------------------------------------------------------- */

   const statusTd=
    document.createElement("td");

   const select=
    document.createElement("select");

   select.className=
    "new-status";

   select.dataset.id=
    o.order_id;


   [
    "",
    "Approved",
    "Preparing",
    "Ready",
    "Cancelled"
   ]
   .forEach(value=>{

    const option=
     document.createElement(
      "option"
     );

    option.value=
     value;

    option.textContent=
     value||
     "Select";

    select.appendChild(
     option
    );
   });


   statusTd.appendChild(
    select
   );

   tr.appendChild(
    statusTd
   );


   /* -------------------------------------------------------
      ORDER DETAILS 
      ------------------------------------------------------- */

   const detailsTd=
    document.createElement("td");

   const details=
    document.createElement("button");

   details.className=
    "details";

   details.dataset.id=
    o.order_id;

   details.type=
    "button";

   details.textContent=
    "View";


   detailsTd.appendChild(
    details
   );

   tr.appendChild(
    detailsTd
   );


   body.appendChild(tr);
  });


  /* -------------------------------------------------------
     UPDATE ORDER STATUS
     ------------------------------------------------------- */

  document
  .querySelectorAll(
   ".new-status"
  )
  .forEach(
   sel=>sel.onchange=()=>{

    if(!sel.value)return;


    const oid=
     Number(
      sel.dataset.id
     );

    const order=
     byId(
      db.Orders,
      "order_id",
      oid
     );

    const last=
     latestStatus(
      db,
      oid
     );

    const newStatus=
     sel.value;


    if(
     last?.status_name===
     "Cancelled"
    ){

     alert(
      "Cancelled orders cannot be reopened."
     );

     sel.value="";

     return;
    }


    /* -----------------------------------------------------
       STAFF CANCELLATION REFUND
       ----------------------------------------------------- */

    if(
     newStatus===
     "Cancelled"
    ){

     const transaction=
      db.Transactions.find(
       t=>
        Number(t.order_id)===
        oid
      );

     const student=
      order
       ?byId(
         db.Students,
         "student_id",
         order.student_id
        )
       :null;


     if(
      transaction &&
      student &&
      transaction.transaction_status===
       "Complete"
     ){

      student.meal_plan_balance=
       Number(
        (
         Number(
          student.meal_plan_balance
         )+
         Number(
          transaction.meal_plan_used
         )
        ).toFixed(2)
       );

      transaction.transaction_status=
       "Cancelled";
     }
    }


    /* -----------------------------------------------------
       CREATE ORDER STATUS HISTORY RECORD
       ----------------------------------------------------- */

    db.OrderStatus.push({

     status_id:
      next(
       db.OrderStatus,
       "status_id"
      ),

     order_id:
      oid,

     staff_id:
      st.staff_id,

     status_name:
      newStatus,

     status_description:
      `Status updated by ${st.first_name} ${st.last_name}`,

     updated_at:
      new Date().toISOString()
    });


    saveDB(db);


    document
    .getElementById(
     "saveMessage"
    )
    .textContent=
     `Order #${oid} status history updated.`;


    drawOrders();
   }
  );


  /* -------------------------------------------------------
     VIEW ORDER DETAILS
     ------------------------------------------------------- */

  document
  .querySelectorAll(
   ".details"
  )
  .forEach(
   b=>b.onclick=()=>{

    const o=
     byId(
      db.Orders,
      "order_id",
      b.dataset.id
     );

    const student=
     byId(
      db.Students,
      "student_id",
      o.student_id
     );


    const lines=
     db.OrderItems
     .filter(
      x=>
       x.order_id===
       o.order_id
     )
     .map(r=>{

      const item=
       byId(
        db.MenuItems,
        "menu_item_id",
        r.menu_item_id
       );

      return `${r.quantity} x ${item?.item_name||"Unknown Item"} = $${Number(r.total_price).toFixed(2)}`;

     })
     .join("\n");


    alert(
     `Order #${o.order_id}\n`+
     `Student: ${
      student
       ?`${student.first_name} ${student.last_name}`
       :"Unknown"
     }\n`+
     `Special Instructions: ${o.special_instructions||"None"}\n\n`+
     `${lines}\n\n`+
     `Total: $${Number(o.total_amount).toFixed(2)}`
    );
   }
  );
 }


 /* ---------------------------------------------------------
    MENU AVAILABILITY MANAGEMENT
    --------------------------------------------------------- */

 function drawMenu(){

  const body=
   document.getElementById(
    "menuAdminBody"
   );

  body.textContent="";


  db.MenuItems.forEach(x=>{

   const vendor=
    byId(
     db.Vendors,
     "vendor_id",
     x.vendor_id
    );

   const tr=
    document.createElement("tr");


   [
    x.menu_item_id,
    vendor?.vendor_name||
     "Unknown",
    x.item_name,
    x.category||"",
    `$${Number(x.price).toFixed(2)}`
   ]
   .forEach(value=>{

    const td=
     document.createElement("td");

    td.textContent=
     value;

    tr.appendChild(td);
   });


   const availabilityTd=
    document.createElement("td");

   const select=
    document.createElement("select");

   select.className=
    "avail";

   select.dataset.id=
    x.menu_item_id;


   [
    ["true","Yes"],
    ["false","No"]
   ]
   .forEach(
    ([value,label])=>{

     const option=
      document.createElement(
       "option"
      );

     option.value=
      value;

     option.textContent=
      label;

     option.selected=
      (value==="true")===
      Boolean(x.is_available);

     select.appendChild(
      option
     );
    }
   );


   availabilityTd.appendChild(
    select
   );

   tr.appendChild(
    availabilityTd
   );


   const actionTd=
    document.createElement("td");

   const save=
    document.createElement("button");

   save.className=
    "save-menu";

   save.dataset.id=
    x.menu_item_id;

   save.type=
    "button";

   save.textContent=
    "Save";


   actionTd.appendChild(
    save
   );

   tr.appendChild(
    actionTd
   );


   body.appendChild(tr);
  });


  document
  .querySelectorAll(
   ".save-menu"
  )
  .forEach(
   b=>b.onclick=()=>{

    const x=
     byId(
      db.MenuItems,
      "menu_item_id",
      b.dataset.id
     );

    const sel=
     document.querySelector(
      `.avail[data-id="${x.menu_item_id}"]`
     );


    x.is_available=
     sel.value==="true";


    saveDB(db);


    document
    .getElementById(
     "menuMessage"
    )
    .textContent=
     `${x.item_name} availability updated.`;
   }
  );
 }


 drawOrders();
}



/* =========================================================
   IT ADMIN PORTAL (BROWSER-ONLY DEMONSTRATION)
   ========================================================= */
function adminInit(db){
 if(!guard("staff"))return;
 const staff=currentStaff(db);
 if(!staff || staff.is_active===false || String(staff.role).trim().toLowerCase()!=="it staff"
    || sessionStorage.getItem("cflProfessorDemo")==="true"){
  location.replace("index.html");return;
 }
 const tbody=document.getElementById("adminAccounts");
 const notice=document.getElementById("adminMessage");
 const directoryNotice=document.getElementById("adminDirectoryMessage");
 const audit=document.getElementById("adminAudit");
 const form=document.getElementById("adminForm");
 const selected=document.getElementById("adminSelected");
 const login=document.getElementById("adminLogin");
 const password=document.getElementById("adminPassword");
 const role=document.getElementById("adminRole");
 const active=document.getElementById("adminActive");
 const type=document.getElementById("adminType");
 const search=document.getElementById("adminSearch");
 const editDialog=document.getElementById("adminEditDialog");
 const removeDialog=document.getElementById("adminRemoveDialog");
 const removeSummary=document.getElementById("adminRemoveSummary");
 const removeWarning=document.getElementById("adminRemoveWarning");
 const closeEdit=()=>editDialog.close();
 document.getElementById("adminEditClose").onclick=closeEdit;
 document.getElementById("adminRemoveClose").onclick=()=>removeDialog.close();
 document.getElementById("adminRemoveCancel").onclick=()=>removeDialog.close();
 // Keep the current selection inside the confirmation, never a stale row reference.
 let pendingRemoval=null;
 document.getElementById("adminRemoveConfirm").onclick=()=>{
  if(!pendingRemoval)return;
  const account=pendingRemoval;
  pendingRemoval=null;
  removeDialog.close();
  executeRemoval(account);
 };

 const accounts=()=>db.DemoAccounts.filter(a=>a.account_type!=="Professor Demo");
 const person=a=>a.account_type==="Student"
  ?byId(db.Students,"student_id",a.record_id)
  :byId(db.Staff,"staff_id",a.record_id);
 const label=a=>{const x=person(a);return x?`${x.first_name} ${x.last_name}`:"Unknown user";};
 const status=a=>a.account_type==="Student"?"Student":person(a)?.role||"Staff";
 const isActive=a=>a.account_type==="Student" ? a.is_active!==false : person(a)?.is_active!==false;
 const logs=()=>read("CFLAdminAudit",[]);
 const log=(action,username,detail)=>{
  const entries=logs();
  entries.push({timestamp:new Date().toISOString(),actor:staff.staff_id,action,username,detail});
  localStorage.setItem("CFLAdminAudit",JSON.stringify(entries.slice(-300)));
  renderAudit();
 };
 const message=(txt)=>{notice.textContent=txt;directoryNotice.textContent=txt;};
 // BUG-007: Persist the audit display cutoff across resets and logouts without deleting audit history.
 const auditCutoffKey = "CFLAdminAuditHiddenBefore";
 function renderAudit(){
  audit.replaceChildren();
  const cutoff = Number(localStorage.getItem(auditCutoffKey) || 0);
  logs().filter(e => Date.parse(e.timestamp) > cutoff).slice(-15).reverse().forEach(e=>{
   const tr=audit.insertRow();
   [new Date(e.timestamp).toLocaleString(),e.action,e.username,e.detail].forEach(v=>tr.insertCell().textContent=v);
  });
 }
 function render(){
  tbody.replaceChildren();
  const q=search.value.trim().toLowerCase();
  accounts().filter(a=>[a.login,label(a),status(a)].some(v=>String(v).toLowerCase().includes(q))).forEach(a=>{
   const tr=tbody.insertRow();
   [a.login,label(a),status(a),isActive(a)?"Active":"Inactive"].forEach(v=>tr.insertCell().textContent=v);
   const td=tr.insertCell(),button=document.createElement("button");
   button.type="button";button.textContent="Edit";button.onclick=()=>choose(a);
   td.append(button);
   const remove=document.createElement("button");
   remove.type="button";remove.textContent="Remove";remove.className="admin-remove";
   remove.onclick=()=>removeAccount(a);
   td.append(" ",remove);
  });
 }
 function removeAccount(a){
  const current=accounts().find(x=>x===a);
  if(!current){message("Account no longer exists.");return;}
  if(a.account_type!=="Student" && Number(a.record_id)===Number(staff.staff_id)){
   message("You cannot remove your own IT account.");return;
  }
  const id=Number(a.record_id);
  const activeOrders=a.account_type==="Student"
   ?db.Orders.filter(o=>Number(o.student_id)===id).filter(o=>{
      const currentStatus=latestStatus(db,o.order_id);
      return ["pending","approved","preparing","ready"].includes(String(currentStatus?.status_name||"Pending").trim().toLowerCase());
     }):[];
  pendingRemoval=activeOrders.length?null:a;
  removeSummary.textContent=`Account: ${label(a)} | Username: ${a.login} | Role: ${status(a)} | Status: ${isActive(a)?"Active":"Inactive"}`;
  const confirmButton=document.getElementById("adminRemoveConfirm");
  confirmButton.disabled=activeOrders.length>0;
  if(activeOrders.length){
   removeWarning.textContent=`Cannot delete account with active orders (${activeOrders.length}). Pending, approved, preparing, or ready orders must be cancelled first.`;
  }else{
   removeWarning.textContent="Confirm removal? Accounts with historical orders or transactions will be deactivated instead, preserving history.";
  }
  removeDialog.showModal();
 }
 function executeRemoval(a){
  if(a.account_type!=="Student" && Number(a.record_id)===Number(staff.staff_id)){
   message("You cannot remove your own IT account.");return;
  }
  const record=person(a);
  if(!record){message("Account record not found; removal cancelled.");return;}
  // Reject removal if any current order is Pending, Approved, or Ready.
  const id=Number(a.record_id);
  if(a.account_type==="Student"){
   const activeOrders=db.Orders.filter(o=>Number(o.student_id)===id).filter(o=>{
    const current=latestStatus(db,o.order_id);
    return ["pending","approved","preparing","ready"].includes(String(current?.status_name||"Pending").trim().toLowerCase());
   });
   if(activeOrders.length){
    message(`Cannot delete account with active orders (${activeOrders.length}). Pending, approved, preparing, or ready orders must be cancelled first.`);
    return;
   }
  }
  // Retain student and staff records referenced by orders, transactions or other records.
  const referenced=a.account_type==="Student"
   ?db.Orders.some(o=>Number(o.student_id)===id)||db.Transactions.some(t=>Number(t.student_id)===id)
   :db.Orders.some(o=>Number(o.handled_by)===id||Number(o.staff_id)===id)
     ||db.OrderStatus.some(o=>Number(o.staff_id)===id||Number(o.updated_by)===id)
     ||db.Transactions.some(t=>Number(t.staff_id)===id);
  if(referenced){
   // BUG-008: Soft removal preserves order and transaction foreign-key relationships.
   a.is_active=false;
   record.is_active=false;
   saveDB(db);
   log("ACCOUNT_DEACTIVATE",a.login,"Account deactivated; historical order/transaction records preserved");
   render();
   message("Account deactivated. Login is disabled; historical orders and transactions are retained.");
   return;
  }
  db.DemoAccounts.splice(db.DemoAccounts.indexOf(a),1);
  const collection=a.account_type==="Student"?db.Students:db.Staff;
  const ix=collection.indexOf(record);if(ix>=0)collection.splice(ix,1);
  saveDB(db);
  log("ACCOUNT_REMOVE",a.login,`Removed ${a.account_type} demo account without related records`);
  if(selected.value===a.login){selected.value="";form.reset();document.getElementById("adminSelection").textContent="Select an account above to edit.";}
  render();message("Account removed from this browser.");
 }
 const createForm=document.getElementById("adminCreateForm");
 createForm.onsubmit=e=>{
  e.preventDefault();
  const username=document.getElementById("createLogin").value.trim().toLowerCase();
  const pwd=document.getElementById("createPassword").value;
  const first=document.getElementById("createFirst").value.trim();
  const last=document.getElementById("createLast").value.trim();
  const email=document.getElementById("createEmail").value.trim();
  const newRole=document.getElementById("createRole").value;
  const feedback=document.getElementById("createMessage");
  if(!first||!last||!email){feedback.textContent="Name and email are required.";return;}
  if(!/^[a-z0-9._-]{3,32}$/.test(username)){feedback.textContent="Username must be 3–32 letters, digits, dots, underscores, or hyphens.";return;}
  if(db.DemoAccounts.some(a=>a.login.toLowerCase()===username)){feedback.textContent="Username already exists.";return;}
  if(pwd.length<8){feedback.textContent="Password must be at least 8 characters.";return;}
  if([...db.Students,...db.Staff].some(a=>String(a.email_address||"").toLowerCase()===email.toLowerCase())){
   feedback.textContent="Email address is already assigned to an account.";return;
  }
  const student=newRole==="Student";
  const recordId=student?next(db.Students,"student_id",101):next(db.Staff,"staff_id",113);
  if(student){db.Students.push({student_id:recordId,first_name:first,last_name:last,email_address:email,phone_number:"",meal_plan_balance:0});}
  else{db.Staff.push({staff_id:recordId,first_name:first,last_name:last,email_address:email,role:newRole,is_active:true});}
  db.DemoAccounts.push({login:username,password:pwd,account_type:student?"Student":"Staff",record_id:recordId,is_active:true});
  saveDB(db);
  log("ACCOUNT_CREATE",username,`Created ${newRole} demonstration account (ID ${recordId})`);
  createForm.reset();render();feedback.textContent=`Account ${username} created. It can now sign in on this browser.`;
 };
 function choose(a){
  selected.value=a.login;
  login.value=a.login;
  password.value="";
  type.value=a.account_type;
  role.value=a.account_type==="Student"?"Student":status(a);
  role.disabled=a.account_type==="Student";
  active.checked=isActive(a);
  document.getElementById("adminSelection").textContent=`Editing ${label(a)} (${a.login})`;
  message("Leave New Password blank to keep the current password.");
  editDialog.showModal();
  login.focus();
 }
 form.onsubmit=e=>{
  e.preventDefault();
  const original=accounts().find(a=>a.login===selected.value);
  if(!original){message("Select an account first.");return;}
  const newLogin=login.value.trim().toLowerCase();
  if(!/^[a-z0-9._-]{3,32}$/.test(newLogin)){message("Username must be 3–32 letters, digits, dots, underscores, or hyphens.");return;}
  if(db.DemoAccounts.some(a=>a!==original && a.login.toLowerCase()===newLogin)){
   message("Username is already in use.");return;
  }
  if(password.value && password.value.length<8){message("New password must be at least 8 characters.");return;}
  if(original.record_id===staff.staff_id && original.account_type!=="Student" &&
      (!active.checked || role.value!=="IT Staff")){
   message("You cannot deactivate or remove your own IT Staff role.");return;
  }
  const before={login:original.login,role:status(original),active:isActive(original)};
  original.login=newLogin;
  if(password.value)original.password=password.value;
  if(original.account_type==="Student"){
   original.is_active=active.checked;
  }else{
   const x=person(original);
   x.role=role.value;x.is_active=active.checked;
  }
  saveDB(db);
  log("ACCOUNT_UPDATE",newLogin,`Login ${before.login} → ${newLogin}; role ${before.role} → ${status(original)}; active ${before.active} → ${active.checked}; password ${password.value?"reset":"unchanged"}`);
  password.value="";
  selected.value=newLogin;
  render();message("Demo account updated in this browser.");
  editDialog.close();
 };
 search.oninput=render;
 document.getElementById("adminLogout").onclick=()=>{sessionStorage.clear();location.href="index.html";};
 // BUG-007: Clear the visible audit display persistently in this browser.
 // Export Audit CSV still includes all historical entries.
 let clearAuditButton=document.getElementById("adminClearDisplay");
 if(!clearAuditButton){
  clearAuditButton=document.createElement("button");
  clearAuditButton.type="button";
  clearAuditButton.id="adminClearDisplay";
  clearAuditButton.textContent="Clear Display";
  document.getElementById("adminAuditExport").before(clearAuditButton);
 }
 if(clearAuditButton){
  clearAuditButton.onclick=()=>{
   localStorage.setItem(auditCutoffKey,String(Date.now()));
   renderAudit();
   message("Activity display cleared. Hidden entries remain available in the full audit CSV export.");
  };
 }
 document.getElementById("adminAuditExport").onclick=()=>{
  const rows=[["Timestamp","Actor staff ID","Action","Username","Detail"],...logs().map(e=>[e.timestamp,e.actor,e.action,e.username,e.detail])];
  const csv=rows.map(row=>row.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(",")).join("\r\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
  const a=document.createElement("a");a.href=url;a.download="CampusFoodLink_Admin_Audit.csv";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 render();renderAudit();
}

/* =========================================================
   APPLICATION STARTUP AND PAGE ROUTING
   ========================================================= */

document.addEventListener(
 "DOMContentLoaded",
 async()=>{

  const db=
   await initDB();

  if(!db)return;


  ({
   login:
    loginInit,

   account:
    accountInit,

   menu:
    menuInit,

   confirmation:
    confirmationInit,

   orders:
    ordersInit,

   admin:
    adminInit

  }[
   document.body.dataset.page
  ])?.(db);
 }
);


/* Professional interface layer: presentation only, no changes to authentication or orders. */
(function(){
  'use strict';
  const titles={account:['Student Dashboard','Your campus dining account at a glance.'],menu:['Student Menu','Browse available meals and build your order.'],confirmation:['Order Confirmation','Review the details of your latest order.'],orders:['Dining Operations','Manage incoming orders and menu availability.'],admin:['IT Administration','Manage user accounts and system access.']};
  function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
  function stat(label,value,note){const card=el('div','cfl-stat');card.append(el('span','cfl-stat-label',label),el('div','cfl-stat-value',value),el('div','cfl-stat-note',note));return card;}
  function addIntro(main,page){if(!titles[page]||main.querySelector('.cfl-page-intro'))return;const intro=el('div','cfl-page-intro');intro.append(el('h1','',titles[page][0]),el('p','',titles[page][1]));const header=main.querySelector(':scope > header');if(header)header.after(intro);else main.prepend(intro);}
  function addFooter(main){if(main.querySelector('.cfl-footer'))return;const foot=el('footer','cfl-footer');foot.append(el('span','', 'Campus FoodLink+ · IT499 Capstone Demonstration'),el('span','','Prototype · v1.0'));main.append(foot);}
  function addStats(main,page){if(main.querySelector('.cfl-stats'))return;const wrap=el('div','cfl-stats');if(page==='account'){
    const balance=stat('Meal Plan Balance','—','Current available balance');balance.querySelector('.cfl-stat-value').id='cflBalanceMirror';wrap.append(balance);
    const order=stat('Latest Order','See below','Order details and status');wrap.append(order);
  }else if(page==='orders'){
    for(const [label,id] of [['Pending','pending'],['Preparing','preparing'],['Ready','ready']]){const s=stat(label,'—','Current order queue');s.querySelector('.cfl-stat-value').id='cflCount-'+id;wrap.append(s);}
  }else if(page==='admin'){
    const s=stat('User Accounts','—','Accounts in directory');s.querySelector('.cfl-stat-value').id='cflAccountCount';wrap.append(s);
  }else return;
    const intro=main.querySelector('.cfl-page-intro');if(intro)intro.after(wrap);
  }
  function update(){const balance=document.getElementById('balance'),mirror=document.getElementById('cflBalanceMirror');if(balance&&mirror)mirror.textContent=balance.textContent.trim()?('$'+balance.textContent.trim().replace(/^\$/,'')):'—';
    const orders=document.getElementById('ordersBody');if(orders){const rows=Array.from(orders.querySelectorAll('tr'));for(const status of ['Pending','preparing','ready']){const dest=document.getElementById('cflCount-'+status);if(dest)dest.textContent=String(rows.filter(row=>Array.from(row.querySelectorAll('td')).some(td=>td.textContent.trim().toLowerCase()===status)).length);}}
    const accounts=document.getElementById('adminAccounts'),dest=document.getElementById('cflAccountCount');if(accounts&&dest)dest.textContent=String(accounts.querySelectorAll('tr').length);
  }
  function start(){const page=document.body.dataset.page,main=document.querySelector('main.wireframe')||document.querySelector('main');if(!main)return;
    if(page==='login'){
      const form=document.getElementById('loginForm');if(form&&!form.querySelector('.cfl-login-heading')){
        form.prepend(el('p','cfl-login-subtitle','Sign in to access your campus dining portal'));form.prepend(el('h1','cfl-login-heading','Welcome Back'));
        const password=document.getElementById('password');if(password){const label=el('label','cfl-show-password');const toggle=el('input');toggle.type='checkbox';toggle.setAttribute('aria-label','Show password');toggle.addEventListener('change',()=>{password.type=toggle.checked?'text':'password';});label.append(toggle,document.createTextNode('Show password'));password.after(label);}
      }
    }else{addIntro(main,page);addStats(main,page);}
    addFooter(main);update();
    const targets=['balance','ordersBody','adminAccounts'].map(id=>document.getElementById(id)).filter(Boolean);
    for(const t of targets){new MutationObserver(update).observe(t,{subtree:true,childList:true,characterData:true});}
  }
  document.addEventListener('DOMContentLoaded',start);
})();
