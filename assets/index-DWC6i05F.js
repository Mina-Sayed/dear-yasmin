var C=Object.defineProperty;var B=(a,t,e)=>t in a?C(a,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):a[t]=e;var r=(a,t,e)=>B(a,typeof t!="symbol"?t+"":t,e);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const n of s)if(n.type==="childList")for(const o of n.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function e(s){const n={};return s.integrity&&(n.integrity=s.integrity),s.referrerPolicy&&(n.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?n.credentials="include":s.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(s){if(s.ep)return;s.ep=!0;const n=e(s);fetch(s.href,n)}})();class P{constructor(t){r(this,"canvas");r(this,"ctx");r(this,"width",0);r(this,"height",0);if(this.canvas=document.getElementById(t),!this.canvas)throw new Error("Canvas not found");const e=this.canvas.getContext("2d",{alpha:!0});if(!e)throw new Error("2D context not supported");this.ctx=e,this.resize(),window.addEventListener("resize",()=>this.resize())}resize(){const t=Math.min(window.devicePixelRatio||1,2);this.width=window.innerWidth,this.height=window.innerHeight,this.canvas.width=this.width*t,this.canvas.height=this.height*t,this.canvas.style.width=`${this.width}px`,this.canvas.style.height=`${this.height}px`,this.ctx.scale(t,t)}clear(t="rgba(0,0,0,0)"){this.ctx.fillStyle=t,t==="rgba(0,0,0,0)"||t==="transparent"?this.ctx.clearRect(0,0,this.width,this.height):this.ctx.fillRect(0,0,this.width,this.height)}drawHeart(t,e,i,s){this.ctx.fillStyle=s,this.ctx.beginPath();const n=i*.3;this.ctx.moveTo(t,e+n),this.ctx.bezierCurveTo(t,e,t-i/2,e,t-i/2,e+n),this.ctx.bezierCurveTo(t-i/2,e+(i+n)/2,t,e+(i+n)/2,t,e+i),this.ctx.bezierCurveTo(t,e+(i+n)/2,t+i/2,e+(i+n)/2,t+i/2,e+n),this.ctx.bezierCurveTo(t+i/2,e,t,e,t,e+n),this.ctx.fill(),this.ctx.closePath()}}class L{constructor(){r(this,"keys",{});r(this,"joystick",{x:0,y:0,active:!1});r(this,"actionPressed",!1);r(this,"keyboardActionPressed",!1);r(this,"dragStart",null);r(this,"touchId",null);r(this,"actionTouchId",null);this.startListening()}startListening(){window.addEventListener("keydown",t=>{this.keys[t.code]=!0,t.code==="Space"&&(this.keyboardActionPressed=!0)}),window.addEventListener("keyup",t=>{this.keys[t.code]=!1,t.code==="Space"&&(this.keyboardActionPressed=!1)}),document.body.addEventListener("touchstart",t=>{t.target.tagName==="CANVAS"&&t.preventDefault()},{passive:!1}),window.addEventListener("touchstart",t=>this.handleTouchStart(t),{passive:!1}),window.addEventListener("touchmove",t=>this.handleTouchMove(t),{passive:!1}),window.addEventListener("touchend",t=>this.handleTouchEnd(t))}handleTouchStart(t){for(let e=0;e<t.changedTouches.length;e++){const i=t.changedTouches[e],s=i.clientY>window.innerHeight*.4;s&&i.clientX<window.innerWidth/2?this.touchId===null&&(this.touchId=i.identifier,this.dragStart={x:i.clientX,y:i.clientY},this.joystick.active=!0):s&&this.actionTouchId===null&&(this.actionTouchId=i.identifier,this.actionPressed=!0)}}handleTouchMove(t){if(this.touchId!==null)for(let e=0;e<t.changedTouches.length;e++){const i=t.changedTouches[e];if(i.identifier===this.touchId&&this.dragStart){const s=i.clientX-this.dragStart.x,n=i.clientY-this.dragStart.y,o=60;let c=Math.sqrt(s*s+n*n);const d=Math.atan2(n,s);c>o&&(c=o),this.joystick.x=Math.cos(d)*(c/o),this.joystick.y=Math.sin(d)*(c/o)}}}handleTouchEnd(t){for(let e=0;e<t.changedTouches.length;e++){const i=t.changedTouches[e];i.identifier===this.touchId&&(this.touchId=null,this.dragStart=null,this.joystick={x:0,y:0,active:!1}),i.identifier===this.actionTouchId&&(this.actionTouchId=null,this.actionPressed=!1)}}isActionActive(){return this.actionPressed||this.keyboardActionPressed}getAxis(){if(this.joystick.active)return{...this.joystick};let t=0,e=0;if((this.keys.KeyW||this.keys.ArrowUp)&&(e-=1),(this.keys.KeyS||this.keys.ArrowDown)&&(e+=1),(this.keys.KeyA||this.keys.ArrowLeft)&&(t-=1),(this.keys.KeyD||this.keys.ArrowRight)&&(t+=1),t!==0||e!==0){const i=Math.sqrt(t*t+e*e);t/=i,e/=i}return{x:t,y:e}}}const b="love-quest-assets",m="game_assets",x="game_config";class I{constructor(){r(this,"supabase",null);r(this,"initialized",!1)}getClient(){if(!this.supabase)throw new Error("Storage not initialized");return this.supabase}getPublicUrl(t){const{data:e}=this.getClient().storage.from(b).getPublicUrl(t);return e.publicUrl}toStoredAsset(t){return{id:t.id,type:t.type,name:t.name,data:new Blob,url:this.getPublicUrl(t.path),text:t.text||void 0,createdAt:new Date(t.created_at).getTime()}}sanitizeName(t){return t.toLowerCase().replace(/[^a-z0-9._-]+/g,"-")}buildAssetPath(t,e,i){return`${e==="photo"?"photos":"audio"}/${t}-${this.sanitizeName(i)}`}async init(){if(!this.initialized)throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")}async saveAsset(t,e,i,s,n){const o=this.getClient(),c=this.buildAssetPath(t,e,i),{error:d}=await o.storage.from(b).upload(c,s,{upsert:!0,contentType:s.type||void 0});if(d)throw new Error(`Upload failed: ${d.message}`);const u=new Date().toISOString(),f={id:t,type:e,name:i,path:c,text:e==="photo"&&n||null,created_at:u},{error:l}=await o.from(m).upsert(f,{onConflict:"id"});if(l)throw new Error(`Failed to save asset metadata: ${l.message}`);return this.toStoredAsset(f)}async getAsset(t){const e=this.getClient(),{data:i,error:s}=await e.from(m).select("*").eq("id",t).maybeSingle();if(s)throw new Error(`Failed to fetch asset: ${s.message}`);return i?this.toStoredAsset(i):null}async getAllAssets(t){let i=this.getClient().from(m).select("*").order("created_at",{ascending:!0});t&&(i=i.eq("type",t));const{data:s,error:n}=await i;if(n)throw new Error(`Failed to fetch assets: ${n.message}`);return s.map(o=>this.toStoredAsset(o))}async updatePhotoText(t,e){const i=this.getClient(),{error:s}=await i.from(m).update({text:e}).eq("id",t).eq("type","photo");if(s)throw new Error(`Failed to update photo text: ${s.message}`)}async deleteAsset(t){const e=this.getClient(),{data:i,error:s}=await e.from(m).select("path").eq("id",t).maybeSingle();if(s)throw new Error(`Failed to find asset: ${s.message}`);if(i!=null&&i.path){const{error:o}=await e.storage.from(b).remove([i.path]);if(o)throw new Error(`Failed to delete asset file: ${o.message}`)}const{error:n}=await e.from(m).delete().eq("id",t);if(n)throw new Error(`Failed to delete asset metadata: ${n.message}`)}async setConfig(t,e){const i=this.getClient(),{error:s}=await i.from(x).upsert({key:t,value:e},{onConflict:"key"});if(s)throw new Error(`Failed to save config: ${s.message}`)}async getConfig(t){const e=this.getClient(),{data:i,error:s}=await e.from(x).select("value").eq("key",t).maybeSingle();if(s)throw new Error(`Failed to fetch config: ${s.message}`);const n=i;return n==null?void 0:n.value}cleanup(){}}const y=new I;function p(a){const t="/dear-yasmin/",e=t.endsWith("/")?t:`${t}/`,i=a.replace(/^\/+/,"");return`${e}${i}`}const g=[{id:1,text:"Our first date at the coffee shop ☕",img:p("assets/photos/p1.jpg")},{id:2,text:"The trip to the beach 🌊",img:p("assets/photos/p2.jpg")},{id:3,text:"Your graduation day 🎓",img:p("assets/photos/p3.jpg")},{id:4,text:"That time we got lost hiking 🏔️",img:p("assets/photos/p4.jpg")},{id:5,text:"Cooking dinner together 🍝",img:p("assets/photos/p5.jpg")}],h={heroName:"Yasmin",secretCode:"30924",finalMessage:`Happy Anniversary my love! ❤️
Here's to many more adventures together.`,memories:[...g],level2StarsToWin:10,useCustomBGM:!1,customBGMUrl:null,async loadCustomContent(){try{await y.init();const a=await y.getAllAssets("photo");a.length>0?this.memories=a.map((i,s)=>{var n;return{id:s+1,text:i.text||((n=g[s])==null?void 0:n.text)||`Memory ${s+1} ❤️`,img:i.url}}):this.memories=[...g];const t=await y.getConfig("useCustomBGM"),e=await y.getAllAssets("audio");t&&e.length>0?(this.useCustomBGM=!0,this.customBGMUrl=e[0].url):(this.useCustomBGM=!1,this.customBGMUrl=null)}catch(a){console.error("Failed to load custom content:",a),this.memories=[...g]}},resetToDefaults(){this.memories=[...g],this.useCustomBGM=!1,this.customBGMUrl=null}};class z{constructor(){r(this,"ctx");r(this,"bgm",null);this.ctx=new(window.AudioContext||window.webkitAudioContext),this.setupBGM()}setupBGM(){this.bgm&&(this.bgm.pause(),this.bgm=null);const t=h.useCustomBGM&&h.customBGMUrl?h.customBGMUrl:p("assets/bgm.mp3");this.bgm=new Audio(t),this.bgm.loop=!0,this.bgm.volume=.5}startBGM(){var t;h.useCustomBGM&&((t=this.bgm)==null?void 0:t.src)!==h.customBGMUrl&&this.setupBGM(),this.bgm&&(this.bgm.currentTime=0,this.bgm.play().catch(e=>console.log("Audio autoplay blocked until interaction",e)))}resume(){this.ctx.state==="suspended"&&this.ctx.resume().catch(console.error)}playTone(t,e="sine",i=.1,s=.1){this.resume();const n=this.ctx.createOscillator(),o=this.ctx.createGain();n.frequency.setValueAtTime(t,this.ctx.currentTime),n.type=e,n.connect(o),o.connect(this.ctx.destination),n.start(),o.gain.setValueAtTime(s,this.ctx.currentTime),o.gain.exponentialRampToValueAtTime(1e-4,this.ctx.currentTime+i),n.stop(this.ctx.currentTime+i)}play(t){switch(t){case"collect":this.playTone(880,"sine",.1),setTimeout(()=>this.playTone(1760,"sine",.2),50);break;case"click":this.playTone(400,"triangle",.05,.05);break;case"jump":this.resume();const e=this.ctx.createOscillator(),i=this.ctx.createGain();e.frequency.setValueAtTime(150,this.ctx.currentTime),e.frequency.linearRampToValueAtTime(300,this.ctx.currentTime+.2),e.type="square",i.gain.setValueAtTime(.05,this.ctx.currentTime),i.gain.linearRampToValueAtTime(0,this.ctx.currentTime+.2),e.connect(i),i.connect(this.ctx.destination),e.start(),e.stop(this.ctx.currentTime+.2);break;case"win":[523.25,659.25,783.99,1046.5].forEach((s,n)=>setTimeout(()=>this.playTone(s,"sine",.5,.1),n*150));break;case"error":this.playTone(150,"sawtooth",.3,.1),setTimeout(()=>this.playTone(100,"sawtooth",.3,.1),150);break}}}class _{constructor(){r(this,"deltaTime",0);r(this,"elapsedTime",0);r(this,"lastTime",0)}update(t){this.lastTime||(this.lastTime=t),this.deltaTime=(t-this.lastTime)/1e3,this.deltaTime>.1&&(this.deltaTime=.1),this.elapsedTime+=this.deltaTime,this.lastTime=t}}class G{constructor(t,e,i){r(this,"currentState",null);r(this,"renderer");r(this,"input");r(this,"audio");this.renderer=t,this.input=e,this.audio=i}changeState(t){this.currentState&&this.currentState.exit(),this.currentState=t;const e=t.constructor.name;console.log(`Entering State: ${e}`),this.currentState.enter()}update(t){this.currentState&&this.currentState.update(t)}draw(){this.currentState&&this.currentState.draw(this.renderer)}resize(t,e){this.currentState&&this.currentState.resize&&this.currentState.resize(t,e)}}const $="modulepreload",j=function(a){return"/dear-yasmin/"+a},w={},v=function(t,e,i){let s=Promise.resolve();if(e&&e.length>0){document.getElementsByTagName("link");const o=document.querySelector("meta[property=csp-nonce]"),c=(o==null?void 0:o.nonce)||(o==null?void 0:o.getAttribute("nonce"));s=Promise.allSettled(e.map(d=>{if(d=j(d),d in w)return;w[d]=!0;const u=d.endsWith(".css"),f=u?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${f}`))return;const l=document.createElement("link");if(l.rel=u?"stylesheet":$,u||(l.as="script"),l.crossOrigin="",l.href=d,c&&l.setAttribute("nonce",c),document.head.appendChild(l),u)return new Promise((E,M)=>{l.addEventListener("load",E),l.addEventListener("error",()=>M(new Error(`Unable to preload CSS for ${d}`)))})}))}function n(o){const c=new Event("vite:preloadError",{cancelable:!0});if(c.payload=o,window.dispatchEvent(c),!c.defaultPrevented)throw o}return s.then(o=>{for(const c of o||[])c.status==="rejected"&&n(c.reason);return t().catch(n)})};function T(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}class S{static showScreen(t){document.querySelectorAll(".screen").forEach(i=>i.classList.add("hidden"));const e=document.getElementById(t);e&&(e.classList.remove("hidden"),e.style.opacity="1")}static hideScreen(t){const e=document.getElementById(t);e&&e.classList.add("hidden")}static updateHUD(t){const e=document.getElementById("hud-text");e&&(e.innerText=t)}static showModal(t,e,i,s){let n=document.getElementById("modal-overlay");n||(n=document.createElement("div"),n.id="modal-overlay",n.className="modal-backdrop hidden",document.body.appendChild(n));const o=T(t),c=T(i);n.innerHTML=`
            <div class="modal">
                <h2 style="color: var(--primary); margin: 0 0 12px 0;">${o}</h2>
                <img src="${e}" class="img-frame" style="background:gray;" alt="Memory Photo">
                <p style="font-size: 1.1rem; line-height: 1.4; margin-bottom: 24px;">${c}</p>
                <button id="modal-next">Continue ❤️</button>
            </div>
        `,n.classList.remove("hidden");const d=document.getElementById("modal-next");d&&(d.onclick=u=>{u.stopPropagation(),n.classList.add("hidden"),s()})}}class k{constructor(t){r(this,"sm");r(this,"hearts",[]);this.sm=t}enter(){S.showScreen("intro-screen"),this.hearts=[];for(let i=0;i<30;i++)this.hearts.push({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,s:10+Math.random()*30,spd:20+Math.random()*40,off:Math.random()*Math.PI*2});const t=document.getElementById("start-btn");t&&(t.onclick=()=>{this.sm.audio.play("click"),this.sm.audio.startBGM(),v(async()=>{const{Level1State:i}=await import("./level1-CgwaRGFX.js");return{Level1State:i}},[]).then(({Level1State:i})=>{this.sm.changeState(new i(this.sm))})});const e=document.getElementById("admin-trigger");e&&(e.onclick=()=>{this.sm.audio.play("click"),v(async()=>{const{AdminState:i}=await import("./admin-Dv3Rfi3A.js");return{AdminState:i}},[]).then(({AdminState:i})=>{this.sm.changeState(new i(this.sm))})})}update(t){this.hearts.forEach(e=>{e.y-=e.spd*t,e.x+=Math.sin(Date.now()/1e3+e.off)*.5,e.y<-50&&(e.y=window.innerHeight+50,e.x=Math.random()*window.innerWidth)})}draw(t){t.clear("#220510"),t.ctx.globalCompositeOperation="screen",this.hearts.forEach(e=>{const i=1+Math.sin(Date.now()/500+e.off)*.1;t.drawHeart(e.x,e.y,e.s*i,"rgba(255, 64, 129, 0.2)")}),t.ctx.globalCompositeOperation="source-over"}resize(t,e){this.hearts.forEach(i=>{i.x=Math.min(i.x,window.innerWidth),i.y=Math.min(i.y,window.innerHeight)})}exit(){S.hideScreen("intro-screen")}}const O=Object.freeze(Object.defineProperty({__proto__:null,IntroState:k},Symbol.toStringTag,{value:"Module"})),U=`
<!-- Intro -->
<div id="intro-screen" class="screen">
    <div style="text-align:center; animation: popIn 1s;">
        <h1 style="font-size: 3.5rem; margin-bottom: 10px; text-shadow: 0 0 30px #ff4081; line-height: 1;">Dear Yasmin<br><span style="font-size: 1.2rem; color: #ff80ab; font-weight: 300;">A small surprise for the girl who means the world</span></h1>
        <p style="font-size: 1.2rem; margin-bottom: 40px; opacity: 0.8; letter-spacing: 1px;">Made with ❤️ just for you</p>
        <button id="start-btn" style="font-size: 1.4rem; padding: 16px 50px;">Start ❤️</button>
    </div>
    <div style="position: absolute; bottom: 20px; opacity: 0.5; font-size: 0.8rem;">Tap to start - Use headphones for best experience</div>
    <!-- Secret admin button (small corner area) -->
    <div id="admin-trigger" style="position: absolute; top: 10px; right: 10px; width: 30px; height: 30px; cursor: pointer; opacity: 0.3; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;" title="Admin">⚙️</div>
</div>

<!-- Game UI -->
<div id="game-ui" class="screen hidden" style="pointer-events: none; background: transparent; justify-content: space-between;">
    <div id="hud-text" class="hud">Loading...</div>
    
    <div style="width: 100%; height: 100px; display: flex; justify-content: space-between; align-items: center; padding: 0 40px; margin-bottom: 40px;">
        <!-- Visual cues for controls -->
        <div style="width: 60px; height: 60px; border: 2px dashed rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: 0.4;">
            <span style="font-size: 24px;">🕹️</span>
        </div>
         <div style="width: 60px; height: 60px; border: 2px dashed rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: 0.4;">
            <span style="font-size: 24px;">🚀</span>
        </div>
    </div>
</div>

<!-- Code Screen -->
<div id="code-screen" class="screen hidden">
    <h2 style="margin-bottom: 20px; color: var(--primary);">Access Top Secret</h2>
    <div id="code-container" style="display: flex; flex-direction: column; align-items: center;">
        <div id="code-display" style="font-size: 2rem; letter-spacing: 5px; margin-bottom: 30px; min-height: 40px; color: #ff80ab;"></div>
        <div class="keypad">
            <button class="key-btn" data-val="1">1</button>
            <button class="key-btn" data-val="2">2</button>
            <button class="key-btn" data-val="3">3</button>
            <button class="key-btn" data-val="4">4</button>
            <button class="key-btn" data-val="5">5</button>
            <button class="key-btn" data-val="6">6</button>
            <button class="key-btn" data-val="7">7</button>
            <button class="key-btn" data-val="8">8</button>
            <button class="key-btn" data-val="9">9</button>
            <button class="key-btn" data-val="del" style="background: rgba(233, 30, 99, 0.4)">🔙</button>
            <button class="key-btn" data-val="0">0</button>
            <button class="key-btn" data-val="ok" style="background: rgba(76, 175, 80, 0.4)">✅</button>
        </div>
    </div>
</div>

<!-- Slideshow -->
<div id="slideshow-screen" class="screen hidden">
    <div id="slideshow-content" class="interactive" style="display:flex; flex-direction:column; align-items:center; width: 100%; max-width: 500px; padding: 20px;">
        <img id="slide-img" class="img-frame" style="width: 100%; aspect-ratio: 1; transition: opacity 0.5s;">
        <p id="slide-text" style="font-size: 1.3rem; margin: 20px 0; min-height: 60px; text-align: center; color: #fff;"></p>
        <div id="slide-progress" style="opacity: 0.6; margin-bottom: 20px; font-size: 0.9rem;"></div>
        
        <div style="display: flex; gap: 20px; margin-bottom: 20px; width: 100%; justify-content: center;">
            <button id="slide-prev" style="padding: 10px 20px;">Prev</button>
            <button id="slide-next" style="padding: 10px 20px;">Next</button>
        </div>
         <button id="slide-finish" class="hidden" style="background: #4caf50; width: 100%; margin-top: 10px; animation: popIn 0.5s;">Start Final Mission 🚀</button>
    </div>
</div>

<!-- Final -->
<div id="final-screen" class="screen hidden" style="text-align: center;">
    <h1 style="font-size: 3rem; margin-bottom: 20px; text-shadow: 0 0 20px #ff4081;">Mission Accomplished!</h1>
    <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 20px; margin: 0 20px 40px 20px; backdrop-filter: blur(5px);">
        <p id="final-message-text" style="font-size: 1.4rem; white-space: pre-wrap; line-height: 1.6;"></p>
    </div>
    <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
        <button id="copy-btn" class="interactive">Share Link 🔗</button>
        <button id="replay-btn" class="interactive" style="background: transparent; border: 2px solid white;">Replay ↺</button>
    </div>
</div>

<!-- Admin -->
<div id="admin-screen" class="screen hidden">
    <div style="width: 100%; max-width: 600px; padding: 20px; display: flex; flex-direction: column; height: 100%; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: var(--primary);">Admin Panel 🎛️</h2>
            <button id="admin-back" style="padding: 8px 16px; font-size: 0.9rem;">Back</button>
        </div>

        <!-- Photos Section -->
        <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="margin: 0; font-size: 1.1rem;">📸 Photos (${h.memories.length} default)</h3>
                <button id="admin-add-photo" style="padding: 8px 16px; font-size: 0.9rem;">+ Add Photos</button>
                <input type="file" id="admin-photo-input" accept="image/*,.heic,.heif" multiple style="display: none;">
            </div>
            <div id="admin-photo-list" style="max-height: 200px; overflow-y: auto;">
                <p style="color: #888; text-align: center;">Loading...</p>
            </div>
        </div>

        <!-- Audio Section -->
        <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="margin: 0; font-size: 1.1rem;">🎵 Background Music</h3>
                <button id="admin-add-audio" style="padding: 8px 16px; font-size: 0.9rem;">+ Add Audio</button>
                <input type="file" id="admin-audio-input" accept="audio/*" style="display: none;">
            </div>
            <div id="admin-audio-info">
                <p style="color: #888; text-align: center;">Loading...</p>
            </div>
        </div>

        <!-- Preview Section -->
        <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 16px; flex: 1;">
            <h3 style="margin: 0 0 12px 0; font-size: 1.1rem;">👁️ Preview</h3>
            <div id="admin-preview">
                <p style="color: #888; text-align: center;">Loading...</p>
            </div>
        </div>

        <!-- Reset -->
        <button id="admin-reset" style="background: #e91e63; margin-top: auto;">Reset to Defaults ↺</button>
    </div>
</div>
`,A=document.getElementById("ui-layer");A&&(A.innerHTML=U);try{const a=new P("game-canvas"),t=new L,e=new z,i=new _,s=new G(a,t,e);window.addEventListener("resize",()=>{s.resize(a.width,a.height)}),h.loadCustomContent().then(()=>{console.log("Custom content loaded:",h.memories.length,"photos,",h.useCustomBGM?"custom BGM":"default BGM"),h.useCustomBGM&&e.setupBGM(),s.changeState(new k(s));const n=o=>{requestAnimationFrame(n),i.update(o);const c=Math.min(i.deltaTime,.05);s.update(c),s.draw()};requestAnimationFrame(n),console.log("Game Initialized!")})}catch(a){console.error("Initialization Failed:",a),document.body.innerHTML=`<h1 style="color:white; text-align:center; margin-top: 50px;">Sorry, something went wrong :(</h1><p style="color:#aaa; text-align:center;">${a}</p>`}export{h as G,S as U,v as _,O as i,y as s};
