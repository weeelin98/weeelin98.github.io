import * as THREE from 'three';
import {box,cyl,ball,mat,C} from './city.js';

export function createWinterLife(citizens,floorAt,parent){
 const exposed=citizens.filter(p=>['street','bus-stop','roof'].includes(p.area)||p.id===29).filter(p=>p.path||[40,43].includes(p.id)||floorAt(p.root.position.x,p.root.position.z)<p.root.position.y+1.15);
 const gear=[];
 for(const p of exposed){
  const color=[C.blueDark,C.terraDark,C.green,0x926781][p.id%4],accessory=[C.yellow,C.cream,C.terra,C.mint][p.id%4],parts=[];
  const coat=new THREE.Group();p.body.add(coat);const body=cyl(coat,0,.18,0,.168,.48,color);body.scale.z=.83;
  for(let y of [.05,.19,.32])ball(coat,0,y,.145,.015,C.cream);parts.push(coat);
  p.arms.forEach(a=>{const sleeve=new THREE.Group();a.upper.add(sleeve);cyl(sleeve,0,-.10,0,.056,.22,color);parts.push(sleeve);const glove=new THREE.Group();a.fore.add(glove);ball(glove,0,-.16,0,.047,accessory);parts.push(glove);});
  const scarf=new THREE.Group();p.body.add(scarf);const ring=new THREE.Mesh(new THREE.TorusGeometry(.09,.035,5,12),mat(accessory));ring.position.y=.43;ring.rotation.x=Math.PI/2;scarf.add(ring);box(scarf,.07,.28,.16,.07,.28,.04,accessory);parts.push(scarf);
  const hat=new THREE.Group();p.head.add(hat);const cap=new THREE.Mesh(new THREE.SphereGeometry(.157,12,8,0,Math.PI*2,0,1.65),mat(color));cap.position.y=.035;hat.add(cap);if(p.id%3!==1){cyl(hat,0,.025,0,.165,.055,accessory);ball(hat,0,.19,0,.055,accessory);}else{const hood=new THREE.Mesh(new THREE.TorusGeometry(.15,.04,5,12,Math.PI),mat(color));hood.rotation.z=Math.PI;hood.position.z=-.04;hat.add(hood);}parts.push(hat);
  parts.forEach(part=>part.visible=false);gear.push({p,parts,threshold:.12+(p.id%6)*.075,amount:0});
 }
 const shovelers=[];
 for(const [id,target]of [[40,[-9.95,.35,8.75]],[43,[10.7,.35,8.95]]]){
  const p=citizens.find(p=>p.id===id);if(!p)continue;
  const tool=new THREE.Group();p.root.add(tool);tool.position.set(0,.38,.32);cyl(tool,0,.34,0,.024,.72,0xa57c4d);const grip=new THREE.Mesh(new THREE.TorusGeometry(.07,.013,5,10),mat(C.dark));grip.position.y=.72;tool.add(grip);const blade=box(tool,0,0,.06,.34,.055,.27,0x547e93);blade.rotation.x=-.35;
  const clump=ball(tool,0,.06,.13,.15,0xeaf0ef);clump.scale.set(1,.4,1);
  const pile=ball(parent,target[0]+.55,.37,target[2]+.32,.35,0xeaf0ef);pile.scale.set(1,.35,.8);pile.userData.nonInteractive=true;tool.visible=pile.visible=false;
  shovelers.push({p,tool,clump,pile,home:p.root.position.clone(),yaw:p.root.rotation.y,target:new THREE.Vector3(...target),mix:0,arms:p.arms.map(a=>[a.upper.rotation.x,a.fore.rotation.x]),active:false});
 }
 return {gear,shovelers,updateStyle(dt,amount){for(const s of gear){const desired=THREE.MathUtils.smoothstep(amount,s.threshold,s.threshold+.25);s.amount=THREE.MathUtils.damp(s.amount,desired,2.2,dt);for(const part of s.parts){part.visible=s.amount>.01;part.scale.setScalar(Math.max(.001,s.amount));}}},update(t,dt,amount){
  for(let i=0;i<shovelers.length;i++){const s=shovelers[i],wanted=amount>.25;
   s.mix=THREE.MathUtils.damp(s.mix,wanted?1:0,1.1,dt);s.tool.visible=s.pile.visible=s.mix>.03;
   if(s.mix>.002){s.active=true;const delta=s.target.clone().sub(s.p.root.position);if(!wanted)delta.copy(s.home).sub(s.p.root.position);const distance=delta.length();if(distance>1e-5)s.p.root.position.addScaledVector(delta,Math.min(distance,dt*.55)/distance);
    const phase=t*.85+i*2.6,push=Math.sin(phase),lift=Math.max(0,Math.sin(phase-1));s.p.root.rotation.y=THREE.MathUtils.lerp(s.yaw,i?-.6:.65,s.mix);s.p.body.rotation.x=(.13+push*.10)*s.mix;
    s.tool.position.z=.34+(push+1)*.10;s.tool.rotation.x=-.20-lift*.65;s.tool.rotation.z=lift*.27;
    s.p.arms.forEach(a=>{a.upper.rotation.x=-.85-push*.20;a.fore.rotation.x=-.72-lift*.25;});s.p.legs.forEach(l=>{l.thigh.rotation.x=0;l.shin.rotation.x=0;});
    s.clump.visible=lift>.1;s.clump.scale.set(.8,.3+lift*.2,.8);s.pile.scale.y=.30+Math.sin(phase*.5)*.025;
   }else if(s.active&&s.p.root.position.distanceTo(s.home)<.02){s.p.root.position.copy(s.home);s.p.root.rotation.y=s.yaw;s.p.body.rotation.x=0;s.p.arms.forEach((a,j)=>{a.upper.rotation.x=s.arms[j][0];a.fore.rotation.x=s.arms[j][1];});s.active=false;}
  }
 }};
}
