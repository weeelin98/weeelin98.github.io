import * as THREE from 'three';

// Fixed lighting reference; the celestial body is displayed at distant screen scale.
export const MOON_POSITION=new THREE.Vector3(28,34,9);
export const MOON_TARGET=new THREE.Vector3(0,4,0);

function surfaceTexture(){
 const width=256,height=128,data=new Uint8Array(width*height*4);
 const craters=[[-.6,.5,.6,.16],[.3,.75,.5,.10],[.55,-.25,.7,.14],[-.4,-.5,.7,.19],[.05,.1,.99,.11],[.7,.5,-.4,.16]];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const phi=x/width*Math.PI*2,theta=y/(height-1)*Math.PI;
  const nx=Math.cos(phi)*Math.sin(theta),ny=Math.cos(theta),nz=Math.sin(phi)*Math.sin(theta);
  let shade=.96+.018*Math.sin(nx*19+Math.sin(ny*11))*Math.sin(nz*17+ny*7);
  for(const [cx,cy,cz,r]of craters){const length=Math.hypot(cx,cy,cz),d=Math.hypot(nx-cx/length,ny-cy/length,nz-cz/length);shade-=.075*Math.exp(-d*d/(r*r));}
  const k=(y*width+x)*4;data[k]=Math.round(255*shade);data[k+1]=Math.round(246*shade);data[k+2]=Math.round(221*shade);data[k+3]=255;
 }
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=THREE.RepeatWrapping;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearFilter;texture.needsUpdate=true;return texture;
}

export function createMoon(scene){
 const texture=surfaceTexture();
 const material=new THREE.MeshStandardMaterial({color:0xffb15a,emissive:0xff8b2f,emissiveIntensity:.95,map:texture,emissiveMap:texture,roughness:.97,metalness:0,transparent:true,opacity:0,depthWrite:false,fog:false});
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 moonWorldNormal;').replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nmoonWorldNormal=normalize(mat3(modelMatrix)*objectNormal);');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 moonWorldNormal;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance*=.30+.70*pow(max(dot(normalize(moonWorldNormal),normalize(vec3(-.25,.5,.83))),0.),.55);').replace('#include <dithering_fragment>','#include <dithering_fragment>\ngl_FragDepth=.9999;');
 };
 // Spherical geometry and shaded normals provide the volume; the far-depth value
 // gives this celestial object background priority if an orbit aligns it with a roof.
 const body=new THREE.Mesh(new THREE.SphereGeometry(1.12,48,32),material);body.name='distant-moon';body.position.copy(MOON_POSITION);body.renderOrder=2;body.userData.nonInteractive=true;body.visible=false;scene.add(body);
 const haloMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,uniforms:{night:{value:0}},
  vertexShader:`varying vec3 n;varying vec3 viewPosition;void main(){n=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);viewPosition=p.xyz;gl_Position=projectionMatrix*p;}`,
  fragmentShader:`uniform float night;varying vec3 n;varying vec3 viewPosition;void main(){float core=pow(max(dot(normalize(n),normalize(-viewPosition)),0.),3.5);gl_FragColor=vec4(vec3(1.,.45,.11),core*night*.065);gl_FragDepth=.99995;
  #include <colorspace_fragment>
  }`});
 const halo=new THREE.Mesh(new THREE.SphereGeometry(1.95,32,24),haloMaterial);halo.position.copy(MOON_POSITION);halo.name='moon-soft-halo';halo.renderOrder=1;halo.userData.nonInteractive=true;halo.visible=false;scene.add(halo);

 const light=new THREE.DirectionalLight(0xffedcf,0);light.name='stable-moonlight';
 const direction=MOON_POSITION.clone().sub(MOON_TARGET).normalize();light.target.position.copy(MOON_TARGET);light.position.copy(MOON_TARGET).addScaledVector(direction,95);scene.add(light,light.target);
 light.castShadow=true;light.shadow.autoUpdate=false;light.shadow.mapSize.set(2048,2048);
 Object.assign(light.shadow.camera,{left:-58,right:58,top:58,bottom:-58,near:1,far:185});
 light.shadow.camera.updateProjectionMatrix();light.shadow.bias=-.00022;light.shadow.normalBias=.065;light.shadow.radius=4;
 const forward=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3();
 return {body,halo,light,direction,update(night){material.opacity=night;body.visible=halo.visible=night>.003;haloMaterial.uniforms.night.value=night;light.intensity=1.05*night*night;},
  updateView(camera){
   forward.set(0,0,-1).applyQuaternion(camera.quaternion);right.set(1,0,0).applyQuaternion(camera.quaternion);up.set(0,1,0).applyQuaternion(camera.quaternion);
   const x=direction.dot(right),y=direction.dot(up),length=Math.hypot(x,y),halfH=camera.top/camera.zoom,halfW=camera.right/camera.zoom;
   // Place it in the clear sky along the real source's projected direction,
   // with safe margins in both portrait and landscape desktop viewports.
   const radius=Math.min(halfW*.88/Math.max(Math.abs(x/length),.001),halfH*.80/Math.max(Math.abs(y/length),.001));
   body.position.copy(camera.position).addScaledVector(forward,130).addScaledVector(right,radius*x/length).addScaledVector(up,radius*y/length);
   body.scale.setScalar(halfH/25);halo.position.copy(body.position);halo.scale.copy(body.scale);
  }};
}
