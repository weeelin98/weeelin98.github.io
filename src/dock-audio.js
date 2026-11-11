// Short local UI samples. AudioContext is unlocked only by a trusted gesture;
// hovering before that stays silent instead of bypassing browser autoplay rules.
export function createDockAudio(dock){
 dock.dataset.soundState='locked';
 const sources={hover:'dock-hover.mp3',click:'dock-click.mp3'};
 const downloads=Object.fromEntries(Object.entries(sources).map(([kind,file])=>[kind,
  fetch(`${import.meta.env.BASE_URL}sounds/${file}`).then(r=>{if(!r.ok)throw new Error('Sound unavailable');return r.arrayBuffer();}).catch(()=>null),
 ]));
 let context=null,ready=null,lastHover=-Infinity,activeHover=null,activeClick=null;
 function unlock(){
  try{
   const AudioContext=window.AudioContext??window.webkitAudioContext;if(!AudioContext)return;
   context??=new AudioContext();
   if(context.state==='suspended')context.resume().catch(()=>{});
   ready??=Promise.all(Object.entries(downloads).map(async([kind,download])=>{
    const data=await download;return [kind,data?await context.decodeAudioData(data).catch(()=>null):null];
   })).then(entries=>{const buffers=Object.fromEntries(entries);dock.dataset.soundState=buffers.hover&&buffers.click?'ready':'unavailable';return buffers;});
  }catch{/* Navigation still works when device audio is unavailable. */}
 }
 document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
 document.addEventListener('keydown',unlock,{capture:true});
 function stop(voice){
  if(!voice)return;const now=context.currentTime;
  voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setTargetAtTime(0,now,.004);
  try{voice.source.stop(now+.025);}catch{}
 }
 async function play(kind){
  if(kind==='click')unlock();
  if(!context||context.state!=='running'||!ready||document.hidden)return;
  const requested=performance.now();
  if(kind==='hover'&&requested-lastHover<110)return;
  if(kind==='hover')lastHover=requested;
  const buffers=await ready;
  if(performance.now()-requested>180||document.hidden||context.state!=='running')return;
  const buffer=buffers[kind];if(!buffer)return;
  if(kind==='hover')stop(activeHover);else{stop(activeHover);stop(activeClick);}
  const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;
  const now=context.currentTime,duration=buffer.duration,volume=kind==='hover'?.38:.48;
  gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.005);
  gain.gain.setValueAtTime(volume,now+Math.max(.006,duration-.035));gain.gain.linearRampToValueAtTime(0,now+duration);
  source.connect(gain);gain.connect(context.destination);
  const voice={source,gain};if(kind==='hover')activeHover=voice;else activeClick=voice;
  source.onended=()=>{source.disconnect();gain.disconnect();if(activeHover===voice)activeHover=null;if(activeClick===voice)activeClick=null;};
  source.start(now);
  dock.dataset.lastSound=kind;dock.dataset.soundCount=String(Number(dock.dataset.soundCount??0)+1);
 }
 return {hover:()=>{void play('hover');},click:()=>{void play('click');}};
}
