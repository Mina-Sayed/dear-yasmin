import { Renderer } from "../engine/renderer";
import { InputManager } from "../engine/input";
import { AudioManager } from "../engine/audio";

export interface State {
    enter(): void;
    update(dt: number): void;
    draw(renderer: Renderer): void;
    exit(): void;
    resize?(w: number, h: number): void;
}

export class StateMachine {
    currentState: State | null = null;
    renderer: Renderer;
    input: InputManager;
    audio: AudioManager;

    constructor(renderer: Renderer, input: InputManager, audio: AudioManager) {
        this.renderer = renderer;
        this.input = input;
        this.audio = audio;
    }

    changeState(newState: State) {
        if (this.currentState) this.currentState.exit();
        this.currentState = newState;
        const stateName = (newState as any).constructor.name;
        console.log(`Entering State: ${stateName}`);
        this.currentState.enter();
    }

    update(dt: number) {
        if (this.currentState) this.currentState.update(dt);
    }

    draw() {
        if (this.currentState) this.currentState.draw(this.renderer);
    }

    resize(w: number, h: number) {
        if (this.currentState && this.currentState.resize) {
            this.currentState.resize(w, h);
        }
    }
}
