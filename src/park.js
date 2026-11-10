import * as THREE from 'three';

const smooth=(a,b,x)=>THREE.MathUtils.smoothstep(x,a,b);
const creekPoints=[[27.3,5],[26.7,9],[25.5,14],[24.8,17.2],[22.6,23]];
const creekCurve=new THREE.CatmullRomCurve3(creekPoints.map(([x,z])=>new THREE.Vector3(x,0,z)));
function creekDistance(x,z){let best=Infinity;for(let i=1;i<creekPoints.length;i++){const [ax,az]=creekPoints[i-1],[bx,bz]=creekPoints[i],dx=bx-ax,dz=bz-az,t=THREE.MathUtils.clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz),0,1);best=Math.min(best,Math.hypot(x-ax-t*dx,z-az-t*dz));}return best;}
function dryHeight(x,z){const outside=smooth(22.1,27.5,Math.hypot(x,z)),mound=(cx,cz,r)=>Math.exp(-((x-cx)**2+(z-cz)**2)/(r*r));return -.68+outside*(.38+.24*Math.sin(x*.19)*Math.cos(z*.15)+.14*Math.sin(x*.26+z*.11)+.48*mound(-23,-10,8)+.58*mound(20,-20,7)+.52*mound(-9,25,7));}
export function terrainHeight(x,z){return dryHeight(x,z)-.32*(1-smooth(.42,1.25,creekDistance(x,z)));}
export function parkPath(){return new THREE.CatmullRomCurve3([[0,14.4],[1,17.6],[8,21.8],[15,23.3],[21,21.3],[25,17],[27.3,13.7]].map(([x,z])=>new THREE.Vector3(x,0,z)));}
function pathHeight(x,z){return terrainHeight(x,z)+.045+.43*Math.exp(-((x-25)**2+(z-17)**2)/5);}
function ribbon(curve,width,height){const p=[],uv=[],idx=[],up=new THREE.Vector3(0,1,0);for(let i=0;i<=128;i++){const t=i/128,c=curve.getPoint(t),side=curve.getTangent(t).cross(up).normalize().multiplyScalar((typeof width==='function'?width(t):width)/2);for(const s of [-1,1]){const v=c.clone().addScaledVector(side,s);p.push(v.x,height(v.x,v.z,c),v.z);uv.push(t,(s+1)/2);}if(i<128){const n=i*2;idx.push(n,n+1,n+2,n+1,n+3,n+2);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}

export function createPark(root){
 const terrain=new THREE.PlaneGeometry(92,84,144,132);terrain.rotateX(-Math.PI/2);
 const position=terrain.attributes.position,pathCurve=parkPath(),pathSamples=pathCurve.getPoints(96),snowMask=new Float32Array(position.count);
 for(let i=0;i<position.count;i++){const x=position.getX(i),z=position.getZ(i);position.setY(i,terrainHeight(x,z));let distance=Infinity;for(const p of pathSamples)distance=Math.min(distance,Math.hypot(x-p.x,z-p.z));snowMask[i]=smooth(.72,1.55,distance)*(1-smooth(.50,.80,1/(1+creekDistance(x,z))));}terrain.setAttribute('parkClear',new THREE.BufferAttribute(snowMask,1));terrain.computeVertexNormals();
 const surfaceUniforms={snow:{value:0},deep:{value:new THREE.Color(0x4c783f)},meadow:{value:new THREE.Color(0x789a50)},warm:{value:new THREE.Color(0x8b9e55)}};
 const groundMaterial=new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,depthWrite:false});
 function terrainShader(material,isSnow=false){material.onBeforeCompile=shader=>{
  shader.uniforms.parkSnow=surfaceUniforms.snow;shader.uniforms.parkDeep=surfaceUniforms.deep;shader.uniforms.parkMeadow=surfaceUniforms.meadow;shader.uniforms.parkWarm=surfaceUniforms.warm;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float parkClear;varying float clearPath;varying vec3 parkWorld;varying vec2 parkScreen;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nclearPath=parkClear;parkWorld=transformed;vec4 clipPark=projectionMatrix*modelViewMatrix*vec4(transformed,1.);parkScreen=clipPark.xy/clipPark.w;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float clearPath;varying vec3 parkWorld;varying vec2 parkScreen;uniform float parkSnow;uniform vec3 parkDeep;uniform vec3 parkMeadow;uniform vec3 parkWarm;').replace('#include <alphatest_fragment>',`
   float shape=pow(pow(abs(parkWorld.x)/33.,4.)+pow(abs(parkWorld.z)/29.,4.),.25);
   float edge=1.-smoothstep(.90,1.09,shape+.012*sin(parkWorld.x*.9)*sin(parkWorld.z*.7));
   float macro=sin(parkWorld.x*.19+sin(parkWorld.z*.13)*1.5)*cos(parkWorld.z*.16);
   float field=.5+.28*macro+.14*sin(parkWorld.z*.29+parkWorld.x*.07);
   ${isSnow?'':`vec3 meadow=mix(parkDeep,parkMeadow,smoothstep(.18,.73,field));meadow=mix(meadow,parkWarm,.34*smoothstep(.3,.9,.5+.5*sin(parkWorld.x*.23+parkWorld.z*.20)));diffuseColor.rgb*=meadow;`}
   diffuseColor.rgb*=.985+.009*sin(parkWorld.x*23.)*sin(parkWorld.z*19.);
   diffuseColor.a*=edge*(1.-smoothstep(.54,.74,parkScreen.y));
   ${isSnow?`float exposed=.95+.05*macro;diffuseColor.a*=exposed*parkSnow*clearPath;`:''}
   #include <alphatest_fragment>`);
 };}
 // A quiet neutral floor surrounds the finite planted park, with the sky above.
 const backdropMaterial=new THREE.MeshBasicMaterial({color:0xe9e7d9,transparent:true,depthWrite:false,fog:false});
 backdropMaterial.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying float backdropY;').replace('#include <project_vertex>','#include <project_vertex>\nbackdropY=gl_Position.y/gl_Position.w;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float backdropY;').replace('#include <alphatest_fragment>','diffuseColor.a*=1.-smoothstep(.50,.77,backdropY);\n#include <alphatest_fragment>');};
 const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000),backdropMaterial);backdrop.rotation.x=-Math.PI/2;backdrop.position.y=-1.15;backdrop.renderOrder=-8;root.add(backdrop);
 terrainShader(groundMaterial);
 const grass=new THREE.Mesh(terrain,groundMaterial);grass.receiveShadow=true;grass.renderOrder=-5;grass.name='continuous-meadow';root.add(grass);
 const winterMat=new THREE.MeshStandardMaterial({color:0xf2f5f4,roughness:.98,transparent:true,depthWrite:false});terrainShader(winterMat,true);
 const winterGround=new THREE.Mesh(terrain,winterMat);winterGround.renderOrder=-4;winterGround.position.y=.12;winterGround.receiveShadow=true;root.add(winterGround);
 const pathMaterial=new THREE.MeshStandardMaterial({color:0xd5bd92,roughness:1,side:THREE.DoubleSide}),path=new THREE.Mesh(ribbon(pathCurve,1.4,(x,z)=>pathHeight(x,z)),pathMaterial);path.receiveShadow=true;path.name='curved-park-path';root.add(path);
 const stepGeometry=new THREE.BoxGeometry(1.4,.17,.48);for(let i=0;i<3;i++){const step=new THREE.Mesh(stepGeometry,pathMaterial);step.position.set(0,-.16-i*.17,14.55+i*.40);step.castShadow=step.receiveShadow=true;root.add(step);}
 const streamMaterial=new THREE.MeshStandardMaterial({color:0x69a9b5,roughness:.55,metalness:0,side:THREE.DoubleSide});
 streamMaterial.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 creekUV;').replace('#include <uv_vertex>','#include <uv_vertex>\ncreekUV=uv;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 creekUV;').replace('#include <alphatest_fragment>','diffuseColor.rgb*=.83+.17*smoothstep(.10,.47,abs(creekUV.y-.5));\n#include <alphatest_fragment>');};
 const stream=new THREE.Mesh(ribbon(creekCurve,t=>1.35*Math.pow(Math.sin(t*Math.PI),.22),(x,z,c)=>dryHeight(c.x,c.z)-.18),streamMaterial);stream.name='small-park-creek';stream.receiveShadow=true;root.add(stream);
 const bridge=new THREE.Group();bridge.name='short-footbridge';bridge.position.set(25,terrainHeight(25,17)+.48,17);bridge.rotation.y=2.30;root.add(bridge);
 const timber=new THREE.MeshStandardMaterial({color:0xb5895f,roughness:.91}),trim=new THREE.MeshStandardMaterial({color:0xe2c39b,roughness:.92}),unitBox=new THREE.BoxGeometry(1,1,1);
 function beam(x,y,z,w,h,d,material){const m=new THREE.Mesh(unitBox,material);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=m.receiveShadow=true;bridge.add(m);}
 for(let i=0;i<9;i++)beam(0,0,-1.2+i*.3,1.9,.10,.28,timber);
 for(const x of [-.87,.87]){beam(x,.56,0,.065,.075,2.7,trim);beam(x,-.12,0,.12,.18,2.7,timber);for(const z of [-1.2,0,1.2])beam(x,.27,z,.08,.59,.08,timber);}
 const bench=new THREE.Group();bench.name='park-path-bench';bench.position.set(27.5,terrainHeight(27.5,12.8),12.8);bench.rotation.y=.5;root.add(bench);
 const benchPart=(x,y,z,w,h,d)=>{const m=new THREE.Mesh(unitBox,timber);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=m.receiveShadow=true;bench.add(m);};
 for(const z of [-.18,0,.18])benchPart(0,.48,z,1.6,.07,.15);for(const y of [.78,1.0])benchPart(0,y,-.28,1.6,.13,.07);for(const x of [-.6,.6]){benchPart(x,.23,0,.10,.46,.45);benchPart(x,.73,-.28,.07,.70,.07);}
 // Unequal clusters: open lawn between them is intentional.
 const ball=new THREE.SphereGeometry(1,14,10),cone=new THREE.ConeGeometry(1,1,12),cylinder=new THREE.CylinderGeometry(1,1,1,8);
 const foliage=[],pines=[],wood=[],rocks=[],flowers=[],tufts=[],snowAnchors=[],dummy=new THREE.Object3D();
 const clusters=[{p:[-23,-10],trees:3,shrubs:8},{p:[19,-21],trees:2,shrubs:4},{p:[-23,14],trees:2,shrubs:6},{p:[-9,25],trees:3,shrubs:5},{p:[25,9],trees:1,shrubs:7},{p:[4,-26],trees:2,shrubs:4}];
 for(let c=0;c<clusters.length;c++){
  const {p:[cx,cz],trees,shrubs}=clusters[c];
  for(let j=0;j<trees;j++){
   const x=cx+Math.sin(j*2.1+c)*1.65,z=cz+Math.cos(j*2.3+c)*1.3,y=terrainHeight(x,z),s=.75+((c+j)%3)*.14;
   wood.push({p:[x,y+.78*s,z],s:[.105,1.56*s,.105]});
   if((c+j)%3===0){for(let tier=0;tier<3;tier++){const r=(.94-tier*.22)*s,h=1.10*s,cy=y+(.90+tier*.53)*s;pines.push({p:[x,cy,z],s:[r,h,r]});snowAnchors.push({kind:'cone',p:[x,cy+.16*s,z],s:[r*.83,h*.73,r*.83]});}}
   else for(let lobe=0;lobe<3;lobe++){const lx=x+Math.sin(lobe*2.4)*.38*s,lz=z+Math.cos(lobe*2.4)*.28*s,ly=y+(1.58+(lobe===0?.30:0))*s;foliage.push({p:[lx,ly,lz],s:[.64*s,.74*s,.65*s]});snowAnchors.push({kind:'dome',p:[lx,ly+.18*s,lz],s:[.65*s,.59*s,.66*s]});}
  }
  for(let j=0;j<shrubs;j++){const a=j*2.399+c,x=cx+Math.sin(a)*(1.7+j*.16),z=cz+Math.cos(a)*(1.5+j*.15),y=terrainHeight(x,z),r=.28+j%3*.09;foliage.push({p:[x,y+.22,z],s:[r,.31,r*1.17]});snowAnchors.push({kind:'dome',p:[x,y+.27,z],s:[r*1.05,.26,r*1.13]});
   if(j%3===0)rocks.push({p:[x+.58,y+.10,z-.28],s:[.28,.16,.24]});
   const flowerCount=j%3===0?6:2;for(let k=0;k<flowerCount;k++){const fx=x+.5+Math.sin(k*2.399)*(.16+k*.045),fz=z+Math.cos(k*2.399)*(.15+k*.045);flowers.push({p:[fx,terrainHeight(fx,fz)+.11,fz],s:[.045,.06,.045],tint:[0xffe4a3,0xf4d4bd,0xe8eabf][(k+c)%3]});}
   if(j%2===0)for(let k=0;k<3;k++)tufts.push({p:[x-.5+k*.10,y+.09,z+.4],s:[.042,.18,.045]});
  }
 }
 for(let i=0;i<20;i++){const t=(i+.35)/20,c=creekCurve.getPoint(t),side=creekCurve.getTangent(t).cross(new THREE.Vector3(0,1,0)).normalize(),s=i%2?1:-1,x=c.x+side.x*s*.91,z=c.z+side.z*s*.91;rocks.push({p:[x,terrainHeight(x,z)+.10,z],s:[.16+(i%3)*.04,.12,.21]});}
 const colorRecords=[],plantMeshes=[];
 function instances(name,geometry,list,color){const material=new THREE.MeshStandardMaterial({color,roughness:.98}),mesh=new THREE.InstancedMesh(geometry,material,list.length);mesh.name=name;list.forEach((r,i)=>{dummy.position.set(...r.p);dummy.scale.set(...r.s);dummy.rotation.set(0,i*1.7,0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);const tint=r.tint?new THREE.Color(r.tint):name.includes('broadleaf')?new THREE.Color([0xe5edc9,0xbdd6ab,0xd8e5b5][i%3]):new THREE.Color().setScalar(.91+i%4*.03);mesh.setColorAt(i,tint);});mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);colorRecords.push({material,color:new THREE.Color(color)});plantMeshes.push(mesh);return mesh;}
 instances('park-broadleaf-and-shrubs',ball,foliage,0x63884c);instances('park-layered-evergreens',cone,pines,0x35664c);instances('park-trunks',cylinder,wood,0x9b7852);instances('park-stones',ball,rocks,0xa5ab9b);instances('park-small-flowers',ball,flowers,0xffffff);instances('park-sparse-tufts',cone,tufts,0x6a8a43);
 return {grass,winterGround,snowAnchors,path,pathCurve,terrainHeight,backdrop,stream,bridge,bench,plantMeshes,clusters,update(rain,night,snow=0){groundMaterial.color.setHex(0xffffff).multiplyScalar(1-.10*rain-.48*night);surfaceUniforms.snow.value=snow;winterGround.visible=snow>.005;winterGround.position.y=.03+.15*snow;winterMat.color.setHex(0xf2f5f4);for(const r of colorRecords)r.material.color.copy(r.color).multiplyScalar(1-.09*rain-.32*night);pathMaterial.color.setHex(0xd5bd92).multiplyScalar(1-.13*rain-.28*night);streamMaterial.color.setHex(0x69a9b5).multiplyScalar(1-.12*rain-.50*night);timber.color.setHex(0xb5895f).multiplyScalar(1-night*.3);trim.color.setHex(0xe2c39b).multiplyScalar(1-night*.3);backdropMaterial.color.setHex(0xe9e7d9).lerp(new THREE.Color(0xc5cdd0),rain).lerp(new THREE.Color(0x162236),night);}};
}
