
const K={cart:"cflCart",order:"cflOrder",student:"cflStudent"};
const MENU=[
 {id:991,name:"Tuna Sandwich",price:10.00,diet:"VGN"},
 {id:992,name:"Pizza",price:20.00,diet:""},
 {id:993,name:"Roasted Green Beans",price:6.00,diet:"GF VEG"}
];
const DEFAULT_STUDENT={studentId:101,name:"Ale Leon",mealPlanBalance:25.00};
const read=(k,f=null)=>{try{const v=localStorage.getItem(k);return v===null?f:JSON.parse(v)}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const money=v=>`$${Number(v).toFixed(2)}`;
const student=()=>read(K.student,DEFAULT_STUDENT);
const cart=()=>read(K.cart,[]);
const total=(c=cart())=>c.reduce((s,i)=>s+i.price*i.quantity,0);

function saveCart(c){write(K.cart,c)}
function add(id){
 const p=MENU.find(x=>x.id===Number(id)); if(!p)return;
 const c=cart(),e=c.find(x=>x.id===p.id);
 if(e)e.quantity+=1; else c.push({...p,quantity:1});
 saveCart(c);renderMenu();renderCheckout();
}
function decrease(id){
 const c=cart(),e=c.find(x=>x.id===Number(id));if(!e)return;
 e.quantity-=1;
 saveCart(c.filter(x=>x.quantity>0));renderMenu();renderCheckout();
}
function removeItem(id){
 saveCart(cart().filter(x=>x.id!==Number(id)));renderMenu();renderCheckout();
}
function clearCart(){
 localStorage.removeItem(K.cart);renderMenu();renderCheckout();
}
function validate(c,s){
 if(!Array.isArray(c)||c.length===0)return "Please select at least one menu item.";
 if(c.some(i=>!Number.isInteger(i.quantity)||i.quantity<1))return "Quantity must be at least 1.";
 if(total(c)>s.mealPlanBalance)return "Order declined: insufficient meal-plan balance.";
 return "";
}
function submitOrder(){
 const c=cart(),s=student(),m=document.getElementById("checkoutMessage"),err=validate(c,s);
 if(err){if(m)m.textContent=err;return}
 const o={orderId:15559,student:s.name,vendor:"Frenchies",items:c,total:total(c),status:"Pending",
 date:new Date().toLocaleDateString(),pickupTime:"12:30 PM",notes:""};
 write(K.order,o);
 write(K.student,{...s,mealPlanBalance:Number((s.mealPlanBalance-o.total).toFixed(2))});
 localStorage.removeItem(K.cart);
 location.href="confirmation.html";
}
function renderDashboard(){
 const s=student(),o=read(K.order,null);
 const n=document.getElementById("studentName"),b=document.getElementById("balance"),a=document.getElementById("currentOrder");
 if(n)n.textContent=s.name;if(b)b.textContent=money(s.mealPlanBalance);
 if(a)a.innerHTML=o?`<p><strong>Order #${o.orderId}</strong></p><p>${o.vendor}</p><p>Total: ${money(o.total)}</p><p>Status: <span class="status">${o.status}</span></p><a class="button" href="confirmation.html">View Order</a>`:"<p>No active order.</p><a class='button' href='menu.html'>Place Order</a>";
}
function renderMenu(){
 const a=document.getElementById("menuItems");if(!a)return;
 const c=cart();
 a.innerHTML=MENU.map(i=>{
   const q=(c.find(x=>x.id===i.id)||{}).quantity||0;
   return `<div class="menu-row"><div class="thumb"></div><div><strong>${i.name}</strong><div class="small">${i.diet}</div></div><div class="price">${money(i.price)}</div><div class="item-actions"><button aria-label="Remove one ${i.name}" onclick="decrease(${i.id})">−</button><span class="qty">${q}</span><button aria-label="Add ${i.name}" onclick="add(${i.id})">+</button></div></div>`;
 }).join("");
 const s=document.getElementById("cartSummary");if(!s)return;
 s.innerHTML=c.length?`${c.map(i=>`<div class="cart-row"><span>${i.name} × ${i.quantity}</span><strong>${money(i.price*i.quantity)}</strong><button class="danger" onclick="removeItem(${i.id})">Remove</button></div>`).join("")}<p><strong>Total: ${money(total(c))}</strong></p>`:"<p>Cart is empty.</p>";
}
function renderCheckout(){
 const c=cart(),a=document.getElementById("checkoutItems"),s=student();if(!a)return;
 a.innerHTML=c.length?`${c.map(i=>`<div class="cart-row"><span>${i.name} × ${i.quantity}</span><strong>${money(i.price*i.quantity)}</strong><button onclick="removeItem(${i.id})">Remove</button></div>`).join("")}<p><strong>Total: ${money(total(c))}</strong></p><p>Meal Plan Balance: ${money(s.mealPlanBalance)}</p>`:"<p>Your cart is empty. Return to the Vendor Menu to add an item.</p>";
}
function renderConfirmation(){
 const o=read(K.order,null),a=document.getElementById("confirmation");if(!a)return;
 a.innerHTML=o?`<div class="confirm-box"><h2>Order Confirmation</h2><p><strong>Order #${o.orderId}</strong></p><p>Vendor: ${o.vendor}</p>${o.items.map(i=>`<p>${i.name} × ${i.quantity}</p>`).join("")}<p>Total: <strong>${money(o.total)}</strong></p><p>Status: <strong>${o.status}</strong></p><p>Pickup Time: ${o.pickupTime}</p></div>`:"<p>No saved order found.</p>";
}
function renderOrders(){
 const o=read(K.order,null),body=document.getElementById("ordersBody");if(!body)return;
 body.innerHTML=o?`<tr><td>${o.orderId}</td><td><select id="statusSelect"><option ${o.status==="Pending"?"selected":""}>Pending</option><option ${o.status==="Approved"?"selected":""}>Approved</option><option ${o.status==="Preparing"?"selected":""}>Preparing</option><option ${o.status==="Ready"?"selected":""}>Ready</option><option ${o.status==="Canceled"?"selected":""}>Canceled</option></select></td><td>${o.date}</td><td>${o.pickupTime}</td><td><textarea id="notes">${o.notes||""}</textarea></td></tr>`:`<tr><td colspan="5">No order has been submitted.</td></tr>`;
}
function saveVendorUpdate(){
 const o=read(K.order,null),m=document.getElementById("vendorMessage");
 if(!o){if(m)m.textContent="No order to update.";return}
 o.status=document.getElementById("statusSelect").value;
 o.notes=document.getElementById("notes").value.trim();
 write(K.order,o);
 if(m)m.textContent=`Order #${o.orderId} updated to ${o.status}.`;
 renderOrders();renderVendorDashboard();renderDashboard();
}
function renderVendorDashboard(){
 const area=document.getElementById("vendorDashboardOrder"),o=read(K.order,null);if(!area)return;
 area.innerHTML=o?`<p><strong>Order #${o.orderId}</strong></p><p>Student: ${o.student}</p><p>Total: ${money(o.total)}</p><p>Status: <span class="status">${o.status}</span></p><a class="button" href="orders.html">Open Order</a>`:"<p>No current orders.</p><a class='button' href='orders.html'>View Orders</a>";
}

function exportOrderData(){
 const o=read(K.order,null);
 const m=document.getElementById("vendorMessage");
 if(!o){
   if(m)m.textContent="No saved order is available to export.";
   return;
 }
 const exportData={
   exportedAt:new Date().toISOString(),
   order:o
 };
 const blob=new Blob([JSON.stringify(exportData,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob);
 const link=document.createElement("a");
 link.href=url;
 link.download=`CampusFoodLink_Order_${o.orderId}.json`;
 document.body.appendChild(link);
 link.click();
 link.remove();
 URL.revokeObjectURL(url);
 if(m)m.textContent=`Order #${o.orderId} exported as JSON.`;
}

function resetDemo(){localStorage.clear();write(K.student,DEFAULT_STUDENT);location.href="index.html"}


function switchToStudent(){
 sessionStorage.setItem("cflLoggedIn","student");
 location.href="account.html";
}
function switchToAssociate(){
 sessionStorage.setItem("cflLoggedIn","vendor");
 location.href="vendor-dashboard.html";
}

function logout(){
 sessionStorage.removeItem("cflLoggedIn");
 location.href="index.html";
}

document.addEventListener("DOMContentLoaded",()=>{if(!localStorage.getItem(K.student))write(K.student,DEFAULT_STUDENT);renderDashboard();renderMenu();renderCheckout();renderConfirmation();renderOrders();renderVendorDashboard()});
