const $=s=>document.querySelector(s);
let matches=[],tab="LIVE",sport="All",hls=null,video=null;
const icons={Cricket:"🏏",Football:"⚽",Tennis:"🎾",Badminton:"🏸",Basketball:"🏀",Hockey:"🏑"};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const live=m=>String(m.status||"").toUpperCase().includes("LIVE");
function stopPlayer(){if(hls){hls.destroy();hls=null}if(video){video.pause();video.removeAttribute("src");video.load();video=null}$("#screen").innerHTML=""}
function closePlayer(){$("#player").classList.remove("show");stopPlayer()}
function render(){
 const cats=["All",...new Set(matches.map(m=>m.category).filter(Boolean))];
 $("#filters").innerHTML=cats.map(c=>'<button class="chip '+(sport===c?"active":"")+'" data-sport="'+esc(c)+'">'+(icons[c]||"✦")+" "+esc(c)+'</button>').join("");
 document.querySelectorAll("[data-sport]").forEach(b=>b.onclick=()=>{sport=b.dataset.sport;render()});
 const list=matches.filter(m=>(tab==="ALL"||(tab==="LIVE"?live(m):!live(m)))&&(sport==="All"||m.category===sport));
 $("#heading").textContent=tab==="ALL"?"All Matches":tab==="LIVE"?"Live Matches":"Upcoming Matches";$("#count").textContent=list.length+" matches";
 $("#matches").innerHTML=list.length?list.map(m=>{const url=m.cnptv_cdn||m.streams?.primary;return '<article class="match"><div class="poster">'+(m.image?'<img loading="lazy" src="'+esc(m.image)+'" alt="" onerror="this.style.display=\'none\'">':'')+'<span class="sport">'+(icons[m.category]||"🏆")+'</span><span class="badge '+(live(m)?"":"up")+'">'+(live(m)?"● LIVE":"UPCOMING")+'</span></div><div class="details"><div class="league">'+esc(m.tournament||m.category||"SPORT")+'</div><h3>'+esc(m.title||"Match")+'</h3><div class="time">◷ '+esc(m.startTime||"Schedule TBA")+'</div>'+(live(m)&&url?'<button class="watch" data-id="'+esc(m.match_id)+'">▶ WATCH LIVE</button>':live(m)?'<button class="watch unavailable" disabled>STREAM NOT AVAILABLE</button>':'<button class="watch upcoming" disabled>◷ UPCOMING</button>')+'</div></article>'}).join(""):'<div class="empty">No matches available in this section.</div>';
 document.querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>openMatch(b.dataset.id));
}
function openMatch(id){
 const m=matches.find(x=>String(x.match_id)===String(id));if(!m)return;const url=m.cnptv_cdn||m.streams?.primary;
 $("#player").classList.add("show");$("#playerTitle").textContent=m.title||"Now Playing";$("#playerMeta").textContent=(m.tournament||"")+" · "+(m.startTime||"");stopPlayer();
 if(!live(m)||!url){$("#screen").innerHTML='<div class="notice">Is match ka stream abhi available nahi hai.</div>'}
 else{const v=document.createElement("video");v.controls=true;v.autoplay=true;v.playsInline=true;v.preload="auto";video=v;$("#screen").append(v);
  if(v.canPlayType("application/vnd.apple.mpegurl")){v.src=url;v.play().catch(()=>{})}
  else if(window.Hls&&Hls.isSupported()){hls=new Hls({enableWorker:true,lowLatencyMode:true});hls.loadSource(url);hls.attachMedia(v);hls.on(Hls.Events.MANIFEST_PARSED,()=>v.play().catch(()=>{}));hls.on(Hls.Events.ERROR,(_,d)=>{if(d.fatal)$("#screen").insertAdjacentHTML("beforeend",'<div class="notice">Stream load nahi hua. Stream access ya availability check karein.</div>')})}
  else $("#screen").innerHTML='<div class="notice">Is browser mein HLS playback supported nahi hai.</div>';
 }
 $("#player").scrollIntoView({behavior:"smooth",block:"start"});
}
$("#close").onclick=closePlayer;
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));render()});
async function load(){try{const r=await fetch("./data/matches.json?t="+Date.now(),{cache:"no-store"});if(!r.ok)throw Error("Feed error");const d=await r.json();matches=Array.isArray(d.matches)?d.matches:[];$("#total").textContent=matches.length;$("#liveCount").textContent=matches.filter(live).length;$("#upCount").textContent=matches.filter(m=>!live(m)).length;$("#updated").textContent="Source: "+(d.updatedAt||"FanCode feed")+" · Checked "+new Date().toLocaleTimeString();render()}catch(e){$("#matches").innerHTML='<div class="empty">Match data could not be loaded.</div>';$("#updated").textContent="Feed unavailable"}}
load();setInterval(load,60000);