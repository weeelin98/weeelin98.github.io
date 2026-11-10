import * as THREE from 'three';
import { box, cyl, ball, rod, mat, C } from './city.js';
import {createRainResponse} from './rain-response.js';

const skins=[0xf0c49b,0xc68d65,0x895a43,0xe1ac86,0xac7654];
const shirts=[C.mint,C.terra,C.blue,0xedd78d,0xeee7d7,0xae7b94,C.green];
const hairColors=[0x3d302a,0x72533d,0xb48b55,0x252f34,0x9e6651];
const TAU=Math.PI*2;
const hairCapGeometry=new THREE.SphereGeometry(.139,10,7,0,TAU,0,1.5);
const glassesGeometry=new THREE.TorusGeometry(.036,.006,4,10);
const cupHandleGeometry=new THREE.TorusGeometry(.035,.009,4,10);

// Local +Z is the face direction. Joint positions are measured from the feet.
// Seated people use the same seat height as the district's chairs (0.46).
function mannequin(parent,id,pose='stand',scale=.9){
  const root=new THREE.Group();root.name=`citizen-${id}`;root.scale.setScalar(scale);parent.add(root);
  const skin=skins[id%5],shirt=shirts[(id*3)%7],hair=hairColors[id%5];
  const feminine=id%2===0, stocky=id%4===0;
  const body=new THREE.Group();root.add(body);
  const seated=['sit','type','drink','read','ride'].includes(pose);
  const hip=seated?.51/scale:.51;
  body.position.y=hip;
  const torso=cyl(body,0,.22,0,stocky?.15:.125,.39,shirt);torso.scale.z*=.73;
  cyl(body,0,.45,0,.047,.10,skin);
  if(feminine&&id%4===0){const skirt=new THREE.Mesh(new THREE.CylinderGeometry(.12,.18,.22,10),mat(shirt));skirt.position.y=-.015;body.add(skirt);}
  const head=new THREE.Group();head.position.y=.59;body.add(head);
  const face=ball(head,0,0,0,.135,skin);face.scale.y*=1.13;
  const cap=new THREE.Mesh(hairCapGeometry,mat(hair));cap.position.y=.028;head.add(cap);
  if(feminine){ball(head,0,-.015,-.12,.085,hair);if(id%3===0)ball(head,0,-.12,-.15,.067,hair);}
  for(let x of [-.045,.045])ball(head,x,.006,.122,.012,C.dark);
  ball(head,0,-.03,.14,.019,skin);
  if(id%6===0){for(let x of [-.045,.045]){const lens=new THREE.Mesh(glassesGeometry,mat(C.dark));lens.position.set(x,.007,.139);head.add(lens);}rod(head,[-.015,.01,.14],[.015,.01,.14],.005,C.dark);}
  const arms=[],legs=[];
  for(let side of [-1,1]){
    const upper=new THREE.Group();upper.position.set(side*(stocky?.18:.16),.36,0);body.add(upper);
    cyl(upper,0,-.09,0,.045,.18,shirt);
    const fore=new THREE.Group();fore.position.y=-.18;upper.add(fore);
    cyl(fore,0,-.075,0,.034,.15,skin);ball(fore,0,-.16,0,.041,skin);
    arms.push({upper,fore});
    const thigh=new THREE.Group();thigh.position.set(side*.078,0,0);body.add(thigh);
    box(thigh,0,-.115,0,.105,.23,.12,0x405661);
    const shin=new THREE.Group();shin.position.y=-.23;thigh.add(shin);
    box(shin,0,-.105,0,.09,.21,.10,0x405661);box(shin,0,-.245,.035,.115,.07,.21,0x353c3d);
    legs.push({thigh,shin});
  }
  const prop=new THREE.Group();arms[1].fore.add(prop);prop.position.set(0,-.15,.045);
  if(['drink','serve'].includes(pose)){cyl(prop,0,.045,.025,.052,.10,C.white);const handle=new THREE.Mesh(cupHandleGeometry,mat(C.white));handle.position.set(.055,.05,.025);prop.add(handle);}
  if(pose==='read'||pose==='browse'){box(prop,-.1,0,.05,.24,.025,.20,C.terra);box(prop,-.1,.018,.05,.21,.012,.17,C.cream);}
  if(!seated&&id%5===0){box(body,-.15,.04,-.08,.09,.22,.17,C.terra);rod(body,[-.15,.37,-.09],[-.15,.06,-.09],.014,C.gold);}
  if(seated){for(const l of legs){l.thigh.rotation.x=-Math.PI/2;l.shin.rotation.x=Math.PI/2;}for(const a of arms){a.upper.rotation.x=-.4;a.fore.rotation.x=-.65;}}
  if(pose==='ride'){for(const l of legs){l.thigh.rotation.x=-.45;l.shin.rotation.x=.65;}arms.forEach(a=>{a.upper.rotation.x=-.8;a.fore.rotation.x=-.4;});}
  if(pose==='type'){arms.forEach(a=>{a.upper.rotation.x=-.55;a.fore.rotation.x=-.95;});}
  if(pose==='drink'||pose==='read'||pose==='browse'){arms[1].upper.rotation.x=-.55;arms[1].fore.rotation.x=-1.3;}
  if(pose==='serve'){arms[1].upper.rotation.x=-.5;arms[1].fore.rotation.x=-1.05;}
  // Only body/head cast shadows; finger-sized limb shadows cost more than they add.
  root.traverse(o=>{if(o.isMesh)o.castShadow=false;});torso.castShadow=true;face.castShadow=true;
  return {root,body,head,arms,legs,pose,phase:(id*2.399)%TAU,rate:.75+(id%7)*.075,id};
}

// Explicit furniture-relative placements: [x,floor,z,yaw,pose,area].
const anchors=[
 [-8,.57,-2.88,Math.PI,'type','office'],[-8,5.67,-2.88,Math.PI,'type','office'],
 [-8,8.22,-2.88,Math.PI,'type','office'],[-8,10.77,-2.88,Math.PI,'type','office'],
 [-7.65,3.12,-3.05,Math.PI,'sit','meeting'],[-6.65,3.12,-4.5,0,'sit','meeting'],
 [-6.2,8.22,-4.25,Math.PI,'browse','office'],[-8.35,13.4,-3.5,Math.PI/2,'drink','roof'],
 [-1.872,.60,-1.38,Math.PI,'type','studio'],[-1,8.7,-2.5,Math.PI,'type','studio'],
 [.5,8.7,-2.5,Math.PI,'read','studio'],[-.15,6.30,-2.45,Math.PI,'jog','gym'],
 [1.9,6,-1.65,Math.PI,'exercise','gym'],[-2.566,3.3,-2,Math.PI/2,'drink','dining'],
 [-.866,3.3,-2,-Math.PI/2,'sit','dining'],[-1,11.59,-3.3,0,'read','lounge'],
 [.08,14,-3.1,-Math.PI/2,'drink','roof'],[9.65,.60,-2.2,-Math.PI/2,'drink','restaurant'],
 [9.65,3.50,-2.2,-Math.PI/2,'sit','restaurant'],[9.65,6.40,-2.2,-Math.PI/2,'drink','restaurant'],
 [8,.60,-5.40,0,'serve','restaurant'],[2.45,.60,4.2,Math.PI/2,'sit','pavilion'],
 [4.55,3.10,4.2,Math.PI/2,'drink','pavilion'],[4.25,5.55,4.2,Math.PI/2,'sit','roof'],
 [-6.45,.45,6.42,0,'serve','cafe'],[-9.65,.45,3.17,0,'serve','bakery'],
 [-9.65,.45,4.43,Math.PI,'stand','bakery'],[.85,.45,7.48,0,'stand','bookshop'],
 [-.65,.45,7.8,Math.PI,'browse','bookshop'],[-7.65,.35,9.4,Math.PI/2,'drink','cafe'],
];

// Two narrow, closed sidewalk circuits avoid storefronts, seats and bicycle pockets.
function sidewalkLoop(x0,x1,z0,z1){
  const path=new THREE.CurvePath(),r=(x1-x0)/2,c=(x0+x1)/2;
  const v=(x,z)=>new THREE.Vector3(x,.35,z);
  path.add(new THREE.LineCurve3(v(x0,z0+r),v(x0,z1-r)));
  path.add(new THREE.QuadraticBezierCurve3(v(x0,z1-r),v(c,z1+r),v(x1,z1-r)));
  path.add(new THREE.LineCurve3(v(x1,z1-r),v(x1,z0+r)));
  path.add(new THREE.QuadraticBezierCurve3(v(x1,z0+r),v(c,z0-r),v(x0,z0+r)));
  return path;
}

export function createCitizens(scene,ferris,carousel){
  let rainResponse=null;
  const citizens=[],walkers=[],loops=[sidewalkLoop(-12.08,-11.68,-6.5,5.8),sidewalkLoop(11.6,12,-8.8,6.2)];
  function add(parent,pose,scale=.9){const p=mannequin(parent,citizens.length,pose,scale);citizens.push(p);return p;}
  for(const [x,y,z,yaw,pose,area]of anchors){const p=add(scene,pose);p.root.position.set(x,y,z);p.root.rotation.y=yaw;p.area=area;}
  for(let lane=0;lane<2;lane++){const n=lane===0?4:6;for(let i=0;i<n;i++){const p=add(scene,'walk',.86+(i%3)*.025);p.path=loops[lane];p.distance=i/n;p.length=p.path.getLength();p.area='street';walkers.push(p);}}
  for(const [x,z,yaw,pose]of [[-9.8,9.73,0,'stand'],[-8.7,9.72,.4,'browse'],[8.4,9.72,0,'stand'],[9.2,9.72,-.5,'stand']]){const p=add(scene,pose);p.root.position.set(x,.35,z);p.root.rotation.y=yaw;p.area='bus-stop';}
  for(const index of [0,2,5,7]){const p=add(ferris.cabins[index].cabin,'sit',.56);p.root.position.set(0,-.93,-.06);p.area='ferris';}
  for(const index of [0,2]){const p=add(carousel.horses[index],'ride',.63);p.root.position.set(0,-.10,0);p.root.rotation.y=Math.PI/2;p.area='carousel';}
  const point=new THREE.Vector3(),ahead=new THREE.Vector3();
  function update(t,dt,raining=false){
    rainResponse?.before(dt,raining);
    for(const p of walkers){if(p.walkBlocked)continue;p.distance=(p.distance+dt*.42*(p.rainSpeed??1)/p.length)%1;p.path.getPointAt(p.distance,point);p.path.getPointAt((p.distance+.0002)%1,ahead);p.root.position.copy(point);p.root.rotation.y=Math.atan2(ahead.x-point.x,ahead.z-point.z);}
    for(const p of citizens){
      const f=t*p.rate+p.phase,s=Math.sin(f),walking=p.pose==='walk'||p.pose==='jog';
      p.head.rotation.y=Math.sin(f*.6)*.12;
      if(walking){const stride=Math.sin(t*(p.pose==='jog'?7:4.3)+p.phase);p.legs.forEach((l,i)=>{l.thigh.rotation.x=stride*(i?-.30:.30);l.shin.rotation.x=Math.max(0,stride*(i?1:-1))*.35;});p.arms.forEach((a,i)=>{a.upper.rotation.x=stride*(i?.25:-.25);a.fore.rotation.x=-.15;});p.body.position.y=.51+Math.abs(stride)*.018;}
      else if(p.pose==='type'){p.arms[0].fore.rotation.x=-.95+s*.045;p.arms[1].fore.rotation.x=-.95+Math.sin(f+1)*.04;}
      else if(p.pose==='drink'){const sip=Math.pow((Math.sin(f*.55)+1)/2,7);p.arms[1].fore.rotation.x=-1.1-sip*.65;p.arms[1].upper.rotation.x=-.55-sip*.15;}
      else if(p.pose==='exercise'){const bend=(s+1)*.15;p.legs.forEach(l=>{l.thigh.rotation.x=-bend;l.shin.rotation.x=bend*2;});p.body.position.y=.51-bend*.12;p.arms.forEach(a=>{a.upper.rotation.x=-.6-bend;});}
      else if(p.pose==='serve')p.arms[1].upper.rotation.x=-.5+s*.08;
      else if(p.pose==='sit'||p.pose==='read')p.head.rotation.x=Math.sin(f*.8)*.04+(p.pose==='read'?.1:0);
    }
    rainResponse?.after(t,dt);
  }
  update(0,0);
  rainResponse=createRainResponse(citizens,walkers);
  return {count:citizens.length,citizens,walkers,update,rainResponse};
}

