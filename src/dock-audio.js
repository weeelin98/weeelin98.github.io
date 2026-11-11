// Short local UI samples. AudioContext is unlocked only by a trusted gesture;
// hovering before that stays silent instead of bypassing browser autoplay rules.
export function createDockAudio(dock){
 dock.dataset.soundState='locked';
 const sources={hover:'dock-hover.mp3',click:'dock-click.mp3'};
 const downloads=Object.fromEntries(Object.entries(sources).map(([kind,file])=>[kind,
  fetch(`${import.meta.env.BASE_URL}sounds/${file}`).then(r=>{if(!r.ok)throw new Error('Sound unavailable');return r.arrayBuffer();}).catch(()=>null),
 ]));
 let context=null,ready=null,lastHover=-Infinity,activeHover=null,activeClick=null,activating=false;
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
  if(kind==='click'){
   unlock();
   if(context?.state==='suspended')await Promise.race([context.resume().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,150))]);
  }
  if(kind==='hover'&&activating)return;
  if(!context||context.state!=='running'||!ready||document.hidden)return;
  const requested=performance.now();
  if(kind==='hover'&&requested-lastHover<110)return;
  if(kind==='hover')lastHover=requested;
  const buffers=await Promise.race([ready,new Promise(resolve=>setTimeout(()=>resolve(null),kind==='click'?350:180))]);
  if(!buffers||performance.now()-requested>(kind==='click'?400:180)||document.hidden||context.state!=='running')return;
  const buffer=buffers[kind];if(!buffer)return;
  if(kind==='hover')stop(activeHover);else{stop(activeHover);stop(activeClick);}
  const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;
  const now=context.currentTime,duration=buffer.duration,volume=kind==='hover'?.38:.48;
  gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.005);
  gain.gain.setValueAtTime(volume,now+Math.max(.006,duration-.035));gain.gain.linearRampToValueAtTime(0,now+duration);
  source.connect(gain);gain.connect(context.destination);
  const voice={source,gain};if(kind==='hover')activeHover=voice;else activeClick=voice;
  let finished;const completion=new Promise(resolve=>{finished=resolve;});
  source.onended=()=>{source.disconnect();gain.disconnect();if(activeHover===voice)activeHover=null;if(activeClick===voice)activeClick=null;finished();};
  source.start(now);
  dock.dataset.lastSound=kind;dock.dataset.soundCount=String(Number(dock.dataset.soundCount??0)+1);
  if(kind==='click'){
   // Let the pop play before same-tab navigation tears down its AudioContext.
   await Promise.race([completion,new Promise(resolve=>setTimeout(resolve,Math.min(500,duration*1000+60)))]);
   dock.dataset.clickSoundCompleted=String(Number(dock.dataset.clickSoundCompleted??0)+1);
  }
 }
 return {hover:()=>{void play('hover');},click:()=>play('click'),async activate(action){
  if(activating)return;activating=true;
  try{await play('click');}catch{/* Audio failure must not block navigation. */}finally{activating=false;action();}
 }};
}
