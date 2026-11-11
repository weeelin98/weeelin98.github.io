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
  color=0xff982a;
  const points=outline(w*.46,h*.43),curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),true),socketMat=new THREE.MeshStandardMaterial({color:0x8c6336,roughness:.55,metalness:.45});
  // Dense marquee bulbs, each with its own luminous globe and soft optical halo.
  const bulbMat=lamp(color);bulbMat.toneMapped=false;
  for(let i=0;i<40;i++){
   const p=curve.getPointAt(i/40),socket=new THREE.Mesh(socketGeometry,socketMat);socket.rotation.x=Math.PI/2;socket.position.copy(p);socket.scale.setScalar(1.12);group.add(socket);
   const bulb=new THREE.Mesh(bulbGeometry,bulbMat);bulb.scale.setScalar(1.22);bulb.position.copy(p);bulb.position.z+=.055;group.add(bulb);
   const hot=new THREE.Mesh(bulbGeometry,new THREE.MeshBasicMaterial({color:0xffe3a0,toneMapped:false}));hot.scale.setScalar(.55);hot.position.copy(bulb.position);hot.position.z+=.052;group.add(hot);
   const aura=new THREE.SpriteMaterial({map:glowTexture,color:0xff8b20,transparent:true,opacity:.15,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});auras.push(aura);
   const glow=new THREE.Sprite(aura);glow.position.copy(bulb.position);glow.position.z+=.04;glow.scale.setScalar(.45);glow.userData.nonOccluding=true;group.add(glow);
  }
  glowTube(outline(w*.427,h*.345),0xffd38a,.012);

 }
 if(entry.id==='projects'){
  glowTube(outline(w*.475,h*.45),0xff7029,.034);
  color=0xffce70;
 }
 if(entry.id==='notes'){
  color=0xff643b;
  // Letter strokes are actual round tubes on standoffs, rotated as a word.
  const alphabet={
   M:[[[0,0],[0,.7],[.16,.36],[.32,.7],[.32,0]]],
   Y:[[[0,.7],[.16,.35],[.32,.7]],[[.16,.35],[.16,0]]],
   S:[[[.32,.7],[0,.7],[0,.35],[.32,.35],[.32,0],[0,0]]],
   T:[[[0,.7],[.32,.7]],[[.16,.7],[.16,0]]],
   O:[[[.16,0],[0,.1],[0,.6],[.16,.7],[.32,.6],[.32,.1],[.16,0]]],
   R:[[[0,0],[0,.7],[.26,.7],[.32,.6],[.32,.43],[.26,.35],[0,.35]],[[.16,.35],[.32,0]]],
  };
  const text=entry.label.toUpperCase(),advance=.31,space=.16;
  const length=[...text].reduce((n,c)=>n+(c===' '?space:advance),0)-advance+.256;
  let cursor=-length/2;
  for(const letter of text){
   if(letter===' '){cursor+=space;continue;}
   const color=letter==='M'||letter==='S'?0xff493d:letter==='T'||letter==='Y'?0xffa036:0x429cff;
   for(const stroke of alphabet[letter]??[]){
    const pts=stroke.map(([x,y])=>[-(y-.35),x*.8+cursor,z+.08]);
    glowTube(pts,color,.039);
   }
   cursor+=advance;
  }
  group.userData.neonText=text;
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
  if(fx.kind==='cv')sign.userData.fillMaterial.emissiveIntensity=.18+1.5*night+hover*.15;
  if(fx.kind==='projects')sign.userData.fillMaterial.emissiveIntensity=.25+.65*night+hover*.1;
 }
}
