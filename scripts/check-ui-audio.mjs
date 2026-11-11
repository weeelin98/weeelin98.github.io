import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../src/dock-audio.js',import.meta.url),'utf8').replaceAll('import.meta.env.BASE_URL',"'/'");
const {createDockAudio}=await import(`data:text/javascript,${encodeURIComponent(source)}`);
const events=[];
globalThis.document={hidden:false,addEventListener(){}};
globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
class AudioContext {
 state='running';currentTime=0;destination={};
 async decodeAudioData(){return {duration:.03};}
 createGain(){return {gain:{cancelScheduledValues(){},setTargetAtTime(){},setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}};}
 createBufferSource(){return {connect(){},disconnect(){},stop(){},start(){events.push('started');setTimeout(()=>{events.push('ended');this.onended();},30);}};}
}
globalThis.window={AudioContext};
const dock={dataset:{}},sounds=createDockAudio(dock);
const first=sounds.activate(()=>events.push('navigate'));
const second=sounds.activate(()=>events.push('duplicate'));
sounds.hover();
await Promise.all([first,second]);
assert.deepEqual(events,['started','ended','navigate'],'navigation waits for pop; duplicate clicks and hover cannot interrupt it');
assert.equal(dock.dataset.clickSoundCompleted,'1');
assert.equal(dock.dataset.lastSound,'click');
document.hidden=true;
await sounds.activate(()=>events.push('silent-navigation'));
assert.equal(events.at(-1),'silent-navigation','unavailable playback does not block navigation');
console.log('UI audio checks passed: click finishes before navigation; hover and duplicate clicks are suppressed during activation; silent fallback navigates.');
