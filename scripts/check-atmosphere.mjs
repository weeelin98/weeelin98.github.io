import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildCity,buildFerris,buildCarousel} from '../src/city.js';
import {createCitizens} from '../src/citizens.js';
import {createEnvironment} from '../src/environment.js';
import {createPicker} from '../src/interactions.js';
import {createSignFeedback} from '../src/signage.js';
import {destinations} from '../src/content.js';

globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)})})};
const scene=new THREE.Scene();scene.background=new THREE.Color();
const city=buildCity(scene,{furnishings:true,blankSigns:false,carouselReserved:false});
const ferris=buildFerris(scene),carousel=buildCarousel(scene),people=createCitizens(scene,ferris,carousel);
const camera=new THREE.OrthographicCamera(-25,25,25,-25,.1,600);camera.position.set(31,29,43);camera.lookAt(0,6,0);camera.updateMatrixWorld(true);
const bounds=new THREE.Box3().setFromObject(scene);bounds.max.y=Math.max(bounds.max.y,18.47500001192093);
let hw=0,hh=0;for(const x of [bounds.min.x,bounds.max.x])for(const y of[bounds.min.y,bounds.max.y])for(const z of[bounds.min.z,bounds.max.z]){const p=new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse);hw=Math.max(hw,Math.abs(p.x));hh=Math.max(hh,Math.abs(p.y));}
const aspect=1101/1244,h=Math.max(hh,hw/aspect)*1.12;camera.left=-h*aspect;camera.right=h*aspect;camera.top=h;camera.bottom=-h;camera.updateProjectionMatrix();
const picker=createPicker(scene,city.signs),feedback=createSignFeedback(city.signs);
assert.deepEqual(destinations.map(e=>e.label),['About Me','Experience','Projects','Coffee','Contact Me','Notes']);
assert.equal(destinations.find(e=>e.label==='Notes').status,'coming-soon');
for(const sign of city.signs.filter(s=>s.userData.entry.interaction!=='decoration')){const p=sign.position.clone().project(camera);const result=picker.pick(new THREE.Vector2(p.x,p.y),camera);assert.equal(result.entry?.id,sign.userData.entry.id,`${sign.userData.entry.label} must be visible and pickable from overview`);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1);}
const target=city.signs[0],base=target.position.clone();
for(let i=0;i<180;i++)feedback.update(target,1/60,i/60);
assert.equal(target.scale.x,1,'fixed fascia stays attached');
assert.ok(target.userData.inkMeshes[0].scale.x>1.02&&target.userData.inkMeshes[0].scale.x<1.03);
// Paused simulation: hover response can settle, then loop position stays fixed.
for(let i=0;i<180;i++)feedback.update(target,1/60,3);
const pausedY=target.position.y;for(let i=0;i<180;i++)feedback.update(target,1/60,3);
assert.ok(Math.abs(target.position.y-pausedY)<1e-8);
for(let i=0;i<120;i++){feedback.update(i%2?target:null,1/60,3);assert.ok(target.scale.x<=1.055001);}
for(let i=0;i<240;i++)feedback.update(null,1/60,3);
assert.ok(target.position.distanceTo(base)<1e-8&&Math.abs(target.scale.x-1)<1e-8,'hover never accumulates transforms');
const environment=createEnvironment({scene,city,ferris,carousel,renderer:{},ambient:new THREE.HemisphereLight(),sun:new THREE.DirectionalLight(),fill:new THREE.DirectionalLight()});
let time=0;
for(const state of ['rain','sunny','night','rain','night','sunny']){
 environment.setState(state);
 for(let i=0;i<1800;i++){time+=1/60;environment.update(1/60);environment.updateView(camera,1/60,time);people.update(time,1/60,state==='rain');}
 assert.ok(environment.surroundings.sky.position.equals(camera.position));
 assert.ok(environment.surroundings.moon.position.toArray().every(Number.isFinite));
}
// The turntable preserves camera orientation; background and celestial framing
// must remain complete when panning and zooming through the supported range.
const moonScreen=environment.surroundings.moon.position.clone().project(camera),orientation=camera.quaternion.clone();
const sky=environment.surroundings.sky;
assert.equal(sky.frustumCulled,false,'full-screen sky is never world-frustum culled');
assert.equal(sky.material.depthTest,false,'sky covers clear color without writing depth');
assert.equal(sky.material.depthWrite,false);
const skyVertices=sky.geometry.attributes.position;
const screenTriangle=new THREE.Triangle(...[0,1,2].map(i=>new THREE.Vector3(skyVertices.getX(i),skyVertices.getY(i),0)));
for(const x of [-1,1])for(const y of [-1,1])assert.ok(screenTriangle.containsPoint(new THREE.Vector3(x,y,0)),'sky triangle covers every viewport corner');
for(let i=0;i<24;i++){camera.position.set(31+i*.2,29,43-i*.1);camera.quaternion.copy(orientation);camera.zoom=.8+(i%5)*.4;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);environment.updateView(camera,0,time);const p=environment.surroundings.moon.position.clone().project(camera);assert.ok(Math.hypot(p.x-moonScreen.x,p.y-moonScreen.y)<1e-8);}
assert.equal(people.count,50);
// Cloud drift and wing motion use scene time, while colors may still settle.
environment.setState('sunny');
for(let i=0;i<600;i++){environment.update(1/60,0);environment.updateView(camera,1/60,22);}
const cloudPosition=environment.surroundings.cloudGroup.position.clone();
const birdPositions=environment.surroundings.flock.children.map(b=>b.position.clone());
const wingAngles=environment.surroundings.flock.children.flatMap(b=>b.children.map(w=>w.rotation.z));
for(let i=0;i<120;i++){environment.update(1/60,0);environment.updateView(camera,1/60,22);}
assert.ok(environment.surroundings.cloudGroup.position.equals(cloudPosition));
environment.surroundings.flock.children.forEach((b,i)=>assert.ok(b.position.equals(birdPositions[i])));
assert.deepEqual(environment.surroundings.flock.children.flatMap(b=>b.children.map(w=>w.rotation.z)),wingAngles);
const luminance=c=>c.r*.2126+c.g*.7152+c.b*.0722;
for(const entry of destinations){const d=entry.design,text=new THREE.Color(d.text),base=new THREE.Color(d.fill),hover=new THREE.Color(d.hoverFill);for(let i=0;i<=10;i++){const fill=base.clone().lerp(hover,i/10),a=luminance(fill),b=luminance(text);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>4.5,`${entry.label}: text contrast during hover`);}}
console.log('Atmosphere checks passed: six overview entrances, reversible hover, Notes status, 6 environment cycles and 24 background pan/zoom views.');
