import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildCity,buildFerris,buildCarousel} from '../src/city.js';
import {createCitizens} from '../src/citizens.js';
import {createTraffic} from '../src/traffic.js';

// Canvas stub covers sign textures only. This verifies scene logic, not WebGL.
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)})})};
const scene=new THREE.Scene();
buildCity(scene,{furnishings:true,blankSigns:true,carouselReserved:false});
const ferris=buildFerris(scene,{blankSigns:true}),carousel=buildCarousel(scene);
const people=createCitizens(scene,ferris,carousel),traffic=createTraffic(scene);
assert.equal(people.count,50);
assert.equal(traffic.vehicles.length,3);
const initial=people.citizens.filter(p=>!['street','ferris','carousel'].includes(p.area)).map(p=>[p,p.root.position.clone()]);
let smallestGap=Infinity,smallestWalkGap=Infinity;
const q=new THREE.Quaternion(),forward=new THREE.Vector3(),velocity=new THREE.Vector3(),radial=new THREE.Vector3();
for(let frame=0;frame<600*60;frame++){
  const t=frame/60;
  ferris.update(t);carousel.update(t);people.update(t,1/60);traffic.update(1/60);
  for(let i=0;i<3;i++){
    const a=traffic.vehicles[i],b=traffic.vehicles[(i+1)%3];
    const gap=((b.distance-a.distance)%traffic.length+traffic.length)%traffic.length;
    smallestGap=Math.min(smallestGap,gap);
    assert.ok(gap>=traffic.minGap-1e-7,'bus minimum spacing');
    assert.ok(Number.isFinite(a.root.position.length()),'finite bus position');
    if(a.wait>0)assert.equal(a.speed,0,'bus remains stationary during dwell');
  }
  if(frame%60!==0)continue;
  for(let i=0;i<people.walkers.length;i++)for(let j=i+1;j<people.walkers.length;j++){
    smallestWalkGap=Math.min(smallestWalkGap,people.walkers[i].root.position.distanceTo(people.walkers[j].root.position));
  }
  for(const [p,position]of initial)assert.ok(p.root.position.equals(position),'interior citizens stay at furniture anchors');
  scene.updateMatrixWorld(true);
  for(const c of ferris.cabins){c.cabin.getWorldQuaternion(q);assert.ok(new THREE.Vector3(0,1,0).applyQuaternion(q).y>.999999,'gondola stays upright');}
  for(const horse of carousel.horses){
    horse.getWorldQuaternion(q);forward.set(1,0,0).applyQuaternion(q);
    radial.copy(horse.parent.position).applyAxisAngle(new THREE.Vector3(0,1,0),carousel.spin.rotation.y);
    velocity.set(-radial.z,0,radial.x).normalize();
    assert.ok(forward.dot(velocity)>.999,'horses face the direction of travel');
  }
}
assert.ok(smallestWalkGap>.35,'sidewalk citizens do not overlap');
for(const b of traffic.vehicles)assert.ok(b.stopCount>=8,'each bus repeatedly visits real stops');
// Stress the follower constraint with a tightly queued bus stop approach.
const queue=createTraffic(new THREE.Scene());
queue.vehicles.forEach((b,i)=>{b.distance=20.8-(2-i)*3.5;b.nextStop=20.8;b.speed=1.15;});
queue.vehicles[2].wait=2.6;queue.vehicles[2].nextStop=queue.length+2.8;
for(let frame=0;frame<1800;frame++){
  queue.update(1/60);
  for(let i=0;i<3;i++){
    const gap=((queue.vehicles[(i+1)%3].distance-queue.vehicles[i].distance)%queue.length+queue.length)%queue.length;
    assert.ok(gap>=queue.minGap-1e-7,'close queue preserves leader spacing');
  }
}
scene.traverse(o=>{if(o.isMesh)for(const attribute of Object.values(o.geometry.attributes))assert.ok(attribute.array.every(Number.isFinite),'finite model geometry');});
console.log(JSON.stringify({simulatedSeconds:600,citizens:people.count,buses:3,stopsPerBus:traffic.vehicles.map(b=>b.stopCount),minimumBusGap:+smallestGap.toFixed(3),minimumWalkerGap:+smallestWalkGap.toFixed(3),gondolasUpright:true,horseDirectionCorrect:true},null,2));
