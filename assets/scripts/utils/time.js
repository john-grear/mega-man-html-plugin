export default class Time {
    static lastTime = performance.now();
    static deltaTime = 0;

    // Calculate deltaTime every frame
    static update() {
        const currentTime = performance.now()
        this.deltaTime = (currentTime - this.lastTime) / 1000
        this.lastTime = currentTime
    }

    static getDeltaTime() {
        return this.deltaTime;
    }
}