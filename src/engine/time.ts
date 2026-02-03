export class Time {
    deltaTime: number = 0;
    elapsedTime: number = 0;
    private lastTime: number = 0;

    update(currentTime: number) {
        if (!this.lastTime) this.lastTime = currentTime;
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        // Clamp delta time to avoid huge leaps
        if (this.deltaTime > 0.1) this.deltaTime = 0.1;
        this.elapsedTime += this.deltaTime;
        this.lastTime = currentTime;
    }
}
