import { State, StateMachine } from "./stateMachine";
import { UIManager } from "../ui/ui";
import { Renderer } from "../engine/renderer";
import { GameData } from "../content";

export class SlideshowState implements State {
    sm: StateMachine;
    currentIndex = 0;
    timer = 0;
    slideDuration = 5; // seconds
    paused = false;
    private pendingSlideIndex: number | null = null;
    private eventListeners: { el: HTMLElement; type: string; handler: EventListener }[] = [];

    constructor(sm: StateMachine) {
        this.sm = sm;
    }

    enter() {
        UIManager.showScreen('slideshow-screen');
        this.currentIndex = 0;
        this.showSlide(0);
        this.eventListeners = [];

        const nextBtn = document.getElementById('slide-next');
        const prevBtn = document.getElementById('slide-prev');
        const finishBtn = document.getElementById('slide-finish');
        const container = document.getElementById('slideshow-content');

        if (nextBtn) {
            const handler = () => { this.timer = 0; this.nextSlide(); };
            nextBtn.addEventListener('click', handler);
            this.eventListeners.push({ el: nextBtn, type: 'click', handler });
        } else {
            console.warn('Slideshow: nextBtn not found');
        }

        if (prevBtn) {
            const handler = () => { this.timer = 0; this.prevSlide(); };
            prevBtn.addEventListener('click', handler);
            this.eventListeners.push({ el: prevBtn, type: 'click', handler });
        } else {
            console.warn('Slideshow: prevBtn not found');
        }

        if (finishBtn) {
            const handler = () => {
                import('./level2.ts').then(({ Level2State }) => {
                    this.sm.changeState(new Level2State(this.sm));
                });
            };
            finishBtn.addEventListener('click', handler);
            this.eventListeners.push({ el: finishBtn, type: 'click', handler });
        } else {
            console.warn('Slideshow: finishBtn not found');
        }

        if (container) {
            const touchStartHandler = () => this.paused = true;
            const touchEndHandler = () => this.paused = false;
            container.addEventListener('touchstart', touchStartHandler);
            container.addEventListener('touchend', touchEndHandler);
            container.addEventListener('mouseenter', touchStartHandler);
            container.addEventListener('mouseleave', touchEndHandler);
            this.eventListeners.push(
                { el: container, type: 'touchstart', handler: touchStartHandler },
                { el: container, type: 'touchend', handler: touchEndHandler },
                { el: container, type: 'mouseenter', handler: touchStartHandler },
                { el: container, type: 'mouseleave', handler: touchEndHandler }
            );
        }
    }

    showSlide(idx: number) {
        if (idx < 0) idx = GameData.memories.length - 1;
        if (idx >= GameData.memories.length) idx = 0;
        this.currentIndex = idx;
        this.pendingSlideIndex = idx;

        const m = GameData.memories[idx];
        const img = document.getElementById('slide-img') as HTMLImageElement;
        const txt = document.getElementById('slide-text');
        const progress = document.getElementById('slide-progress');

        if (img) {
            // Clear previous handlers to prevent stale callbacks
            img.onload = null;
            img.onerror = null;
            img.style.opacity = '0';
            
            setTimeout(() => {
                // Check if slide changed during timeout
                if (this.pendingSlideIndex !== idx) return;
                
                img.onload = () => {
                    if (this.pendingSlideIndex === idx) img.style.opacity = '1';
                };
                // Handle error
                img.onerror = () => {
                    if (this.pendingSlideIndex !== idx) return;
                    img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNkZGQiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzU1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='; 
                    img.style.opacity = '1'; 
                };
                
                // Set src after handlers are attached
                img.src = m.img;
            }, 200);
        }
        if (txt) txt.innerText = m.text;
        if (progress) progress.innerText = `${idx + 1} / ${GameData.memories.length}`;

        // Show "Finish" button if last slide
        const btn = document.getElementById('slide-finish');
        if (btn) {
            if (idx === GameData.memories.length - 1) {
                btn.classList.remove('hidden');
                btn.style.display = 'block';
            } else {
                btn.classList.add('hidden');
                btn.style.display = 'none';
            }
        }
    }

    nextSlide() {
        // If at end, just loop or stop? Loop is better for slideshow.
        // But if button is there, maybe stop logic.
        this.showSlide(this.currentIndex + 1);
    }
    prevSlide() {
        this.showSlide(this.currentIndex - 1);
    }

    update(dt: number) {
        if (!this.paused) {
            this.timer += dt;
            if (this.timer > this.slideDuration) {
                this.timer = 0;
                // If last slide, don't auto loop instantly, give time to see button
                if (this.currentIndex < GameData.memories.length - 1) {
                    this.nextSlide();
                }
            }
        }
    }

    draw(r: Renderer) {
        r.clear('#000');
    }

    resize(_w: number, _h: number) {
        // No canvas elements to resize, UI handles itself
    }

    exit() {
        // Clean up all event listeners
        this.eventListeners.forEach(({ el, type, handler }) => {
            el.removeEventListener(type, handler);
        });
        this.eventListeners = [];
        UIManager.hideScreen('slideshow-screen');
    }
}
