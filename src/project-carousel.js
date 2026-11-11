export function installProjectCarousel(sounds){
 const track=document.querySelector('#project-track');if(!track)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const originals=[...track.children],pause=document.querySelector('#project-pause');
 for(const card of originals){const clone=card.cloneNode(true);clone.removeAttribute('id');clone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));clone.querySelectorAll('a,button,summary').forEach(el=>el.tabIndex=-1);clone.setAttribute('aria-hidden','true');track.append(clone);}
 let stopped=reduced.matches,hover=false,focused=false,drag=false,last=0,frame=0,waitUntil=0,fraction=0;
 const period=()=>track.children[originals.length].offsetLeft-originals[0].offsetLeft;
 function state(){pause.textContent=stopped?'Resume scrolling':'Pause scrolling';pause.setAttribute('aria-pressed',String(stopped));}
 function tick(now){const dt=Math.min((now-last)/1000||0,.05);last=now;
  if(!stopped&&!reduced.matches&&!hover&&!focused&&!drag&&!document.hidden&&now>waitUntil){fraction+=dt*22;const pixels=Math.floor(fraction);fraction-=pixels;track.scrollLeft+=pixels;const width=period();if(width&&track.scrollLeft>=width)track.scrollLeft-=width;}
  frame=requestAnimationFrame(tick);
 }
 function step(direction){waitUntil=performance.now()+6000;const width=period(),stride=originals[1].offsetLeft-originals[0].offsetLeft;let target=track.scrollLeft+stride*direction;if(target<0){track.scrollLeft+=width;target+=width;}if(target>=width)target-=width;track.scrollTo({left:target,behavior:reduced.matches?'instant':'smooth'});}
 document.querySelector('#project-prev').addEventListener('click',()=>{void sounds?.click();step(-1);});
 document.querySelector('#project-next').addEventListener('click',()=>{void sounds?.click();step(1);});
 pause.addEventListener('click',()=>{void sounds?.click();stopped=!stopped;state();});
 track.addEventListener('pointerenter',()=>hover=true);track.addEventListener('pointerleave',()=>hover=false);
 track.addEventListener('focusin',()=>focused=true);track.addEventListener('focusout',()=>focused=track.contains(document.activeElement));
 track.addEventListener('pointerdown',()=>drag=true);window.addEventListener('pointerup',()=>{drag=false;waitUntil=performance.now()+3000;});
 track.addEventListener('wheel',()=>{waitUntil=performance.now()+5000;sounds?.hover();},{passive:true});
 track.addEventListener('pointerover',event=>{const card=event.target.closest('.project-card');if(card&&!card.contains(event.relatedTarget))sounds?.hover();});
 track.addEventListener('scroll',()=>{if(drag)sounds?.hover();},{passive:true});
 track.addEventListener('click',event=>{if(event.target.closest('a,summary'))void sounds?.click();});
 track.addEventListener('keydown',event=>{if(event.target===track&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();sounds?.hover();step(event.key==='ArrowLeft'?-1:1);}});
 reduced.addEventListener('change',()=>{stopped=reduced.matches;state();});
 state();frame=requestAnimationFrame(tick);window.addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});
}


