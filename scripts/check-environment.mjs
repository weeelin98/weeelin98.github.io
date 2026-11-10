import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildCity,buildFerris,buildCarousel} from '../src/city.js';
import {createCitizens} from '../src/citizens.js';
import {createEnvironment,rainFloor} from '../src/environment.js';
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)})})};
const scene=new THREE.Scene();scene.background=new THREE.Color(0xffffff);
const city=buildCity(scene,{furnishings:true,blankSigns:false,carouselReserved:false});
const ferris=buildFerris(scene),carousel=buildCarousel(scene),people=createCitizens(scene,ferris,carousel);
const ambient=new THREE.HemisphereLight(),sun=new THREE.DirectionalLight(),fill=new THREE.DirectionalLight();
scene.add(ambient,sun,fill);
const environment=createEnvironment({scene,city,ferris,carousel,ambient,sun,fill,renderer:{}});
const resources=[];scene.traverse(o=>{if(o.isMesh||o.isLineSegments||o.isLight)resources.push([o,o.geometry,o.material]);});
const interior=people.citizens.filter(p=>['office','meeting','studio','gym','restaurant','pavilion','bookshop','bakery'].includes(p.area)).map(p=>[p,p.root.position.clone()]);
let time=0,maxStep=0;
function tick(seconds,raining){for(let frame=0;frame<seconds*60;frame++){
 const before=people.citizens.map(p=>p.root.position.clone());
 time+=1/60;environment.update(1/60);people.update(time,1/60,raining);
 for(const s of people.rainResponse.states)if(raining&&['rush','approach'].includes(s.phase)&&s.age>s.delay+1)assert.ok(s.umbrella.visible&&s.cover>.8,'shelter seekers carry rain gear while outdoors');
 people.citizens.forEach((p,i)=>{maxStep=Math.max(maxStep,p.root.position.distanceTo(before[i]));assert.ok(p.root.visible,'citizens never disappear');});
}}
environment.setState('rain');tick(.5,true);
assert.ok(environment.rainAmount>0&&environment.rainAmount<1,'rain fades in');
assert.equal(people.rainResponse.states.filter(s=>s.umbrella.visible).length,0,'reactions are delayed');
tick(90,true);
const sheltered=people.rainResponse.states.filter(s=>s.phase==='sheltered');
assert.equal(sheltered.length,5,'all five shelter seekers reach cover');
for(const s of sheltered)assert.ok(rainFloor(s.p.root.position.x,s.p.root.position.z)>2,'shelter targets are under a roof');
assert.equal(people.rainResponse.states.filter(s=>s.umbrella.visible).length,7);
environment.setState('sunny');tick(100,false);
assert.ok(environment.wetness<.001,'ground dries gradually');
assert.ok(people.rainResponse.states.every(s=>s.phase==='normal'&&!s.umbrella.visible),'all citizens resume after rain');
for(let cycle=0;cycle<6;cycle++){environment.setState('rain');tick(7,true);environment.setState('night');tick(2,false);environment.setState('sunny');tick(2,false);}
environment.setState('sunny');tick(100,false);
assert.ok(people.rainResponse.states.every(s=>s.phase==='normal'),'rapid toggles leave no stuck actors');
environment.setState('night');tick(12,false);
assert.ok(environment.night>.999&&environment.windows.children[0].material.opacity<.3);
assert.ok(ambient.intensity>.5&&environment.surroundings.lunar.light.intensity>.8&&sun.intensity<.02,'night uses moonlight and cool fill, not residual sunlight');
for(const [p,position]of interior)assert.ok(p.root.position.equals(position),'covered interior actors continue in place');
for(const [o,geo,material]of resources){assert.equal(o.geometry,geo);assert.equal(o.material,material);}
assert.ok(maxStep<.06,`no teleport: maximum displacement per frame ${maxStep}`);
console.log(JSON.stringify({shelterSeekers:5,umbrellaUsers:7,rapidCycles:6,maximumStep:+maxStep.toFixed(4),stableResources:true,nightFill:true},null,2));
