import * as THREE from 'three';
import {addSignIllumination} from './sign-lighting.js';

function rounded(w,h,r){
 const s=new THREE.Shape(),x=-w/2,y=-h/2;
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
}
export function signShape(w,h,type){
 if(type==='oval'){const s=new THREE.Shape();s.absellipse(0,0,w/2,h/2,0,Math.PI*2,false);return s;}
 if(type==='tag'){
  const s=new THREE.Shape(),a=w/2,b=h/2,c=.19;
  s.moveTo(-a,-b+c);s.lineTo(-a+c,-b);s.lineTo(a-c,-b);s.lineTo(a,-b+c);s.lineTo(a,b-c);s.lineTo(a-c,b);s.lineTo(-a+c,b);s.lineTo(-a,b-c);s.closePath();
  const hole=new THREE.Path();hole.absellipse(0,b-.16,.065,.065,0,Math.PI*2,true);s.holes.push(hole);return s;
 }
 if(type==='bookmark'){
  const s=new THREE.Shape(),a=w/2,b=h/2,r=.15;
  s.moveTo(-a,-b);s.lineTo(0,-b+.20);s.lineTo(a,-b);s.lineTo(a,b-r);s.quadraticCurveTo(a,b,a-r,b);s.lineTo(-a+r,b);s.quadraticCurveTo(-a,b,-a,b-r);s.closePath();return s;
 }
 return rounded(w,h,type==='billboard'?.065:type==='arch'?.32:.25);
}
function textTexture(entry,blank){
 const [w,h]=entry.size,d=entry.design,canvas=document.createElement('canvas');
 const density=Math.min(420,2048/Math.max(w,h));canvas.width=Math.round(w*density);canvas.height=Math.round(h*density);
 const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
 ctx.clearRect(0,0,W,H);ctx.fillStyle=d.text;ctx.strokeStyle=d.text;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineCap='round';
 function words(text,x,y,maxSize,maxWidth){
  let size=maxSize;ctx.font=`${d.weight} ${size}px "${d.font}"`;
  const measured=ctx.measureText(text)?.width??text.length*size*.65;
  if(measured>maxWidth){size*=maxWidth/measured;ctx.font=`${d.weight} ${size}px "${d.font}"`;}
  ctx.fillText(text,x,y);
 }
 if(!blank){
  if(entry.interaction==='decoration'){
   ctx.lineWidth=H*.035;ctx.beginPath();ctx.moveTo(W*.30,H*.37);ctx.lineTo(W*.30,H*.62);ctx.quadraticCurveTo(W*.5,H*.86,W*.66,H*.62);ctx.lineTo(W*.66,H*.37);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.arc(W*.69,H*.49,W*.09,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.beginPath();ctx.moveTo(W*.26,H*.78);ctx.lineTo(W*.71,H*.78);ctx.stroke();
   for(const x of [.4,.51,.61]){ctx.beginPath();ctx.moveTo(W*x,H*.28);ctx.quadraticCurveTo(W*(x-.04),H*.22,W*x,H*.16);ctx.stroke();}
  }else if(entry.id==='notes'){} // Physical neon tubes supply the lettering.
  else if(entry.id==='cv'&&entry.label==='CV'){words('C',W*.5,H*.34,H*.32,W*.72);words('V',W*.5,H*.73,H*.32,W*.72);}
  else if(d.shape==='bookmark'){
   ctx.save();ctx.translate(W/2,H*.48);ctx.rotate(-Math.PI/2);words(entry.label.toUpperCase(),0,0,W*.66,H*.78);ctx.restore();
   ctx.fillRect(W*.26,H*.89,W*.48,H*.018);
  }else if(entry.id==='contact'){
   const split=entry.label.split(' '),last=split.pop();words(split.join(' '),W*.5,H*.33,H*.32,W*.83);words(last,W*.42,H*.70,H*.31,W*.47);
   const x=W*.67,y=H*.62,iw=W*.12,ih=H*.16;ctx.lineWidth=H*.018;ctx.strokeRect(x,y,iw,ih);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+iw/2,y+ih*.55);ctx.lineTo(x+iw,y);ctx.stroke();
  }else if(entry.id==='about'){
   words(entry.label,W*.57,H*.52,H*.55,W*.72);
   const x=W*.09,y=H*.33,cw=W*.085,ch=H*.30;ctx.lineWidth=H*.03;ctx.strokeRect(x,y,cw,ch);ctx.beginPath();ctx.arc(x+cw,y+ch*.45,ch*.26,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.beginPath();ctx.moveTo(x-W*.008,y+ch+H*.06);ctx.lineTo(x+cw+W*.015,y+ch+H*.06);ctx.stroke();
  }else if(d.shape==='oval')words(entry.label,W*.5,H*.52,H*.48,W*.80);
  else words(entry.label.toUpperCase(),W*.5,H*.52,H*.60,W*.86);
 }
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}

export function makeNavigationSign(entry,blank=false){
 const [w,h]=entry.size,d=entry.design,t=d.thickness;
 const root=new THREE.Group();root.position.set(...entry.position);root.rotation.y=entry.rotation??0;
 const motion=new THREE.Group();root.add(motion);
 const plate=new THREE.Group();motion.add(plate);
 if(d.motion==='hanging'){motion.position.y=h/2+.14;plate.position.y=-motion.position.y;}
 const outline=signShape(w,h,d.shape);
 const geometry=new THREE.ExtrudeGeometry(outline,{depth:t,steps:1,bevelEnabled:true,bevelSegments:3,bevelSize:.035,bevelThickness:.025,curveSegments:24});geometry.translate(0,0,-t/2);
 const rim=new THREE.MeshStandardMaterial({color:d.rim,roughness:.58});
 const body=new THREE.Mesh(geometry,rim);body.castShadow=true;body.receiveShadow=true;plate.add(body);
 const fill=entry.id==='projects'?new THREE.MeshStandardMaterial({color:d.fill,emissive:0xffce70,emissiveIntensity:.3,roughness:.5}):new THREE.MeshBasicMaterial({color:d.fill,toneMapped:false});
 const inkMaterial=new THREE.MeshBasicMaterial({map:textTexture(entry,blank),transparent:true,depthWrite:false,toneMapped:false});
 const inks=[];const frontDepth=t/2+.055;
 for(const side of d.doubleSided?[1,-1]:[1]){
  const inset=new THREE.Mesh(new THREE.ShapeGeometry(outline,24),fill);inset.scale.set(.925,.89,1);inset.position.z=side*(t/2+.031);if(side<0)inset.rotation.y=Math.PI;plate.add(inset);
  const ink=new THREE.Mesh(new THREE.PlaneGeometry(w,h),inkMaterial);ink.position.z=side*frontDepth;if(side<0)ink.rotation.y=Math.PI;ink.userData.nonOccluding=true;plate.add(ink);inks.push(ink);
 }
 // Small corner fasteners on the billboard, kept separate from the typography.
 if(d.shape==='billboard'){
  const boltGeometry=new THREE.SphereGeometry(.036,6,4),metal=new THREE.MeshStandardMaterial({color:0xffe6af,roughness:.45,metalness:.25});
  for(const x of [-w/2+.12,w/2-.12])for(const y of [-h/2+.12,h/2-.12]){const bolt=new THREE.Mesh(boltGeometry,metal);bolt.position.set(x,y,t/2+.055);plate.add(bolt);}
 }
 root.userData={type:'sign',entry,size:new THREE.Vector3(w,h,t+.11),frontDepth,fillMaterial:fill,inkMeshes:inks,motionGroup:motion,plateGroup:plate,homePosition:root.position.clone()};
 if(!blank)addSignIllumination(root);
 return root;
}

export function buildSignMount(city,entry,kit){
 const {rod,box,C}=kit,[w,h]=entry.size,d=entry.design;
 const g=new THREE.Group();g.position.set(...entry.position);g.rotation.y=entry.rotation??0;city.add(g);
 const base=entry.mountBase-entry.position[1],metal=d.mount==='a-frame'?0xc96c52:0x36554a;
 if(d.mount==='a-frame'){
  for(const x of [-w*.32,w*.32]){rod(g,[x,base,-.45],[x,h*.3,-.45],.065,metal);rod(g,[x,base,-1.05],[x,h*.15,-.45],.045,metal);box(g,x,base,-.64,.4,.08,1,C.cream);}
  rod(g,[-w*.32,base+.2,-.45],[w*.32,h*.25,-.45],.035,metal);rod(g,[w*.32,base+.2,-.45],[-w*.32,h*.25,-.45],.035,metal);
 }else if(d.mount==='fascia'){
  for(const x of [-w*.37,w*.37]){rod(g,[x,-.4,-.65],[x,.4,-.65],.055,0xc7765c);rod(g,[x,0,-.65],[x,0,-.17],.045,0xc7765c);}
  box(g,0,h/2+.10,-.10,w+.16,.12,.45,0xc7765c);
 }else if(d.mount==='hanging'){
  rod(g,[-w*.57,base,-.95],[-w*.57,h/2+.38,-.95],.052,metal);
  rod(g,[-w*.57,h/2+.38,-.95],[-w*.57,h/2+.38,-.08],.05,metal);
  rod(g,[-w*.57,h/2+.38,-.08],[w*.3,h/2+.38,-.08],.05,metal);
  for(const x of [-w*.24,w*.24])rod(g,[x,h/2+.37,-.1],[x,h/2+.05,0],.022,C.gold);
 }else if(d.mount==='blade'||d.mount==='bracket'){
  const anchor=d.mount==='blade'?-.7:-.6;
  for(const y of [-h*.28,h*.35]){rod(g,[anchor,y,-.62],[0,y,-.24],.045,metal);box(g,anchor,y,-.63,.12,.26,.08,C.gold);}
  rod(g,[anchor,Math.min(base,-h*.3),-.62],[anchor,h*.4,-.62],.035,metal);
  box(g,anchor,base,-.62,.22,.06,.3,C.gold);
 }else{
  for(const x of [-w*.33,w*.33]){rod(g,[x,base,-.75],[x,-.1,-.75],.045,metal);rod(g,[x,-.1,-.75],[x,-.1,-.16],.035,C.gold);}
 }
}

export function createSignFeedback(signs){
 const states=signs.map((sign,i)=>({sign,amount:0,base:sign.position.clone(),phase:i*.7,from:new THREE.Color(sign.userData.entry.design.fill),to:new THREE.Color(sign.userData.entry.design.hoverFill)}));
 return {states,update(hovered,wallDelta,simulationTime){for(const s of states){
  const data=s.sign.userData,d=data.entry.design;
  s.amount=THREE.MathUtils.damp(s.amount,s.sign===hovered?1:0,10,wallDelta);
  data.hoverAmount=s.amount;
  data.fillMaterial.color.lerpColors(s.from,s.to,s.amount);
  if(d.motion==='hanging'){
   data.plateGroup.scale.setScalar(1+s.amount*.025);
   data.motionGroup.rotation.z=s.amount*Math.sin(simulationTime*1.25+s.phase)*.010;
  }else{
   for(const ink of data.inkMeshes){ink.scale.setScalar(1+s.amount*.025);ink.position.z=Math.sign(ink.position.z)*(data.frontDepth+s.amount*.025);}
  }
 }}};
}
