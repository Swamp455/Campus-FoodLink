const DB_KEY="CampusFoodLinkDB",CART_KEY="CampusFoodLinkCart";
const read=(k,d=null)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch{return d}};
const saveDB=db=>localStorage.setItem(DB_KEY,JSON.stringify(db));
const cart=()=>read(CART_KEY,[]),saveCart=c=>localStorage.setItem(CART_KEY,JSON.stringify(c));
const next=(a,k,s=1)=>a.length?Math.max(...a.map(x=>Number(x[k])||0))+1:s;
const byId=(a,k,id)=>a.find(x=>Number(x[k])===Number(id));
const latestStatus=(db,orderId)=>db.OrderStatus.filter(x=>Number(x.order_id)===Number(orderId)).sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at)||b.status_id-a.status_id)[0]||null;
const currentStudent=db=>byId(db.Students,"student_id",sessionStorage.getItem("cflStudentId"));
const currentStaff=db=>byId(db.Staff,"staff_id",sessionStorage.getItem("cflStaffId"));

function escapeHTML(value){
 return String(value??"")
  .replaceAll("&","&amp;")
  .replaceAll("<","&lt;")
  .replaceAll(">","&gt;")
  .replaceAll('"',"&quot;")
  .replaceAll("'","&#039;");
}

function guard(r){if(sessionStorage.getItem("cflRole")!==r){location.href="index.html";return false}return true}

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
  alert("Run this project through a web server or GitHub Pages.");
  return null;
 }
}

async function resetDB(){
 if(!confirm("Reset all demo data to apps.json?"))return false;
 let r=await fetch("apps.json?"+Date.now());
 if(!r.ok)return false;
 saveDB(await r.json());
 localStorage.removeItem(CART_KEY);
 sessionStorage.clear();
 return true;
}

function exportJSON(){
 let db=read(DB_KEY);if(!db)return;
 let copy=JSON.parse(JSON.stringify(db));
 delete copy.DemoAccounts;
 let out={project:"Campus FoodLink+",schema:"MySQL-matched prototype export",exported_at:new Date().toISOString(),tables:copy};
 let blob=new Blob([JSON.stringify(out,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;
 a.download=`CampusFoodLink_MySQL_Data_${new Date().toISOString().slice(0,10)}.json`;
 a.click();
 URL.revokeObjectURL(url);
}

function loginInit(db){
 const f=document.getElementById("loginForm"),err=document.getElementById("loginError");
 document.getElementById("resetDemoBtn").onclick=async()=>{if(await resetDB())location.reload()};
 f.onsubmit=e=>{
  e.preventDefault();
  const u=document.getElementById("userId").value.trim().toLowerCase(),p=document.getElementById("password").value;
  const a=db.DemoAccounts.find(x=>x.login.toLowerCase()===u&&x.password===p);
  if(!a){err.textContent="Invalid demo username or password.";return}
  sessionStorage.clear();
  if(a.account_type==="Student"){
   sessionStorage.setItem("cflRole","student");
   sessionStorage.setItem("cflStudentId",a.record_id);
   location.href="account.html";
   return;
  }
  sessionStorage.setItem("cflRole","staff");
  sessionStorage.setItem("cflStaffId",a.record_id);
  if(a.account_type==="Professor Demo")sessionStorage.setItem("cflProfessorDemo","true");
  location.href="orders.html";
 };
}

function accountInit(db){
 if(!guard("student"))return;
 const s=currentStudent(db),msg=document.getElementById("accountMessage"),cancel=document.getElementById("cancelOrderBtn");
 document.getElementById("studentName").textContent=`${s.first_name} ${s.last_name}`;
 document.getElementById("studentEmail").textContent=s.email_address;
 document.getElementById("balance").textContent=Number(s.meal_plan_balance).toFixed(2);

 const back=document.getElementById("returnStaffBtn");
 if(sessionStorage.getItem("cflProfessorDemo")==="true"){
  back.hidden=false;
  back.onclick=()=>{
   sessionStorage.setItem("cflRole","staff");
   sessionStorage.setItem("cflStaffId",sessionStorage.getItem("cflProfessorStaffId")||113);
   sessionStorage.removeItem("cflStudentId");
   location.href="orders.html";
  };
 }

 const orders=db.Orders.filter(x=>x.student_id===s.student_id);
 const o=orders.at(-1);
 if(!o){cancel.hidden=true;return}
 const v=byId(db.Vendors,"vendor_id",o.vendor_id),st=latestStatus(db,o.order_id);
 document.getElementById("orderId").textContent=o.order_id;
 document.getElementById("orderVendor").textContent=v?.vendor_name||"Unknown";
 document.getElementById("orderStatus").textContent=st?.status_name||"Pending";
 document.getElementById("statusUpdated").textContent=st?new Date(st.updated_at).toLocaleString():"-";
 cancel.hidden=!st||!["Pending","Approved"].includes(st.status_name);

 cancel.onclick=()=>{
  const now=latestStatus(db,o.order_id);
  if(!now||!["Pending","Approved"].includes(now.status_name)){
   msg.textContent="This order can no longer be cancelled.";
   return;
  }
  if(!confirm(`Cancel Order #${o.order_id}?`))return;
  db.OrderStatus.push({
   status_id:next(db.OrderStatus,"status_id"),
   order_id:o.order_id,
   staff_id:null,
   status_name:"Cancelled",
   status_description:"Cancelled by student",
   updated_at:new Date().toISOString()
  });
  const t=db.Transactions.find(x=>x.order_id===o.order_id);
  if(t&&t.transaction_status==="Complete"){
   s.meal_plan_balance=Number((Number(s.meal_plan_balance)+Number(t.meal_plan_used)).toFixed(2));
   t.transaction_status="Cancelled";
  }
  saveDB(db);
  location.reload();
 };
}

function menuInit(db){
 if(!guard("student"))return;

 const s=currentStudent(db),
       vs=document.getElementById("vendorSelect"),
       items=document.getElementById("menuItems"),
       rows=document.getElementById("cartRows"),
       tot=document.getElementById("cartTotal"),
       pickupInput=document.getElementById("pickupTime"),
       orderMessage=document.getElementById("orderMessage");

 document.getElementById("menuBalance").textContent=Number(s.meal_plan_balance).toFixed(2);

 // Create vendor options safely instead of inserting database text through innerHTML.
 db.Vendors.filter(v=>v.is_active).forEach(v=>{
  const option=document.createElement("option");
  option.value=v.vendor_id;
  option.textContent=v.vendor_name;
  vs.appendChild(option);
 });

 // Prevent selecting a pickup time in the past in the browser control.
 function updatePickupMinimum(){
  const now=new Date();
  now.setMinutes(now.getMinutes()-now.getTimezoneOffset());
  pickupInput.min=now.toISOString().slice(0,16);
 }
 updatePickupMinimum();

 let currentVendorValue=vs.value;

 vs.onchange=()=>{
  const previous=currentVendorValue;
  const existingCart=cart();

  if(existingCart.length>0){
   const changeVendor=confirm("Changing vendors will remove the items currently in your order. Continue?");
   if(!changeVendor){
    vs.value=previous;
    return;
   }
   saveCart([]);
   orderMessage.textContent="Cart cleared because the vendor was changed.";
  }else{
   orderMessage.textContent="";
  }

  currentVendorValue=vs.value;
  draw();
 };

 function draw(){
  const vid=Number(vs.value),c=cart();

  if(!vid){
   items.textContent="";
   const p=document.createElement("p");
   p.textContent="Select an active vendor.";
   items.appendChild(p);
   rows.textContent="";
   tot.textContent="0.00";
   return;
  }

  items.textContent="";
  const menu=db.MenuItems.filter(x=>x.vendor_id===vid&&x.is_available);

  if(!menu.length){
   const p=document.createElement("p");
   p.textContent="No available items.";
   items.appendChild(p);
  }else{
   menu.forEach(x=>{
    const box=document.createElement("div");
    box.className="menu-item";

    const info=document.createElement("div");
    const name=document.createElement("b");
    name.textContent=x.item_name;
    info.appendChild(name);
    info.appendChild(document.createElement("br"));

    const description=document.createTextNode(x.description||"");
    info.appendChild(description);
    info.appendChild(document.createElement("br"));

    const category=document.createElement("small");
    category.textContent=x.category||"";
    info.appendChild(category);
    info.appendChild(document.createElement("br"));

    info.appendChild(document.createTextNode(`$${Number(x.price).toFixed(2)}`));

    const add=document.createElement("button");
    add.className="add";
    add.dataset.id=x.menu_item_id;
    add.type="button";
    add.textContent="Add";

    box.append(info,add);
    items.appendChild(box);
   });
  }

  rows.textContent="";
  c.forEach(r=>{
   const x=byId(db.MenuItems,"menu_item_id",r.menu_item_id);
   if(!x)return;
   const line=Number(x.price)*Number(r.quantity);
   const tr=document.createElement("tr");

   [r.quantity,x.item_name,`$${Number(x.price).toFixed(2)}`,`$${line.toFixed(2)}`].forEach(value=>{
    const td=document.createElement("td");
    td.textContent=value;
    tr.appendChild(td);
   });

   const action=document.createElement("td");
   const remove=document.createElement("button");
   remove.className="remove";
   remove.dataset.id=x.menu_item_id;
   remove.type="button";
   remove.textContent="Remove";
   action.appendChild(remove);
   tr.appendChild(action);
   rows.appendChild(tr);
  });

  tot.textContent=c.reduce((z,r)=>{
   const x=byId(db.MenuItems,"menu_item_id",r.menu_item_id);
   return z+(x?Number(x.price)*Number(r.quantity):0);
  },0).toFixed(2);

  document.querySelectorAll(".add").forEach(b=>b.onclick=()=>{
   let c=cart(),id=Number(b.dataset.id),r=c.find(x=>x.menu_item_id===id);
   if(r){
    if(r.quantity>=10){
     orderMessage.textContent="Maximum quantity is 10 of the same menu item.";
     return;
    }
    r.quantity++;
   }else{
    c.push({menu_item_id:id,quantity:1});
   }
   orderMessage.textContent="";
   saveCart(c);
   draw();
  });

  document.querySelectorAll(".remove").forEach(b=>b.onclick=()=>{
   let c=cart(),id=Number(b.dataset.id),r=c.find(x=>x.menu_item_id===id);
   if(!r)return;
   if(r.quantity>1)r.quantity--;
   else c=c.filter(x=>x.menu_item_id!==id);
   saveCart(c);
   draw();
  });
 }

 document.getElementById("placeOrder").onclick=()=>{
  const vid=Number(vs.value),c=cart(),pickup=pickupInput.value;
  orderMessage.textContent="";

  if(!vid||!c.length){
   orderMessage.textContent="Select a vendor and add at least one item.";
   return;
  }

  if(!pickup){
   orderMessage.textContent="Select a pickup date and time.";
   return;
  }

  const pickupDate=new Date(pickup);
  if(Number.isNaN(pickupDate.getTime())||pickupDate<=new Date()){
   orderMessage.textContent="Pickup time must be in the future. Please select a new pickup time.";
   updatePickupMinimum();
   return;
  }

  for(const r of c){
   if(!Number.isInteger(Number(r.quantity))||Number(r.quantity)<1||Number(r.quantity)>10){
    orderMessage.textContent="Each item quantity must be between 1 and 10.";
    return;
   }

   const x=byId(db.MenuItems,"menu_item_id",r.menu_item_id);
   if(!x||!x.is_available||x.vendor_id!==vid){
    const itemName=x?.item_name||"A selected item";
    orderMessage.textContent=`${itemName} is no longer available. Remove it from the order or select another available item, then try again.`;
    return;
   }
  }

  const instructions=document.getElementById("specialInstructions").value.trim();
  if(instructions.length>255){
   orderMessage.textContent="Special instructions cannot exceed 255 characters.";
   return;
  }

  const total=Number(c.reduce((z,r)=>{
   const x=byId(db.MenuItems,"menu_item_id",r.menu_item_id);
   return z+Number(x.price)*Number(r.quantity);
  },0).toFixed(2));

  if(total>Number(s.meal_plan_balance)){
   orderMessage.textContent=`Insufficient meal-plan funds. Order total is $${total.toFixed(2)} and available balance is $${Number(s.meal_plan_balance).toFixed(2)}. Remove an item or reduce the quantity and try again.`;
   return;
  }

  const oid=next(db.Orders,"order_id",15559),now=new Date().toISOString();

  db.Orders.push({
   order_id:oid,
   vendor_id:vid,
   student_id:s.student_id,
   order_date:now,
   total_amount:total,
   pickup_time:pickupDate.toISOString(),
   special_instructions:instructions
  });

  c.forEach(r=>{
   const x=byId(db.MenuItems,"menu_item_id",r.menu_item_id),
         line=Number((Number(x.price)*Number(r.quantity)).toFixed(2));
   db.OrderItems.push({
    order_item_id:next(db.OrderItems,"order_item_id"),
    order_id:oid,
    menu_item_id:x.menu_item_id,
    quantity:Number(r.quantity),
    unit_price:Number(x.price),
    total_price:line
   });
  });

  db.OrderStatus.push({
   status_id:next(db.OrderStatus,"status_id"),
   order_id:oid,
   staff_id:null,
   status_name:"Pending",
   status_description:"Order submitted by student",
   updated_at:now
  });

  db.Transactions.push({
   transaction_id:next(db.Transactions,"transaction_id"),
   order_id:oid,
   student_id:s.student_id,
   transaction_date:now,
   amount:total,
   payment_method:"Meal Plan",
   meal_plan_used:total,
   transaction_status:"Complete"
  });

  s.meal_plan_balance=Number((Number(s.meal_plan_balance)-total).toFixed(2));
  saveDB(db);
  saveCart([]);
  sessionStorage.setItem("cflLastOrderId",oid);
  location.href="confirmation.html";
 };

 draw();
}

function confirmationInit(db){
 if(!guard("student"))return;
 const o=byId(db.Orders,"order_id",sessionStorage.getItem("cflLastOrderId"));
 if(!o)return location.href="account.html";
 document.getElementById("confirmOrder").textContent=o.order_id;
 document.getElementById("confirmVendor").textContent=byId(db.Vendors,"vendor_id",o.vendor_id)?.vendor_name||"Unknown";
 document.getElementById("confirmStatus").textContent=latestStatus(db,o.order_id)?.status_name||"Pending";
 document.getElementById("confirmPickup").textContent=new Date(o.pickup_time).toLocaleString();
 document.getElementById("confirmTotal").textContent=Number(o.total_amount).toFixed(2);
 document.getElementById("logoutBtn").onclick=()=>{sessionStorage.clear();location.href="index.html"};
}

function ordersInit(db){
 if(!guard("staff"))return;
 const st=currentStaff(db);
 if(!st||!st.is_active){sessionStorage.clear();location.href="index.html";return}

 document.getElementById("staffName").textContent=`${st.first_name} ${st.last_name}`;
 document.getElementById("staffRole").textContent=st.role;

 const demo=document.getElementById("studentDemoBtn");
 if(sessionStorage.getItem("cflProfessorDemo")==="true"){
  demo.hidden=false;
  demo.onclick=()=>{
   sessionStorage.setItem("cflProfessorStaffId",st.staff_id);
   sessionStorage.setItem("cflRole","student");
   sessionStorage.setItem("cflStudentId",101);
   location.href="account.html";
  };
 }

 document.getElementById("exportDataBtn").onclick=exportJSON;
 document.getElementById("staffLogoutBtn").onclick=()=>{sessionStorage.clear();location.href="index.html"};

 const os=document.getElementById("ordersSection"),ms=document.getElementById("menuSection");
 document.getElementById("showOrdersBtn").onclick=()=>{os.hidden=false;ms.hidden=true;drawOrders()};
 document.getElementById("showMenuBtn").onclick=()=>{os.hidden=true;ms.hidden=false;drawMenu()};

 function drawOrders(){
  const body=document.getElementById("ordersBody");
  body.textContent="";

  if(!db.Orders.length){
   const tr=document.createElement("tr"),td=document.createElement("td");
   td.colSpan=7;
   td.textContent="No current orders.";
   tr.appendChild(td);
   body.appendChild(tr);
   return;
  }

  db.Orders.forEach(o=>{
   const student=byId(db.Students,"student_id",o.student_id),
         vendor=byId(db.Vendors,"vendor_id",o.vendor_id),
         ls=latestStatus(db,o.order_id),
         tr=document.createElement("tr");

   const values=[
    o.order_id,
    student?`${student.first_name} ${student.last_name}`:"Unknown",
    vendor?.vendor_name||"Unknown",
    ls?.status_name||"-",
    new Date(o.pickup_time).toLocaleString()
   ];

   values.forEach(value=>{
    const td=document.createElement("td");
    td.textContent=value;
    tr.appendChild(td);
   });

   const statusTd=document.createElement("td");
   const select=document.createElement("select");
   select.className="new-status";
   select.dataset.id=o.order_id;

   ["","Approved","Preparing","Ready","Cancelled"].forEach(value=>{
    const option=document.createElement("option");
    option.value=value;
    option.textContent=value||"Select";
    select.appendChild(option);
   });
   statusTd.appendChild(select);
   tr.appendChild(statusTd);

   const detailsTd=document.createElement("td");
   const details=document.createElement("button");
   details.className="details";
   details.dataset.id=o.order_id;
   details.type="button";
   details.textContent="View";
   detailsTd.appendChild(details);
   tr.appendChild(detailsTd);

   body.appendChild(tr);
  });

  document.querySelectorAll(".new-status").forEach(sel=>sel.onchange=()=>{
   if(!sel.value)return;

   const oid=Number(sel.dataset.id),
         order=byId(db.Orders,"order_id",oid),
         last=latestStatus(db,oid),
         newStatus=sel.value;

   if(last?.status_name==="Cancelled"){
    alert("Cancelled orders cannot be reopened.");
    sel.value="";
    return;
   }

   // If staff cancels an order, return meal-plan funds once and mark its transaction Cancelled.
   if(newStatus==="Cancelled"){
    const transaction=db.Transactions.find(t=>Number(t.order_id)===oid),
          student=order?byId(db.Students,"student_id",order.student_id):null;

    if(transaction&&student&&transaction.transaction_status==="Complete"){
     student.meal_plan_balance=Number((Number(student.meal_plan_balance)+Number(transaction.meal_plan_used)).toFixed(2));
     transaction.transaction_status="Cancelled";
    }
   }

   db.OrderStatus.push({
    status_id:next(db.OrderStatus,"status_id"),
    order_id:oid,
    staff_id:st.staff_id,
    status_name:newStatus,
    status_description:`Status updated by ${st.first_name} ${st.last_name}`,
    updated_at:new Date().toISOString()
   });

   saveDB(db);
   document.getElementById("saveMessage").textContent=`Order #${oid} status history updated.`;
   drawOrders();
  });

  document.querySelectorAll(".details").forEach(b=>b.onclick=()=>{
   const o=byId(db.Orders,"order_id",b.dataset.id),
         student=byId(db.Students,"student_id",o.student_id),
         lines=db.OrderItems.filter(x=>x.order_id===o.order_id).map(r=>{
          const item=byId(db.MenuItems,"menu_item_id",r.menu_item_id);
          return `${r.quantity} x ${item?.item_name||"Unknown Item"} = $${Number(r.total_price).toFixed(2)}`;
         }).join("\n");

   alert(`Order #${o.order_id}\nStudent: ${student?`${student.first_name} ${student.last_name}`:"Unknown"}\nSpecial Instructions: ${o.special_instructions||"None"}\n\n${lines}\n\nTotal: $${Number(o.total_amount).toFixed(2)}`);
  });
 }

 function drawMenu(){
  const body=document.getElementById("menuAdminBody");
  body.textContent="";

  db.MenuItems.forEach(x=>{
   const vendor=byId(db.Vendors,"vendor_id",x.vendor_id),
         tr=document.createElement("tr");

   [x.menu_item_id,vendor?.vendor_name||"Unknown",x.item_name,x.category||"",`$${Number(x.price).toFixed(2)}`].forEach(value=>{
    const td=document.createElement("td");
    td.textContent=value;
    tr.appendChild(td);
   });

   const availabilityTd=document.createElement("td");
   const select=document.createElement("select");
   select.className="avail";
   select.dataset.id=x.menu_item_id;

   [["true","Yes"],["false","No"]].forEach(([value,label])=>{
    const option=document.createElement("option");
    option.value=value;
    option.textContent=label;
    option.selected=(value==="true")===Boolean(x.is_available);
    select.appendChild(option);
   });

   availabilityTd.appendChild(select);
   tr.appendChild(availabilityTd);

   const actionTd=document.createElement("td");
   const save=document.createElement("button");
   save.className="save-menu";
   save.dataset.id=x.menu_item_id;
   save.type="button";
   save.textContent="Save";
   actionTd.appendChild(save);
   tr.appendChild(actionTd);

   body.appendChild(tr);
  });

  document.querySelectorAll(".save-menu").forEach(b=>b.onclick=()=>{
   const x=byId(db.MenuItems,"menu_item_id",b.dataset.id),
         sel=document.querySelector(`.avail[data-id="${x.menu_item_id}"]`);
   x.is_available=sel.value==="true";
   saveDB(db);
   document.getElementById("menuMessage").textContent=`${x.item_name} availability updated.`;
  });
 }

 drawOrders();
}

document.addEventListener("DOMContentLoaded",async()=>{
 const db=await initDB();
 if(!db)return;
 ({login:loginInit,account:accountInit,menu:menuInit,confirmation:confirmationInit,orders:ordersInit}[document.body.dataset.page])?.(db);
});
