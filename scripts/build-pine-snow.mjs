import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const b=fs.readFileSync('public/models/christmas-pine.glb');
const gltf=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
const root=gltf.scene,bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
root.position.set(-center.x,-bounds.min.y,-center.z);const normalizer=new THREE.Group();normalizer.add(root);normalizer.scale.setScalar(3.3/size.y);normalizer.updateMatrixWorld(true);
let all=0,up=0,exposed=0;const snow=[],ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),a=new THREE.Vector3(),c=new THREE.Vector3(),d=new THREE.Vector3();
root.traverse(part=>{if(!part.isMesh||part.material.name==='Wood')return;const g=part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone();g.applyMatrix4(part.matrixWorld);const pos=g.attributes.position;
for(let i=0;i<pos.count;i+=3){all++;a.fromBufferAttribute(pos,i);c.fromBufferAttribute(pos,i+1);d.fromBufferAttribute(pos,i+2);const normal=c.clone().sub(a).cross(d.clone().sub(a)).normalize(),mid=a.clone().add(c).add(d).multiplyScalar(1/3);if(normal.y<.7)continue;up++;ray.set(mid.clone().add(new THREE.Vector3(0,5,0)),down);const hits=ray.intersectObject(root,true);if(!hits.length||hits[0].point.distanceTo(mid)>.035)continue;exposed++;
// Small, irregular deposits on selected exposed branches; most green stays visible.
const pattern=Math.sin(mid.x*8+mid.z*3)*Math.cos(mid.z*7-mid.y*2);
if(pattern<.18)continue;
for(const v of [a,c,d]){const p=mid.clone().lerp(v,.78).addScaledVector(normal,.012);snow.push(...p.toArray().map(n=>+n.toFixed(5)));}
}});
fs.writeFileSync('public/models/pine-snow.json',JSON.stringify(snow));console.log({triangles:all,upward:up,exposed,snowTriangles:snow.length/9,vertices:snow.length/3});
