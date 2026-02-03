import { State, StateMachine } from "./stateMachine";
import { UIManager } from "../ui/ui";
import { Renderer } from "../engine/renderer";
import { GameData } from "../content";

export class CodeState implements State {
    sm: StateMachine;
    currentInput = "";
    private keyHandlers: { el: HTMLElement; handler: (e: MouseEvent) => void }[] = [];

    constructor(sm: StateMachine) {
        this.sm = sm;
    }

    enter() {
        UIManager.showScreen('code-screen');
        this.currentInput = "";
        this.updateDisplay();
        this.keyHandlers = [];

        const keys = document.querySelectorAll('.key-btn');
        keys.forEach(k => {
            const handler = (e: MouseEvent) => {
                const val = (e.target as HTMLElement).getAttribute('data-val');
                if (!val) return;

                if (val === 'del') {
                    this.currentInput = this.currentInput.slice(0, -1);
                } else if (val === 'ok') {
                    this.checkCode();
                } else {
                    if (this.currentInput.length < 8) this.currentInput += val;
                }
                this.sm.audio.play('click');
                this.updateDisplay();
            };
            (k as HTMLElement).onclick = handler;
            this.keyHandlers.push({ el: k as HTMLElement, handler });
        });
    }

    updateDisplay() {
        const disp = document.getElementById('code-display');
        if (disp) {
            // Mask with hearts
            let text = "";
            for (let i = 0; i < this.currentInput.length; i++) text += "❤️";
            if (this.currentInput.length === 0) text = "Enter Secret Code";
            disp.innerText = text;
        }
    }

    checkCode() {
        if (this.currentInput === GameData.secretCode) {
            this.sm.audio.play('win');
            // Transition
            import('./slideshow.ts').then(({ SlideshowState }) => {
                this.sm.changeState(new SlideshowState(this.sm));
            });
        } else {
            this.sm.audio.play('error');
            const box = document.getElementById('code-container');
            if (box) {
                box.classList.remove('shake');
                void box.offsetWidth; // trigger reflow
                box.classList.add('shake');
            }
            this.currentInput = "";
            setTimeout(() => this.updateDisplay(), 500);
        }
    }

    update(_dt: number) { }

    draw(r: Renderer) {
        r.clear('#111');
        // Subtle gradient drawn via canvas usually looks better than CSS for bg dynamics
        // But we can stick to clean black for focus
    }

    resize(_w: number, _h: number) {
        // No canvas elements to resize, UI handles itself
    }

    exit() {
        // Clean up event handlers to prevent accumulation
        this.keyHandlers.forEach(({ el }) => {
            el.onclick = null;
        });
        this.keyHandlers = [];
        UIManager.hideScreen('code-screen');
    }
}
