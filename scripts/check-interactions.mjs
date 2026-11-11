import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createPicker,CameraFlight} from '../src/interactions.js';
import {destinations,locations} from '../src/content.js';

const scene=new THREE.Scene();
const sign=new THREE.Mesh(new THREE.BoxGeometry(1,.7,.1),new THREE.MeshBasicMaterial());
sign.userData.entry=destinations[0];scene.add(sign);
const blocker=new THREE.Mesh(new THREE.BoxGeometry(3,3,1),new THREE.MeshBasicMaterial());blocker.position.set(0,0,5);scene.add(blocker);
const camera=new THREE.OrthographicCamera(-2,2,2,-2,.1,100);camera.position.set(0,0,10);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
const picker=createPicker(scene,[sign]);
assert.notEqual(picker.pick(new THREE.Vector2(0,0),camera).type,'content','opaque geometry hides the sign');
blocker.position.x=6;
assert.equal(picker.pick(new THREE.Vector2(0,0),camera).type,'content','visible sign takes priority over its building');
assert.equal(picker.pick(new THREE.Vector2(.30,0),camera).type,'content','small signs have padded hit targets');
assert.notEqual(picker.pick(new THREE.Vector2(.45,0),camera).type,'content','hit expansion is bounded');
camera.position.z=-10;camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
assert.notEqual(picker.pick(new THREE.Vector2(0,0),camera).type,'content','sign backs are not clickable');

camera.position.set(31,29,43);const controls={target:new THREE.Vector3(0,6,0),enableDamping:true,update(){camera.lookAt(this.target);}};controls.update();
const flight=new CameraFlight(camera,controls);const home=camera.position.clone();
for(const place of locations){
 flight.go(place.camera);const start=flight.active.start;
 for(let ms=0;ms<=1500;ms+=10){flight.update(start+ms);assert.ok(camera.position.toArray().every(Number.isFinite));assert.ok(camera.position.y>19||Math.hypot(camera.position.x,camera.position.z)>24,'camera stays above or outside the city');}
 assert.ok(controls.target.distanceTo(new THREE.Vector3(...place.camera.target))<1e-8);
 assert.equal(camera.zoom,place.camera.zoom);
}
flight.go();flight.update(flight.active.start+1500);assert.ok(camera.position.distanceTo(home)<1e-8);assert.equal(camera.zoom,1);
flight.go(locations[0].camera);flight.update(flight.active.start+500);flight.cancel();const canceled=camera.position.clone();flight.update(performance.now()+2000);assert.ok(camera.position.equals(canceled),'manual interrupt freezes the automatic flight');
for(const entry of destinations){assert.equal(entry.interaction,entry.id==='memo'?'decoration':'content');assert.ok(entry.regionId);assert.ok(entry.camera);assert.equal(typeof entry.href,'string');}
console.log('Interaction checks passed: occlusion, hit padding, sign priority/backface, 9 camera targets, overview return, manual interrupt and content configuration.');
