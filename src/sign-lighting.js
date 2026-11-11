import * as THREE from 'three';

// Shared geometry, bounded lights, persistent materials: no postprocessing pass.
const bulbGeometry=new THREE.SphereGeometry(.052,10,8),socketGeometry=new THREE.CylinderGeometry(.074,.074,.035,10);
// Camera-facing soft light, with no hard outer edge. Shared by every neon tube.
const glowPixels=new Uint8Array(64*64*4);
for(let y=0;y<64;y++)for(let x=0;x<64;x++){
 const radius=Math.hypot((x-31.5)/31.5,(y-31.5)/31.5),i=(y*64+x)*4;
 glowPixels[i]=glowPixels[i+1]=glowPixels[i+2]=255;
 glowPixels[i+3]=Math.round(255*Math.pow(Math.max(0,1-radius),2.5));
}
const glowTexture=new THREE.DataTexture(glowPixels,64,64);glowTexture.needsUpdate=true;
glowTexture.magFilter=THREE.LinearFilter;glowTexture.minFilter=THREE.LinearFilter;
function trace(points,radius,material,parent){
 const curve=new THREE.CurvePath();for(let i=1;i<points.length;i++)curve.add(new THREE.LineCurve3(new THREE.Vector3(...points[i-1]),new THREE.Vector3(...points[i])));
 const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(8,points.length*7),radius,7,false),material);mesh.userData.nonOccluding=true;parent.add(mesh);return mesh;
}
export function addSignIllumination(sign){
 const {entry,plateGroup,frontDepth}=sign.userData;if(!['about','cv','notes','projects'].includes(entry.id))return;
 const [w,h]=entry.size,z=frontDepth+.045,group=new THREE.Group();group.name=`${entry.id}-lighting`;group.userData.nonInteractive=true;group.userData.nonOccluding=true;plateGroup.add(group);
 const materials=[],halos=[],auras=[];
 function lamp(color){const m=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:1.5,roughness:.3});materials.push(m);return m;}
 function glowTube(points,color,r=.025){
  const material=['notes','projects'].includes(entry.id)?new THREE.MeshBasicMaterial({color,toneMapped:false}):lamp(color);
  if(material.isMeshBasicMaterial){material.userData.glowColor=new THREE.Color(color);materials.push(material);}
  trace(points,r,material,group);
  if(['notes','projects'].includes(entry.id)){
   // A near-white hot filament inside saturated glass, plus diffuse light in air.
   const core=new THREE.MeshBasicMaterial({color:new THREE.Color(color).lerp(new THREE.Color('white'),.72),toneMapped:false});
   core.userData.glowColor=core.color.clone();materials.push(core);
   trace(points.map(p=>[p[0],p[1],p[2]+r*.55]),r*.43,core,group);
   const aura=new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,opacity:.16,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
   auras.push(aura);
   for(let i=1;i<points.length;i++){
    const a=new THREE.Vector3(...points[i-1]),b=new THREE.Vector3(...points[i]),count=Math.max(1,Math.ceil(a.distanceTo(b)/.20));
    for(let j=0;j<count;j++){
     const glow=new THREE.Sprite(aura);glow.position.lerpVectors(a,b,j/count);glow.position.z+=.025;
     glow.scale.setScalar(entry.id==='projects'?1.05:.88);glow.userData.nonOccluding=true;group.add(glow);
    }
   }
  }
  const halo=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.10,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});halos.push(halo);trace(points,r*2.8,halo,group);return material;
 }
 const outline=(x,y)=>{const r=Math.min(.20,y*.45),p=[];for(const [cx,cy,start]of [[x-r,y-r,0],[-x+r,y-r,Math.PI/2],[-x+r,-y+r,Math.PI],[x-r,-y+r,Math.PI*1.5]])for(let i=0;i<=6;i++){const a=start+i/6*Math.PI/2;p.push([cx+r*Math.cos(a),cy+r*Math.sin(a),z]);}p.push(p[0]);return p;};
 let color=0xfff1d4;
 if(entry.id==='about')glowTube(outline(w*.475,h*.455),color,.017);
 if(entry.id==='cv'){
  color=0xffc66c;const points=outline(w*.43,h*.445),curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),true),socketMat=new THREE.MeshStandardMaterial({color:0x72573a,roughness:.7});
  for(let i=0;i<28;i++){
   const p=curve.getPoint(i/28),socket=new THREE.Mesh(socketGeometry,socketMat);socket.rotation.x=Math.PI/2;socket.position.copy(p);group.add(socket);
   const bulb=new THREE.Mesh(bulbGeometry,lamp(color));bulb.position.copy(p);bulb.position.z+=.045;group.add(bulb);
   const glow=new THREE.Mesh(bulbGeometry,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.13,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));glow.position.copy(bulb.position);glow.scale.setScalar(2.1);halos.push(glow.material);group.add(glow);
  }
 }
 if(entry.id==='projects'){
  glowTube(outline(w*.475,h*.45),0xff7029,.034);
  color=0xffce70;
 }
 if(entry.id==='notes'){
  color=0xff643b;
  // Letter strokes are actual round tubes on standoffs, rotated as a word.
  const glyphs=[[[[0,0],[0,.7],[.32,0],[.32,.7]]],[[[.16,0],[0,.1],[0,.6],[.16,.7],[.32,.6],[.32,.1],[.16,0]]],[[[0,.7],[.32,.7]],[[.16,.7],[.16,0]]],[[[.32,.7],[0,.7],[0,0],[.32,0]],[[0,.35],[.26,.35]]],[[[.32,.7],[0,.7],[0,.35],[.32,.35],[.32,0],[0,0]]]];
  const colors=[0xff493d,0xffa036,0x429cff,0xffa036,0xff493d];
  glyphs.forEach((strokes,i)=>{for(const stroke of strokes){const pts=stroke.map(([x,y])=>[-(y-.35),x+i*.43-1.02,z+.08]);glowTube(pts,colors[i],.026);}});
  for(const y of [-.8,0,.8]){const pin=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.12,6),new THREE.MeshStandardMaterial({color:0x777777}));pin.rotation.x=Math.PI/2;pin.position.set(0,y,z);group.add(pin);}
 }
 const light=new THREE.PointLight(color,0,['notes','projects'].includes(entry.id)?5.5:4,2);light.position.set(0,0,.55);light.castShadow=false;group.add(light);
 sign.userData.illumination={materials,halos,auras,light,kind:entry.id};
}
export function updateSignIllumination(signs,night,time,reduced=false){
 for(const sign of signs){const fx=sign.userData.illumination;if(!fx)continue;
  const hover=sign.userData.hoverAmount??0;
  let variation=1;
  if(fx.kind==='notes'&&!reduced){
   variation=.82+.18*Math.sin(time*.8);
   // A rare brief dip, never a rapid full-sign strobe or complete blackout.
   const phase=time%17;if(phase>12&&phase<12.16)variation*=.55;
  }
  const strength=(.35+.65*night)*(1+hover*.18)*variation;
  fx.materials.forEach((m,i)=>{
   if(m.isMeshBasicMaterial)m.color.copy(m.userData.glowColor).multiplyScalar(.78+variation*.22);
   else m.emissiveIntensity=(1.0+strength*1.8)*(fx.kind==='cv'?.94+(i%4)*.025:1);
  });
  fx.halos.forEach(m=>m.opacity=.035+strength*.12);
  fx.auras.forEach(m=>m.opacity=(.025+.26*night)*(1+hover*.2)*variation);
  fx.light.intensity=strength*(fx.kind==='cv'?2.1:['notes','projects'].includes(fx.kind)?7:1.35);
  if(fx.kind==='projects')sign.userData.fillMaterial.emissiveIntensity=.25+.65*night+hover*.1;
 }
}
