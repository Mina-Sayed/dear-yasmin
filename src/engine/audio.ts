import { GameData } from "../content";
import { resolveAssetPath } from "./assetPath";

const BGM_AUTOPLAY_KEY = "lq_bgm_autoplay";

export class AudioManager {
    ctx: AudioContext;
    bgm: HTMLAudioElement | null = null;
    private unlockHandlerBound = false;

    constructor() {
        // Handle browser autoplay policy
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Setup BGM (will be updated when GameData is loaded)
        this.setupBGM();
    }

    setupBGM() {
        // Clean up existing BGM
        if (this.bgm) {
            this.bgm.pause();
            this.bgm = null;
        }

        // Use custom BGM if available
        const bgmUrl = GameData.useCustomBGM && GameData.customBGMUrl 
            ? GameData.customBGMUrl 
            : resolveAssetPath('assets/bgm.mp3');
        
        this.bgm = new Audio(bgmUrl);
        this.bgm.loop = true;
        this.bgm.volume = 0.5;
    }

    private rememberAutoplayPreference() {
        try {
            localStorage.setItem(BGM_AUTOPLAY_KEY, "1");
        } catch {
            // Ignore storage restrictions.
        }
    }

    private shouldAutoplayFromPreference(): boolean {
        try {
            return localStorage.getItem(BGM_AUTOPLAY_KEY) === "1";
        } catch {
            return false;
        }
    }

    private bindUnlockToRetryBGM() {
        if (this.unlockHandlerBound) return;
        this.unlockHandlerBound = true;

        const onUserInteract = () => {
            this.resume();
            this.playBGM(false, false);
            window.removeEventListener("pointerdown", onUserInteract);
            window.removeEventListener("touchstart", onUserInteract);
            window.removeEventListener("keydown", onUserInteract);
            this.unlockHandlerBound = false;
        };

        window.addEventListener("pointerdown", onUserInteract, { once: true });
        window.addEventListener("touchstart", onUserInteract, { once: true });
        window.addEventListener("keydown", onUserInteract, { once: true });
    }

    private playBGM(restart: boolean, rememberPreference: boolean) {
        // Re-setup BGM in case GameData was updated
        if (GameData.useCustomBGM && this.bgm?.src !== GameData.customBGMUrl) {
            this.setupBGM();
        }

        if (rememberPreference) {
            this.rememberAutoplayPreference();
        }

        if (this.bgm) {
            if (restart) this.bgm.currentTime = 0;
            this.bgm.play().catch((e) => {
                console.log("Audio autoplay blocked until interaction", e);
                this.bindUnlockToRetryBGM();
            });
        }
    }

    startBGM() {
        this.playBGM(true, true);
    }

    tryAutoplayBGM() {
        if (!this.shouldAutoplayFromPreference()) return;
        this.playBGM(false, false);
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(console.error);
        }
    }

    playTone(freq: number, type: OscillatorType = 'sine', duration: number = 0.1, vol: number = 0.1) {
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.type = type;

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.stop(this.ctx.currentTime + duration);
    }

    play(name: 'collect' | 'click' | 'jump' | 'win' | 'error') {
        switch (name) {
            case 'collect':
                this.playTone(880, 'sine', 0.1); // High ping
                setTimeout(() => this.playTone(1760, 'sine', 0.2), 50);
                break;
            case 'click':
                this.playTone(400, 'triangle', 0.05, 0.05);
                break;
            case 'jump':
                // Slide pitch up
                this.resume();
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.frequency.setValueAtTime(150, this.ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 0.2);
                osc.type = 'square';
                gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.2);
                break;
            case 'win':
                [523.25, 659.25, 783.99, 1046.50].forEach((f, i) =>
                    setTimeout(() => this.playTone(f, 'sine', 0.5, 0.1), i * 150)
                );
                break;
            case 'error':
                this.playTone(150, 'sawtooth', 0.3, 0.1);
                setTimeout(() => this.playTone(100, 'sawtooth', 0.3, 0.1), 150);
                break;
        }
    }
}
