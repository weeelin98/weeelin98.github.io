// Scene time is independent of UI time: pausing cannot freeze camera flights or
// lighting transitions, and resuming never replays time spent paused/hidden.
export class SimulationClock {
  constructor(now=performance.now()){this.previous=now;this.time=0;this.paused=false;}
  rebase(now=performance.now()){this.previous=now;}
  tick(now){
    const wallDelta=Math.max(0,Math.min((now-this.previous)/1000,.05));
    this.previous=now;
    const delta=this.paused?0:wallDelta;
    this.time+=delta;
    return {wallDelta,delta,time:this.time};
  }
}
