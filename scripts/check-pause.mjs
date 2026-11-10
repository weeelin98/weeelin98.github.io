import assert from 'node:assert/strict';
import * as THREE from 'three';
import {SimulationClock} from '../src/simulation.js';
import {buildCity,buildFerris,buildCarousel} from '../src/city.js';
import {createCitizens} from '../src/citizens.js';
import {createTraffic} from '../src/traffic.js';
import {createEnvironment} from '../src/environment.js';

globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)})})};
const scene=new THREE.Scene();scene.background=new THREE.Color(0xffffff);
const city=buildCity(scene,{furnishings:true,blankSigns:false,carouselReserved:false}),ferris=buildFerris(scene),carousel=buildCarousel(scene);
const people=createCitizens(scene,ferris,carousel),traffic=createTraffic(scene);
const environment=createEnvironment({scene,city,ferris,carousel,renderer:{},ambient:new THREE.HemisphereLight(),sun:new THREE.DirectionalLight(),fill:new THREE.DirectionalLight()});
const clock=new SimulationClock(0);let now=0;
function step(){now+=1000/60;const {wallDelta,delta,time}=clock.tick(now);environment.update(wallDelta,delta);if(delta){ferris.update(time);carousel.update(time);people.update(time,delta,environment.state==='rain');traffic.update(delta);}}
environment.setState('rain');for(let i=0;i<600;i++)step();
clock.paused=true;
const frozenTime=clock.time,angle=ferris.wheel.rotation.z,horse=carousel.horses[0].position.y,busDistances=traffic.vehicles.map(b=>b.distance),positions=people.citizens.map(p=>p.root.position.clone());
const rain=environment.rain.drops.geometry.attributes.position.array.slice(),ripples=environment.rain.ripples.instanceMatrix.array.slice();
for(const state of ['night','sunny','rain','night']){environment.setState(state);for(let i=0;i<600;i++)step();}
assert.equal(clock.time,frozenTime);assert.equal(ferris.wheel.rotation.z,angle);assert.equal(carousel.horses[0].position.y,horse);
assert.deepEqual(traffic.vehicles.map(b=>b.distance),busDistances);
people.citizens.forEach((p,i)=>assert.ok(p.root.position.equals(positions[i])));
assert.deepEqual(environment.rain.drops.geometry.attributes.position.array,rain);
assert.deepEqual(environment.rain.ripples.instanceMatrix.array,ripples);
assert.ok(environment.night>.999,'environment transitions run while animation is paused');
clock.paused=false;step();assert.ok(clock.time-frozenTime<.02,'resume has no catch-up jump');
clock.rebase(100000);const next=clock.tick(100016);assert.ok(next.delta<.02,'visibility rebase avoids a time jump');
console.log('Pause checks passed: actors, buses, rides, rain and ripples freeze; environment remains live; resume and hidden-tab recovery do not catch up.');
