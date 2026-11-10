import * as THREE from 'three';

// Static stage-two detail builders. All items are batched with the architecture.
export function addDistrictDetails(g, kit) {
  const {box,cyl,ball,rod,mat,C,glow,glass,table,chair,seating,pot,planter,bookshelf}=kit;
  const timber=0xc79a72, steel=0x46595c;
  const routes=[];
  function coffeeBar(x,y,z,w=2.4){
    box(g,x,y+.5,z,w,1,.6,C.mint);
    box(g,x,y+1.04,z,w+.12,.09,.72,C.cream);
    for(let xx=x-w/2+.12;xx<x+w/2;xx+=.17)box(g,xx,y+.48,z+.31,.035,.85,.025,timber);
    box(g,x-.5,y+1.27,z,.6,.4,.4,steel);
    cyl(g,x-.5,y+1.5,z,.16,.1,C.gold);
    for(let xx of [x-.65,x-.35]){rod(g,[xx,y+1.26,z+.22],[xx,y+1.16,z+.22],.024,C.gold);cyl(g,xx,y+1.1,z+.23,.06,.12,C.white);}
    for(let xx of [x+.3,x+.55,x+.8]){cyl(g,xx,y+1.15,z,.065,.15,C.white);cyl(g,xx,y+1.24,z,.07,.025,C.gold);}
    box(g,x+.5,y+1.37,z-.19,1,.08,.24,timber);
    pot(g,x+w/2-.1,y+1.1,z,.13);
  }
  function pendant(x,y,z){rod(g,[x,y,z],[x,y-.35,z],.015,C.gold);const m=new THREE.Mesh(new THREE.ConeGeometry(.18,.19,12),mat(C.green));m.position.set(x,y-.4,z);g.add(m);cyl(g,x,y-.5,z,.14,.03,glow);}
  function gym(x,y,z){
    box(g,x,y+.02,z,2.8,.04,2.4,0xa3b8a0);
    box(g,x-.65,y+.2,z,.64,.13,1.45,steel);
    box(g,x-.65,y+.28,z,.49,.04,1.23,0x283d40);
    for(let xx of [x-.9,x-.4])rod(g,[xx,y+.25,z-.55],[xx,y+1.12,z-.65],.035,steel);
    box(g,x-.65,y+1.12,z-.65,.67,.24,.12,C.dark);
    box(g,x+.6,y+.5,z+.12,.42,.12,1,C.terra);
    for(let zz of [z-.25,z+.5])rod(g,[x+.6,y+.45,zz],[x+.6,y,zz],.04,steel);
    rod(g,[x+.12,y+1,z-.55],[x+1.12,y+1,z-.55],.035,C.gold);
    for(let xx of [x+.18,x+1.05]){const weight=cyl(g,xx,y+1,z-.55,.19,.10,C.dark);weight.rotation.z=Math.PI/2;}
  }
  // Main floor uses: workshop, dining, gym, studio, lounge, rooftop café.
  coffeeBar(-1.8,3.30,-4.25,2.6);
  gym(.5,6,-2.45);
  box(g,-.25,9.42,-3.25,2,.1,.85,timber);
  for(let xx of [-1,.5])chair(g,xx,8.7,-2.5,Math.PI,C.terra);
  box(g,0,9.6,-4.6,2.3,1.2,.06,C.cream);
  for(let i=0;i<4;i++)box(g,-.8+i*.5,9.6,-4.55,.3,.4,.02,[C.mint,C.yellow,C.blue,C.terra][i]);
  box(g,-1,11.85,-3.3,1.45,.5,.55,C.mint);
  box(g,-1,12.17,-3.52,1.45,.4,.12,C.mint);
  table(g,.85,11.4,-3,.32);
  coffeeBar(0,14,-4,1.85);
  // The upper floor already sits beneath the existing roof; maintain roof height.
  for(let z of [-3.9,-2.2])pendant(0,16.13,z);
  // Blue tower: alternating work areas and a proper meeting room.
  for(let i=0;i<5;i++){
    const y=.57+i*2.55;
    box(g,-9.07,y+.55,-5.05,.48,1.1,.6,C.cream);
    box(g,-9.07,y+1.18,-5.05,.48,.12,.65,C.mint);
    pendant(-7.4,y+2.1,-3.4);
    if(i===1){box(g,-7.15,y+.72,-3.75,1.4,.08,.8,timber);for(let xx of [-7.65,-6.65]){chair(g,xx,y,-3.05,Math.PI);chair(g,xx,y,-4.5,0);}box(g,-7.3,y+1.25,-5.39,1.55,.8,.04,C.white);}
    if(i===3){bookshelf(g,-8.3,y,-4.95,1.2);box(g,-6.1,y+.7,-3.2,.45,.08,.45,C.cream);}
  }
  // Restaurant: espresso equipment, crockery and stools at each coffee bar.
  for(let i=0;i<3;i++){
    const y=.60+i*2.9;coffeeBar(8,y,-5.02,2.8);
    for(let x of [7.3,8.6]){cyl(g,x,y+.52,-4.1,.18,.08,timber);rod(g,[x,y+.5,-4.1],[x,y,-4.1],.03,C.gold);}
    pendant(7.6,y+2.35,-3.1);
    table(g,9,y,-2.2,.34);chair(g,9.65,y,-2.2,-Math.PI/2);
  }
  // Roof pergolas fit underneath existing signs and do not increase building heights.
  for(let xx of [6.2,9.8])for(let zz of [-5.3,-2.4])rod(g,[xx,9.28,zz],[xx,10.08,zz],.035,C.gold);
  for(let z=-5.4;z<=-2.3;z+=.35)box(g,8,10.08,z,3.8,.055,.09,C.green);
  planter(g,8,9.3,-5.5,2.5);
  // Shallow-front shops: separate identities through furniture and goods.
  coffeeBar(-6.45,.39,6.74,2.3);
  box(g,-7.9,1.18,6.25,.65,1.1,.10,C.green);
  for(let i=0;i<3;i++)box(g,-7.9,.88+i*.3,6.32,.48,.025,.04,C.cream);
  // Bakery glazing cabinet with trays, loaves and a working counter.
  box(g,-9.65,.8,3.78,1.55,.75,.6,timber);
  box(g,-9.65,1.45,4.08,1.55,.6,.03,glass);
  box(g,-9.65,1.77,3.78,1.65,.07,.7,C.cream);
  for(let y of [1.12,1.49]){box(g,-9.65,y,3.78,1.5,.04,.6,C.cream);for(let i=0;i<4;i++){const loaf=ball(g,-10.2+i*.35,y+.11,3.82,.12,0xd8a45c);loaf.scale.set(.16,.09,.1);}}
  box(g,-10.35,1.2,2.68,.8,1.1,.08,C.terraDark);
  // Bookshop shelves line the rear; low display and register stay behind glazing.
  bookshelf(g,-.10,.39,6.95,1.9);
  box(g,.85,.78,8.03,.8,.75,.5,timber);
  box(g,.85,1.24,8.03,.27,.21,.22,C.dark);
  for(let i=0;i<4;i++)box(g,-.4,.45+i*.055,8.4,.48,.05,.36,[C.terra,C.mint,C.yellow,C.blue][i]);
  // Small street details are kept in sidewalk pockets away from entry axes.
  function bin(x,z){cyl(g,x,.73,z,.19,.75,C.green);cyl(g,x,1.12,z,.22,.09,C.gold);box(g,x,.98,z+.19,.16,.08,.02,C.dark);}
  for(let [x,z] of [[-10.9,6],[10.8,7.8],[5,9.55]])bin(x,z);
  function bicycle(x,z){const bg=new THREE.Group();bg.position.set(x,.35,z);g.add(bg);for(let xx of [-.48,.48]){const wheel=new THREE.Mesh(new THREE.TorusGeometry(.29,.025,6,24),mat(steel));wheel.position.set(xx,.31,0);bg.add(wheel);rod(bg,[xx,.31,0],[xx,.31,.02],.035,C.gold);}for(let [a,b] of [[[0,.35,0],[-.48,.31,0]],[[0,.35,0],[-.2,.79,0]],[[-.2,.79,0],[-.48,.31,0]],[[-.2,.79,0],[.28,.73,0]],[[.28,.73,0],[.48,.31,0]],[[.48,.31,0],[0,.35,0]],[[.28,.73,0],[.23,1.02,0]]])rod(bg,a,b,.025,C.terra);box(bg,-.2,.85,0,.25,.05,.14,C.dark);rod(bg,[.2,1.02,-.12],[.2,1.02,.12],.025,steel);}
  bicycle(9.9,8);bicycle(11.2,7.7);
  for(let x of [9.4,10,10.6]){rod(g,[x,.35,8.4],[x,1,8.4],.025,C.gold);}
  // Circulation along the main building's right side, outside the floor slabs.
  // Every flight terminates exactly at a landing, and upper floor setbacks have
  // transverse bridges. These route records are reusable for future citizens.
  const levels=[.60,3.30,6,8.70,11.40,14,16.23];
  const widths=[7.8,7.8,6.8,5.8,4.7,3.5,4.15];
  for(let z of [-4.4,-1.8])rod(g,[5.11,.35,z],[5.11,16.23,z],.055,C.green);
  for(let i=0;i<levels.length;i++){
    const y=levels[i],z=i%2?-4.4:-1.8,edge=widths[i]/2;
    box(g,(edge+5.12)/2,y-.065,z,5.12-edge,.13,.86,C.cream);
    for(let dz of [-.43,.43]){rod(g,[edge,y+.65,z+dz],[5.12,y+.65,z+dz],.024,C.gold);for(let x=edge+.2;x<5.12;x+=.4)rod(g,[x,y,z+dz],[x,y+.65,z+dz],.018,C.gold);}
    routes.push({id:`main-landing-${i}`,position:[4.66,y,z],floor:i});
    if(i===levels.length-1)continue;
    const nextZ=(i+1)%2?-4.4:-1.8,count=14,rise=(levels[i+1]-y)/count,run=(nextZ-z)/count;
    for(let j=0;j<count;j++)box(g,4.66,y+(j+.5)*rise,z+(j+.5)*run,.9,rise,Math.abs(run)+.01,C.cream);
    for(let x of [4.21,5.11]){rod(g,[x,y+.7,z],[x,levels[i+1]+.7,nextZ],.025,C.gold);for(let j=0;j<=count;j+=2)rod(g,[x,y+j*rise,z+j*run],[x,y+j*rise+.7,z+j*run],.018,C.gold);}
    routes.push({id:`main-flight-${i}`,from:[4.66,y,z],to:[4.66,levels[i+1],nextZ]});
  }
  // Low entrance steps from the sidewalk to the first landing.
  box(g,4.66,.405,-1.10,.90,.15,.35,C.cream);
  box(g,4.66,.53,-1.45,.90,.14,.35,C.cream);
  // Blue-office balcony connects to the main floor with a shallow threshold.
  box(g,-4.64,3.12,-1.15,1.60,.16,.68,C.cream);
  for(let z of [-1.49,-.81])rod(g,[-5.43,3.83,z],[-3.85,3.98,z],.025,C.gold);
  box(g,-3.99,3.24,-1.15,.32,.16,.68,C.cream);
  routes.push({id:'office-main-bridge',from:[-5.4,3.2,-1.15],to:[-3.8,3.3,-1.15]});
  // Pavilion side stairs replace the earlier flights with exact floor heights.
  for(let floor=0;floor<2;floor++){
    const low=floor===0?.59:3.09,high=floor===0?3.09:5.5;
    const z0=floor===0?6.3:2.7,z1=floor===0?2.7:6.3;
    for(let j=0;j<14;j++)box(g,7.15,low+(j+.5)*(high-low)/14,z0+(j+.5)*(z1-z0)/14,1,(high-low)/14,Math.abs(z1-z0)/14+.01,C.cream);
    for(let x of [6.65,7.65])rod(g,[x,low+.7,z0],[x,high+.7,z1],.025,C.gold);
    box(g,7,high-.07,z1,1.4,.14,.75,C.cream);
    routes.push({id:`pavilion-flight-${floor}`,from:[7.15,low,z0],to:[7.15,high,z1]});
  }
  return routes;
}

