import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createDisplayController,worldFocus} from '../src/display.js';
import {createPicker,CameraFlight} from '../src/interactions.js';
import {buildCity,buildFerris,buildCarousel} from '../src/city.js';
import {createEnvironment} from '../src/environment.js';
import {locations} from '../src/content.js';

globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)})})};
globalThis.addEventListener=()=>{};
const scene=new THREE.Scene(),root=new THREE.Group();scene.background=new THREE.Color();scene.add(root);
const city=buildCity(root,{furnishings:true,blankSigns:false,carouselReserved:false}),ferris=buildFerris(root),carousel=buildCarousel(root);
const sun=new THREE.DirectionalLight(),fill=new THREE.DirectionalLight(),ambient=new THREE.HemisphereLight();
sun.target.position.set(0,4,0);sun.position.copy(sun.target.position).addScaledVector(new THREE.Vector3(-13,30,18).normalize(),95);scene.add(sun,sun.target,fill,ambient);
Object.assign(sun.shadow.camera,{left:-58,right:58,top:58,bottom:-58,near:1,far:185});sun.shadow.camera.updateProjectionMatrix();
const camera=new THREE.OrthographicCamera(-30,30,32,-32,.1,600);camera.position.set(31,29,43);
const controls={target:new THREE.Vector3(0,6,0),enabled:true,update(){camera.lookAt(this.target);camera.updateMatrixWorld(true);}};controls.update();
const events={},canvas={clientWidth:1101,addEventListener:(name,fn)=>events[name]=fn,setPointerCapture(){}};
const display=createDisplayController(root,canvas,controls),flight=new CameraFlight(camera,controls,display);display.onStart=()=>flight.cancel();
const picker=createPicker(scene,city.signs,root),environment=createEnvironment({scene,city,ferris,carousel,sun,fill,ambient,renderer:{shadowMap:{}},displayRoot:root});
const moon=environment.surroundings.lunar,source=moon.light.position.clone(),sunPosition=sun.position.clone(),orientation=camera.quaternion.clone();
assert.equal(sun.parent,scene);assert.equal(moon.light.parent,scene);assert.equal(moon.body.parent,scene);
assert.ok(environment.lights.every(([light])=>light.parent===root),'interior illumination follows its building');
assert.equal(controls.enableRotate,false);assert.equal(controls.enableDamping,false);

events.pointerdown({button:0,pointerId:1,clientX:200});events.pointermove({pointerId:1,clientX:350});events.pointerup();
assert.ok(Math.abs(root.rotation.y-150/1101*Math.PI*1.8)<1e-9,'left drag rotates the model itself');
const stopped=root.rotation.y;events.pointermove({pointerId:1,clientX:600});assert.equal(root.rotation.y,stopped,'release has no residual rotation');
assert.ok(camera.quaternion.angleTo(orientation)<1e-8,'drag does not orbit the camera');

const localPoint=new THREE.Vector3(3,6,-2),localNormal=new THREE.Vector3(0,0,1),values={sun:[],moon:[]},shadowPoints={sun:[],moon:[]};
let picked=0;
for(let i=0;i<24;i++){
 display.setAngle(i/24*Math.PI*2);scene.updateMatrixWorld(true);
 for(const [name,light]of [['sun',sun],['moon',moon.light]]){
  const toward=light.position.clone().sub(light.target.position).normalize();
  const worldNormal=localNormal.clone().transformDirection(root.matrixWorld);values[name].push(worldNormal.dot(toward));
  // A physical parallel ray lands opposite the source; transform the resulting
  // world shadow back to the display to verify it changes relative to the model.
  const point=root.localToWorld(localPoint.clone()),shadow=point.clone().addScaledVector(toward,-point.y/toward.y);
  assert.ok(Math.abs(shadow.y)<1e-8);root.worldToLocal(shadow);
  shadowPoints[name].push(shadow);
  light.shadow.updateMatrices(light);
  for(const x of [-16.5,16.5])for(const z of [-14.5,14.5])for(const y of[-.63,18.5]){
   const p=root.localToWorld(new THREE.Vector3(x,y,z)).project(light.shadow.camera);
   assert.ok(Math.max(Math.abs(p.x),Math.abs(p.y),Math.abs(p.z))<1,'rotated model stays inside shadow frustum');
  }
 }
 for(const sign of city.signs){
  const p=sign.getWorldPosition(new THREE.Vector3()).project(camera),result=picker.pick(new THREE.Vector2(p.x,p.y),camera);
  if(result.type==='content'){assert.equal(result.entry.id,sign.userData.entry.id);picked++;}
 }
}
assert.ok(picked>=24,'rotated visible sign pads remain aligned with real signs');
assert.ok(values.sun.some(v=>v>.3)&&values.sun.some(v=>v<-.3));assert.ok(values.moon.some(v=>v>.5)&&values.moon.some(v=>v<-.5),'different real facade normals face the stable source');
for(const points of Object.values(shadowPoints))assert.ok(points[0].distanceTo(points[12])>4,'physical shadow landing changes relative to rotating ground');
assert.ok(moon.light.position.equals(source)&&sun.position.equals(sunPosition));

display.setAngle(.7);
for(const place of locations){
 const target=worldFocus(place.camera,root),angle=root.rotation.y;
 flight.go(place.camera);const start=flight.active.start;
 for(let ms=0;ms<=1500;ms+=20){flight.update(start+ms);assert.ok(camera.quaternion.angleTo(orientation)<1e-7,'focus keeps celestial direction stable');}
 assert.ok(controls.target.distanceTo(target)<1e-8);assert.equal(root.rotation.y,angle);
}
flight.go(locations[0].camera);flight.update(flight.active.start+300);events.pointerdown({button:0,pointerId:2,clientX:100});assert.equal(flight.active,null);events.pointerup();
flight.go();flight.update(flight.active.start+1500);assert.ok(Math.abs(root.rotation.y%(Math.PI*2))<1e-8);assert.ok(controls.target.distanceTo(new THREE.Vector3(0,6,0))<1e-8);
console.log('Display checks passed: real turntable drag, immediate stop, independent sun/moon, rotating facade lighting/shadow coverage, transformed sign picking, focus, return and interruption.');
