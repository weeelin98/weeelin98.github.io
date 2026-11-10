import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { destinations, locations } from './content.js';
import { addDistrictDetails } from './details.js';
import {makeNavigationSign,buildSignMount} from './signage.js';

export const C = { cream:0xffeccb, white:0xfff7e7, blue:0x287fce, blueDark:0x194d8c, terra:0xe78565, terraDark:0xbd6047, yellow:0xf3c950, mint:0x76c5a6, green:0x245e49, leaf:0x51894b, leafLight:0x8cb66a, gold:0xb99b60, dark:0x35494a, road:0x84969c, pink:0xeeb5b1 };
const materials = new Map();
let furnishingsEnabled = true;
export function mat(color, roughness=.84, metalness=0){const key=`${color}-${roughness}-${metalness}`;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness,metalness}));return materials.get(key);}
export const glow = new THREE.MeshStandardMaterial({color:0xffe3a1,emissive:0xffc56d,emissiveIntensity:.08,roughness:.65});
export const glass = new THREE.MeshStandardMaterial({color:0xa7d7df,transparent:true,opacity:.19,roughness:.2,depthWrite:false,side:THREE.DoubleSide});
const cube=new THREE.BoxGeometry(1,1,1), cylinder=new THREE.CylinderGeometry(1,1,1,12), sphere=new THREE.SphereGeometry(1,9,7);
const roundedBoxes=new Map();
export function box(g,x,y,z,w,h,d,color,rot=0){
 const soft=(w>1.4&&d>.12&&h<.5)||(h>1.6&&Math.min(w,d)>.12);
 let geometry=cube;
 if(soft){const key=[w,h,d].join(',');if(!roundedBoxes.has(key))roundedBoxes.set(key,new RoundedBoxGeometry(w,h,d,2,Math.min(w,h,d)*.22));geometry=roundedBoxes.get(key);}
 const m=new THREE.Mesh(geometry,color?.isMaterial?color:mat(color));m.position.set(x,y,z);if(!soft)m.scale.set(w,h,d);m.rotation.y=rot;m.castShadow=true;m.receiveShadow=true;g.add(m);
 // Keep authored surface dimensions before static material batching.
 if(w>.32&&d>.24&&h<.48)m.userData.snowSurface={w,d,h};return m;
}
export function cyl(g,x,y,z,r,h,color){const m=new THREE.Mesh(cylinder,color?.isMaterial?color:mat(color));m.position.set(x,y,z);m.scale.set(r,h,r);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
export function ball(g,x,y,z,r,color){const m=new THREE.Mesh(sphere,mat(color));m.position.set(x,y,z);m.scale.setScalar(r);m.castShadow=true;if(color===C.leaf||color===C.leafLight)m.userData.snowPlant=true;g.add(m);return m;}
export function rod(g,a,b,r,color){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),m=cyl(g,0,0,0,r,av.distanceTo(bv),color);m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return m;}
function roundedSlab(g,x,y,z,w,d,h,r,color){const shape=new THREE.Shape();shape.moveTo(-w/2+r,-d/2);shape.lineTo(w/2-r,-d/2);shape.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);shape.lineTo(w/2,d/2-r);shape.quadraticCurveTo(w/2,d/2,w/2-r,d/2);shape.lineTo(-w/2+r,d/2);shape.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);shape.lineTo(-w/2,-d/2+r);shape.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);const geo=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,curveSegments:7});geo.rotateX(-Math.PI/2);const m=new THREE.Mesh(geo,mat(color));m.position.set(x,y,z);m.receiveShadow=true;g.add(m);return m;}
function rail(g,x,y,z,w,d,openRight=false){const h=.62,r=.025;for(const dz of [-d/2,d/2]){rod(g,[x-w/2,y+h,z+dz],[x+w/2,y+h,z+dz],r,C.gold);rod(g,[x-w/2,y+.18,z+dz],[x+w/2,y+.18,z+dz],r*.7,C.gold);for(let i=0;i<=Math.ceil(w/.55);i++){let xx=x-w/2+i*w/Math.ceil(w/.55);rod(g,[xx,y,z+dz],[xx,y+h,z+dz],r*.7,C.gold);}}for(const dx of [-w/2,w/2]){if(openRight&&dx>0)continue;rod(g,[x+dx,y+h,z-d/2],[x+dx,y+h,z+d/2],r,C.gold);for(let i=0;i<=Math.ceil(d/.55);i++){let zz=z-d/2+i*d/Math.ceil(d/.55);rod(g,[x+dx,y,zz],[x+dx,y+h,zz],r*.7,C.gold);}}}
function pot(g,x,y,z,size=.34){cyl(g,x,y+size*.5,z,size*.65,size,0xdba783);cyl(g,x,y+size,z,size*.73,size*.12,C.cream);ball(g,x,y+size*1.65,z,size*.8,C.leaf);ball(g,x+size*.4,y+size*1.8,z,size*.6,C.leafLight);}
function planter(g,x,y,z,w=1.5){box(g,x,y+.18,z,w,.36,.48,C.cream);for(let i=0;i<Math.ceil(w/.3);i++)ball(g,x-w/2+.16+i*.3,y+.48,z,.22,i%2?C.leaf:C.leafLight);}
function chair(g,x,y,z,rot=0,color=C.green){const group=new THREE.Group();group.position.set(x,y,z);group.rotation.y=rot;g.add(group);box(group,0,.46,0,.42,.09,.43,color);box(group,0,.77,-.19,.42,.5,.055,color);for(let xx of [-.16,.16])for(let zz of [-.15,.15])box(group,xx,.22,zz,.045,.45,.045,C.gold);}
function table(g,x,y,z,size=.68){cyl(g,x,y+.76,z,size,.09,C.white);cyl(g,x,y+.38,z,.055,.72,C.gold);cyl(g,x,y+.04,z,.28,.06,C.gold);cyl(g,x+.16,y+.86,z,.055,.12,C.cream);cyl(g,x-.2,y+.83,z,.16,.025,C.cream);pot(g,x,y+.81,z-.15,.1);}
function seating(g,x,y,z){if(!furnishingsEnabled)return;table(g,x,y,z,.5);chair(g,x-.85,y,z,Math.PI/2);chair(g,x+.85,y,z,-Math.PI/2);}
function window(g,x,y,z,w,h,color=C.cream){box(g,x,y,z,w,h,.035,glass);for(let xx of [x-w/2,x,x+w/2])box(g,xx,y,z+.04,.085,h+.12,.095,color);for(let yy of [y-h/2,y+h/2])box(g,x,yy,z+.04,w+.12,.09,.095,color);}
function awning(g,x,y,z,w,d,color=C.mint){let segments=Math.ceil(w/.38);for(let i=0;i<segments;i++){const part=box(g,x-w/2+(i+.5)*w/segments,y,z,w/segments,.10,d,i%2?C.cream:color);part.rotation.x=.16;box(g,x-w/2+(i+.5)*w/segments,y-.17,z+d/2,w/segments,.28,.07,i%2?C.cream:color);}}
function desk(g,x,y,z){if(!furnishingsEnabled)return;box(g,x,y+.75,z,1.25,.09,.64,C.cream);for(let xx of [x-.5,x+.5])box(g,xx,y+.36,z,.06,.72,.5,C.dark);box(g,x,y+1.16,z-.1,.66,.43,.045,C.dark);box(g,x,y+1.16,z-.069,.56,.33,.01,0x93bfcc);box(g,x,y+.87,z-.1,.05,.2,.05,C.dark);box(g,x,y+.82,z+.17,.47,.025,.17,C.dark);chair(g,x,y,z+.62,Math.PI,C.blueDark);}
function bookshelf(g,x,y,z,w=1.4){if(!furnishingsEnabled)return;box(g,x,y+.85,z,w,1.7,.32,C.green);for(let yy of [.12,.65,1.2]){box(g,x,y+yy,z+.19,w,.06,.45,C.cream);for(let i=0;i<7;i++)box(g,x-w/2+.12+i*w/7,y+yy+.22,z+.07,.1,.30+(i%3)*.05,.23,[C.terra,C.yellow,C.mint,C.blue][i%4]);}}
function stairs(g,x,y,z,width,count=12,dir=1){for(let i=0;i<count;i++)box(g,x,y+(i+.5)*.205,z-dir*i*.22,width,.205,.24,C.cream);rod(g,[x+width/2,y+.7,z+.1],[x+width/2,y+count*.205+.7,z-dir*count*.22],.025,C.gold);for(let i=0;i<count;i+=3)rod(g,[x+width/2,y+i*.205,z-dir*i*.22],[x+width/2,y+i*.205+.7,z-dir*i*.22],.022,C.gold);}
function label(text,sub,color='#315f4b',w=3,h=.95){const cv=document.createElement('canvas');cv.width=768;cv.height=256;const c=cv.getContext('2d');c.fillStyle='#fff3d6';c.fillRect(0,0,768,256);c.strokeStyle=color;c.lineWidth=13;c.strokeRect(12,12,744,232);c.fillStyle=color;c.textAlign='center';c.font='700 75px Georgia';c.fillText(text,384,124);c.font='500 24px sans-serif';c.letterSpacing='5px';c.fillText(sub,384,183);const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.MeshBasicMaterial({map:tex,color:0xf3f3f3,toneMapped:false});return new THREE.Mesh(new THREE.BoxGeometry(w,h,.10),[mat(C.gold),mat(C.gold),mat(C.gold),mat(C.gold),m,mat(C.cream)]);}

export function buildCity(scene, { furnishings=true, blankSigns=false, carouselReserved=true } = {}){ furnishingsEnabled=furnishings;
 const city=new THREE.Group();scene.add(city);const signs=[],pickables=[],lamps=[],shelters=[[-7,0,8],[0,0,7],[6,0,7],[-4,0,1],[8,0,-1]];
 roundedSlab(city,0,-.6,0,33,29,.55,1.3,0xe8eeee);
 roundedSlab(city,0,-.05,0,30.3,26.3,.05,2,C.road);
 roundedSlab(city,0,.015,0,27,23,.035,1.3,0xf7df88);
 roundedSlab(city,0,.055,0,26.8,22.8,.04,1.2,C.road);
 roundedSlab(city,0,.1,0,24.6,20.6,.18,.8,0xe9e8dc);
 roundedSlab(city,0,.29,0,24.1,20.1,.04,.6,0xf4f0e4);
 // Tactile curb stones and road markings.
 for(let x=-11;x<=11;x+=.65){box(city,x,.29,10.32,.60,.15,.18,C.white);box(city,x,.29,-10.32,.60,.15,.18,C.white);}
 for(let z=-9.5;z<10;z+=.65){box(city,12.32,.29,z,.18,.15,.6,C.white);box(city,-12.32,.29,z,.18,.15,.6,C.white);}
 for(let x=-10.5;x<11;x+=1.8){box(city,x,.12,12.22,.8,.015,.08,C.white);box(city,x,.12,-12.22,.8,.015,.08,C.white);}
 for(let z=-9;z<9;z+=1.8){box(city,14.23,.12,z,.08,.015,.8,C.white);box(city,-14.23,.12,z,.08,.015,.8,C.white);}
 for(let i=0;i<6;i++)box(city,9.7+i*.33,.125,11.5,.18,.025,1.3,C.white);
 for(let x=-10;x<11;x+=.58)box(city,x,.34,9.35,.025,.012,.8,0xd8d5c8);
 // Terraced central building: each floor retreats to expose a usable balcony.
 const floors=[{w:7.8,d:6.7,z:-2,h:2.7},{w:7.8,d:6.7,z:-2,h:2.7},{w:6.8,d:5.6,z:-2.3,h:2.7},{w:5.8,d:4.7,z:-2.65,h:2.7},{w:4.7,d:3.8,z:-2.9,h:2.6},{w:3.5,d:2.9,z:-3.1,h:2.3}];
 let y=.35;
 floors.forEach((f,i)=>{const fh=f.h,front=f.z+f.d/2;
  box(city,0,y+.10,f.z,f.w+.45,.20,f.d+.45,C.cream);box(city,0,y+.23,f.z,f.w,.07,f.d,C.terra);
  box(city,0,y+fh/2,f.z-f.d/2,f.w,fh,.14,i%2?C.terra:C.terraDark);
  for(let xx of [-f.w/2,f.w/2])for(let zz of [f.z-f.d/2,front])box(city,xx,y+fh/2,zz,.17,fh,.17,C.terraDark);
  box(city,0,y+fh-.12,front,f.w,.26,.20,C.terra);
  for(let xx=-f.w/2+.8;xx<f.w/2;xx+=1.2)window(city,xx,y+fh/2,front-.38,1.1,fh-1.0,C.cream);
  // Right side glazing is deliberately sparse to leave furnished floors visible.
  for(let zz=f.z-f.d/2+.7;zz<front-.4;zz+=1.1){box(city,f.w/2,y+fh/2,zz,.07,fh-.5,.07,C.cream);}
  if(i%3===0){if(i!==3||!furnishings)desk(city,-f.w*.24,y+.25,f.z);bookshelf(city,f.w*.28,y+.25,f.z-f.d*.31);pot(city,-f.w*.35,y+.25,front-.6,.4);}
  else if(i===2){if(!furnishings)for(let xx of [-1.5,1.2]){box(city,xx,y+.4,f.z,1.2,.12,1.8,C.dark);rod(city,[xx,y+.6,f.z+.4],[xx,y+1.5,f.z-.6],.08,C.gold);cyl(city,xx,y+1.5,f.z-.6,.18,.12,C.dark).rotation.z=Math.PI/2;}}
  else if(i!==4||!furnishings){seating(city,-f.w*.22,y+.25,f.z);if(f.w>5)seating(city,f.w*.23,y+.25,f.z);}
  rail(city,0,y+.25,front+.13,f.w+.3,.48);planter(city,-f.w/2+.65,y+.25,front+.1,1.05);planter(city,f.w/2-.65,y+.25,front+.1,1.05);
  if(i>1){const prev=floors[i-1];const tz=prev.z+prev.d/2-.2;box(city,0,y+.10,prev.z,prev.w+.45,.2,prev.d+.45,C.cream);pot(city,-prev.w/2+.35,y+.2,tz,.22);}
  y+=fh;
 });
 box(city,0,y+.08,-3.1,4.15,.18,3.5,C.terraDark);rail(city,0,y+.18,-3.1,4.05,3.4);awning(city,0,y-.1,-2.7,3.7,2.7,C.terra);pot(city,-1.7,y+.2,-1.7,.32);
 // Azure studio tower.
 for(let i=0;i<5;i++){const yy=.35+i*2.55;box(city,-7.5,yy+.1,-3.5,4.25,.2,4.3,C.cream);box(city,-7.5,yy+1.3,-5.5,3.95,2.5,.15,C.blue);box(city,-9.45,yy+1.3,-3.5,.15,2.5,4.1,C.blue);
  for(let xx of [-9.4,-5.6])box(city,xx,yy+1.3,-1.55,.18,2.5,.18,C.blueDark);box(city,-7.5,yy+2.38,-1.55,4,.33,.2,C.blue);
  window(city,-7.5,yy+1.35,-1.65,3.35,1.65,C.cream);if(i!==1)desk(city,-8,yy+.22,-3.5);bookshelf(city,-6.25,yy+.22,-4.9,1.05);pot(city,-6,yy+.22,-2.2,.3);rail(city,-7.5,yy+.2,-1.15,4.25,.6,furnishings&&i===1);
 }box(city,-7.5,13.23,-3.5,4.3,.22,4.35,C.green);rail(city,-7.5,13.35,-3.5,4.2,4.2);seating(city,-7.5,13.4,-3.5);planter(city,-9.2,13.4,-2.2,.7);
 // Butter-yellow restaurant and green rooftop.
 for(let i=0;i<3;i++){let yy=.35+i*2.9;box(city,8,yy+.12,-3.6,4.6,.24,4.4,C.cream);box(city,8,yy+1.4,-5.7,4.4,2.8,.14,C.yellow);box(city,5.8,yy+1.4,-3.6,.17,2.8,4.2,C.yellow);box(city,10.2,yy+.38,-3.6,.17,.5,4.2,C.yellow);box(city,10.2,yy+2.65,-3.6,.17,.4,4.2,C.yellow);for(let z of [-5.65,-3.6,-1.55])box(city,10.2,yy+1.4,z,.18,2.8,.12,C.cream);box(city,8,yy+2.65,-1.5,4.5,.4,.2,C.yellow);window(city,8,yy+1.5,-1.55,3.9,1.8,C.green);seating(city,7.6,yy+.25,-3.7);rail(city,8,yy+.25,-.95,4.6,.8);planter(city,9.5,yy+.3,-.9,.85);}
 box(city,8,9.15,-3.6,4.8,.25,4.6,C.green);rail(city,8,9.29,-3.6,4.7,4.5);seating(city,8,9.3,-3.4);pot(city,6.1,9.3,-1.8,.3);
 // Front terrace pavilion, two open floors and a roof garden.
 for(let i=0;i<2;i++){let yy=.35+i*2.5;box(city,3.3,yy+.12,4.1,6.5,.24,4.1,C.cream);box(city,3.3,yy+1.25,2.1,6.3,2.5,.15,C.white);box(city,.2,yy+1.25,4.1,.18,2.5,4,C.terra);box(city,6.4,yy+2.3,4.1,.18,.4,4,C.terra);for(let zz of [2.1,4.1,6.1])box(city,6.4,yy+1.25,zz,.18,2.5,.12,C.terra);box(city,3.3,yy+2.3,6.1,6.4,.4,.15,i?C.mint:C.terra);for(let xx of [1.2,3.3,5.4]){seating(city,xx,yy+.25,4.2);window(city,xx,yy+1.3,6.02,1.7,1.6,C.green);}rail(city,3.3,yy+.26,6.5,6.5,.6);}
 box(city,3.3,5.4,4.1,6.6,.2,4.3,C.green);rail(city,3.3,5.52,4.1,6.6,4.3);seating(city,1.4,5.55,4.2);seating(city,5.1,5.55,4.2);planter(city,3.3,5.55,6,2);awning(city,3.4,7.5,3.8,5.9,3.2,C.cream);for(let xx of [.6,6.2])for(let zz of [2.4,5.2])rod(city,[xx,5.5,zz],[xx,7.5,zz],.04,C.gold);
 if(!furnishings){stairs(city,7.15,.35,6.6,1,12);stairs(city,-4.6,.35,2.9,1.1,13);stairs(city,-4.6,3.05,-.1,1.1,13);}
 if(!furnishings){box(city,-3.5,3.08,.15,2.5,.15,1,C.cream);rail(city,-3.5,3.18,.15,2.5,1);}
 // Foreground café and bookshop.
 function shop(x,z,w,color,roof){box(city,x,.39,z,w,.12,2.3,C.cream);box(city,x,1.35,z-1.1,w,2,.12,color);box(city,x-w/2,1.35,z,.12,2,2.3,color);box(city,x+w/2,.62,z,.12,.5,2.3,color);box(city,x+w/2,2.25,z,.12,.2,2.3,color);for(let zz of [z-1.1,z+1.1])box(city,x+w/2,1.35,zz,.12,2,.12,color);box(city,x,2.43,z,w+.25,.18,2.55,roof);window(city,x,1.32,z+1.16,w-.6,1.5,C.cream);box(city,x-w*.28,.93,z+1.2,.65,1.7,.07,C.green);box(city,x-w*.28,1.2,z+1.25,.5,.95,.03,glass);awning(city,x,2.17,z+1.6,w+.2,1,roof);rail(city,x,2.55,z,w+.15,2.45);pot(city,x-w*.35,2.55,z+.8,.3);pot(city,x+w*.35,2.55,z+.8,.3);}
 shop(-6.8,7.3,3.8,C.mint,C.green);shop(.2,7.8,3.1,C.cream,C.terra);shop(-10,3.7,2.9,C.yellow,C.green);
 table(city,-6.8,.35,9.4,.5);chair(city,-7.65,.35,9.4,Math.PI/2);chair(city,-5.95,.35,9.4,-Math.PI/2);
 // Reserved carousel site: a quiet circular plinth at this stage.
 if(carouselReserved)cyl(city,-8,.43,1.6,1.85,.20,C.cream);
 if(carouselReserved)cyl(city,-8,.55,1.6,1.65,.045,C.mint);
 // Front square: wooden deck, café umbrellas and flower planters.
 for(let i=0;i<17;i++)box(city,-3.5+i*.32,.39,7,.29,.12,2.2,0xce9b70);
 for(let x of [-3.2,-1.5]){seating(city,x,.46,7);cyl(city,x,.46+1.6,7,.025,3.2,C.gold);const canopy=new THREE.Mesh(new THREE.ConeGeometry(1.05,.3,8),mat(x<-2?C.mint:C.cream));canopy.position.set(x,3.6,7);city.add(canopy);}
 for(let x of [-10,-4,4,10])planter(city,x,.0,13.4,2.6);
 for(let p of [[-11,9],[10,8],[10,-8],[-11,-8],[-3,9],[8,2],[-5,4],[3,-7]]){pot(city,p[0],.35,p[1],.48);}
 // Delicate street lamps, night bulbs share one persistent emissive material.
 for(let p of [[-11,7],[-5,10],[3,10],[11,5],[11,-7],[-11,-8]]){cyl(city,p[0],1.9,p[1],.05,3.1,C.green);cyl(city,p[0],.5,p[1],.17,.3,C.green);box(city,p[0],3.49,p[1],.36,.4,.36,glow);box(city,p[0],3.73,p[1],.53,.12,.53,C.green);lamps.push(new THREE.Vector3(p[0],3.5,p[1]));}
 // Bus stop furniture.
 for(let x of [-9,9]){for(let xx of [x-1.25,x+1.25])rod(city,[xx,.3,10.3],[xx,2.25,10.3],.035,C.green);box(city,x,2.32,10.25,2.9,.13,1.1,C.mint);box(city,x,1.15,10.07,2.5,1.6,.04,glass);box(city,x,.8,10.25,2.25,.13,.42,C.terra);rod(city,[x+1.65,.3,10.6],[x+1.65,2.25,10.6],.035,C.green);const busSign=label('BUS','CITY LOOP','#315f4b',.52,.50);busSign.position.set(x+1.65,2.25,10.65);scene.add(busSign);}
 // Architectural picking volumes are independent of render batching.
 const regions=locations.map(place=>[place.id,place.center,place.size]);
 for(let [id,p,s] of regions){let mesh=new THREE.Mesh(new THREE.BoxGeometry(...s),new THREE.MeshBasicMaterial({visible:false}));mesh.position.set(...p);mesh.userData={type:'building',id,focus:p};scene.add(mesh);pickables.push(mesh);}
 for(let entry of destinations){
   const sign=makeNavigationSign(entry,blankSigns),[w,h]=entry.size;
   buildSignMount(city,entry,{box,rod,cyl,mat,C});
   scene.add(sign);pickables.push(sign);signs.push(sign);
 }
 const routes=furnishings?addDistrictDetails(city,{box,cyl,ball,rod,mat,C,glow,glass,table,chair,seating,pot,planter,bookshelf}):[];
 // Batch static architecture by material to keep dense detailing inexpensive.
 city.updateMatrixWorld(true);const snowSurfaces=[],snowPlants=[];const buckets=new Map();city.traverse(o=>{if(o.isMesh){if(o.userData.snowPlant)snowPlants.push(o.matrixWorld.clone());if(o.userData.snowSurface){const {w,d,h}=o.userData.snowSurface;const pose=new THREE.Matrix4().compose(o.getWorldPosition(new THREE.Vector3()),o.getWorldQuaternion(new THREE.Quaternion()),new THREE.Vector3(1,1,1));snowSurfaces.push({w,d,h,matrix:pose});}const m=o.material;if(!buckets.has(m))buckets.set(m,[]);buckets.get(m).push((o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrixWorld));}});
 city.clear();for(let [material,geos] of buckets){let geo=mergeGeometries(geos);const mesh=new THREE.Mesh(geo,material);mesh.castShadow=!material.transparent;mesh.receiveShadow=true;city.add(mesh);for(let g of geos)g.dispose();}
 return {city,signs,pickables,lamps,shelters,routes,snowSurfaces,snowPlants};
}

export function buildFerris(scene, { blankSigns=false } = {}){const base=new THREE.Group();base.position.set(-10.1,.35,-6.7);scene.add(base);base.userData.locationId='ferris';const radius=4.4,cy=10.1;
 for(let z of [-.65,.65]){rod(base,[-2.3,0,z],[0,cy,z],.12,C.terraDark);rod(base,[2.3,0,z],[0,cy,z],.12,C.terraDark);box(base,0,.15,z,5,.3,.5,C.cream);}
 const wheel=new THREE.Group();wheel.position.y=cy;base.add(wheel);for(let z of [-.45,.45]){let torus=new THREE.Mesh(new THREE.TorusGeometry(radius,.055,6,100),mat(0x9d4c60));torus.position.z=z;wheel.add(torus);for(let i=0;i<10;i++){const a=i/10*Math.PI*2;rod(wheel,[0,0,z],[Math.cos(a)*radius,Math.sin(a)*radius,z],.033,0xb87e89);}}
 let axle=cyl(base,0,cy,0,.3,1.4,C.gold);axle.rotation.x=Math.PI/2;
 const cabins=[];for(let i=0;i<10;i++){const pivot=new THREE.Group();wheel.add(pivot);let a=i/10*Math.PI*2;pivot.position.set(Math.cos(a)*radius,Math.sin(a)*radius,0);const cabin=new THREE.Group();pivot.add(cabin);box(cabin,0,-.65,0,1.1,.55,.85,[C.mint,C.yellow,C.pink,C.cream][i%4]);box(cabin,0,-.95,0,1.12,.12,.9,C.cream);for(let x of [-.48,.48])rod(cabin,[x,-.4,0],[x,.4,0],.025,C.gold);box(cabin,0,.38,0,1.15,.10,.9,[C.mint,C.yellow,C.pink,C.cream][i%4]);cabins.push({pivot,cabin,angle:a});}
 box(base,0,1,2.2,3,1.8,1.6,C.cream);box(base,0,2,2.2,3.2,.16,1.8,C.terra);const sign=label(blankSigns?'':'THE WHEEL',blankSigns?'':'TAKE A LITTLE BREAK','#9d4c60',2.5,.8);sign.position.set(-10,3,-4.5);scene.add(sign);
 return {root:base,wheel,cabins,update(t){wheel.rotation.z=t*.055;cabins.forEach(c=>c.cabin.rotation.z=-wheel.rotation.z);}};
}

export function buildCarousel(scene){const g=new THREE.Group();g.position.set(-8,.35,1.6);g.userData.locationId='carousel';scene.add(g);cyl(g,0,.13,0,1.8,.26,C.cream);cyl(g,0,.33,0,1.7,.15,C.terra);cyl(g,0,1.65,0,.12,2.9,C.gold);const top=new THREE.Mesh(new THREE.ConeGeometry(2,.8,16),mat(C.mint));top.position.y=3.3;g.add(top);cyl(g,0,2.93,0,2,.13,C.cream);ball(g,0,3.8,0,.15,C.gold);
 const spin=new THREE.Group();g.add(spin);const horses=[];for(let i=0;i<5;i++){const a=i/5*Math.PI*2;let pivot=new THREE.Group();pivot.position.set(Math.cos(a)*1.15,0,Math.sin(a)*1.15);pivot.rotation.y=-a-Math.PI/2;spin.add(pivot);cyl(pivot,0,1.6,0,.025,2.6,C.gold);const horse=new THREE.Group();horse.position.y=1.1;pivot.add(horse);box(horse,0,0,0,.58,.28,.26,C.cream);box(horse,.25,.22,0,.18,.5,.22,C.cream);box(horse,.36,.4,0,.28,.18,.23,C.cream);box(horse,-.04,.18,0,.3,.08,.3,C.terra);for(let x of [-.2,.2])for(let z of [-.09,.09])rod(horse,[x,-.1,z],[x+.07,-.42,z],.035,C.cream);horses.push(horse);}
 return {root:g,horses,spin,update(t){spin.rotation.y=-t*.16;horses.forEach((h,i)=>h.position.y=1.1+Math.sin(t*1.7+i*1.7)*.15);}};
}












