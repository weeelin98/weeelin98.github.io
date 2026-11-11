import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {destinations} from '../src/content.js';
import {makeNavigationSign,createSignFeedback} from '../src/signage.js';
import {createPicker} from '../src/interactions.js';
import {updateSignIllumination} from '../src/sign-lighting.js';
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>new Proxy({},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)})})};

assert.equal(new Set(destinations.map(e=>e.design.shape)).size,6,'six independent silhouettes');
assert.equal(new Set(destinations.map(e=>e.design.font)).size,3,'three actual type families');
for(const name of ['LilitaOne-Regular.ttf','Bungee-Regular.ttf','Fredoka-Variable.ttf']){
 const bytes=readFileSync(`public/fonts/${name}`);assert.equal(bytes.readUInt32BE(0),0x00010000);assert.ok(bytes.length>10000);
}
for(const entry of destinations){
 assert.ok(entry.design.thickness>=.2);assert.ok(entry.design.fill&&entry.design.hoverFill&&entry.design.text);
 const sign=makeNavigationSign(entry),start=sign.position.clone(),feedback=createSignFeedback([sign]);
 const fx=sign.userData.illumination;
 if(entry.id==='contact')assert.equal(fx,undefined,'Contact has no neon border or spill light');
 if(entry.id==='cv')assert.ok(entry.size[0]>entry.size[1]*2,'Experience is horizontal');
 if(entry.id==='projects'){
  assert.ok(sign.userData.fillMaterial.isMeshStandardMaterial,'Projects uses an emissive lightbox surface');
  assert.equal(fx.light.color.getHex(),0xffce70,'Projects spill is warm yellow');
 }
 if(['about','cv','notes','projects'].includes(entry.id)){
  assert.ok(fx&&fx.materials.length>0);assert.equal(fx.light.castShadow,false);
  updateSignIllumination([sign],0,5);const dayPower=fx.light.intensity;
  updateSignIllumination([sign],1,5);assert.ok(fx.light.intensity>dayPower);
  const materialRefs=[...fx.materials];updateSignIllumination([sign],1,12.08);
  assert.deepEqual(fx.materials,materialRefs,'light transitions reuse materials');
  updateSignIllumination([sign],1,5,true);const reduced=fx.light.intensity;
  updateSignIllumination([sign],1,12.08,true);assert.equal(fx.light.intensity,reduced,'reduced motion removes flicker');
 }
 for(let i=0;i<600;i++)feedback.update(i%7?sign:null,1/60,i/60);
 assert.ok(sign.position.equals(start),'mount origin is never animated');
 if(entry.design.motion==='fixed'){
  assert.equal(sign.userData.motionGroup.rotation.z,0);assert.equal(sign.scale.x,1);
  assert.ok(sign.userData.inkMeshes.every(m=>m.scale.x<=1.02501));
 }else assert.ok(Math.abs(sign.userData.motionGroup.rotation.z)<=.01001,'hanging sway is restrained');
 for(let i=0;i<240;i++)feedback.update(null,1/60,10);
 assert.ok(Math.abs(sign.userData.motionGroup.rotation.z)<1e-8);
}
const memoEntry=destinations.find(e=>e.id==='memo'),memo=makeNavigationSign({...memoEntry,interaction:'content',position:[0,0,0],rotation:0});
const scene=new THREE.Scene();scene.add(memo);
const blocker=new THREE.Mesh(new THREE.BoxGeometry(4,4,.3),new THREE.MeshBasicMaterial());blocker.position.set(6,0,-2);scene.add(blocker);
const picker=createPicker(scene,[memo]),camera=new THREE.OrthographicCamera(-3,3,3,-3,.1,100);
camera.position.set(0,0,-8);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
assert.equal(picker.pick(new THREE.Vector2(0,0),camera).entry?.id,'memo','double-sided hanging plate works from the back');
blocker.position.x=0;assert.notEqual(picker.pick(new THREE.Vector2(0,0),camera).type,'content','double-sided plate still respects walls');
const decorative=new THREE.Scene(),coffee=makeNavigationSign({...memoEntry,position:[0,0,0],rotation:0});decorative.add(coffee);
assert.notEqual(createPicker(decorative,[coffee]).pick(new THREE.Vector2(0,0),camera).type,'content','coffee sign has no hyperlink');
assert.equal(destinations.find(e=>e.id==='cv').href,'./about.html#experience');
console.log('Brand-sign checks passed: six silhouettes, three bundled TrueType fonts, physical thickness, fixed mounts, bounded typography lift/sway and double-sided occlusion.');
