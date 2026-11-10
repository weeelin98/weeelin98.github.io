import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildCity, buildFerris, buildCarousel } from './city.js';
import { createCitizens } from './citizens.js';
import { createTraffic } from './traffic.js';
import { installInteractions } from './interactions.js';
import { createEnvironment } from './environment.js';
import { SimulationClock } from './simulation.js';
import {createDisplayController} from './display.js';
import {loadSignFonts} from './sign-fonts.js';
import './style.css';
const loadedSignFonts=await loadSignFonts();

// Final local desktop frame: shared simulation clock, bounded effects, no HUD.
const canvas = document.querySelector('#city');
canvas.dataset.signFonts=loadedSignFonts.join(',');
canvas.dataset.signFontsReady=String(document.fonts.check('400 24px "City Lilita"')&&document.fonts.check('400 24px "City Bungee"')&&document.fonts.check('700 24px "City Fredoka"'));
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#dce7e0');
const camera = new THREE.OrthographicCamera(-25, 25, 20, -20, .1, 600);
const homeTarget = new THREE.Vector3(0, 6, 0);
camera.position.set(31, 29, 43);
const controls = new OrbitControls(camera, canvas);
controls.target.copy(homeTarget);
controls.enableDamping = false;
controls.dampingFactor = .075;
controls.enablePan = true;
controls.screenSpacePanning = false;
controls.minPolarAngle = .48;
controls.maxPolarAngle = 1.22;
// Orthographic zoom magnifies without moving the camera into a model.
controls.minZoom = .8;
controls.maxZoom = 2.4;
controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
controls.update();
const ambient=new THREE.HemisphereLight(0xfff9ef, 0xa1b4c0, 2.1);scene.add(ambient);
const sun = new THREE.DirectionalLight(0xfff2df, 2.8);
sun.target.position.set(0,4,0);sun.position.copy(sun.target.position).addScaledVector(new THREE.Vector3(-13,30,18).normalize(),95);scene.add(sun.target);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left:-58, right:58, top:58, bottom:-58, near:1, far:185 });
sun.shadow.camera.updateProjectionMatrix();
sun.shadow.bias = -.00025;
sun.shadow.normalBias = .065;
sun.shadow.radius = 3;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xd8e9ff, 1.1);
fill.position.set(15,18,-10);
scene.add(fill);
const city = buildCity(scene, { furnishings: true, blankSigns: false, carouselReserved: false });
const ferris = buildFerris(scene, { blankSigns: true });
const carousel = buildCarousel(scene);
scene.updateMatrixWorld(true);
const bounds = new THREE.Box3().setFromObject(scene);
bounds.max.y=Math.max(bounds.max.y,18.47500001192093); // Preserve the Step 6 framing.
const corners = [];
for (const x of [bounds.min.x, bounds.max.x])
  for (const y of [bounds.min.y, bounds.max.y])
    for (const z of [bounds.min.z, bounds.max.z]) corners.push(new THREE.Vector3(x,y,z));
// Fit the whole district with breathing room; keep the visitor's orbit on resize.
camera.updateMatrixWorld(true);
const homeMatrix = camera.matrixWorldInverse.clone();
function fitViewport() {
  const aspect=innerWidth/innerHeight;
  let halfWidth=0, halfHeight=0;
  for(const corner of corners){const p=corner.clone().applyMatrix4(homeMatrix);halfWidth=Math.max(halfWidth,Math.abs(p.x));halfHeight=Math.max(halfHeight,Math.abs(p.y));}
  const height=Math.max(halfHeight,halfWidth/aspect)*1.12;
  camera.left=-height*aspect;camera.right=height*aspect;camera.top=height;camera.bottom=-height;
  camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
}
fitViewport();
const people=createCitizens(scene,ferris,carousel);
const traffic=createTraffic(scene);
const displayRoot=new THREE.Group();displayRoot.name='city-display';
const modelNodes=scene.children.filter(o=>!o.isLight&&o!==sun.target&&o!==fill.target);
scene.add(displayRoot);for(const node of modelNodes)displayRoot.add(node);
const display=createDisplayController(displayRoot,canvas,controls);
const interaction=installInteractions({scene,camera,controls,canvas,signs:city.signs,display});
const environment=createEnvironment({scene,renderer,ambient,sun,fill,city,ferris,carousel,displayRoot});
document.querySelectorAll('[data-weather]').forEach(button=>button.addEventListener('click',()=>{environment.setState(button.dataset.weather);document.body.classList.toggle('night',environment.state==='night');document.querySelectorAll('[data-weather]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
addEventListener('resize',fitViewport);
const targetBefore = new THREE.Vector3();
const panMin = new THREE.Vector3(-12,1,-9), panMax = new THREE.Vector3(12,12,10);
const clock=new SimulationClock();
let lastShadow=-Infinity,lastMetadata=-Infinity,frameCount=0,frameTotal=0,lastFrame=performance.now();
const pauseButton=document.querySelector('#pause-animation');
pauseButton.addEventListener('click',()=>{clock.paused=!clock.paused;pauseButton.setAttribute('aria-pressed',String(clock.paused));pauseButton.setAttribute('aria-label',clock.paused?'继续动画':'暂停动画');pauseButton.title=clock.paused?'继续人物、车辆和雨滴':'暂停人物、车辆和雨滴';pauseButton.querySelector('.pause-icon').textContent=clock.paused?'▷':'Ⅱ';pauseButton.querySelector('.pause-text').textContent=clock.paused?'Play':'Pause';});
document.addEventListener('visibilitychange',()=>clock.rebase());
function animate(now=performance.now()) {
  requestAnimationFrame(animate);
  controls.update();
  const {wallDelta,delta:dt,time:elapsed}=clock.tick(now);
  environment.update(wallDelta,dt);
  if(dt>0){ferris.update(elapsed);carousel.update(elapsed);people.update(elapsed,dt,environment.state==='rain');traffic.update(dt);}
  if(lastShadow===-Infinity||(!clock.paused&&now-lastShadow>=1000/30)){environment.requestShadows(lastShadow===-Infinity);renderer.shadowMap.needsUpdate=true;lastShadow=now;}
  targetBefore.copy(controls.target);
  controls.target.clamp(panMin,panMax);
  camera.position.add(controls.target.clone().sub(targetBefore));
  interaction.update(now,wallDelta,elapsed);
  if(display.consumeChange()){environment.requestShadows();renderer.shadowMap.needsUpdate=true;}
  environment.updateView(camera,wallDelta,elapsed);
  frameCount++;frameTotal+=Math.min(now-lastFrame,250);lastFrame=now;
  if(now-lastMetadata>250){canvas.dataset.paused=String(clock.paused);canvas.dataset.simulationTime=elapsed.toFixed(3);canvas.dataset.frameMs=(frameTotal/frameCount).toFixed(2);canvas.dataset.drawCalls=String(renderer.info.render.calls);frameTotal=0;frameCount=0;lastMetadata=now;
  canvas.dataset.displayAngle=displayRoot.rotation.y.toFixed(4);canvas.dataset.environment=environment.state;canvas.dataset.wetness=environment.wetness.toFixed(3);canvas.dataset.night=environment.night.toFixed(3);
  canvas.dataset.cameraMoving=String(!!interaction.flight.active);canvas.dataset.zoom=camera.zoom.toFixed(3);canvas.dataset.target=controls.target.toArray().map(n=>n.toFixed(3)).join(',');
  }
  renderer.render(scene,camera);
}
animate();
window.cityDiagnostics = () => ({stage:7,paused:clock.paused,citizens:people.count,buses:traffic.vehicles.length,environment:environment.stats(),animated:!clock.paused,signs:city.signs.length,routes:city.routes.length,cameraZoom:camera.zoom,panelOpen:interaction.panel.open,cameraMoving:!!interaction.flight.active,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles});








