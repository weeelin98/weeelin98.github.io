import * as THREE from 'three';
import {locations} from './content.js';
import {createSignFeedback} from './signage.js';
import {worldFocus} from './display.js';

const regionBoxes=locations.map(config=>({config,box:new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(...config.center),new THREE.Vector3(...config.size))}));
const forward=new THREE.Vector3(0,0,1),zero=new THREE.Vector3();
function opaque(hit){for(let p=hit.object;p;p=p.parent)if(!p.visible||p.userData.nonInteractive||p.userData.nonOccluding)return false;const m=Array.isArray(hit.object.material)?hit.object.material[hit.face?.materialIndex??0]:hit.object.material;return m?.visible!==false&&(!m.transparent||m.opacity>=.5);}

// Exact rendered geometry handles occlusion. Invisible architectural volumes
// classify surfaces only; they never hide a sign or steal its click.
export function createPicker(scene,signs,displayRoot=null){
 const ray=new THREE.Raycaster(),checkRay=new THREE.Raycaster(),meshes=[],pads=[];
 const q=new THREE.Quaternion(),normal=new THREE.Vector3(),toCamera=new THREE.Vector3(),local=new THREE.Vector3(),clamped=new THREE.Vector3();
 scene.traverse(o=>{if(o.isMesh&&o.visible&&(!Array.isArray(o.material)?o.material.visible!==false:true))meshes.push(o);});
 for(const sign of signs){
   const size=sign.userData.size?.clone()??new THREE.Box3().setFromBufferAttribute(sign.geometry.attributes.position).getSize(new THREE.Vector3());
   const pad=new THREE.Mesh(new THREE.BoxGeometry(size.x+.5,size.y+.58,size.z+.03),new THREE.MeshBasicMaterial({visible:false}));
   pad.position.copy(sign.position);pad.position.y+=.07;pad.quaternion.copy(sign.quaternion);pad.updateMatrixWorld(true);pad.userData={sign,size};pads.push(pad);
   if(displayRoot)displayRoot.add(pad);
 }
 function pick(ndc,camera){
   scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);ray.setFromCamera(ndc,camera);
   const visible=ray.intersectObjects(meshes,false).filter(opaque);
   const candidates=ray.intersectObjects(pads,false);
   for(const candidate of candidates){
     const {sign,size}=candidate.object.userData;
     sign.getWorldQuaternion(q);normal.copy(forward).applyQuaternion(q);
     // One-sided interaction: the back of a sign is not a content entrance.
     const facing=normal.dot(toCamera.copy(camera.position).sub(sign.getWorldPosition(zero)));
     if(facing<=0&&!sign.userData.entry?.design?.doubleSided)continue;
     local.copy(candidate.point);sign.worldToLocal(local);
     if(sign.userData.entry?.design?.shape==='oval'&&Math.pow(local.x/(size.x/2+.15),2)+Math.pow(local.y/(size.y/2+.15),2)>1.2)continue;
     clamped.set(THREE.MathUtils.clamp(local.x,-size.x/2+.02,size.x/2-.02),THREE.MathUtils.clamp(local.y,-size.y/2+.02,size.y/2-.02),(facing>=0?1:-1)*((sign.userData.frontDepth??size.z/2)+.012));
     sign.localToWorld(clamped);
     // Check the nearest point on the real sign when using its enlarged hit area.
     // Orthographic rays are parallel, so derive the shifted ray origin accordingly.
     const distance=clamped.clone().sub(ray.ray.origin).dot(ray.ray.direction);
     checkRay.ray.origin.copy(clamped).addScaledVector(ray.ray.direction,-distance);
     checkRay.ray.direction.copy(ray.ray.direction);
     checkRay.near=0;checkRay.far=distance-.035;
     if(!checkRay.intersectObjects(meshes,false).some(hit=>{for(let node=hit.object;node;node=node.parent)if(node===sign)return false;return opaque(hit);}))return {type:'content',entry:sign.userData.entry,sign};
   }
   const surface=visible[0];
   if(!surface)return {type:'background'};
   // Dynamic amusement objects carry their location ID through their parent root.
   for(let node=surface.object;node;node=node.parent){if(node.userData.locationId){return {type:'focus',place:locations.find(p=>p.id===node.userData.locationId)};}}
   const point=displayRoot?displayRoot.worldToLocal(surface.point.clone()):surface.point;
   const containing=regionBoxes.filter(r=>r.box.containsPoint(point));
   containing.sort((a,b)=>a.config.size.reduce((v,n)=>v*n,1)-b.config.size.reduce((v,n)=>v*n,1));
   return containing.length?{type:'focus',place:containing[0].config}:{type:'surface'};
 }
 return {pick};
}

const smooth=t=>t*t*t*(t*(t*6-15)+10);
export class CameraFlight{
 constructor(camera,controls,display=null){this.camera=camera;this.controls=controls;this.display=display;this.active=null;this.home={target:controls.target.clone(),position:camera.position.clone(),zoom:camera.zoom};}
 cancel(){this.active=null;this.controls.enableDamping=!this.display;}
 go(config){
   // Flush residual OrbitControls inertia before starting a programmatic movement.
   this.controls.enableDamping=false;this.controls.update();
   const target=config?worldFocus(config,this.display?.root):this.home.target.clone();
   const offset=this.display?this.home.position.clone().sub(this.home.target):new THREE.Vector3(...(config?.offset??[0,0,0]));
   const position=config?target.clone().add(offset):this.home.position.clone();
   const from=new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));
   const to=new THREE.Spherical().setFromVector3(position.clone().sub(target));
   const delta=THREE.MathUtils.euclideanModulo(to.theta-from.theta+Math.PI,Math.PI*2)-Math.PI;
   const fromYaw=this.display?.root.rotation.y??0;
   this.active={start:performance.now(),target,position,fromPosition:this.camera.position.clone(),fromTarget:this.controls.target.clone(),from,to,delta,fromYaw,toYaw:config?fromYaw:fromYaw+THREE.MathUtils.euclideanModulo(-fromYaw+Math.PI,Math.PI*2)-Math.PI,fromZoom:this.camera.zoom,toZoom:config?.zoom??this.home.zoom};
 }
 update(now){
   const a=this.active;if(!a)return;
   const t=Math.min(1,Math.max(0,(now-a.start)/1450)),s=smooth(t);
   this.controls.target.lerpVectors(a.fromTarget,a.target,s);
   const phi=THREE.MathUtils.lerp(a.from.phi,a.to.phi,s),theta=a.from.theta+a.delta*s;
   // Orbit along an exterior corridor rather than interpolate a chord through buildings.
   // Endpoint radii are preserved; middle of the arc can only move farther outward.
   const radius=THREE.MathUtils.lerp(a.from.radius,a.to.radius,s)+Math.sin(Math.PI*t)*5;
   if(this.display){this.camera.position.lerpVectors(a.fromPosition,a.position,s);this.display.setAngle(THREE.MathUtils.lerp(a.fromYaw,a.toYaw,s));}
   else this.camera.position.setFromSpherical(new THREE.Spherical(radius,phi,theta)).add(this.controls.target);
   this.camera.zoom=THREE.MathUtils.lerp(a.fromZoom,a.toZoom,s);this.camera.updateProjectionMatrix();
   this.controls.update();
   if(t===1){this.active=null;this.controls.enableDamping=!this.display;}
 }
}

export function installInteractions({scene,camera,controls,canvas,signs,display=null}){
 const picker=createPicker(scene,signs,display?.root),flight=new CameraFlight(camera,controls,display),ndc=new THREE.Vector2(),feedback=createSignFeedback(signs);
 if(display)display.onStart=()=>flight.cancel();
 const panel=document.querySelector('#content-panel'),title=document.querySelector('#panel-title'),tag=document.querySelector('#panel-region'),description=document.querySelector('#panel-description'),tooltip=document.querySelector('#hover-label');
 const close=panel.querySelector('.close');let down=null,hover=null,lastFocus=null,dirty=false,mouse=null;
 function hideHover(){hover=null;tooltip.hidden=true;canvas.style.cursor='grab';}
 function stop(){flight.cancel();}
 controls.addEventListener('start',stop);
 canvas.addEventListener('wheel',()=>{stop();if(down)down.moved=true;hideHover();},{passive:true});
 function hit(e){const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);return picker.pick(ndc,camera);}
 function open(entry){
   if(entry.href&&entry.status!=='coming-soon'){const url=new URL(entry.href,location.href);if(['http:','https:','mailto:'].includes(url.protocol))window.open(url.href,'_blank','noopener,noreferrer');return;}
   stop();lastFocus=document.activeElement;title.textContent=entry.label;tag.textContent=`${entry.regionId.toUpperCase()} / ${entry.id.toUpperCase()}`;description.textContent=entry.description;
   panel.querySelector('.placeholder p').textContent=entry.status==='coming-soon'?'Coming Soon · 敬请期待':'这个入口已就绪。完整内容页面将在后续加入。';
   controls.enabled=false;hideHover();panel.showModal();close.focus();
 }
 function dismiss(){panel.close();controls.enabled=true;lastFocus?.focus?.({preventScroll:true});canvas.focus({preventScroll:true});}
 close.addEventListener('click',dismiss);panel.querySelector('.continue').addEventListener('click',dismiss);
 panel.addEventListener('cancel',e=>{e.preventDefault();dismiss();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();if(panel.open)dismiss();else flight.go();}});
 canvas.addEventListener('pointerdown',e=>{stop();hideHover();if(down){down.moved=true;return;}down={id:e.pointerId,x:e.clientX,y:e.clientY,button:e.button,moved:false};});
 canvas.addEventListener('pointermove',e=>{mouse=e;dirty=true;if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)down.moved=true;});
 canvas.addEventListener('pointerup',e=>{const press=down;down=null;dirty=true;if(!press||press.id!==e.pointerId||press.button!==0||press.moved||panel.open)return;const result=hit(e);if(result.type==='content')open(result.entry);else if(result.type==='focus')flight.go(result.place.camera);else if(result.type==='background')flight.go();});
 canvas.addEventListener('pointercancel',()=>{down=null;hideHover();});
 canvas.addEventListener('pointerleave',()=>{dirty=false;mouse=null;hideHover();});
 addEventListener('blur',()=>{down=null;hideHover();stop();});
 return {flight,panel,feedback,update(now,wallDelta=1/60,simulationTime=0){
   flight.update(now);
   if(dirty&&mouse&&!down&&!panel.open){dirty=false;const result=hit(mouse);hover=result.type==='content'?result.sign:null;
     canvas.style.cursor=hover?'pointer':result.type==='focus'?'zoom-in':'grab';tooltip.hidden=!hover;
     if(hover){tooltip.textContent=`${result.entry.label} ↗`;tooltip.style.left=`${Math.max(8,Math.min(mouse.clientX+16,innerWidth-180))}px`;tooltip.style.top=`${Math.max(8,mouse.clientY-40)}px`;}
   }
   feedback.update(hover,wallDelta,simulationTime);
 }};
}

