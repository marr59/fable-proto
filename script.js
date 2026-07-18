import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

// ── Renderer ──────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
document.body.appendChild(renderer.domElement);
renderer.domElement.style.touchAction = 'none'; // iOS: не даём браузеру перехватывать тачи

// ── Scene ───────────────────────────────────────────────────────────────���─────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1828);
scene.fog = new THREE.FogExp2(0x121e2e, 0.020);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 6, 10);
camera.lookAt(0, 1, 0);

// ── Post-processing ───────────────────────────────────────────────────────────
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.55, 0.4, 0.85);
composer.addPass(bloom);

// ── Lights ────────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x8090b0, 1.9));

const moonLight = new THREE.DirectionalLight(0xc0d0e8, 2.0);
moonLight.position.set(-8, 18, -5);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(2048, 2048);
Object.assign(moonLight.shadow.camera, { near: 1, far: 80, left: -25, right: 25, top: 25, bottom: -25 });
scene.add(moonLight);

const fillLight = new THREE.DirectionalLight(0xd0b880, 0.9);
fillLight.position.set(5, 8, 10);
scene.add(fillLight);

// Луна
const moonMesh = new THREE.Mesh(
 new THREE.SphereGeometry(1.5, 16, 12),
 new THREE.MeshStandardMaterial({ color: 0xd0dde0, emissive: 0xb0c8d0, emissiveIntensity: 1.5 })
);
moonMesh.position.set(-35, 40, -50);
scene.add(moonMesh);

// ── Звёзды ─────────────────────────────────���──────────────────────────────────
{
 const n = 1500;
 const pos = new Float32Array(n * 3);
 for (let i = 0; i < n; i++) {
 const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), r = 85 + Math.random() * 25;
 pos[i*3] = r*Math.sin(ph)*Math.cos(th); pos[i*3+1] = Math.abs(r*Math.cos(ph)); pos[i*3+2] = r*Math.sin(ph)*Math.sin(th);
 }
 const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
 scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size:0.25, color:0xffffff, transparent:true, opacity:0.65, blending:THREE.AdditiveBlending, depthWrite:false })));
}

// ── Земля ───────────────────────────────────────────────────��─────────────────
const ground = new THREE.Mesh(
 new THREE.PlaneGeometry(100, 100),
 new THREE.MeshStandardMaterial({ color: 0x1a1810, roughness: 0.95 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Каменная дорожка
const stoneMat = new THREE.MeshStandardMaterial({ color: 0x303028, roughness: 0.82, metalness: 0.06 });
for (let i = -6; i <= 6; i++) {
 const s = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.07, 0.84), stoneMat);
 s.position.set((Math.random()-0.5)*0.18, 0.035, i*1.05);
 s.rotation.y = (Math.random()-0.5)*0.25;
 s.receiveShadow = true;
 scene.add(s);
}

// ── Каменные фонари (торо) ──────────────────────────────────���─────────────────
const lanternLights = [];
[[-2.5,-3.5],[2.5,-3.5],[-2.5,3.5],[2.5,3.5]].forEach(([x,z]) => {
 const sm = new THREE.MeshStandardMaterial({ color:0x353028, roughness:0.9 });
 const lm = new THREE.MeshStandardMaterial({ color:0xff7700, emissive:0xff5500, emissiveIntensity:2.0, transparent:true, opacity:0.88 });
 const grp = new THREE.Group(); grp.position.set(x,0,z);
 [{geo:new THREE.CylinderGeometry(0.26,0.31,0.14,10),mat:sm,y:0.07},
 {geo:new THREE.CylinderGeometry(0.1,0.13,1.2,10), mat:sm,y:0.74},
 {geo:new THREE.CylinderGeometry(0.36,0.36,0.11,10),mat:sm,y:1.38},
 {geo:new THREE.BoxGeometry(0.34,0.34,0.34), mat:lm,y:1.1 }
 ].forEach(({geo,mat,y}) => { const m=new THREE.Mesh(geo,mat); m.position.y=y; m.castShadow=true; grp.add(m); });
 const rf=new THREE.Mesh(new THREE.ConeGeometry(0.32,0.24,8), new THREE.MeshStandardMaterial({color:0x252018,roughness:0.8}));
 rf.position.y=1.43; grp.add(rf); scene.add(grp);
 const pl=new THREE.PointLight(0xff6600,2.2,8); pl.position.set(x,1.15,z); scene.add(pl); lanternLights.push(pl);
});

// ── Тории ────────────────────────────────────────────────────────────────────
{
 const tm=new THREE.MeshStandardMaterial({color:0xcc2200,roughness:0.65,metalness:0.1,emissive:0x330500,emissiveIntensity:0.3});
 [-1.5,1.5].forEach(side=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.22,5.6,10),tm); p.position.set(side,2.8,-14); p.castShadow=true; scene.add(p);});
 [{w:4.5,y:5.7},{w:3.8,y:5.38},{w:3.4,y:4.55}].forEach(({w,y})=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,0.2,0.4),tm); b.position.set(0,y,-14); scene.add(b);});
}

// ── Препятствия (столкновения) ───────────────────────────────────────────────���
const obstacles = []; // круги {x,z,r}: герой не заходит внутрь

// ── Японский дом (пагода) ─────────────────────────────���───────────────────────
function addPagoda(x, z, ry = 0) {
 const woodMat = new THREE.MeshStandardMaterial({ color:0x4a2810, roughness:0.85 });
 const wallMat = new THREE.MeshStandardMaterial({ color:0x8a6040, roughness:0.9 });
 const roofMat = new THREE.MeshStandardMaterial({ color:0x1c1a14, roughness:0.75, metalness:0.1 });
 const goldMat = new THREE.MeshStandardMaterial({ color:0x8a7030, roughness:0.4, metalness:0.7 });
 const grp = new THREE.Group(); grp.position.set(x,0,z); grp.rotation.y=ry;

 const found=new THREE.Mesh(new THREE.BoxGeometry(4.2,0.35,3.2),woodMat); found.position.y=0.175; found.castShadow=true; grp.add(found);
 const walls=new THREE.Mesh(new THREE.BoxGeometry(3.8,2.2,2.8),wallMat); walls.position.y=1.45; walls.castShadow=true; grp.add(walls);
 const winMat=new THREE.MeshStandardMaterial({ color:0xffb24a, emissive:0xff7a1e, emissiveIntensity:1.5, roughness:0.5 });
 [-0.95,0.95].forEach(wx=>{ [1.41,-1.41].forEach(wz=>{ const win=new THREE.Mesh(new THREE.PlaneGeometry(0.62,0.82),winMat); win.position.set(wx,1.5,wz); if(wz<0) win.rotation.y=Math.PI; grp.add(win); }); });
 const w2win=new THREE.Mesh(new THREE.PlaneGeometry(0.7,0.6),winMat); w2win.position.set(0,3.65,0.96); grp.add(w2win);
 const r1=new THREE.Mesh(new THREE.ConeGeometry(3.2,1.0,4),roofMat); r1.position.y=2.85; r1.rotation.y=Math.PI/4; r1.castShadow=true; grp.add(r1);
 const w2=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.4,1.9),wallMat); w2.position.y=3.65; w2.castShadow=true; grp.add(w2);
 const r2=new THREE.Mesh(new THREE.ConeGeometry(2.0,0.75,4),roofMat); r2.position.y=4.6; r2.rotation.y=Math.PI/4; r2.castShadow=true; grp.add(r2);
 const spire=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.08,0.8,8),goldMat); spire.position.y=5.35; grp.add(spire);
 const ball=new THREE.Mesh(new THREE.SphereGeometry(0.1,10,8),goldMat); ball.position.y=5.8; grp.add(ball);

 grp.children.forEach(c=>{ c.receiveShadow=true; });
 scene.add(grp);
 obstacles.push({ x, z, r: 2.2 });
}

const guilds = [];
function addGuild(x, z, type, accent){
 const woodMat=new THREE.MeshStandardMaterial({color:0x3a2410,roughness:0.85});
 const wallMat=new THREE.MeshStandardMaterial({color:0x6e5236,roughness:0.9});
 const roofMat=new THREE.MeshStandardMaterial({color:0x18160f,roughness:0.75});
 const acc=new THREE.MeshStandardMaterial({color:accent,roughness:0.5,emissive:accent,emissiveIntensity:0.4});
 const grp=new THREE.Group(); grp.position.set(x,0,z);
 const found=new THREE.Mesh(new THREE.BoxGeometry(4.2,0.35,3.2),woodMat); found.position.y=0.175; found.castShadow=true; grp.add(found);
 const walls=new THREE.Mesh(new THREE.BoxGeometry(3.8,2.4,2.8),wallMat); walls.position.y=1.55; walls.castShadow=true; grp.add(walls);
 const roof=new THREE.Mesh(new THREE.ConeGeometry(3.3,1.3,4),roofMat); roof.position.y=3.15; roof.rotation.y=Math.PI/4; roof.castShadow=true; grp.add(roof);
 const winMat=new THREE.MeshStandardMaterial({color:0xffb24a,emissive:0xff7a1e,emissiveIntensity:1.5,roughness:0.5});
 [-0.95,0.95].forEach(wx=>{ const win=new THREE.Mesh(new THREE.PlaneGeometry(0.6,0.85),winMat); win.position.set(wx,1.6,1.41); grp.add(win); });
 const banner=new THREE.Mesh(new THREE.PlaneGeometry(0.7,1.7),acc); banner.position.set(0,1.85,1.42); grp.add(banner);
 const emblem=new THREE.Mesh(new THREE.SphereGeometry(0.14,12,10),acc); emblem.position.set(0,3.95,0); grp.add(emblem);
 grp.children.forEach(c=>{ c.receiveShadow=true; });
 scene.add(grp);
 obstacles.push({x,z,r:2.3});
 guilds.push({x,z,type,group:grp});
}
addGuild(-13, -7, 'archer', 0x39c24a);
addGuild(0, -14,'spearman', 0xd0402e);
addGuild(13, -7, 'alchemist', 0x9a3ad0);

// ── Разрушенные стены ────────────────────────────���────────────────────────────
function addRuins(x, z) {
 const mat=new THREE.MeshStandardMaterial({color:0x504840,roughness:0.95});
 const h=1.4+Math.random()*0.8;
 const wall=new THREE.Mesh(new THREE.BoxGeometry(0.45,h,2.2),mat); wall.position.set(x,h/2,z); wall.rotation.y=(Math.random()-0.5)*0.2; wall.castShadow=true; scene.add(wall);
 for(let i=0;i<4;i++){
 const sz=0.3+Math.random()*0.4;
 const b=new THREE.Mesh(new THREE.BoxGeometry(sz,sz*0.65,sz),mat);
 b.position.set(x+(Math.random()-0.5)*2.5,sz*0.32,z+(Math.random()-0.5)*2.5);
 b.rotation.set((Math.random()-0.5)*0.5,Math.random()*Math.PI,(Math.random()-0.5)*0.4);
 b.castShadow=true; b.receiveShadow=true; scene.add(b);
 }
}
addRuins(-8, 5);
addRuins(9, 3);

// ── Колодец ───────────────────────────────────────────────────────────────────
function addWell(x, z) {
 const stm=new THREE.MeshStandardMaterial({color:0x454035,roughness:0.9});
 const wdm=new THREE.MeshStandardMaterial({color:0x3a2010,roughness:0.9});
 const ring=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,0.65,16),stm); ring.position.set(x,0.32,z); ring.castShadow=true; scene.add(ring);
 const inner=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,0.9,16,1,true),new THREE.MeshStandardMaterial({color:0x0a0810,side:THREE.BackSide})); inner.position.set(x,0.15,z); scene.add(inner);
 const water=new THREE.Mesh(new THREE.CircleGeometry(0.44,24),new THREE.MeshStandardMaterial({color:0x0a1826,roughness:0.15,metalness:0.3})); water.rotation.x=-Math.PI/2; water.position.set(x,0.12,z); scene.add(water);
 [-0.45,0.45].forEach(s=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.065,1.3,8),wdm); p.position.set(x+s,1.0,z); p.castShadow=true; scene.add(p);});
 const beam=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,1.05,8),wdm); beam.position.set(x,1.55,z); beam.rotation.z=Math.PI/2; beam.castShadow=true; scene.add(beam);
 const rf=new THREE.Mesh(new THREE.ConeGeometry(0.65,0.5,8),new THREE.MeshStandardMaterial({color:0x1c1a14,roughness:0.8})); rf.position.set(x,1.9,z); scene.add(rf);
}
addWell(4, 2);

// ── Деревья ─────────────────────────────────────────────────────────────────��─
function addCherryTree(x, z) {
 const tm=new THREE.MeshStandardMaterial({color:0x1a0c08,roughness:0.9});
 const bm=new THREE.MeshStandardMaterial({color:0x6b1030,roughness:0.8,emissive:0x3a0618,emissiveIntensity:0.3});
 const tr=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.18,3.2,8),tm); tr.position.set(x,1.6,z); tr.castShadow=true; scene.add(tr);
 for(let i=0;i<14;i++){
 const b=new THREE.Mesh(new THREE.IcosahedronGeometry(0.32+Math.random()*0.34,0),bm.clone());
 b.position.set(x+(Math.random()-0.5)*2.6, 3.0+Math.random()*1.0, z+(Math.random()-0.5)*2.6);
 b.scale.y=0.55+Math.random()*0.2;
 b.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);
 b.material.color.offsetHSL(0,(Math.random()-0.5)*0.05,(Math.random()-0.5)*0.06);
 b.castShadow=true; scene.add(b);
 }
}
function addDeadTree(x, z) {
 const m=new THREE.MeshStandardMaterial({color:0x110808,roughness:1});
 const tr=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.15,4.2,7),m); tr.position.set(x,2.1,z); tr.rotation.z=(Math.random()-0.5)*0.22; tr.castShadow=true; scene.add(tr);
 for(let i=0;i<5;i++){const a=(i/5)*Math.PI*2; const br=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.06,0.65+Math.random()*0.7,6),m); br.position.set(x+Math.sin(a)*0.4,2.6+Math.random()*1.2,z+Math.cos(a)*0.4); br.rotation.z=Math.sin(a)*0.85; br.castShadow=true; scene.add(br);}
}
[[-5,-7],[-8,2],[-6,8],[5,-9],[9,0],[7,7],[-10,-3],[10,-5]].forEach(([x,z],i)=>{ (i%2===0?addCherryTree:addDeadTree)(x,z); });

// ── Костры ────────────────────────────────────────────────────────────────────
function makeGlowTexture() {
 const c=document.createElement('canvas'); c.width=c.height=64;
 const ctx=c.getContext('2d');
 const g=ctx.createRadialGradient(32,32,0,32,32,32);
 g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.35,'rgba(255,200,80,0.8)'); g.addColorStop(1,'rgba(255,80,0,0)');
 ctx.fillStyle=g; ctx.fillRect(0,0,64,64);
 return new THREE.CanvasTexture(c);
}
const glowTex = makeGlowTexture();

const campfires = [];
function addFlames(x, z) {
 const grp = new THREE.Group(); grp.position.set(x,0,z);
 const stonM=new THREE.MeshStandardMaterial({color:0x303028,roughness:1});
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2; const s=new THREE.Mesh(new THREE.SphereGeometry(0.1+Math.random()*0.06,7,5),stonM); s.position.set(Math.cos(a)*0.3,0.06,Math.sin(a)*0.3); s.castShadow=true; grp.add(s);}
 const flames = [];
 for(let i=0;i<5;i++){
 const h=0.18+Math.random()*0.14;
 const fm=new THREE.MeshStandardMaterial({color:0xff6600,emissive:0xff4400,emissiveIntensity:3,transparent:true,opacity:0.85,depthWrite:false});
 const f=new THREE.Mesh(new THREE.ConeGeometry(0.05,h,6),fm);
 f.position.set((Math.random()-0.5)*0.15,h/2,(Math.random()-0.5)*0.15);
 f.userData.baseHeight=h; f.userData.phase=Math.random()*Math.PI*2;
 grp.add(f); flames.push(f);
 }
 const pl=new THREE.PointLight(0xff6600,2.5,5); pl.position.y=0.4; grp.add(pl);
 scene.add(grp);
 campfires.push({grp,flames,light:pl});
}
addFlames(-3, 0.5);
addFlames(6, -5);
addFlames(-7, -4);

// ── Частицы кармы ────────────────────────────────���────────────────────────────
const karmaParticles = (() => {
 const PCOUNT = 100;
 const pPos = new Float32Array(PCOUNT * 3);
 for (let i = 0; i < PCOUNT; i++) {
 const a = Math.random()*Math.PI*2, r = 0.7+Math.random()*0.8;
 pPos[i*3]=Math.cos(a)*r; pPos[i*3+1]=Math.random()*2.5; pPos[i*3+2]=Math.sin(a)*r;
 }
 const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pPos,3));
 const mat = new THREE.PointsMaterial({
 size:0.18, map:glowTex, color:0x8800ff,
 transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, alphaTest:0.01,
 });
 return { pts: new THREE.Points(geo, mat), mat };
})();

const heroLight = new THREE.PointLight(0x8800ff, 0, 5);
scene.add(heroLight);

// ── Индикатор цели ────────────────────────────────────────────────────────────
const targetRingMat = new THREE.MeshBasicMaterial({ color:0xff6600, side:THREE.DoubleSide, transparent:true, opacity:0, depthWrite:false });
const targetRing = new THREE.Mesh(new THREE.RingGeometry(0.22,0.38,24), targetRingMat);
targetRing.rotation.x = -Math.PI/2; targetRing.position.y = 0.02;
scene.add(targetRing);

// ── Юниты (RTS) ───────────────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);
const UNIT_SPEED = 3.6;
const TRAIN_TIME = 3.5;

const CLASS = {
 peasant: { name:'Peasant', body:0x8a6a3a, hat:0xcaa855 },
 archer: { name:'Archer', body:0x35602f },
 spearman: { name:'Spearman', body:0x7a2f2a },
 alchemist:{ name:'Alchemist', body:0x412a63, glow:0x9a3ad0 },
};

scene.add(karmaParticles.pts);

const units = [];
let selection = [];
const selRingGeo = new THREE.RingGeometry(0.4,0.54,28);
const selRingMat = new THREE.MeshBasicMaterial({ color:0x66ccff, side:THREE.DoubleSide, transparent:true, opacity:0.9, depthWrite:false });

// ── Юниты: риггованная модель Soldier.glb (скелетная Idle/Walk) ──
const SOLDIER_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/r168/examples/models/gltf/Soldier.glb';
const CLASS_COLOR = { peasant:0xe6e6e6, archer:0x3f7a38, spearman:0x9c3a33, alchemist:0x5c3f92 };
let baseGLTF = null;

function makeHat(cls){ return null; }

function spawnUnit(cls, x, z){
 const group = new THREE.Group(); group.position.set(x,0,z);
 const model = SkeletonUtils.clone(baseGLTF.scene);
 model.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true;
 o.material = o.material.clone(); o.material.map=null; o.material.metalness=0.05; o.material.roughness=0.85; o.material.flatShading=true;
 if(o.material.color) o.material.color.set(CLASS_COLOR[cls]);
 o.material.needsUpdate=true;
 }});
 group.add(model);
 let hat = makeHat(cls); if(hat) group.add(hat);
 const ring = new THREE.Mesh(selRingGeo, selRingMat); ring.rotation.x=-Math.PI/2; ring.position.y=0.03; ring.visible=false; group.add(ring);
 scene.add(group);
 const mixer = new THREE.AnimationMixer(model);
 const idleAction = mixer.clipAction(THREE.AnimationClip.findByName(baseGLTF.animations,'Idle'));
 const walkAction = mixer.clipAction(THREE.AnimationClip.findByName(baseGLTF.animations,'Walk'));
 idleAction.play();
 const u = { group, model, hat, ring, cls, mixer, idleAction, walkAction, activeAction:idleAction, target:new THREE.Vector3(x,0,z), moving:false, order:null, train:0, facing:0, bob:Math.random()*6 };
 units.push(u); return u;
}

function unitFade(u, action){
 if(!u.mixer || !action || u.activeAction===action) return;
 const prev=u.activeAction;
 action.enabled=true; action.setEffectiveTimeScale(1); action.setEffectiveWeight(1); action.reset().play();
 if(prev) prev.crossFadeTo(action,0.2,false);
 u.activeAction=action;
}

new GLTFLoader().load(SOLDIER_URL, (gltf)=>{
 baseGLTF = gltf;
 [[-2,2.5],[0,3.2],[2,2.6],[-3.4,4],[3.4,4]].forEach(([x,z])=>spawnUnit('peasant',x,z));
 selectUnit(units[0]);
 camFocus.copy(units[0].group.position); camFocus.y=0;
 camera.position.set(units[0].group.position.x, 5.5, units[0].group.position.z+9);
}, undefined, err=>console.warn('Soldier load error:', err));

function clearSelection(){ for(const u of selection) u.ring.visible=false; }
function setSelection(arr){ clearSelection(); selection = arr.slice(); for(const u of selection) u.ring.visible=true; syncHUD(); }
function selectUnit(u){ setSelection(u?[u]:[]); }
function sel0(){ return selection[0]||null; }

function animateUnit(u,dt){ if(u.mixer) u.mixer.update(dt); }

function transform(u, cls){
 u.cls = cls; u.order = null; u.train = 0;
 u.model.traverse(o=>{ if(o.isMesh && o.material.color) o.material.color.set(CLASS_COLOR[cls]); });
 if(u.hat){ u.group.remove(u.hat); u.hat=null; }
 u.hat = makeHat(cls); if(u.hat) u.group.add(u.hat);
 if(selection.includes(u)) syncHUD();
}

// ── Управление ───────────────────────────────────��──────────────────────────���─
let ringAlpha = 0;
const _v3 = new THREE.Vector3();
const camFocus = new THREE.Vector3(0,0,0);
const CAM_PAN = 16;
const edge = { x:0, z:0 };

function isDescendant(root,obj){ let p=obj; while(p){ if(p===root) return true; p=p.parent; } return false; }
function clampOut(v){ for(const o of obstacles){ const dx=v.x-o.x, dz=v.z-o.z, d=Math.hypot(dx,dz); if(d<o.r){ const s=d<1e-4?0:o.r/d; v.x=o.x+(d<1e-4?o.r:dx*s); v.z=o.z+dz*s; } } return v; }
function orderMove(u,x,z){ u.order=null; u.train=0; u.target.set(x,0,z); clampOut(u.target); u.moving=true; }
function moveGroup(x,z){
 const n=selection.length;
 selection.forEach((u,i)=>{ const ang=(i/Math.max(1,n))*Math.PI*2, rad=n>1?0.75:0; orderMove(u, x+Math.cos(ang)*rad, z+Math.sin(ang)*rad); });
}
function trainGroup(g){
 const base=Math.atan2(-g.z,-g.x), n=selection.length;
 selection.forEach((u,i)=>{ if(u.cls===g.type) return; const ang=base+(i-(n-1)/2)*0.3; u.target.set(g.x+Math.cos(ang)*2.6,0,g.z+Math.sin(ang)*2.6); clampOut(u.target); u.order={type:'train',g}; u.train=0; u.moving=true; });
}

const selBox = document.getElementById('selbox');
let down=null, dragging=false;

window.addEventListener('pointerdown',(e)=>{
 if(e.target.closest('#hud-bottom')||e.target.closest('#hud-top-left')){ down=null; return; }
 down={x:e.clientX,y:e.clientY}; dragging=false;
});
window.addEventListener('pointermove',(e)=>{
 const m=48,w=window.innerWidth,h=window.innerHeight;
 edge.x = e.clientX<m?-1 : e.clientX>w-m?1 : 0;
 edge.z = e.clientY<m?-1 : e.clientY>h-m?1 : 0;
 if(!down) return;
 const dx=e.clientX-down.x, dy=e.clientY-down.y;
 if(!dragging && Math.hypot(dx,dy)>6) dragging=true;
 if(dragging && selBox){
 selBox.style.display='block';
 selBox.style.left=Math.min(e.clientX,down.x)+'px'; selBox.style.top=Math.min(e.clientY,down.y)+'px';
 selBox.style.width=Math.abs(dx)+'px'; selBox.style.height=Math.abs(dy)+'px';
 }
});
window.addEventListener('pointerup',(e)=>{
 if(!down){ return; }
 if(selBox) selBox.style.display='none';
 if(dragging){
 const x1=Math.min(down.x,e.clientX), x2=Math.max(down.x,e.clientX), y1=Math.min(down.y,e.clientY), y2=Math.max(down.y,e.clientY);
 const inside=[];
 for(const u of units){ _v3.copy(u.group.position); _v3.y=1; _v3.project(camera); const sx=(_v3.x*0.5+0.5)*window.innerWidth, sy=(-_v3.y*0.5+0.5)*window.innerHeight; if(sx>=x1&&sx<=x2&&sy>=y1&&sy<=y2) inside.push(u); }
 setSelection(inside);
 } else { clickAction(e); }
 down=null; dragging=false;
});
window.addEventListener('mouseleave',()=>{ edge.x=0; edge.z=0; });
window.addEventListener('keydown',(e)=>{ const k=e.key.toLowerCase(); if(k==='a') setSelection(units.slice()); });

function clickAction(e){
 mouse.x=(e.clientX/window.innerWidth)*2-1; mouse.y=-(e.clientY/window.innerHeight)*2+1;
 raycaster.setFromCamera(mouse,camera);
 const uHit=raycaster.intersectObjects(units.map(u=>u.group),true)[0];
 if(uHit){ const u=units.find(u=>isDescendant(u.group,uHit.object)); if(u){ selectUnit(u); return; } }
 if(!selection.length) return;
 const gHit=raycaster.intersectObjects(guilds.map(g=>g.group),true)[0];
 if(gHit){ const g=guilds.find(g=>isDescendant(g.group,gHit.object)); if(g){ trainGroup(g); return; } }
 const hit=new THREE.Vector3();
 if(raycaster.ray.intersectPlane(groundPlane,hit)){ moveGroup(hit.x,hit.z); targetRing.position.set(hit.x,0.02,hit.z); ringAlpha=1.0; }
}

// ── Состояние игрока ───────────────────────────────��──────────────────────────
const player = { hp:100, maxHp:100, karma:0 };
const clamp = (v,lo,hi) => Math.min(hi,Math.max(lo,v));

function updateKarmaFX() {
 const k=player.karma, abs=Math.abs(k);
 if(abs<25){ karmaParticles.mat.opacity=0; heroLight.intensity=0; bloom.strength=0.55; return; }
 const t=(abs-25)/75;
 if(k>0){ karmaParticles.mat.color.setHex(0xffcc44); karmaParticles.mat.opacity=t*0.75; heroLight.color.setHex(0xffcc44); heroLight.intensity=t*3; bloom.strength=0.55+t*1.1; }
 else { karmaParticles.mat.color.setHex(0x9900ff); karmaParticles.mat.opacity=t*0.85; heroLight.color.setHex(0x6600cc); heroLight.intensity=t*3.8; bloom.strength=0.55+t*1.6; }
}

function changeKarma(delta) { player.karma=clamp(player.karma+delta,-100,100); syncHUD(); updateKarmaFX(); }

const avatar=document.getElementById('avatar'), hpFill=document.getElementById('hp-bar-fill'), karmaValue=document.getElementById('karma-value');
const unitClassEl=document.getElementById('unit-class'), trainFill=document.getElementById('train-fill');

function syncHUD() {
 const p=(player.hp/player.maxHp)*100;
 hpFill.style.width=p+'%';
 karmaValue.textContent=(player.karma>0?'+':'')+player.karma;
 avatar.classList.toggle('hero--angel',player.karma>50);
 avatar.classList.toggle('hero--demon',player.karma<-50);
 hpFill.style.background=p>60?'linear-gradient(90deg,#2ecc71,#27ae60)':p>30?'linear-gradient(90deg,#f39c12,#e67e22)':'linear-gradient(90deg,#e74c3c,#c0392b)';
 karmaValue.style.color=player.karma>30?'#ffcc44':player.karma<-30?'#cc44ff':'#c8b89a';
 if(unitClassEl){ const s0=sel0(); unitClassEl.textContent = selection.length===0?'—' : selection.length===1?CLASS[s0.cls].name : CLASS[s0.cls].name+' ×'+selection.length; } // '—' is intentional (em dash for "none")
}
syncHUD();
camera.position.set(0, 6.5, 11);

document.getElementById('btn-good').addEventListener('click',()=>{ changeKarma(+10); player.hp=clamp(player.hp+5,0,player.maxHp); syncHUD(); });
document.getElementById('btn-evil').addEventListener('click',()=>{ changeKarma(-10); player.hp=clamp(player.hp-8,0,player.maxHp); syncHUD(); });

window.addEventListener('resize',()=>{
 camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix();
 renderer.setSize(window.innerWidth,window.innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 composer.setSize(window.innerWidth,window.innerHeight);
});

// ── Цикл ───────────────────────────���─────────────────────────────────────────
const clock = new THREE.Clock();
const CAM_OFFSET = new THREE.Vector3(0, 5.5, 9);
const camTarget = new THREE.Vector3();
const camLook = new THREE.Vector3(0,1.2,0);

renderer.setAnimationLoop(() => {
 const dt = clock.getDelta();
 const t = clock.elapsedTime;

 for(const u of units){
 if(u.moving){
 const dir=new THREE.Vector3().subVectors(u.target,u.group.position); dir.y=0;
 const dist=dir.length();
 if(dist>0.1){
 dir.normalize();
 u.group.position.addScaledVector(dir, UNIT_SPEED*dt);
 for(const o of obstacles){
 const dx=u.group.position.x-o.x, dz=u.group.position.z-o.z, d=Math.hypot(dx,dz);
 if(d<o.r && d>1e-4){ const push=o.r-d; u.group.position.x+=dx/d*push; u.group.position.z+=dz/d*push; }
 }
 u.facing=Math.atan2(dir.x,dir.z)+Math.PI;
 unitFade(u, u.walkAction);
 } else { u.moving=false; unitFade(u, u.idleAction); }
 }
 u.group.rotation.y += (u.facing - u.group.rotation.y)*0.2;
 animateUnit(u,dt);
 if(u.order && u.order.type==='train' && !u.moving && u.cls!==u.order.g.type){
 u.train += dt;
 if(u.train>=TRAIN_TIME) transform(u, u.order.g.type);
 }
 }
 if(trainFill){ const s0=sel0(); const on=s0&&s0.order&&s0.order.type==='train'; trainFill.style.width = on ? Math.min(100,(s0.train/TRAIN_TIME)*100)+'%' : '0%'; }

 karmaParticles.pts.rotation.y = t * 0.85;
 const focus=sel0();
 if(focus){ karmaParticles.pts.position.set(focus.group.position.x,0,focus.group.position.z); heroLight.position.set(focus.group.position.x,1.5,focus.group.position.z); }

 lanternLights.forEach((l,i)=>{ l.intensity=2.0+Math.sin(t*7.2+i*1.8)*0.25; });

 campfires.forEach(({flames,light},ci)=>{
 flames.forEach(f=>{
 const ph=f.userData.phase, bh=f.userData.baseHeight;
 const sc=0.7+0.35*Math.sin(t*8+ph);
 f.scale.set(sc,0.6+0.5*Math.sin(t*6+ph),sc);
 f.position.y=bh*0.5*sc;
 f.rotation.y=t*2+ph;
 });
 light.intensity=2.2+Math.sin(t*9+ci*2.3)*0.4;
 });

 if(ringAlpha>0){ ringAlpha=Math.max(0,ringAlpha-dt*1.8); targetRingMat.opacity=ringAlpha; }

 if(selection.length){
 let cx=0,cz=0; for(const u of selection){ cx+=u.group.position.x; cz+=u.group.position.z; }
 camFocus.lerp(_v3.set(cx/selection.length,0,cz/selection.length),0.08);
 } else {
 camFocus.x=clamp(camFocus.x+edge.x*CAM_PAN*dt,-26,26);
 camFocus.z=clamp(camFocus.z+edge.z*CAM_PAN*dt,-26,26);
 }
 camera.position.lerp(_v3.set(camFocus.x+CAM_OFFSET.x,CAM_OFFSET.y,camFocus.z+CAM_OFFSET.z),0.1);
 camera.lookAt(camFocus.x,1.0,camFocus.z);

 composer.render();
});
