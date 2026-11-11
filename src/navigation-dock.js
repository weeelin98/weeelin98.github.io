import {navigationEntries} from './content.js';
import {createDockAudio} from './dock-audio.js';

export function installNavigationDock({open}){
 const dock=document.querySelector('#navigation-dock'),list=dock.querySelector('#dock-destinations');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),compact=matchMedia('(max-width:600px)');
 const sounds=createDockAudio(dock),items=[];let pointerX=null,focused=null,hovered=null,frame=0,lastTime=0;
 const baseSize=()=>compact.matches?36:52;
 function animate(now){
  frame=0;const dt=Math.min((now-lastTime)/1000||1/60,1/30);lastTime=now;let moving=false;
  // Measure stationary slots, not translated buttons, to avoid hover oscillation.
  const centers=items.map(item=>{const r=item.slot.getBoundingClientRect();return r.left+r.width/2;});
  items.forEach((item,index)=>{
   const distance=pointerX===null?Infinity:Math.abs(pointerX-centers[index]);
   const proximity=pointerX===null?(focused===item.button?1:0):Math.max(0,1-distance/135);
   const influence=proximity*proximity*(3-2*proximity);
   const target=reduced.matches?0:influence;
   // A damped spring retains momentum when the pointer moves between icons.
   const acceleration=340*(target-item.value)-19*item.velocity;
   item.velocity+=acceleration*dt;item.value+=item.velocity*dt;
   if(Math.abs(target-item.value)<.001&&Math.abs(item.velocity)<.006){item.value=target;item.velocity=0;}else moving=true;
   item.hopVelocity+=(-420*item.hop-16*item.hopVelocity)*dt;item.hop+=item.hopVelocity*dt;
   if(Math.abs(item.hop)<.02&&Math.abs(item.hopVelocity)<.1){item.hop=0;item.hopVelocity=0;}else moving=true;
   const value=Math.max(0,Math.min(1.08,item.value)),size=baseSize()+value*(compact.matches?14:18);
   item.slot.style.width=`${size}px`;item.button.style.height=`${size}px`;
   const lift=reduced.matches?0:Math.max(0,value*10+item.hop);
   item.button.style.transform=`translateY(${-lift}px)`;
   item.button.style.setProperty('--dock-energy',String(Math.min(1,value)));
  });
  if(moving)frame=requestAnimationFrame(animate);
 }
 function wake(){if(!frame){lastTime=performance.now();frame=requestAnimationFrame(animate);}}
 for(const entry of navigationEntries){
  const button=document.createElement('button');button.type='button';button.className='dock-entry';button.dataset.destination=entry.id;button.setAttribute('aria-label',entry.label);button.style.setProperty('--entry-accent',entry.color);
  const icon=document.createElement('span');icon.className='dock-icon';icon.setAttribute('aria-hidden','true');
  const image=document.createElement('img');image.src=`${import.meta.env.BASE_URL}icons/${entry.id}.png`;image.alt='';image.draggable=false;image.width=image.height=512;icon.append(image);
  const label=document.createElement('span');label.className='dock-label';label.textContent=entry.label;
  const slot=document.createElement('div');slot.className='dock-slot';slot.style.width=`${baseSize()}px`;
  button.append(icon,label);slot.append(button);list.append(slot);
  const item={slot,button,value:0,velocity:0,hop:0,hopVelocity:0};items.push(item);
  button.addEventListener('click',()=>{sounds.click();open(entry);});
  button.addEventListener('pointerenter',e=>{
   if(e.pointerType==='touch'||hovered===button)return;hovered=button;
   if(!reduced.matches)item.hopVelocity=170;
   sounds.hover();wake();
  });
  button.addEventListener('focus',()=>{focused=button;wake();});
  button.addEventListener('blur',()=>{if(focused===button)focused=null;wake();});
 }
 list.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;pointerX=e.clientX;wake();});
 list.addEventListener('pointerleave',()=>{pointerX=null;hovered=null;wake();});
 reduced.addEventListener('change',wake);compact.addEventListener('change',wake);
 // UI events never enter the canvas display controller or sign picker.
 dock.addEventListener('pointerdown',e=>e.stopPropagation());
 dock.addEventListener('click',e=>e.stopPropagation());
 dock.addEventListener('keydown',e=>{
  if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)&&list.contains(e.target)){
   const buttons=[...list.querySelectorAll('button')],index=buttons.indexOf(e.target);
   const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
   e.preventDefault();buttons[next].focus();
  }
 });
 wake();
}
