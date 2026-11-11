import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import * as THREE from 'three';
import {buildCity,buildFerris,buildCarousel} from '../src/city.js';
import {createCitizens} from '../src/citizens.js';
import {createTraffic} from '../src/traffic.js';
import {createEnvironment} from '../src/environment.js';
import {createEnvironmentCycle,localDay} from '../src/environment-cycle.js';
import {exposedSurfaces} from '../src/snow.js';
import {createPicker} from '../src/interactions.js';

globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)})})};
const clockDate=(h,m=0)=>new Date(2026,10,10,h,m);
assert.equal(localDay(clockDate(5,59)),'night');assert.equal(localDay(clockDate(6)),'day');assert.equal(localDay(clockDate(17,59)),'day');assert.equal(localDay(clockDate(18)),'night');
let now=clockDate(8),stub={day:'day',weather:'clear',setDay(v){this.day=v;},setWeather(v){this.weather=v;}},cycle=createEnvironmentCycle(stub,{now:()=>now});
assert.equal(stub.weather,'snow','winter welcome starts with snow');cycle.update(299,299);assert.equal(stub.weather,'snow');cycle.update(1,1);assert.equal(stub.weather,'clear');
cycle.selectWeather('snow');cycle.update(900,900);assert.equal(stub.weather,'snow');assert.equal(cycle.dayMode,'auto');
now=clockDate(22);cycle.update(0,25);assert.equal(stub.day,'night','local clock keeps updating while life is paused');
cycle.selectDay('day');cycle.selectWeather('auto');assert.equal(stub.weather,'snow');assert.equal(cycle.elapsed,0);cycle.update(300);assert.equal(stub.weather,'clear');assert.equal(stub.day,'day');
cycle.selectDay('auto');assert.equal(stub.day,'night');cycle.update(250);const elapsed=cycle.elapsed;cycle.setVisible(false);now=clockDate(9);cycle.update(900,900);assert.equal(cycle.elapsed,elapsed);cycle.setVisible(true);assert.equal(stub.day,'day');cycle.update(0,300);assert.equal(cycle.elapsed,elapsed,'pause does not advance automatic weather');cycle.update(50);assert.equal(stub.weather,'rain','visible active time resumes without replay');

const matrix=y=>new THREE.Matrix4().makeTranslation(0,y,0),exposure=exposedSurfaces([{w:4,d:4,h:.2,matrix:matrix(3)},{w:1,d:1,h:.1,matrix:matrix(1)}]);
assert.ok(exposure.caps.every(c=>c.matrix.elements[13]>3),'covered indoor furniture cannot receive snow');
assert.ok(exposure.floorAt(0,0)>3,'flakes stop at the topmost cover');
const scene=new THREE.Scene(),root=new THREE.Group();scene.background=new THREE.Color();scene.add(root);
const city=buildCity(root,{furnishings:true,blankSigns:false,carouselReserved:false}),ferris=buildFerris(root),carousel=buildCarousel(root),people=createCitizens(root,ferris,carousel),traffic=createTraffic(root);
const buildingBounds=new THREE.Box3().setFromObject(city.city),geometry=city.city.children.map(m=>m.geometry),signPlacements=city.signs.map(s=>s.position.clone());
const picker=createPicker(scene,city.signs,root),sun=new THREE.DirectionalLight(),ambient=new THREE.HemisphereLight(),fill=new THREE.DirectionalLight();scene.add(sun,ambient,fill);
const environment=createEnvironment({scene,displayRoot:root,city,ferris,carousel,people,sun,ambient,fill,renderer:{shadowMap:{},getPixelRatio:()=>1}});
const resources=[];scene.traverse(o=>{if(o.geometry||o.material)resources.push([o,o.geometry,o.material]);});
assert.ok(environment.snow.caps.length>40&&environment.snow.caps.length<2000,'bounded reusable cap count');
assert.equal(environment.winter.shovelers.length,2);assert.ok(environment.winter.gear.length>=12);assert.equal(people.count,50);assert.equal(traffic.vehicles.length,3);
const indoor=people.citizens.filter(p=>['office','studio','gym','restaurant','meeting','pavilion','bookshop','bakery'].includes(p.area)).map(p=>[p,p.root.position.clone()]);
let time=0,maxStep=0;
function tick(seconds,paused=false){for(let i=0;i<Math.round(seconds*30);i++){const dt=1/30,active=paused?0:dt,before=people.citizens.map(p=>p.root.position.clone());time+=active;environment.update(dt,active);if(active){people.update(time,dt,environment.weather==='rain',environment.weather==='snow');environment.updateLife(time,dt);traffic.update(dt);ferris.update(time);carousel.update(time);}people.citizens.forEach((p,j)=>maxStep=Math.max(maxStep,p.root.position.distanceTo(before[j])));}}
const start=performance.now();
const manualCycle=createEnvironmentCycle(environment,{now:()=>clockDate(8)});
assert.equal(environment.weather,'snow');assert.equal(environment.snowCover,1,'first frame has a snowy city');
for(const outfit of environment.winter.gear){
 const coat=outfit.parts[0];coat.updateMatrixWorld(true);const size=new THREE.Box3().setFromObject(coat).getSize(new THREE.Vector3());
 assert.ok(Math.max(size.x,size.z)<.4&&size.y<.5,'coats remain proportional to a roughly 1.2-unit-tall citizen');
}
manualCycle.selectDay('night');tick(.3);assert.ok(environment.night>.02,'manual daylight responds visibly within 300ms');tick(2);assert.equal(environment.night,1);
manualCycle.selectWeather('rain');tick(3);assert.equal(environment.rainAmount,1);assert.equal(environment.day,'night','manual Rain preserves Night');
const pausedSnow=environment.snowfall.flakes.geometry.attributes.position.array.slice();manualCycle.selectWeather('snow');tick(3,true);assert.equal(environment.snowAmount,1);assert.deepEqual(environment.snowfall.flakes.geometry.attributes.position.array,pausedSnow,'manual weather fades while snow motion is paused');
manualCycle.selectDay('day');tick(2);assert.equal(environment.weather,'snow');assert.equal(environment.night,0);
manualCycle.selectWeather('auto');assert.equal(environment.weather,'snow');assert.equal(manualCycle.elapsed,0);
manualCycle.selectWeather('clear');tick(40);environment.setDay('day');
const park=environment.surroundings.park;
assert.equal(park.grass.parent.parent,root,'park rotates together with the city to keep path connections attached');
assert.ok(park.stream.isMesh&&park.bridge.children.length>10&&park.path.isMesh);
assert.ok(new Set(park.clusters.map(c=>c.trees)).size>1,'planting groups use unequal density');
assert.ok(park.grass.geometry.attributes.position.count<20000,'bounded continuous terrain geometry');
for(let i=0;i<24;i++){const p=new THREE.Vector3(16.5,0,14.5).applyAxisAngle(new THREE.Vector3(0,1,0),i/24*Math.PI*2);assert.ok(park.terrainHeight(p.x,p.z)<-.6,'all rotating base corners remain above the park terrain');}
environment.setWeather('snow');tick(1);assert.ok(environment.snowAmount>0&&environment.snowCover<.001,'snow starts before new accumulation');tick(24);
assert.ok(environment.snowCover>.99);assert.ok(environment.winter.gear.every(s=>s.amount>.98));
for(const s of environment.winter.shovelers)assert.ok(s.p.root.position.distanceTo(s.target)<.01&&s.tool.visible,'fixed shovel stations are reached gradually');
const particles=environment.snowfall.flakes.geometry.attributes.position.array;
for(let i=0;i<particles.length;i+=3)assert.ok(particles[i+1]>=environment.snow.floorAt(particles[i],particles[i+2])+.09,'snow never remains below roofs');
const frozen=particles.slice(),poses=people.citizens.map(p=>p.root.position.clone()),bus=traffic.vehicles.map(b=>b.distance),angle=ferris.wheel.rotation.z;
environment.setDay('night');tick(12,true);assert.ok(environment.night>.999&&environment.snowAmount>.999,'night snow is independent');assert.deepEqual(particles,frozen);assert.deepEqual(traffic.vehicles.map(b=>b.distance),bus);assert.equal(ferris.wheel.rotation.z,angle);people.citizens.forEach((p,i)=>assert.ok(p.root.position.equals(poses[i])));
for(const day of ['day','night'])for(const weather of ['clear','rain','snow']){environment.setDay(day);environment.setWeather(weather);tick(12);assert.equal(environment.day,day);assert.equal(environment.weather,weather);assert.ok(Math.abs(environment.night-(day==='night'?1:0))<.001);assert.ok(Math.abs(environment.rainAmount-(weather==='rain'?1:0))<.001);assert.ok(Math.abs(environment.snowAmount-(weather==='snow'?1:0))<.001);}
for(let i=0;i<18;i++){environment.setDay(i%2?'day':'night');environment.setWeather(['snow','rain','clear'][i%3]);tick(.35,i%4===0);}
environment.setDay('night');environment.setWeather('clear');tick(40);assert.equal(environment.night,1);assert.ok(environment.snowCover<.001);assert.ok(environment.winter.gear.every(s=>s.amount<.001));
for(const s of environment.winter.shovelers)assert.ok(s.p.root.position.distanceTo(s.home)<.01&&!s.tool.visible);
for(const [p,pos]of indoor)assert.ok(p.root.position.equals(pos),'interior activities keep their original anchors');
assert.ok(maxStep<.09,'no weather teleportation');
assert.ok(new THREE.Box3().setFromObject(city.city).equals(buildingBounds));assert.deepEqual(city.city.children.map(m=>m.geometry),geometry);city.signs.forEach((s,i)=>assert.ok(s.position.equals(signPlacements[i])));
for(const [o,g,m]of resources){assert.equal(o.geometry,g);assert.equal(o.material,m);}
const camera=new THREE.OrthographicCamera(-27,27,31,-31,.1,600);camera.position.set(31,29,43);camera.lookAt(0,6,0);camera.updateMatrixWorld(true);
for(const sign of city.signs.filter(s=>s.userData.entry.interaction!=='decoration')){const p=sign.getWorldPosition(new THREE.Vector3()).project(camera);assert.equal(picker.pick(new THREE.Vector2(p.x,p.y),camera).entry?.id,sign.userData.entry.id);}
console.log(JSON.stringify({winterChecks:'passed',snowCaps:environment.snow.caps.length,flakes:environment.snowfall.count,winterPeople:environment.winter.gear.length,shovelers:2,combinations:6,rapidSwitches:18,maximumActorStep:+maxStep.toFixed(4),cpuSimulationSeconds:+((performance.now()-start)/1000).toFixed(2),resourceIdentity:'stable',autoWeather:'active time only',manualWeather:'responsive including paused mode',park:'finite terrain, varied clusters, path, creek and bridge'},null,2));
