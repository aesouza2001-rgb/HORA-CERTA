const KEY="horaCertaMVP";
const defaultState={people:[{id:"p1",name:"Minha Família"}],current:"p1",target:480, punches:[]};
let state=JSON.parse(localStorage.getItem(KEY)||"null")||defaultState;
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const pad=n=>String(n).padStart(2,"0");
const fmtMin=m=>{let sign=m<0?"-":"",v=Math.abs(Math.round(m));return sign+pad(Math.floor(v/60))+":"+pad(v%60)};
const todayKey=()=>{let d=new Date();return d.toISOString().slice(0,10)};
const todayPunches=()=>state.punches.filter(p=>p.personId===state.current&&p.date===todayKey()).sort((a,b)=>a.ts-b.ts);
function calcDay(ps){
  let total=0;
  for(let i=0;i+1<ps.length;i+=2) total+=(ps[i+1].ts-ps[i].ts)/60000;
  return Math.round(total);
}
function allPeople(){return state.people}
function bankFor(personId){
  let by={};
  state.punches.filter(p=>p.personId===personId).forEach(p=>(by[p.date]??=[]).push(p));
  return Object.values(by).reduce((s,ps)=>s+calcDay(ps)-state.target,0);
}
function currentPerson(){return state.people.find(p=>p.id===state.current)||state.people[0]}
function render(){
  document.getElementById("currentName").textContent=currentPerson()?.name||"Família";
  document.getElementById("today").textContent=new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});
  const ps=todayPunches(), worked=calcDay(ps), bal=worked-state.target;
  document.getElementById("todayBalance").textContent=fmtMin(bal);
  document.getElementById("todayBalance").className=bal<0?"negative":"positive";
  const bank=bankFor(state.current);
  document.getElementById("bankBalance").textContent=fmtMin(bank);
  document.getElementById("bankBalance").className=bank<0?"negative":"positive";
  const tl=document.getElementById("todayPunches"); tl.innerHTML="";
  ps.forEach((p,i)=>{let div=document.createElement("div");div.className="item";div.innerHTML=`<span>${i%2===0?"Entrada":"Saída/intervalo"}</span><strong>${new Date(p.ts).toLocaleTimeString("pt-BR")}</strong>`;tl.appendChild(div)});
  const last=ps[ps.length-1];
  document.getElementById("punchBtn").textContent=last&&ps.length%2===1?"REGISTRAR SAÍDA / INTERVALO":"REGISTRAR PONTO";
  document.getElementById("locationStatus").textContent=last?.location?(last.address?`📍 ${formatAddress(last.address)}`:`📍 GPS: ${last.location.lat.toFixed(5)}, ${last.location.lng.toFixed(5)}`):"📍 Localização será solicitada no registro";
  renderHistory(); renderAdmin();
}
async function reverseGeocode(lat,lng){
  try{
    const url=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;
    const res=await fetch(url,{headers:{"Accept":"application/json"}});
    if(!res.ok) throw new Error("geocode");
    const data=await res.json();
    const a=data.address||{};
    return {
      street:a.road||a.pedestrian||a.footway||"",
      number:a.house_number||"",
      neighborhood:a.neighbourhood||a.suburb||a.quarter||"",
      city:a.city||a.town||a.municipality||"",
      state:a.state||"",
      cep:a.postcode||"",
      display:data.display_name||""
    };
  }catch(e){
    return null;
  }
}

function formatAddress(addr){
  if(!addr) return "Localização obtida, mas endereço não identificado";
  const line1=[addr.street,addr.number].filter(Boolean).join(", ");
  const line2=[addr.neighborhood,addr.city].filter(Boolean).join(" • ");
  const line3=addr.cep ? `CEP ${addr.cep}` : "";
  return [line1,line2,line3].filter(Boolean).join(" | ") || addr.display || "Endereço não identificado";
}

async function punch(){
  const btn=document.getElementById("punchBtn");
  btn.disabled=true;
  btn.textContent="OBTENDO LOCALIZAÇÃO...";

  const add=async (loc)=>{
    let address=null;
    if(loc) address=await reverseGeocode(loc.lat,loc.lng);
    state.punches.push({
      id:crypto.randomUUID(),
      personId:state.current,
      date:todayKey(),
      ts:Date.now(),
      location:loc,
      address:address
    });
    save();
    render();
    btn.disabled=false;
  };

  if(!navigator.geolocation){
    await add(null);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos=>add({
      lat:pos.coords.latitude,
      lng:pos.coords.longitude,
      accuracy:pos.coords.accuracy
    }),
    async ()=>{
      await add(null);
      alert("Não foi possível obter o GPS. O registro foi salvo sem localização.");
    },
    {enableHighAccuracy:true,timeout:15000,maximumAge:0}
  );
}
function renderHistory(){
  const by={}; state.punches.filter(p=>p.personId===state.current).forEach(p=>(by[p.date]??=[]).push(p));
  const el=document.getElementById("historyList"); el.innerHTML="";
  Object.keys(by).sort().reverse().forEach(date=>{let mins=calcDay(by[date]);let bal=mins-state.target;let d=document.createElement("div");d.className="person";d.innerHTML=`<div><strong>${new Date(date+"T12:00:00").toLocaleDateString("pt-BR")}</strong><div class="muted">Trabalhado ${fmtMin(mins)}</div></div><strong class="${bal<0?"negative":"positive"}">${fmtMin(bal)}</strong>`;el.appendChild(d)});
  if(!el.children.length) el.innerHTML='<div class="muted">Nenhum registro ainda.</div>';
}
function renderAdmin(){
  document.getElementById("peopleCount").textContent=state.people.length;
  const work=state.people.filter(p=>{let ps=state.punches.filter(x=>x.personId===p.id&&x.date===todayKey());return ps.length%2===1}).length;
  document.getElementById("workingCount").textContent=work;
  let total=state.people.reduce((s,p)=>s+bankFor(p.id),0);
  document.getElementById("adminBalance").textContent=fmtMin(total);
  document.getElementById("extraTotal").textContent=fmtMin(Math.max(0,total));
  const el=document.getElementById("peopleList");el.innerHTML="";
  state.people.forEach(p=>{let row=document.createElement("div");row.className="person";row.innerHTML=`<span>${p.name}</span><span><button onclick="selectPerson('${p.id}')">Selecionar</button> <button onclick="removePerson('${p.id}')">Excluir</button></span>`;el.appendChild(row)});
}
window.selectPerson=id=>{state.current=id;save();show("home");render()};
window.removePerson=id=>{if(state.people.length===1)return alert("Mantenha pelo menos uma pessoa.");state.people=state.people.filter(p=>p.id!==id);state.punches=state.punches.filter(p=>p.personId!==id);if(state.current===id)state.current=state.people[0].id;save();render()};
function show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));document.getElementById(id).classList.add("active");document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.screen===id))}
document.querySelectorAll(".nav").forEach(n=>n.onclick=()=>show(n.dataset.screen));
document.getElementById("punchBtn").onclick=punch;
document.getElementById("addPerson").onclick=()=>{let n=document.getElementById("newName").value.trim();if(!n)return;state.people.push({id:crypto.randomUUID(),name:n});document.getElementById("newName").value="";save();render()};
document.getElementById("resetBtn").onclick=()=>{if(confirm("Apagar todos os dados deste teste?")){localStorage.removeItem(KEY);location.reload()}};
setInterval(()=>document.getElementById("clock").textContent=new Date().toLocaleTimeString("pt-BR"),1000);
render();
