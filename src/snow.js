import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {terrainHeight} from './park.js';

// Authored upward surfaces are sampled once, before runtime weather changes.
// The highest surface wins, so covered floors and indoor furniture stay bare.
export function exposedSurfaces(surfaces){
 const cell=.22,heights=new Map(),key=(x,z)=>`${Math.round(x/cell)},${Math.round(z/cell)}`;
 const candidates=surfaces.filter(s=>s.matrix.elements[5]>.94&&s.matrix.elements[13]>.55&&Math.abs(s.matrix.elements[12])<17&&Math.abs(s.matrix.elements[14])<15);
 const point=new THREE.Vector3();
 for(const s of candidates){const nx=Math.ceil(s.w/cell),nz=Math.ceil(s.d/cell);for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){point.set(-s.w/2+i*s.w/nx,s.h/2,-s.d/2+j*s.d/nz).applyMatrix4(s.matrix);const k=key(point.x,point.z);heights.set(k,Math.max(heights.get(k)??-.7,point.y));}}
 const floorAt=(x,z)=>heights.get(key(x,z))??(Math.abs(x)>16.5||Math.abs(z)>14.5?terrainHeight(x,z):.35);
 const caps=[];
 for(const s of candidates){
  const nx=Math.max(1,Math.ceil(s.w/.52)),nz=Math.max(1,Math.ceil(s.d/.52)),rows=[];
  for(let j=0;j<nz;j++){let start=-1;for(let i=0;i<=nx;i++){
   point.set(-s.w/2+(i+.5)*s.w/nx,s.h/2,-s.d/2+(j+.5)*s.d/nz).applyMatrix4(s.matrix);
   const clear=i<nx&&point.y>=floorAt(point.x,point.z)-.075;
   if(clear&&start<0)start=i;
   if(!clear&&start>=0){rows.push({start,end:i,row:j});start=-1;}
  }}
  const used=new Set();for(let i=0;i<rows.length;i++){if(used.has(i))continue;const r=rows[i];let last=r.row;for(let j=i+1;j<rows.length;j++){const next=rows[j];if(next.row===last+1&&next.start===r.start&&next.end===r.end){used.add(j);last=next.row;}}
   const x=-s.w/2+(r.start+r.end)/2*s.w/nx,z=-s.d/2+(r.row+last+1)/2*s.d/nz;
   caps.push({matrix:s.matrix.clone().multiply(new THREE.Matrix4().makeTranslation(x,s.h/2,z)),w:(r.end-r.start)*s.w/nx+.025,d:(last-r.row+1)*s.d/nz+.025,depth:.13+.035*Math.sin(i*2.4)**2});
  }
 }
 return {caps,floorAt};
}

export function createSnow({displayRoot,city,park}){
 const root=new THREE.Group();root.name='reusable-city-snow';root.userData.nonInteractive=true;displayRoot.add(root);
 const {caps,floorAt}=exposedSurfaces(city.snowSurfaces??[]);
 const material=new THREE.MeshStandardMaterial({color:0xf4f5f3,roughness:.98,transparent:true,opacity:0,depthWrite:true});
 const capGeo=new RoundedBoxGeometry(1,1,1,2,.15),domeGeo=new THREE.SphereGeometry(1,12,8,0,Math.PI*2,0,Math.PI/2),coneGeo=new THREE.ConeGeometry(1,1,12),dummy=new THREE.Object3D();
 const capMesh=new THREE.InstancedMesh(capGeo,material,caps.length);capMesh.receiveShadow=true;capMesh.frustumCulled=false;root.add(capMesh);
 const bumps=caps.filter(r=>r.w>2&&r.d>.8).flatMap((r,i)=>[-1,1].map(side=>({r,x:side*r.w*.22,z:Math.sin(i*2.4+side)*r.d*.16,height:.04+(i%3)*.012})));
 const bumpMesh=new THREE.InstancedMesh(domeGeo,material,bumps.length);bumpMesh.receiveShadow=true;root.add(bumpMesh);
 const signCaps=[];
 for(const sign of city.signs){const [w,h]=sign.userData.entry.size,cap=new THREE.Mesh(capGeo,material);cap.position.set(0,h/2+.04,0);cap.scale.set(w*.91,.13,.25);sign.add(cap);cap.userData.nonInteractive=true;cap.receiveShadow=true;signCaps.push(cap);}
 const banks=[];
 for(const x of [-10,-4,4,10])for(let j=0;j<4;j++)banks.push({p:[x-1+j*.62,.24,13.4],s:[.49,.18+.04*Math.sin(j),.40]});
 for(const x of [-15.5,15.5])for(const z of [-10,-5,1,7,11])banks.push({p:[x,-.05,z],s:[.42,.25,.82]});
 for(const x of [-11,-7,7,11])banks.push({p:[x,.37,-9.9],s:[.78,.23,.35]});
 // Cleared carriageways, entrances, stairs and narrow walkways receive no blanket.
 const bankMesh=new THREE.InstancedMesh(domeGeo,material,banks.length);bankMesh.receiveShadow=true;root.add(bankMesh);
 const plants=(city.snowPlants??[]).filter(m=>m.elements[13]+m.elements[5]>=floorAt(m.elements[12],m.elements[14])-.04);
 const plantMesh=new THREE.InstancedMesh(domeGeo,material,plants.length);plantMesh.receiveShadow=true;root.add(plantMesh);
 const treeRoot=new THREE.Group();treeRoot.name='layered-plant-snow';treeRoot.userData.nonInteractive=true;park.grass.parent.add(treeRoot);
 const treeMeshes=[];for(const kind of ['cone','dome']){const records=park.snowAnchors.filter(a=>a.kind===kind),mesh=new THREE.InstancedMesh(kind==='cone'?coneGeo:domeGeo,material,records.length);mesh.receiveShadow=true;mesh.frustumCulled=false;treeRoot.add(mesh);treeMeshes.push({mesh,records});}
 let previous=-1;
 function updateCoverage(amount){
  root.visible=treeRoot.visible=amount>.005;material.opacity=THREE.MathUtils.smoothstep(amount,0,.25);for(const cap of signCaps){cap.visible=amount>.005;cap.scale.y=.13*Math.max(.01,amount);}
  if(Math.abs(amount-previous)<.001)return;previous=amount;
  caps.forEach((r,i)=>{dummy.position.set(0,r.depth*amount*.5,0);dummy.scale.set(r.w,Math.max(.002,r.depth*amount),r.d);dummy.rotation.set(0,0,0);dummy.updateMatrix();capMesh.setMatrixAt(i,r.matrix.clone().multiply(dummy.matrix));});capMesh.instanceMatrix.needsUpdate=true;
  bumps.forEach(({r,x,z,height},i)=>{dummy.position.set(x,r.depth*amount*.96,z);dummy.scale.set(Math.min(.55,r.w*.15),Math.max(.001,height*amount),Math.min(.45,r.d*.22));dummy.updateMatrix();bumpMesh.setMatrixAt(i,r.matrix.clone().multiply(dummy.matrix));});bumpMesh.instanceMatrix.needsUpdate=true;
  banks.forEach((r,i)=>{dummy.position.set(...r.p);dummy.scale.set(r.s[0],r.s[1]*Math.max(.001,amount),r.s[2]);dummy.updateMatrix();bankMesh.setMatrixAt(i,dummy.matrix);});bankMesh.instanceMatrix.needsUpdate=true;
  plants.forEach((m,i)=>{dummy.position.set(0,.15,0);dummy.scale.set(1.02,Math.max(.001,amount)*.87,1.02);dummy.updateMatrix();plantMesh.setMatrixAt(i,m.clone().multiply(dummy.matrix));});plantMesh.instanceMatrix.needsUpdate=true;
  for(const {mesh,records}of treeMeshes){records.forEach((r,i)=>{dummy.position.set(...r.p);dummy.scale.set(r.s[0]*Math.max(.001,amount),r.s[1]*Math.max(.001,amount),r.s[2]*Math.max(.001,amount));dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.instanceMatrix.needsUpdate=true;}
 }
 updateCoverage(0);
 return {root,treeRoot,capMesh,bankMesh,treeMeshes,caps,floorAt,material,updateCoverage};
}

export function createSnowfall(parent,floorAt){
 const count=1000,positions=new Float32Array(count*3),speed=new Float32Array(count),sizes=new Float32Array(count),phase=new Float32Array(count);let seed=9217,time=0;
 const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<count;i++){positions[i*3]=rand()*68-34;positions[i*3+2]=rand()*62-31;const floor=floorAt(positions[i*3],positions[i*3+2]);positions[i*3+1]=floor+.2+rand()*(29-floor);speed[i]=.65+rand()*1.5;sizes[i]=1.1+rand()*2.1;phase[i]=rand()*Math.PI*2;}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('flakeSize',new THREE.BufferAttribute(sizes,1));
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{amount:{value:0},pixelRatio:{value:1},viewScale:{value:1}},
  vertexShader:`attribute float flakeSize;uniform float pixelRatio;uniform float viewScale;varying float flakeAlpha;void main(){vec4 p=modelViewMatrix*vec4(position,1.);float farScale=clamp(70./max(25.,-p.z),.6,1.3);gl_PointSize=flakeSize*pixelRatio*sqrt(viewScale)*farScale;flakeAlpha=farScale;gl_Position=projectionMatrix*p;}`,
  fragmentShader:`uniform float amount;varying float flakeAlpha;
   void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(.92,.96,1.,(1.-smoothstep(.35,1.,r))*amount*.78*flakeAlpha);
   #include <colorspace_fragment>
   }`});
 const flakes=new THREE.Points(geometry,material);flakes.name='bounded-snowfall';flakes.frustumCulled=false;flakes.userData.nonInteractive=true;parent.add(flakes);
 return {flakes,count,update(dt,amount){flakes.visible=amount>.005;material.uniforms.amount.value=amount;if(!dt||amount<.005)return;time+=dt;for(let i=0;i<count;i++){const k=i*3;positions[k]+=(Math.sin(time*.6+phase[i])*.20+.10)*dt;positions[k+2]+=Math.cos(time*.4+phase[i])*.12*dt;positions[k+1]-=speed[i]*dt;if(positions[k+1]<=floorAt(positions[k],positions[k+2])+.10||Math.abs(positions[k])>34){positions[k]=rand()*68-34;positions[k+2]=rand()*62-31;positions[k+1]=29;}}geometry.attributes.position.needsUpdate=true;},updateView(camera,pixelRatio=1){material.uniforms.viewScale.value=camera.zoom;material.uniforms.pixelRatio.value=pixelRatio;}};
}
