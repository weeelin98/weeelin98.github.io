import * as THREE from 'three';
import { box,cyl,C } from './city.js';

// Curves stay centered in the existing road; rounded turns have no spline overshoot.
function cityLoop(){
  const p=new THREE.CurvePath(),x=13.45,z=11.7,r=1.65,v=(a,b)=>new THREE.Vector3(a,.14,b);
  const line=(a,b)=>p.add(new THREE.LineCurve3(v(...a),v(...b)));
  const bend=(a,b,c)=>p.add(new THREE.QuadraticBezierCurve3(v(...a),v(...b),v(...c)));
  line([-x+r,z],[x-r,z]);bend([x-r,z],[x,z],[x,z-r]);line([x,z-r],[x,-z+r]);bend([x,-z+r],[x,-z],[x-r,-z]);
  line([x-r,-z],[-x+r,-z]);bend([-x+r,-z],[-x,-z],[-x,-z+r]);line([-x,-z+r],[-x,z-r]);bend([-x,z-r],[-x,z],[-x+r,z]);
  return p;
}
export function createTraffic(scene){
  const path=cityLoop(),length=path.getLength(),stops=[2.8,20.8],minGap=3.4,vehicles=[];
  function nextStop(distance){const lap=Math.floor(distance/length);return stops.map(s=>s+lap*length).find(s=>s>distance+.01)??stops[0]+(lap+1)*length;}
  for(let i=0;i<3;i++){
    const root=new THREE.Group();root.name=`bus-${i}`;scene.add(root);const color=[C.mint,C.terra,C.yellow][i];
    box(root,0,.61,0,.9,.83,2.1,color);box(root,0,1.08,0,.95,.12,2.15,C.cream);
    for(let end of [-1,1])box(root,0,.77,end*1.055,.73,.37,.025,0x355963);
    for(let x of [-.46,.46])for(let z of [-.65,0,.65])box(root,x,.8,z,.025,.36,.48,0x355963);
    const wheels=[];for(let x of [-.47,.47])for(let z of [-.68,.68]){const axle=new THREE.Group();axle.position.set(x,.23,z);root.add(axle);const w=cyl(axle,0,0,0,.21,.12,C.dark);w.rotation.z=Math.PI/2;wheels.push(axle);}
    for(let x of [-.29,.29])box(root,x,.47,1.077,.13,.09,.02,0xffedb8);
    box(root,0,.97,1.078,.38,.08,.02,C.cream);
    const distance=i*length/3;vehicles.push({root,wheels,distance,speed:0,wait:0,nextStop:nextStop(distance),stopCount:0});
  }
  const position=new THREE.Vector3(),ahead=new THREE.Vector3();
  function update(dt){
    // Bound substeps so tab suspension or a slow frame cannot skip a stop/leader.
    let remaining=Math.min(dt,1);
    while(remaining>1e-8){const step=Math.min(remaining,1/60);remaining-=step;const old=vehicles.map(b=>b.distance);
      vehicles.forEach((b,i)=>{
        if(b.wait>0){b.wait=Math.max(0,b.wait-step);b.speed=0;return;}
        const gap=((old[(i+1)%3]-old[i])%length+length)%length;
        const stopDistance=b.nextStop-b.distance;
        if(stopDistance<.045){b.distance=b.nextStop;b.wait=2.6;b.speed=0;b.stopCount++;b.nextStop=nextStop(b.distance);return;}
        const safeDistance=Math.max(0,gap-minGap);
        b.speed=Math.min(1.15,b.speed+.6*step,Math.sqrt(2*.9*Math.max(0,stopDistance)),Math.sqrt(2*.9*safeDistance));
        const travel=Math.min(b.speed*step,stopDistance,safeDistance);b.distance+=travel;
        for(const w of b.wheels)w.rotation.x+=travel/.21;
      });
    }
    for(const b of vehicles){const u=(b.distance%length)/length;path.getPointAt(u,position);path.getPointAt((u+.0001)%1,ahead);b.root.position.copy(position);b.root.rotation.y=Math.atan2(ahead.x-position.x,ahead.z-position.z);}
  }
  update(0);
  return {vehicles,path,length,minGap,update};
}
