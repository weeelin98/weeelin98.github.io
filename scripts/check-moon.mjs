import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createMoon,MOON_POSITION,MOON_TARGET} from '../src/moon.js';
import {createEnvironment} from '../src/environment.js';
import {buildCity,buildFerris,buildCarousel} from '../src/city.js';

globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)})})};
const scene=new THREE.Scene();scene.background=new THREE.Color();
const city=buildCity(scene,{furnishings:true,blankSigns:false,carouselReserved:false}),ferris=buildFerris(scene),carousel=buildCarousel(scene);
const renderer={shadowMap:{needsUpdate:false}},sun=new THREE.DirectionalLight(),ambient=new THREE.HemisphereLight(),fill=new THREE.DirectionalLight();scene.add(sun,ambient,fill);
const env=createEnvironment({scene,city,ferris,carousel,sun,ambient,fill,renderer}),lunar=env.surroundings.lunar;
assert.equal(lunar.body.geometry.type,'SphereGeometry');assert.ok(lunar.body.material.isMeshStandardMaterial&&lunar.body.material.emissiveIntensity>0);
assert.ok(lunar.body.material.map.isDataTexture&&lunar.light.isDirectionalLight&&lunar.light.castShadow);
assert.ok(lunar.body.position.equals(MOON_POSITION));
assert.ok(lunar.light.position.clone().sub(lunar.light.target.position).normalize().dot(MOON_POSITION.clone().sub(MOON_TARGET).normalize())>.999999);
const resources=[lunar.body.geometry,lunar.body.material,lunar.body.material.map,lunar.halo.geometry,lunar.light.shadow];
const camera=new THREE.OrthographicCamera(-24,24,25,-25,.1,600);
camera.position.set(31,29,43);camera.lookAt(0,6,0);camera.updateMatrixWorld(true);
const orientation=camera.quaternion.clone(),source=lunar.light.position.clone();
const projection=()=>{camera.updateMatrixWorld(true);return lunar.body.position.clone().project(camera);};
lunar.updateView(camera);const screenPosition=projection(),apparentRadius=lunar.body.scale.x/camera.top*camera.zoom;
assert.ok(materialAmber(lunar.body.material.emissive),'moon body is amber, while its actual light is pale');
function materialAmber(c){return c.r>c.g*1.8&&c.g>c.b*2;}
for(let cycle=0;cycle<4;cycle++)for(const state of ['night','sunny','night','rain']){
 env.setState(state);
 for(let frame=0;frame<600;frame++){
  env.update(1/60,0);
  assert.ok(!(sun.intensity>1&&lunar.light.intensity>.5),'strong double illumination is avoided');
 }
 for(let i=0;i<16;i++){
  camera.position.set(31+i*.4,29+i*.2,43-i*.3);camera.quaternion.copy(orientation);camera.zoom=.8+(i%5)*.4;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  env.updateView(camera,1/60,10);
  const p=projection();assert.ok(Math.hypot(p.x-screenPosition.x,p.y-screenPosition.y)<1e-8,'moon stays at the same sky position through pan and focus');
  assert.ok(Math.abs(lunar.body.scale.x/camera.top*camera.zoom-apparentRadius)<1e-8,'zoom cannot enlarge the distant moon');
  assert.ok(lunar.light.position.equals(source),'celestial framing never moves the real illumination source');
  assert.ok(lunar.light.position.clone().sub(lunar.light.target.position).normalize().dot(lunar.direction)>.999999);
 }
}
env.setState('night');for(let i=0;i<1200;i++)env.update(1/60);
assert.ok(sun.intensity<.001&&lunar.light.intensity>1);
scene.updateMatrixWorld(true);lunar.light.shadow.updateMatrices(lunar.light);
// Cover both the model/base and all four peripheral tree crowns in light space.
const samples=[];for(const x of [-16.5,16.5])for(const y of[-.63,18.5])for(const z of[-14.5,14.5])samples.push(new THREE.Vector3(x,y,z));
for(let i=0;i<4;i++){const a=.7+i*Math.PI/2;samples.push(new THREE.Vector3(Math.cos(a)*42,3,Math.sin(a)*42));}
for(let i=0;i<24;i++)for(const p of samples){const q=p.clone().applyAxisAngle(new THREE.Vector3(0,1,0),i/24*Math.PI*2).project(lunar.light.shadow.camera);assert.ok(Math.abs(q.x)<1&&Math.abs(q.y)<1&&Math.abs(q.z)<1,'lunar shadow projection covers rotating city/base/trees');}
assert.deepEqual([lunar.body.geometry,lunar.body.material,lunar.body.material.map,lunar.halo.geometry,lunar.light.shadow],resources);
env.requestShadows();assert.equal(sun.shadow.needsUpdate,false);assert.equal(lunar.light.shadow.needsUpdate,true);
console.log('Moon checks passed: amber emissive sphere, fixed real light, stable sky position/apparent size, rotating shadow coverage, crossfades and resource reuse.');
