import * as THREE from 'three';
import {createMoon} from './moon.js';
import {createPark} from './park.js';

// Added after framing: never participates in the city bounds or navigation picks.
export function createSurroundings(scene,displayRoot=scene){
 const root=new THREE.Group();root.name='quiet-surroundings';root.userData.nonInteractive=true;scene.add(root);
 // A clip-space background cannot expose the scene's differently colored clear
 // color at a sphere edge, near/far clip, or extreme orthographic viewport.
 const skyGeometry=new THREE.BufferGeometry();
 skyGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
 const sky=new THREE.Mesh(skyGeometry,new THREE.ShaderMaterial({depthTest:false,depthWrite:false,fog:false,
  uniforms:{rain:{value:0},night:{value:0},cameraBasis:{value:new THREE.Matrix3()},viewHalfSize:{value:new THREE.Vector2(25,25)}},
  vertexShader:`varying vec2 skyScreen;void main(){skyScreen=position.xy;gl_Position=vec4(position.xy,1.,1.);}`,
  fragmentShader:`uniform float rain;uniform float night;uniform mat3 cameraBasis;uniform vec2 viewHalfSize;varying vec2 skyScreen;
   void main(){vec2 offset=skyScreen*viewHalfSize;
   vec3 direction=cameraBasis*vec3(offset,-sqrt(max(1.,480.*480.-dot(offset,offset))));
   float h=smoothstep(-.55,-.1,normalize(direction).y);
   vec3 day=mix(vec3(.23,.53,.89),vec3(.08,.32,.73),h);
   vec3 overcast=mix(vec3(.19,.29,.40),vec3(.09,.17,.28),h);
   vec3 dark=mix(vec3(.010,.018,.038),vec3(.003,.008,.024),h);
   gl_FragColor=vec4(mix(mix(day,overcast,rain),dark,night),1.);
   #include <colorspace_fragment>
  }`}));root.add(sky);sky.renderOrder=-10;sky.frustumCulled=false;
 const parkRoot=new THREE.Group();parkRoot.name='park-display';parkRoot.userData.nonInteractive=true;displayRoot.add(parkRoot);
 const park=createPark(parkRoot),grass=park.grass,dummy=new THREE.Object3D();
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
 const fwd=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3(),skyRotation=new THREE.Matrix4();
 let birdVisibility=0;
 return {root,grass,park,cloudGroup,clouds,storms,moon,lunar,flock,sky,
  update(camera,wallDt,time,rain,night,snow=0,fallingSnow=snow){
   const cloudiness=Math.min(1,rain+fallingSnow*.50);
   sky.position.copy(camera.position);sky.material.uniforms.rain.value=cloudiness;sky.material.uniforms.night.value=night;
   scene.fog.color.copy(fogDay).lerp(fogRain,rain).lerp(fogNight,night);
   park.update(rain,night,snow,time);
   cloudMat.color.setHex(0xfff4dc).lerp(new THREE.Color(0x9bafbd),cloudiness).lerp(new THREE.Color(0x34435b),night);cloudMat.opacity=.9-.6*night;
   stormMat.opacity=cloudiness*.6*(1-night*.6);
   fwd.set(0,0,-1).applyQuaternion(camera.quaternion);right.set(1,0,0).applyQuaternion(camera.quaternion);up.set(0,1,0).applyQuaternion(camera.quaternion);
   const halfW=camera.right/camera.zoom,halfH=camera.top/camera.zoom;
   sky.material.uniforms.viewHalfSize.value.set(halfW,halfH);
   sky.material.uniforms.cameraBasis.value.setFromMatrix4(skyRotation.makeRotationFromQuaternion(camera.quaternion));
   cloudGroup.position.copy(camera.position).addScaledVector(fwd,175).addScaledVector(right,Math.sin(time*.035)*halfW*.035);cloudGroup.quaternion.copy(camera.quaternion);cloudGroup.scale.set(halfW,halfH,1);
   lunar.update(night);
   lunar.updateView(camera);
   const cycle=time%66,active=cycle>14&&cycle<27,progress=THREE.MathUtils.clamp((cycle-14)/13,0,1);
   const fade=active?Math.sin(progress*Math.PI):0;
   birdVisibility=THREE.MathUtils.damp(birdVisibility,fade*(1-rain)*(1-fallingSnow)*(1-night),3,wallDt);birdMat.opacity=birdVisibility*.65;
   flock.position.copy(camera.position).addScaledVector(fwd,125).addScaledVector(right,halfW*(-1.12+progress*2.24)).addScaledVector(up,halfH*(.55+Math.sin(progress*Math.PI)*.09));flock.quaternion.copy(camera.quaternion);
   birds.forEach(({bird,wings},i)=>{bird.position.set(-i*.6,-i*.18,0);wings[0].rotation.z=.2+Math.sin(time*5+i)*.22;wings[1].rotation.z=-.2-Math.sin(time*5+i)*.22;});
  }
 };
}

