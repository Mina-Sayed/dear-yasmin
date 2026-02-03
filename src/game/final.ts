import { State, StateMachine } from "./stateMachine";
import { UIManager } from "../ui/ui";
import { Renderer } from "../engine/renderer";
import { GameData } from "../content";

export class FinalState implements State {
    sm: StateMachine;
    hearts: { x: number, y: number, s: number, spd: number }[] = [];

    constructor(sm: StateMachine) {
        this.sm = sm;
    }

    enter() {
        UIManager.showScreen('final-screen');
        const msg = document.getElementById('final-message-text');
        if (msg) msg.innerText = GameData.finalMessage;

        const copyBtn = document.getElementById('copy-btn');
        if (copyBtn) {
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    const original = copyBtn.innerText;
                    copyBtn.innerText = "Link Copied! ❤️";
                    setTimeout(() => copyBtn.innerText = original, 2000);
                });
            };
        }

        const replayBtn = document.getElementById('replay-btn');
        if (replayBtn) replayBtn.onclick = () => window.location.reload();

        // Init floating hearts
        for (let i = 0; i < 50; i++) {
            this.hearts.push({
                x: Math.random() * window.innerWidth,
                y: window.innerHeight + Math.random() * 500,
                s: 10 + Math.random() * 30,
                spd: 50 + Math.random() * 100
            });
        }
    }

    update(dt: number) {
        this.hearts.forEach(h => {
            h.y -= h.spd * dt;
            if (h.y < -50) {
                h.y = window.innerHeight + 50;
                h.x = Math.random() * window.innerWidth;
            }
        });
    }

    draw(r: Renderer) {
        r.clear('#2a0510');
        r.ctx.globalCompositeOperation = 'lighter';
        this.hearts.forEach(h => {
            r.drawHeart(h.x, h.y, h.s, 'rgba(255, 64, 129, 0.4)');
        });
        r.ctx.globalCompositeOperation = 'source-over';
    }

    resize(_w: number, _h: number) {
        // Re-distribute hearts for new screen size
        this.hearts.forEach(h => {
            h.x = Math.min(h.x, window.innerWidth);
            if (h.y > window.innerHeight + 500) {
                h.y = window.innerHeight + Math.random() * 500;
            }
        });
    }

    exit() {
        UIManager.hideScreen('final-screen');
    }
}
