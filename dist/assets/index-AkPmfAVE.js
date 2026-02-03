(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=class{canvas;ctx;width=0;height=0;constructor(e){if(this.canvas=document.getElementById(e),!this.canvas)throw Error(`Canvas not found`);let t=this.canvas.getContext(`2d`,{alpha:!0});if(!t)throw Error(`2D context not supported`);this.ctx=t,this.resize(),window.addEventListener(`resize`,()=>this.resize())}resize(){let e=Math.min(window.devicePixelRatio||1,2);this.width=window.innerWidth,this.height=window.innerHeight,this.canvas.width=this.width*e,this.canvas.height=this.height*e,this.canvas.style.width=`${this.width}px`,this.canvas.style.height=`${this.height}px`,this.ctx.scale(e,e)}clear(e=`rgba(0,0,0,0)`){this.ctx.fillStyle=e,e===`rgba(0,0,0,0)`||e===`transparent`?this.ctx.clearRect(0,0,this.width,this.height):this.ctx.fillRect(0,0,this.width,this.height)}drawHeart(e,t,n,r){this.ctx.fillStyle=r,this.ctx.beginPath();let i=n*.3;this.ctx.moveTo(e,t+i),this.ctx.bezierCurveTo(e,t,e-n/2,t,e-n/2,t+i),this.ctx.bezierCurveTo(e-n/2,t+(n+i)/2,e,t+(n+i)/2,e,t+n),this.ctx.bezierCurveTo(e,t+(n+i)/2,e+n/2,t+(n+i)/2,e+n/2,t+i),this.ctx.bezierCurveTo(e+n/2,t,e,t,e,t+i),this.ctx.fill(),this.ctx.closePath()}},t=class{keys={};joystick={x:0,y:0,active:!1};actionPressed=!1;dragStart=null;touchId=null;actionTouchId=null;constructor(){this.startListening()}startListening(){window.addEventListener(`keydown`,e=>this.keys[e.code]=!0),window.addEventListener(`keyup`,e=>this.keys[e.code]=!1),document.body.addEventListener(`touchstart`,e=>{e.target.tagName===`CANVAS`&&e.preventDefault()},{passive:!1}),window.addEventListener(`touchstart`,e=>this.handleTouchStart(e),{passive:!1}),window.addEventListener(`touchmove`,e=>this.handleTouchMove(e),{passive:!1}),window.addEventListener(`touchend`,e=>this.handleTouchEnd(e))}handleTouchStart(e){for(let t=0;t<e.changedTouches.length;t++){let n=e.changedTouches[t],r=n.clientY>window.innerHeight*.4;r&&n.clientX<window.innerWidth/2?this.touchId===null&&(this.touchId=n.identifier,this.dragStart={x:n.clientX,y:n.clientY},this.joystick.active=!0):r&&this.actionTouchId===null&&(this.actionTouchId=n.identifier,this.actionPressed=!0,this.keys.Space=!0)}}handleTouchMove(e){if(this.touchId!==null)for(let t=0;t<e.changedTouches.length;t++){let n=e.changedTouches[t];if(n.identifier===this.touchId&&this.dragStart){let e=n.clientX-this.dragStart.x,t=n.clientY-this.dragStart.y,r=Math.sqrt(e*e+t*t),i=Math.atan2(t,e);r>60&&(r=60),this.joystick.x=Math.cos(i)*(r/60),this.joystick.y=Math.sin(i)*(r/60)}}}handleTouchEnd(e){for(let t=0;t<e.changedTouches.length;t++){let n=e.changedTouches[t];n.identifier===this.touchId&&(this.touchId=null,this.dragStart=null,this.joystick={x:0,y:0,active:!1}),n.identifier===this.actionTouchId&&(this.actionTouchId=null,this.actionPressed=!1,this.keys.Space=!1)}}getAxis(){if(this.joystick.active)return{...this.joystick};let e=0,t=0;if((this.keys.KeyW||this.keys.ArrowUp)&&--t,(this.keys.KeyS||this.keys.ArrowDown)&&(t+=1),(this.keys.KeyA||this.keys.ArrowLeft)&&--e,(this.keys.KeyD||this.keys.ArrowRight)&&(e+=1),e!==0||t!==0){let n=Math.sqrt(e*e+t*t);e/=n,t/=n}return{x:e,y:t}}},n=`LoveQuestStorage`,r=1,i=`assets`,a=`config`;const o=new class{db=null;objectUrls=[];async init(){return new Promise((e,t)=>{let o=indexedDB.open(n,r);o.onerror=()=>t(o.error),o.onsuccess=()=>{this.db=o.result,e()},o.onupgradeneeded=e=>{let t=e.target.result;t.objectStoreNames.contains(i)||t.createObjectStore(i,{keyPath:`id`}),t.objectStoreNames.contains(a)||t.createObjectStore(a,{keyPath:`key`})}})}async saveAsset(e,t,n,r,a){if(!this.db)throw Error(`Storage not initialized`);await this.deleteAsset(e);let o=URL.createObjectURL(r),s={id:e,type:t,name:n,data:r,text:a,createdAt:Date.now()};return new Promise((e,t)=>{let n=this.db.transaction([i],`readwrite`).objectStore(i).put(s);n.onsuccess=()=>{this.objectUrls.push(o),e({...s,url:o})},n.onerror=()=>t(n.error)})}async getAsset(e){if(!this.db)throw Error(`Storage not initialized`);return new Promise((t,n)=>{let r=this.db.transaction([i],`readonly`).objectStore(i).get(e);r.onsuccess=()=>{let e=r.result;if(e){let n=URL.createObjectURL(e.data);this.objectUrls.push(n),t({...e,url:n})}else t(null)},r.onerror=()=>n(r.error)})}async getAllAssets(e){if(!this.db)throw Error(`Storage not initialized`);return new Promise((t,n)=>{let r=this.db.transaction([i],`readonly`).objectStore(i).getAll();r.onsuccess=()=>{let n=r.result.map(e=>{let t=URL.createObjectURL(e.data);return this.objectUrls.push(t),{...e,url:t}});t(e?n.filter(t=>t.type===e):n)},r.onerror=()=>n(r.error)})}async updatePhotoText(e,t){if(!this.db)throw Error(`Storage not initialized`);return new Promise((n,r)=>{let a=this.db.transaction([i],`readwrite`).objectStore(i),o=a.get(e);o.onsuccess=()=>{let e=o.result;if(!e){r(Error(`Asset not found`));return}e.text=t;let i=a.put(e);i.onsuccess=()=>n(),i.onerror=()=>r(i.error)},o.onerror=()=>r(o.error)})}async deleteAsset(e){if(!this.db)throw Error(`Storage not initialized`);let t=await this.getAsset(e);return t?.url&&URL.revokeObjectURL(t.url),new Promise((t,n)=>{let r=this.db.transaction([i],`readwrite`).objectStore(i).delete(e);r.onsuccess=()=>t(),r.onerror=()=>n(r.error)})}async setConfig(e,t){if(!this.db)throw Error(`Storage not initialized`);return new Promise((n,r)=>{let i=this.db.transaction([a],`readwrite`).objectStore(a).put({key:e,value:t});i.onsuccess=()=>n(),i.onerror=()=>r(i.error)})}async getConfig(e){if(!this.db)throw Error(`Storage not initialized`);return new Promise((t,n)=>{let r=this.db.transaction([a],`readonly`).objectStore(a).get(e);r.onsuccess=()=>{let e=r.result;t(e?.value)},r.onerror=()=>n(r.error)})}cleanup(){this.objectUrls.forEach(e=>URL.revokeObjectURL(e)),this.objectUrls=[]}},s=[{id:1,text:`Our first date at the coffee shop ☕`,img:`/assets/photos/p1.jpg`},{id:2,text:`The trip to the beach 🌊`,img:`/assets/photos/p2.jpg`},{id:3,text:`Your graduation day 🎓`,img:`/assets/photos/p3.jpg`},{id:4,text:`That time we got lost hiking 🏔️`,img:`/assets/photos/p4.jpg`},{id:5,text:`Cooking dinner together 🍝`,img:`/assets/photos/p5.jpg`}],c={heroName:`Yasmin`,secretCode:`2024`,finalMessage:`Happy Anniversary my love! ❤️
Here's to many more adventures together.`,memories:[...s],level2StarsToWin:10,useCustomBGM:!1,customBGMUrl:null,async loadCustomContent(){try{await o.init();let e=await o.getAllAssets(`photo`);e.length>0?this.memories=e.map((e,t)=>({id:t+1,text:e.text||s[t]?.text||`Memory ${t+1} ❤️`,img:e.url})):this.memories=[...s];let t=await o.getConfig(`useCustomBGM`),n=await o.getAllAssets(`audio`);t&&n.length>0?(this.useCustomBGM=!0,this.customBGMUrl=n[0].url):(this.useCustomBGM=!1,this.customBGMUrl=null)}catch(e){console.error(`Failed to load custom content:`,e),this.memories=[...s]}},resetToDefaults(){this.memories=[...s],this.useCustomBGM=!1,this.customBGMUrl=null}};var l=class{ctx;bgm=null;constructor(){this.ctx=new(window.AudioContext||window.webkitAudioContext),this.setupBGM()}setupBGM(){this.bgm&&=(this.bgm.pause(),null);let e=c.useCustomBGM&&c.customBGMUrl?c.customBGMUrl:`/assets/bgm.mp3`;this.bgm=new Audio(e),this.bgm.loop=!0,this.bgm.volume=.5}startBGM(){c.useCustomBGM&&this.bgm?.src!==c.customBGMUrl&&this.setupBGM(),this.bgm&&(this.bgm.currentTime=0,this.bgm.play().catch(e=>console.log(`Audio autoplay blocked until interaction`,e)))}resume(){this.ctx.state===`suspended`&&this.ctx.resume().catch(console.error)}playTone(e,t=`sine`,n=.1,r=.1){this.resume();let i=this.ctx.createOscillator(),a=this.ctx.createGain();i.frequency.setValueAtTime(e,this.ctx.currentTime),i.type=t,i.connect(a),a.connect(this.ctx.destination),i.start(),a.gain.setValueAtTime(r,this.ctx.currentTime),a.gain.exponentialRampToValueAtTime(1e-4,this.ctx.currentTime+n),i.stop(this.ctx.currentTime+n)}play(e){switch(e){case`collect`:this.playTone(880,`sine`,.1),setTimeout(()=>this.playTone(1760,`sine`,.2),50);break;case`click`:this.playTone(400,`triangle`,.05,.05);break;case`jump`:this.resume();let e=this.ctx.createOscillator(),t=this.ctx.createGain();e.frequency.setValueAtTime(150,this.ctx.currentTime),e.frequency.linearRampToValueAtTime(300,this.ctx.currentTime+.2),e.type=`square`,t.gain.setValueAtTime(.05,this.ctx.currentTime),t.gain.linearRampToValueAtTime(0,this.ctx.currentTime+.2),e.connect(t),t.connect(this.ctx.destination),e.start(),e.stop(this.ctx.currentTime+.2);break;case`win`:[523.25,659.25,783.99,1046.5].forEach((e,t)=>setTimeout(()=>this.playTone(e,`sine`,.5,.1),t*150));break;case`error`:this.playTone(150,`sawtooth`,.3,.1),setTimeout(()=>this.playTone(100,`sawtooth`,.3,.1),150);break}}},u=class{deltaTime=0;elapsedTime=0;lastTime=0;update(e){this.lastTime||=e,this.deltaTime=(e-this.lastTime)/1e3,this.deltaTime>.1&&(this.deltaTime=.1),this.elapsedTime+=this.deltaTime,this.lastTime=e}},d=class{currentState=null;renderer;input;audio;constructor(e,t,n){this.renderer=e,this.input=t,this.audio=n}changeState(e){this.currentState&&this.currentState.exit(),this.currentState=e;let t=e.constructor.name;console.log(`Entering State: ${t}`),this.currentState.enter()}update(e){this.currentState&&this.currentState.update(e)}draw(){this.currentState&&this.currentState.draw(this.renderer)}resize(e,t){this.currentState&&this.currentState.resize&&this.currentState.resize(e,t)}};function f(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}var p=class{static showScreen(e){document.querySelectorAll(`.screen`).forEach(e=>e.classList.add(`hidden`));let t=document.getElementById(e);t&&(t.classList.remove(`hidden`),t.style.opacity=`1`)}static hideScreen(e){let t=document.getElementById(e);t&&t.classList.add(`hidden`)}static updateHUD(e){let t=document.getElementById(`hud-text`);t&&(t.innerText=e)}static showModal(e,t,n,r){let i=document.getElementById(`modal-overlay`);i||(i=document.createElement(`div`),i.id=`modal-overlay`,i.className=`modal-backdrop hidden`,document.body.appendChild(i)),i.innerHTML=`
            <div class="modal">
                <h2 style="color: var(--primary); margin: 0 0 12px 0;">${f(e)}</h2>
                <img src="${t}" class="img-frame" style="background:gray;" alt="Memory Photo">
                <p style="font-size: 1.1rem; line-height: 1.4; margin-bottom: 24px;">${f(n)}</p>
                <button id="modal-next">Continue ❤️</button>
            </div>
        `,i.classList.remove(`hidden`);let a=document.getElementById(`modal-next`);a&&(a.onclick=e=>{e.stopPropagation(),i.classList.add(`hidden`),r()})}},m=`modulepreload`,h=function(e){return`/dear-yasmin/`+e},g={};const _=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=h(t,n),t in g)return;g[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:m,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})};var v=class{sm;hearts=[];constructor(e){this.sm=e}enter(){p.showScreen(`intro-screen`),this.hearts=[];for(let e=0;e<30;e++)this.hearts.push({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,s:10+Math.random()*30,spd:20+Math.random()*40,off:Math.random()*Math.PI*2});let e=document.getElementById(`start-btn`);e&&(e.onclick=()=>{this.sm.audio.play(`click`),this.sm.audio.startBGM(),_(async()=>{let{Level1State:e}=await import(`./level1-DdkMi1RV.js`);return{Level1State:e}},[]).then(({Level1State:e})=>{this.sm.changeState(new e(this.sm))})});let t=document.getElementById(`admin-trigger`);t&&(t.onclick=()=>{this.sm.audio.play(`click`),_(async()=>{let{AdminState:e}=await import(`./admin-aNehGhjt.js`);return{AdminState:e}},[]).then(({AdminState:e})=>{this.sm.changeState(new e(this.sm))})})}update(e){this.hearts.forEach(t=>{t.y-=t.spd*e,t.x+=Math.sin(Date.now()/1e3+t.off)*.5,t.y<-50&&(t.y=window.innerHeight+50,t.x=Math.random()*window.innerWidth)})}draw(e){e.clear(`#220510`),e.ctx.globalCompositeOperation=`screen`,this.hearts.forEach(t=>{let n=1+Math.sin(Date.now()/500+t.off)*.1;e.drawHeart(t.x,t.y,t.s*n,`rgba(255, 64, 129, 0.2)`)}),e.ctx.globalCompositeOperation=`source-over`}resize(e,t){this.hearts.forEach(e=>{e.x=Math.min(e.x,window.innerWidth),e.y=Math.min(e.y,window.innerHeight)})}exit(){p.hideScreen(`intro-screen`)}},y=`
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
                <h3 style="margin: 0; font-size: 1.1rem;">📸 Photos (${c.memories.length} default)</h3>
                <button id="admin-add-photo" style="padding: 8px 16px; font-size: 0.9rem;">+ Add Photos</button>
                <input type="file" id="admin-photo-input" accept="image/*" multiple style="display: none;">
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
`,b=document.getElementById(`ui-layer`);b&&(b.innerHTML=y);try{let n=new e(`game-canvas`),r=new t,i=new l,a=new u,o=new d(n,r,i);window.addEventListener(`resize`,()=>{o.resize(n.width,n.height)}),c.loadCustomContent().then(()=>{console.log(`Custom content loaded:`,c.memories.length,`photos,`,c.useCustomBGM?`custom BGM`:`default BGM`),c.useCustomBGM&&i.setupBGM(),o.changeState(new v(o));let e=t=>{requestAnimationFrame(e),a.update(t);let n=Math.min(a.deltaTime,.05);o.update(n),o.draw()};requestAnimationFrame(e),console.log(`Game Initialized!`)})}catch(e){console.error(`Initialization Failed:`,e),document.body.innerHTML=`<h1 style="color:white; text-align:center; margin-top: 50px;">Sorry, something went wrong :(</h1><p style="color:#aaa; text-align:center;">${e}</p>`}export{o as a,c as i,_ as n,p as r,v as t};