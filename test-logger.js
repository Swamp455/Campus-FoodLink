/* Campus FoodLink+ Unit 8 prototype evidence logger. Local to this browser. */
(()=>{
"use strict";
const KEY="CFL_Unit8_TestLog_v1", CASE="CFL_Unit8_ActiveCase_v1";
const tests=["UI-01","UI-02","UI-03","UI-04","UI-05","UI-06","LOG-01","LOG-02","LOG-03","LOG-04","LOG-05","LOG-06","DATA-01","DATA-02","DATA-03","DATA-04","DATA-05","INT-01"];
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return []}};
const safe=(s)=>String(s??"").slice(0,220);
function record(action,result="OBSERVED",details={}){
 const entry={timestamp:new Date().toISOString(),test_case:localStorage.getItem(CASE)||"UNASSIGNED",page:document.body?.dataset.page||"unknown",action:safe(action),result:safe(result),details};
 try{const entries=load();entries.push(entry);localStorage.setItem(KEY,JSON.stringify(entries.slice(-1500)))}catch(e){console.warn("Test log storage unavailable",e)}
 console.info("[CFL TEST]",entry);renderCount();return entry;
}
window.CFLTestLog={record,entries:load};
function download(filename,content,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function exportLogs(format){const rows=load();const stamp=new Date().toISOString().replace(/[:.]/g,"-");if(format==="json")download(`CampusFoodLink_TestLogs_${stamp}.json`,JSON.stringify({project:"Campus FoodLink+",type:"Prototype browser testing evidence",exported_at:new Date().toISOString(),entries:rows},null,2),"application/json");else{const cols=["timestamp","test_case","page","action","result","details"];const esc=v=>'"'+String(v??"").replace(/"/g,'""')+'"';const lines=[cols.join(","),...rows.map(r=>cols.map(c=>esc(c==="details"?JSON.stringify(r.details):r[c])).join(","))];download(`CampusFoodLink_TestLogs_${stamp}.csv`,lines.join("\r\n"),"text/csv;charset=utf-8")}}
function renderCount(){const n=document.getElementById("cflLogCount");if(n)n.textContent=`${load().length} entries`}
function init(){
 const panel=document.createElement("aside");panel.id="cflTestPanel";panel.setAttribute("aria-label","Unit 8 test evidence tools");panel.innerHTML=`<div style="font-weight:700;margin-bottom:6px">Unit 8 Test Logger <span id="cflLogCount"></span></div><label for="cflCase">Test case</label> <select id="cflCase"></select><div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px"><button type="button" id="cflMarkPass">Mark Pass</button><button type="button" id="cflMarkFail">Mark Fail</button><button type="button" id="cflExportCSV">Export CSV</button><button type="button" id="cflExportJSON">Export JSON</button><button type="button" id="cflClearLog">Clear logs</button></div><small>Logs are stored only in this browser. Export before clearing browser data.</small>`;
 Object.assign(panel.style,{position:"fixed",bottom:"8px",right:"8px",zIndex:"99999",background:"#f6f8fa",border:"2px solid #1565c0",borderRadius:"7px",padding:"10px",maxWidth:"370px",boxShadow:"0 2px 12px #0003",font:"12px Arial",color:"#111"});
 document.body.appendChild(panel);
 const select=document.getElementById("cflCase");for(const v of ["UNASSIGNED",...tests]){const op=document.createElement("option");op.value=v;op.textContent=v;select.appendChild(op)}select.value=localStorage.getItem(CASE)||"UNASSIGNED";select.onchange=()=>{localStorage.setItem(CASE,select.value);record("TEST_CASE_SELECTED","INFO")};
 document.getElementById("cflMarkPass").onclick=()=>record("MANUAL_TEST_RESULT","PASS",{note:"Tester manually marked this test Pass; attach screenshot for evidence."});
 document.getElementById("cflMarkFail").onclick=()=>record("MANUAL_TEST_RESULT","FAIL",{note:"Tester manually marked this test Fail; describe defect in issue log."});
 document.getElementById("cflExportCSV").onclick=()=>exportLogs("csv");document.getElementById("cflExportJSON").onclick=()=>exportLogs("json");
 document.getElementById("cflClearLog").onclick=()=>{if(confirm("Delete all local test log entries? Export first.")){localStorage.removeItem(KEY);renderCount()}};
 renderCount();record("PAGE_LOADED","INFO",{path:location.pathname});
 // Captures actions without recording usernames, passwords, special instructions or other form values.
 document.addEventListener("click",e=>{const target=e.target.closest("button,a");if(!target||panel.contains(target))return;record("CONTROL_CLICK","ACTION",{control_id:target.id||null,control_class:safe(target.className),label:safe(target.textContent.trim()).slice(0,60)})},true);
 document.addEventListener("submit",e=>{record("FORM_SUBMITTED","ACTION",{form_id:e.target.id||null})},true);
 // Capture visible validation/status messages after application logic updates them.
 const watched=["loginError","fundMessage","accountMessage","orderMessage","saveMessage","menuMessage","resetMessage"];
 for(const id of watched){const el=document.getElementById(id);if(!el)continue;let previous=el.textContent.trim();new MutationObserver(()=>{const message=el.textContent.trim();if(message&&message!==previous){record("UI_MESSAGE","OBSERVED",{element:id,message:safe(message)});}previous=message}).observe(el,{childList:true,characterData:true,subtree:true})}
 // Browser's native required-field validation does not submit the form.
 document.addEventListener("invalid",e=>{record("NATIVE_FORM_VALIDATION","BLOCKED",{field_id:e.target.id||null,reason:"Browser rejected invalid required field"})},true);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
