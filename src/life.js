import * as THREE from 'three';
import { box, cyl, ball, rod, C, mat } from './city.js';

// Seeded variation: stable citizens and outfits across reloads.
let seed=84021;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const skins=[0xf2c49c,0xce976f,0x875b43,0xe0b088,0xb77751];
const clothes=[0xcb704c,0x365b80,0xeac75e,0x73a797,0xf3e7cd,0xb87085,0x4c7062];
function person(parent,index){const g=new THREE.Group();parent.add(g);const skin=skins[index%skins.length],shirt=clothes[(index*3)%clothes.length];
 cyl(g,0,.7,0,.15,.44,shirt);ball(g,0,1.1,0,.145,skin);ball(g,0,1.18,-.025,.145,[0x45332b,0x67513b,0x302e2c,0xa67445][index%4]);
 if(index%3===0)box(g,0,1.08,-.1,.27,.26,.12,0x45332b);
 box(g,0,1.08,.12,.18,.13,.045,skin);
 const limbs=[];for(let side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.2,.88,0);g.add(arm);cyl(arm,0,-.13,0,.045,.27,shirt);ball(arm,0,-.31,0,.05,skin);limbs.push(arm);const leg=new THREE.Group();leg.position.set(side*.085,.5,0);g.add(leg);box(leg,0,-.2,0,.11,.4,.12,index%3?C.dark:0x746346);box(leg,0,-.4,.04,.13,.08,.22,0x3a4039);limbs.push(leg);}
 const umbrella=new THREE.Group();umbrella.visible=false;umbrella.position.set(.18,.8,.05);g.add(umbrella);rod(umbrella,[0,0,0],[0,1.02,0],.015,C.gold);let cap=new THREE.Mesh(new THREE.ConeGeometry(.62,.24,10),mat([C.yellow,C.terra,C.mint][index%3]));cap.position.y=1.05;umbrella.add(cap);return {g,limbs,umbrella};
}

export function createPeople(scene){const root=new THREE.Group();scene.add(root);const citizens=[];
 const route=new THREE.CatmullRomCurve3([new THREE.Vector3(-10.6,.35,9.3),new THREE.Vector3(0,.35,9.3),new THREE.Vector3(10.8,.35,8.9),new THREE.Vector3(11,.35,0),new THREE.Vector3(10.8,.35,-8.9),new THREE.Vector3(0,.35,-9),new THREE.Vector3(-10.8,.35,-8.8),new THREE.Vector3(-11,.35,0)],true,'catmullrom',.1);
 for(let i=0;i<22;i++){const p=person(root,i);p.progress=i/22;p.speed=.0045+random()*.003;p.phase=random()*10;p.outdoor=true;p.rainDelay=random()*4;p.g.scale.setScalar(.74+random()*.16);citizens.push(p);}
 const rooms=[[-8.5, .58,-3.1],[-7,.58,-3.7],[-8.5,3.13,-3.1],[-7,5.68,-3.7],[-8.4,8.23,-3],[-7,10.78,-3.7],[-7.5,13.55,-3.6],[-1.5,.6,-2],[1.5,3.3,-2],[-1.4,6,-2],[1.4,6,-2],[-1,8.7,-2],[1,11.4,-2.6],[0,14,-3],[-1.7,3.35,1],[1.8,6.05,.7],[7.4,.6,-3],[8.6,3.5,-3],[7.4,6.4,-3],[8,9.5,-3],[1.4,.6,4.6],[5,.6,4],[3,3.1,4],[5.2,3.1,4.6],[1.7,5.7,4],[5,5.7,4],[-7.5,.35,8.9],[-9.5,.35,4.7]];
 rooms.forEach((pos,j)=>{const p=person(root,j+22);p.g.position.set(...pos);p.g.rotation.y=random()*Math.PI*2;p.g.scale.setScalar(.8);p.phase=random()*10;p.baseY=pos[1];p.activity=j%4;citizens.push(p);});
 let rainAge=0;
 return {count:citizens.length,update(t,dt,raining){rainAge=raining?rainAge+dt:0;citizens.forEach((p,i)=>{if(p.outdoor){const useUmbrella=raining&&rainAge>p.rainDelay;p.umbrella.visible=useUmbrella;
  // Citizens keep walking with umbrellas; late reactions avoid synchronous changes.
  p.progress=(p.progress+dt*p.speed*(useUmbrella?1.2:1))%1;const point=route.getPointAt(p.progress),next=route.getPointAt((p.progress+.001)%1);p.g.position.copy(point);p.g.rotation.y=Math.atan2(next.x-point.x,next.z-point.z);const stride=Math.sin(t*5+p.phase)*.35;p.limbs[0].rotation.x=stride;p.limbs[2].rotation.x=-stride;p.limbs[1].rotation.x=-stride;p.limbs[3].rotation.x=stride;p.g.position.y+=Math.abs(Math.sin(t*5+p.phase))*.025;
 }else{p.g.rotation.z=Math.sin(t*.7+p.phase)*.025;p.limbs[0].rotation.x=p.activity===0?-.85+Math.sin(t*1.1+p.phase)*.08:Math.sin(t*.8+p.phase)*.13;p.limbs[2].rotation.x=p.activity===1?-.8+Math.sin(t*.7+p.phase)*.16:.08;}});}};
}

export function createBuses(scene){const path=new THREE.CatmullRomCurve3([new THREE.Vector3(-11.8,.24,11.5),new THREE.Vector3(0,.24,11.5),new THREE.Vector3(11.8,.24,11.5),new THREE.Vector3(13.5,.24,9.8),new THREE.Vector3(13.5,.24,-9.8),new THREE.Vector3(11.8,.24,-11.5),new THREE.Vector3(-11.8,.24,-11.5),new THREE.Vector3(-13.5,.24,-9.8),new THREE.Vector3(-13.5,.24,9.8)],true,'catmullrom',.12);
 const buses=[];for(let i=0;i<3;i++){const g=new THREE.Group();scene.add(g);box(g,0,.63,0,.9,.88,2.1,[C.mint,C.terra,C.yellow][i]);box(g,0,1.1,0,.95,.12,2.15,C.cream);box(g,0,.76,1.06,.72,.4,.035,0x355a63);box(g,0,.76,-1.06,.72,.4,.035,0x355a63);for(let x of [-.46,.46]){for(let z of [-.64,0,.64])box(g,x,.82,z,.025,.38,.49,0x355a63);for(let z of [-.67,.67]){const wheel=cyl(g,x,.28,z,.22,.12,C.dark);wheel.rotation.z=Math.PI/2;}}for(let x of [-.3,.3])box(g,x,.45,1.085,.15,.1,.035,0xffedba);buses.push({g,progress:i/3,wait:0,lastStop:-1});}
 const stops=[path.getUtoTmapping? .15:.15,.84];
 return {update(dt){for(let i=0;i<3;i++){let b=buses[i];if(b.wait>0)b.wait-=dt;else{const next=(b.progress+dt*.012)%1;const front=buses[(i+1)%3];const gap=(front.progress-b.progress+1)%1;if(gap>.055){for(let j=0;j<stops.length;j++){if(b.progress<stops[j]&&next>=stops[j]){b.wait=2.4;b.lastStop=j;}}b.progress=next;}}const p=path.getPointAt(b.progress),q=path.getPointAt((b.progress+.0003)%1);b.g.position.copy(p);b.g.rotation.y=Math.atan2(q.x-p.x,q.z-p.z);}}};
}

export function createRain(scene){const count=1300,positions=new Float32Array(count*6),speeds=new Float32Array(count);for(let i=0;i<count;i++){const k=i*6;positions[k]=random()*38-19;positions[k+1]=random()*26;positions[k+2]=random()*34-17;positions[k+3]=positions[k]-.06;positions[k+4]=positions[k+1]+.38;positions[k+5]=positions[k+2];speeds[i]=10+random()*9;}
 const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.BufferAttribute(positions,3));const material=new THREE.LineBasicMaterial({color:0x97b6c4,transparent:true,opacity:0,depthWrite:false});const rain=new THREE.LineSegments(geom,material);rain.frustumCulled=false;scene.add(rain);return {update(dt,intensity){material.opacity=intensity*.47;rain.visible=intensity>.005;if(!rain.visible)return;for(let i=0;i<count;i++){let k=i*6;positions[k+1]-=dt*speeds[i];positions[k]-=dt*.7;if(positions[k+1]<.4){positions[k+1]=22+random()*4;positions[k]=random()*38-19;}positions[k+3]=positions[k]-.06;positions[k+4]=positions[k+1]+.38;positions[k+5]=positions[k+2];}geom.attributes.position.needsUpdate=true;}};
}
