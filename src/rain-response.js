import * as THREE from 'three';
import {cyl,mat,C} from './city.js';
const canopyPanels=Array.from({length:8},(_,i)=>new THREE.SphereGeometry(.56,3,5,i*Math.PI/4,Math.PI/4,0,Math.PI/2));

function umbrella(person){
 const g=new THREE.Group();g.visible=false;person.root.add(g);g.position.set(-.20,0,.08);
 cyl(g,0,1.02,0,.014,.89,C.gold);
 const colors=[C.terra,C.mint,0x799fbe,C.yellow];
 for(let i=0;i<8;i++){
  const m=new THREE.Mesh(canopyPanels[i],mat(i%2?C.cream:colors[person.id%4]));
  m.scale.y=.38;m.position.y=1.45;m.material.side=THREE.DoubleSide;g.add(m);
 }
 return g;
}
function joinPoint(path){let best=-Infinity,u=0;for(let i=0;i<256;i++){const p=path.getPointAt(i/256);if(p.z>best){best=p.z;u=i/256;}}return u;}
const near=(a,b)=>a.distanceTo(b)<1e-5;

export function createRainResponse(citizens,walkers){
 const eligible=[...walkers,...citizens.filter(p=>p.id===7||p.id===29)];
 const states=eligible.map((p,i)=>{
  const shelter=p.path&&i%2===1,side=p.root.position.x<0?'left':'right';
  const slot=side==='left'?Math.floor(i/2)%2:Math.floor((i-4)/2)%3;
  return {p,kind:shelter?'shelter':'umbrella',side,slot,umbrella:umbrella(p),phase:'normal',delay:1.2+(i*1.71)%5,age:0,join:p.path?joinPoint(p.path):0,trail:[],index:0,cover:0};
 });
 let raining=false;
 function beginReverse(s){s.phase='return';s.trail=s.trail.slice(0,s.index).reverse();s.trail.push(s.joinPosition.clone());s.index=0;}
 function walkTrail(s,dt,speed){
  let budget=dt*speed;
  while(s.index<s.trail.length&&budget>0){const target=s.trail[s.index],delta=target.clone().sub(s.p.root.position),distance=delta.length();
   if(distance<1e-6){s.index++;continue;}
   s.p.root.rotation.y=Math.atan2(delta.x,delta.z);
   const step=Math.min(budget,distance);s.p.root.position.addScaledVector(delta,step/distance);budget-=step;
   if(near(s.p.root.position,target))s.index++;
  }
  return s.index>=s.trail.length;
 }
 return {states,
  before(dt,isRain){
   if(isRain!==raining){raining=isRain;for(const s of states){s.age=0;
    if(raining){if(s.phase==='normal')s.phase='react';}
    else if(s.phase==='sheltered')s.phase='release';
    else if(s.phase==='approach')beginReverse(s);
    else if(s.phase==='rush'||s.phase==='react')s.phase='normal';
   }}
   for(const s of states){s.age+=dt;
    if(s.phase==='react'&&s.age>s.delay){s.phase=s.kind==='shelter'?'rush':'normal';}
    if(s.phase==='release'&&s.age>s.delay){s.phase='return';s.trail=s.fullTrail.slice(0,-1).reverse();s.trail.push(s.joinPosition.clone());s.index=0;}
    s.p.walkBlocked=['approach','sheltered','release','return'].includes(s.phase);
    s.p.rainSpeed=s.phase==='rush'?1.85:1;
    if(s.phase==='rush'){
     const remaining=(s.join-s.p.distance+1)%1;
     if(remaining<dt*.42*1.85/s.p.length+.00001){
      s.p.distance=s.join;s.p.walkBlocked=true;s.joinPosition=s.p.path.getPointAt(s.join);s.p.root.position.copy(s.joinPosition);
      const [x,y,z]=s.joinPosition.toArray();
      s.trail=s.side==='left'?[new THREE.Vector3(x,y,5.65),new THREE.Vector3(-10.6+s.slot*.55,y,5.65),new THREE.Vector3(-10.6+s.slot*.55,y,5.18)]
       :[new THREE.Vector3(12.05,y,z),new THREE.Vector3(12.05,y,9.25),new THREE.Vector3(10.98,y,9.25),new THREE.Vector3(10.98,y,10.96),new THREE.Vector3(8.25+s.slot*.72,y,10.96),new THREE.Vector3(8.25+s.slot*.72,y,10.70)];
      s.fullTrail=s.trail.map(v=>v.clone());s.index=0;s.phase='approach';
     }
    }
   }
  },
  after(t,dt){for(const s of states){
   if(s.phase==='approach'&&walkTrail(s,dt,.82)){s.phase=raining?'sheltered':'release';s.age=0;}
   else if(s.phase==='return'&&walkTrail(s,dt,.48)){s.phase=raining?'react':'normal';s.age=0;s.p.distance=s.join;s.p.walkBlocked=false;}
   const show=raining&&s.age>s.delay&&(s.kind==='umbrella'||!['sheltered','release'].includes(s.phase));
   s.cover=THREE.MathUtils.damp(s.cover,show?1:0,4,dt);s.umbrella.visible=s.cover>.015;s.umbrella.scale.setScalar(Math.max(.01,s.cover));
   if(s.cover>.2){s.p.arms[0].upper.rotation.x=-.65;s.p.arms[0].fore.rotation.x=-1.05;}
   if(['sheltered','release'].includes(s.phase)){s.p.legs.forEach(l=>{l.thigh.rotation.x=0;l.shin.rotation.x=0;});s.p.arms.forEach(a=>{a.upper.rotation.x=.05;a.fore.rotation.x=-.15;});s.p.body.position.y=.51;}
  }}
 };
}
