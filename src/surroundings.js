import * as THREE from 'three';
import {createMoon} from './moon.js';

// Added after framing: never participates in the city bounds or navigation picks.
export function createSurroundings(scene){
 const root=new THREE.Group();root.name='quiet-surroundings';root.userData.nonInteractive=true;scene.add(root);
 const sky=new THREE.Mesh(new THREE.SphereGeometry(480,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{rain:{value:0},night:{value:0}},
  vertexShader:`varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform float rain;uniform float night;varying vec3 direction;
   void main(){float h=smoothstep(-.55,-.1,normalize(direction).y);
   vec3 day=mix(vec3(.23,.53,.89),vec3(.08,.32,.73),h);
   vec3 overcast=mix(vec3(.19,.29,.40),vec3(.09,.17,.28),h);
   vec3 dark=mix(vec3(.010,.018,.038),vec3(.003,.008,.024),h);
   gl_FragColor=vec4(mix(mix(day,overcast,rain),dark,night),1.);
   #include <colorspace_fragment>
  }`}));root.add(sky);sky.renderOrder=-10;
 const grassMaterial=new THREE.MeshLambertMaterial({color:0x52873d,transparent:true,depthWrite:false});
 // A broad atmospheric fade, rather than a hard terrain edge, reveals the sky
 // behind a tilted orthographic diorama in every orbit direction.
 grassMaterial.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 terrainWorld;varying vec2 terrainScreen;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nterrainWorld=(modelMatrix*vec4(transformed,1.)).xyz;vec4 terrainClip=projectionMatrix*modelViewMatrix*vec4(transformed,1.);terrainScreen=terrainClip.xy/terrainClip.w;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 terrainWorld;varying vec2 terrainScreen;').replace('#include <alphatest_fragment>','diffuseColor.rgb*=.96+.025*sin(terrainWorld.x*.18)*sin(terrainWorld.z*.15)+.012*sin(terrainWorld.x*.39+terrainWorld.z*.25);diffuseColor.a*=(1.-smoothstep(42.,88.,length(terrainWorld.xz)))*(1.-smoothstep(.54,.74,terrainScreen.y));\n#include <alphatest_fragment>');
 };
 const grass=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000),grassMaterial);grass.rotation.x=-Math.PI/2;grass.position.y=-.63;grass.receiveShadow=true;grass.renderOrder=-5;root.add(grass);
 const hills=new THREE.InstancedMesh(new THREE.SphereGeometry(1,18,10),new THREE.MeshLambertMaterial({color:0x52873d}),8);
 const dummy=new THREE.Object3D();
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2+.3;dummy.position.set(Math.cos(a)*29,-.85,Math.sin(a)*28);dummy.scale.set(4.5+(i%3),.65,3.5+(i%2));dummy.rotation.set(0,a,0);dummy.updateMatrix();hills.setMatrixAt(i,dummy.matrix);}root.add(hills);
 const treeMaterial=new THREE.MeshStandardMaterial({color:0x78946a,roughness:1}),trunkMaterial=new THREE.MeshStandardMaterial({color:0xa99478,roughness:1});
 for(let i=0;i<4;i++){const a=.7+i*Math.PI/2,x=Math.cos(a)*42,z=Math.sin(a)*42;
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.10,.14,1.8,7),trunkMaterial);trunk.position.set(x,.18,z);root.add(trunk);
  const crown=new THREE.Mesh(new THREE.SphereGeometry(1,12,9),treeMaterial);crown.position.set(x,1.35,z);crown.scale.set(.9,1.4,.9);root.add(crown);
  trunk.castShadow=crown.castShadow=true;trunk.receiveShadow=crown.receiveShadow=true;
 }
 const cloudGroup=new THREE.Group();root.add(cloudGroup);
 const cloudMat=new THREE.MeshStandardMaterial({color:0xfff4dc,roughness:1,emissive:0xddd7c9,emissiveIntensity:.10,transparent:true,opacity:.9,depthWrite:false,fog:false});
 const stormMat=new THREE.MeshStandardMaterial({color:0x9bafbd,roughness:1,transparent:true,opacity:0,depthWrite:false,fog:false});
 const puff=new THREE.SphereGeometry(1,12,8),clouds=new THREE.InstancedMesh(puff,cloudMat,16),storms=new THREE.InstancedMesh(puff,stormMat,16);
 function placeClouds(mesh,storm){const puffs=[[0,0,.19,.015],[-.065,.025,.065,.042],[.015,.060,.08,.063],[.095,.028,.06,.043]];for(let i=0;i<16;i++){const bundle=Math.floor(i/4),[x,y,sx,sy]=puffs[i%4];dummy.position.set([-.85,-.3,.2,.78][bundle]+x,[.76,.88,.80,.94][bundle]+y-(storm?.055:0),storm?-1:0);dummy.scale.set(sx,sy*(storm?1.15:1),.85);dummy.rotation.set(0,0,0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}cloudGroup.add(mesh);}
 placeClouds(clouds,false);placeClouds(storms,true);
 const lunar=createMoon(scene),moon=lunar.body;
 const birdMat=new THREE.MeshBasicMaterial({color:0x596f75,transparent:true,opacity:0,side:THREE.DoubleSide,fog:false});
 const wingGeometry=new THREE.PlaneGeometry(.23,.045),flock=new THREE.Group();root.add(flock);const birds=[];
 for(let i=0;i<3;i++){const bird=new THREE.Group(),wings=[];for(let side of [-1,1]){const wing=new THREE.Mesh(wingGeometry,birdMat);wing.position.x=side*.11;bird.add(wing);wings.push(wing);}flock.add(bird);birds.push({bird,wings});}
 const fogDay=new THREE.Color(0x99bcd7),fogRain=new THREE.Color(0x708ca3),fogNight=new THREE.Color(0x1b293d);
 scene.fog=new THREE.Fog(fogDay,160,330);
 const fwd=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3();
 let birdVisibility=0;
 return {root,grass,cloudGroup,clouds,storms,moon,lunar,flock,sky,
  update(camera,wallDt,time,rain,night){
   sky.position.copy(camera.position);sky.material.uniforms.rain.value=rain;sky.material.uniforms.night.value=night;
   scene.fog.color.copy(fogDay).lerp(fogRain,rain).lerp(fogNight,night);
   grassMaterial.color.setHex(0x52873d).multiplyScalar(1-.15*rain-.56*night);hills.material.color.setHex(0x52873d).multiplyScalar(1-.15*rain-.48*night);
   treeMaterial.color.setHex(0x78946a).multiplyScalar(1-.1*rain-.4*night);
   cloudMat.color.setHex(0xfff4dc).lerp(new THREE.Color(0x9bafbd),rain).lerp(new THREE.Color(0x34435b),night);cloudMat.opacity=.9-.6*night;
   stormMat.opacity=rain*.6*(1-night*.6);
   fwd.set(0,0,-1).applyQuaternion(camera.quaternion);right.set(1,0,0).applyQuaternion(camera.quaternion);up.set(0,1,0).applyQuaternion(camera.quaternion);
   const halfW=camera.right/camera.zoom,halfH=camera.top/camera.zoom;
   cloudGroup.position.copy(camera.position).addScaledVector(fwd,175).addScaledVector(right,Math.sin(time*.035)*halfW*.035);cloudGroup.quaternion.copy(camera.quaternion);cloudGroup.scale.set(halfW,halfH,1);
   lunar.update(night);
   lunar.updateView(camera);
   const cycle=time%66,active=cycle>14&&cycle<27,progress=THREE.MathUtils.clamp((cycle-14)/13,0,1);
   const fade=active?Math.sin(progress*Math.PI):0;
   birdVisibility=THREE.MathUtils.damp(birdVisibility,fade*(1-rain)*(1-night),3,wallDt);birdMat.opacity=birdVisibility*.65;
   flock.position.copy(camera.position).addScaledVector(fwd,125).addScaledVector(right,halfW*(-1.12+progress*2.24)).addScaledVector(up,halfH*(.55+Math.sin(progress*Math.PI)*.09));flock.quaternion.copy(camera.quaternion);
   birds.forEach(({bird,wings},i)=>{bird.position.set(-i*.6,-i*.18,0);wings[0].rotation.z=.2+Math.sin(time*5+i)*.22;wings[1].rotation.z=-.2-Math.sin(time*5+i)*.22;});
  }
 };
}

