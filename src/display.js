import * as THREE from 'three';

// Turntable motion rotates real model transforms. Lighting remains in the scene.
export function createDisplayController(root,canvas,controls){
 controls.enableRotate=false;
 controls.enableDamping=false;
 let pointer=null,changed=false,onStart=()=>{};
 function setAngle(angle){if(Math.abs(root.rotation.y-angle)<1e-9)return;root.rotation.y=angle;root.updateMatrixWorld(true);changed=true;}
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!controls.enabled)return;pointer={id:e.pointerId,x:e.clientX,angle:root.rotation.y};onStart();canvas.setPointerCapture?.(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!pointer||e.pointerId!==pointer.id)return;const dx=e.clientX-pointer.x;if(Math.abs(dx)>4)setAngle(pointer.angle+dx/Math.max(canvas.clientWidth,600)*Math.PI*1.8);});
 const end=()=>{pointer=null;};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);addEventListener('blur',end);
 return {root,setAngle,set onStart(fn){onStart=fn;},consumeChange(){const value=changed;changed=false;return value;}};
}

export function worldFocus(config,root){return root?root.localToWorld(new THREE.Vector3(...config.target)):new THREE.Vector3(...config.target);}
