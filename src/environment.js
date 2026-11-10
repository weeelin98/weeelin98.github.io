import * as THREE from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {glow,C} from './city.js';
import {createSurroundings} from './surroundings.js';

// Existing roofs, authored from the model footprints. Drops stop above surfaces,
// so open cutaway walls do not allow rain to fall through interior rooms.
const roofs=[
 [-2.08,2.08,-4.85,-1.35,16.25],[-2.58,2.58,-5.03,-.78,14.2],[-3.13,3.13,-5.23,-.08,11.6],[-3.63,3.63,-5.33,.73,8.9],[-4.13,4.13,-5.58,1.58,5.95],
 [-9.66,-5.34,-5.68,-1.1,13.35],[5.6,10.4,-5.9,-1.3,9.28],
 [.2,6.4,2.2,5.4,7.58],[0,6.6,2,6.3,5.52],
 [-8.82,-4.78,6,9.4,2.5],[-1.5,1.9,6.5,9.9,2.5],[-11.6,-8.4,2.4,5.8,2.5],
 [-10.45,-7.55,9.7,10.8,2.42],[7.55,10.45,9.7,10.8,2.42],[-10,-6,-.4,3.6,3.7],
];
export function rainFloor(x,z){for(const [x0,x1,z0,z1,y]of roofs)if(x>=x0&&x<=x1&&z>=z0&&z<=z1)return y;return Math.abs(x)>12.3||Math.abs(z)>10.3?.14:.35;}

function rainSystem(scene){
 let seed=81411;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const count=1500,positions=new Float32Array(count*6),speed=new Float32Array(count),floors=new Float32Array(count);
 for(let i=0;i<count;i++){const k=i*6,x=random()*33-16.5,z=random()*29-14.5;floors[i]=rainFloor(x,z);positions[k]=x;positions[k+1]=floors[i]+.1+random()*(24.9-floors[i]);positions[k+2]=z;positions[k+3]=x-.045;positions[k+4]=positions[k+1]+.28;positions[k+5]=z;speed[i]=10+random()*6;}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const material=new THREE.LineBasicMaterial({color:0x87a6b6,transparent:true,opacity:0,depthWrite:false});
 const drops=new THREE.LineSegments(geometry,material);drops.frustumCulled=false;drops.userData.nonInteractive=true;scene.add(drops);
 // Small surface ripples use one instanced draw, not hundreds of independent meshes.
 const ripples=new THREE.InstancedMesh(new THREE.RingGeometry(.07,.09,10),new THREE.MeshBasicMaterial({color:0xc2d6de,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}),55);
 ripples.userData.nonInteractive=true;scene.add(ripples);const dummy=new THREE.Object3D();
 const spots=Array.from({length:55},()=>{let x,z;do{x=random()*29-14.5;z=random()*25-12.5;}while(rainFloor(x,z)>1);return [x,rainFloor(x,z)+.012,z,random()*8];});
 let age=0;
 function updateRipples(){spots.forEach(([x,y,z,phase],i)=>{const t=(age*1.3+phase)%1;dummy.position.set(x,y,z);dummy.rotation.x=-Math.PI/2;dummy.scale.setScalar(.4+t*2.5);dummy.updateMatrix();ripples.setMatrixAt(i,dummy.matrix);});ripples.instanceMatrix.needsUpdate=true;}
 updateRipples();
 return {drops,ripples,update(dt,intensity){
   age+=dt;drops.visible=ripples.visible=intensity>.006;material.opacity=intensity*.48;ripples.material.opacity=intensity*.19;
   if(intensity<.006||dt===0)return;
   for(let i=0;i<count;i++){const k=i*6;positions[k+1]-=dt*speed[i];if(positions[k+1]<floors[i]+.1)positions[k+1]=25;positions[k+3]=positions[k]-.045;positions[k+4]=positions[k+1]+.28;positions[k+5]=positions[k+2];}
   geometry.attributes.position.needsUpdate=true;
   updateRipples();
 }};
}

function reflection(scene){
 const source=Reflector.ReflectorShader;
 const shader={uniforms:{...THREE.UniformsUtils.clone(source.uniforms),wetness:{value:0}},
  vertexShader:source.vertexShader.replace('varying vec4 vUv;','varying vec4 vUv; varying vec2 patchUv;').replace('vUv = textureMatrix','patchUv = uv; vUv = textureMatrix'),
  fragmentShader:source.fragmentShader.replace('varying vec4 vUv;','varying vec4 vUv; varying vec2 patchUv; uniform float wetness;').replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );',`
    vec2 p = patchUv * vec2(30.0,26.0)-vec2(15.0,13.0);
    float a=1.0-smoothstep(.5,1.0,length((p-vec2(-5.0,-11.7))/vec2(3.1,.65)));
    float b=1.0-smoothstep(.4,1.0,length((p-vec2(8.0,-11.7))/vec2(2.2,.55)));
    float c=1.0-smoothstep(.4,1.0,length((p-vec2(13.4,1.0))/vec2(.55,3.5)));
    gl_FragColor = vec4(blendOverlay(base.rgb,color),max(max(a,b),c)*wetness*.23);
   `)};
 const puddles=new Reflector(new THREE.PlaneGeometry(30,26),{textureWidth:384,textureHeight:384,multisample:0,color:0x85969c,clipBias:.002,shader});
 puddles.position.y=.133;puddles.rotation.x=-Math.PI/2;puddles.material.transparent=true;puddles.material.depthWrite=false;puddles.userData.nonInteractive=true;puddles.visible=false;scene.add(puddles);
 // Refresh immediately on camera changes; cap only stationary-view reflections.
 const renderReflection=puddles.onBeforeRender,lastView=new THREE.Matrix4(),lastProjection=new THREE.Matrix4(),lastModel=new THREE.Matrix4();let lastRender=-Infinity;
 puddles.onBeforeRender=function(renderer,scene,camera){const now=performance.now();if(now-lastRender<1000/24&&lastView.equals(camera.matrixWorld)&&lastProjection.equals(camera.projectionMatrix)&&lastModel.equals(this.matrixWorld))return;renderReflection.call(this,renderer,scene,camera);lastView.copy(camera.matrixWorld);lastProjection.copy(camera.projectionMatrix);lastModel.copy(this.matrixWorld);lastRender=now;};
 return puddles;
}

export function createEnvironment({scene,renderer,ambient,sun,fill,city,ferris,carousel,displayRoot=scene}){
 const surroundings=createSurroundings(scene);
 sun.shadow.autoUpdate=false;
 const rain=rainSystem(displayRoot),puddles=reflection(displayRoot),windows=new THREE.Group();displayRoot.add(windows);
 const windowMaterial=new THREE.MeshBasicMaterial({color:0xffc66f,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
 function pane(x,y,z,w,h,rotation=0){const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),windowMaterial);p.position.set(x,y,z);p.rotation.y=rotation;p.userData.nonInteractive=true;windows.add(p);}
 const levels=[.35,3.05,5.75,8.45,11.15,13.75],fronts=[1.35,1.35,.5,-.3,-1,-1.65],widths=[7.8,7.8,6.8,5.8,4.7,3.5];
 levels.forEach((y,i)=>{for(let x=-widths[i]/2+.8;x<widths[i]/2;x+=1.2)pane(x,y+1.35,fronts[i]-.405,1.03,1.56);});
 for(let i=0;i<5;i++)pane(-7.5,1.70+i*2.55,-1.68,3.25,1.55);
 for(let i=0;i<3;i++)pane(8,1.85+i*2.9,-1.58,3.75,1.7);
 for(let i=0;i<2;i++)for(let x of [1.2,3.3,5.4])pane(x,1.65+i*2.5,5.99,1.57,1.48);
 for(let [x,z,w]of [[-6.8,8.46,3.1],[-10,4.86,2.2],[.2,8.96,2.4]])pane(x,1.35,z-.02,w,1.4);
 const lights=[];
 for(const [x,y,z,power,range]of [[-7.5,2.2,-3.2,12,5],[-7.5,7.6,-3.2,14,6],[-7.5,12.5,-3.2,12,5],[0,4,-2.2,16,6],[0,10,-2.4,16,6],[0,15,-3,10,4],[8,2,-3.5,15,5],[8,6.6,-3.5,16,6],[3.3,2,4.4,16,6],[3.3,6.6,4.1,14,5],[-6.7,1.9,7.1,8,4],[-.2,1.8,7.9,8,4]]){
  const l=new THREE.PointLight(0xffc477,0,range,1.6);l.position.set(x,y,z);displayRoot.add(l);lights.push([l,power]);
 }
 // Warm spill at street level, separate from the emissive lamp bulbs.
 for(const p of city.lamps){const l=new THREE.PointLight(0xffc36b,0,4,1.7);l.position.copy(p).y-=.35;displayRoot.add(l);lights.push([l,4]);}
 const bulbsMaterial=new THREE.MeshBasicMaterial({color:0xffd18b,transparent:true,opacity:0,toneMapped:false});
 const bulbs=new THREE.InstancedMesh(new THREE.SphereGeometry(.047,6,4),bulbsMaterial,64),dummy=new THREE.Object3D();bulbs.userData.nonInteractive=true;
 for(let i=0;i<64;i++){const a=i/64*Math.PI*2;dummy.position.set(Math.cos(a)*4.4,Math.sin(a)*4.4,.48);dummy.updateMatrix();bulbs.setMatrixAt(i,dummy.matrix);}ferris.wheel.add(bulbs);
 const trim=new THREE.Mesh(new THREE.TorusGeometry(1.98,.024,5,64),bulbsMaterial);trim.position.y=2.94;trim.rotation.x=Math.PI/2;trim.userData.nonInteractive=true;carousel.root.add(trim);
 const ground=[];city.city.traverse(o=>{if(o.isMesh&&o.material.color&&[C.road,0xf4f0e4].includes(o.material.color.getHex())){o.material=o.material.clone();ground.push({material:o.material,color:o.material.color.clone(),roughness:o.material.roughness});}});
 const facades=[];city.city.traverse(o=>{if(o.isMesh&&o.material.color&&!o.material.transparent&&!ground.some(g=>g.material===o.material)&&o.material!==glow){o.material=o.material.clone();facades.push({material:o.material,color:o.material.color.clone()});}});
 const white=new THREE.Color(0xffffff),rainSky=new THREE.Color(0xdde8ee),nightSky=new THREE.Color(0x111d35),daySun=new THREE.Color(0xfff2df),moon=new THREE.Color(0x93b9ed);
 let state='sunny',rainAmount=0,wetness=0,night=0;
 return {rain,puddles,lights,windows,bulbs,ground,surroundings,get state(){return state;},get rainAmount(){return rainAmount;},get wetness(){return wetness;},get night(){return night;},
  setState(next){if(!['sunny','rain','night'].includes(next))return;state=next;sun.shadow.needsUpdate=true;surroundings.lunar.light.shadow.needsUpdate=true;if(renderer.shadowMap)renderer.shadowMap.needsUpdate=true;},
  update(dt,animationDelta=dt){
   rainAmount=THREE.MathUtils.damp(rainAmount,state==='rain'?1:0,1.15,dt);
   wetness=THREE.MathUtils.damp(wetness,state==='rain'?1:0,state==='rain'?.38:.16,dt);
   night=THREE.MathUtils.damp(night,state==='night'?1:0,.9,dt);
   scene.background.copy(white).lerp(rainSky,rainAmount*.8).lerp(nightSky,night);
   ambient.intensity=2.1-night*1.48-rainAmount*.25;ambient.color.setHex(0xfff9ef).lerp(moon,night*.65);
   sun.intensity=(2.8-rainAmount*1.7)*Math.pow(1-night,2);sun.color.copy(daySun);
   fill.intensity=1.1-night*.92;renderer.toneMappingExposure=1.08+night*.06;
   surroundings.lunar.update(night);
   windowMaterial.opacity=night*.22;glow.emissiveIntensity=.08+night*1.15;bulbsMaterial.opacity=night*.9;
   for(const [l,power]of lights)l.intensity=power*night;
   for(const g of ground){g.material.roughness=THREE.MathUtils.lerp(g.roughness,.24,wetness);g.material.color.copy(g.color).multiplyScalar(1-wetness*.14);g.material.metalness=wetness*.14;}
   for(const f of facades)f.material.color.copy(f.color).multiplyScalar(1-rainAmount*.06);
   puddles.visible=wetness>.015;puddles.material.uniforms.wetness.value=wetness;
   rain.update(animationDelta,rainAmount);
  },requestShadows(first=false){sun.shadow.needsUpdate=first||night<.97;surroundings.lunar.light.shadow.needsUpdate=first||night>.03;},updateView(camera,wallDelta,time){surroundings.update(camera,wallDelta,time,rainAmount,night);},stats(){return {state,rainAmount,wetness,night,moonlight:surroundings.lunar.light.intensity};}
 };
}

