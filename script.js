import * as THREE from 'three';
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GLTFLoader }      from 'three/addons/loaders/GLTFLoader.js';

// ── Renderer ──────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
document.body.appendChild(renderer.domElement);

// ── Scene ─────────────────────────────────────────────────────────────────────
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

// ── Звёзды ────────────────────────────────────────────────────────────────────
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

// ── Земля ─────────────────────────────────────────────────────────────────────
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

// ── Каменные фонари (торо) ────────────────────────────────────────────────────
const lanternLights = [];
[[-2.5,-3.5],[2.5,-3.5],[-2.5,3.5],[2.5,3.5]].forEach(([x,z]) => {
  const sm = new THREE.MeshStandardMaterial({ color:0x353028, roughness:0.9 });
  const lm = new THREE.MeshStandardMaterial({ color:0xff7700, emissive:0xff5500, emissiveIntensity:2.0, transparent:true, opacity:0.88 });
  const grp = new THREE.Group(); grp.position.set(x,0,z);
  [{geo:new THREE.CylinderGeometry(0.26,0.31,0.14,10),mat:sm,y:0.07},
   {geo:new THREE.CylinderGeometry(0.1,0.13,1.2,10), mat:sm,y:0.74},
   {geo:new THREE.CylinderGeometry(0.36,0.36,0.11,10),mat:sm,y:1.38},
   {geo:new THREE.BoxGeometry(0.34,0.34,0.34),         mat:lm,y:1.1 }
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

// ── Японский дом (пагода) ─────────────────────────────────────────────────────
function addPagoda(x, z, ry = 0) {
  const woodMat  = new THREE.MeshStandardMaterial({ color:0x4a2810, roughness:0.85 });
  const wallMat  = new THREE.MeshStandardMaterial({ color:0x8a6040, roughness:0.9 });
  const roofMat  = new THREE.MeshStandardMaterial({ color:0x1c1a14, roughness:0.75, metalness:0.1 });
  const goldMat  = new THREE.MeshStandardMaterial({ color:0x8a7030, roughness:0.4, metalness:0.7 });
  const grp = new THREE.Group(); grp.position.set(x,0,z); grp.rotation.y=ry;

  const winMat = new THREE.MeshBasicMaterial({ color:0xffb04a, side:THREE.DoubleSide });
  // Фундамент
  const found=new THREE.Mesh(new THREE.BoxGeometry(4.2,0.35,3.2),woodMat); found.position.y=0.175; found.castShadow=true; grp.add(found);
  // Стены
  const walls=new THREE.Mesh(new THREE.BoxGeometry(3.8,2.2,2.8),wallMat); walls.position.y=1.45; walls.castShadow=true; grp.add(walls);
  // Окна первого яруса — фронт и тыл
  [-0.85,0.85].forEach(wx=>{
    [1.41,-1.41].forEach(wz=>{
      const win=new THREE.Mesh(new THREE.PlaneGeometry(0.55,0.72),winMat);
      win.position.set(wx,1.52,wz); if(wz<0) win.rotation.y=Math.PI; grp.add(win);
    });
  });
  // Окна первого яруса — боковые стены
  [-0.9,0.9].forEach(wz=>{
    const win=new THREE.Mesh(new THREE.PlaneGeometry(0.55,0.72),winMat);
    win.position.set(1.9,1.52,wz); win.rotation.y=Math.PI/2; grp.add(win);
    const win2=new THREE.Mesh(new THREE.PlaneGeometry(0.55,0.72),winMat);
    win2.position.set(-1.9,1.52,wz); win2.rotation.y=-Math.PI/2; grp.add(win2);
  });
  // Первая крыша (4-скатная = конус с 4 сегментами)
  const r1=new THREE.Mesh(new THREE.ConeGeometry(3.2,1.0,4),roofMat); r1.position.y=2.85; r1.rotation.y=Math.PI/4; r1.castShadow=true; grp.add(r1);
  // Второй ярус
  const w2=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.4,1.9),wallMat); w2.position.y=3.65; w2.castShadow=true; grp.add(w2);
  // Окно второго яруса — фронт
  const win2nd=new THREE.Mesh(new THREE.PlaneGeometry(0.6,0.5),winMat); win2nd.position.set(0,3.7,0.96); grp.add(win2nd);
  const r2=new THREE.Mesh(new THREE.ConeGeometry(2.0,0.75,4),roofMat); r2.position.y=4.6; r2.rotation.y=Math.PI/4; r2.castShadow=true; grp.add(r2);
  // Шпиль
  const spire=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.08,0.8,8),goldMat); spire.position.y=5.35; grp.add(spire);
  const ball=new THREE.Mesh(new THREE.SphereGeometry(0.1,10,8),goldMat); ball.position.y=5.8; grp.add(ball);

  grp.children.forEach(c=>{ c.receiveShadow=true; });
  scene.add(grp);
}
addPagoda(-12, -8, 0.3);
addPagoda(11, -10, -0.2);

// ── Разрушенные стены ─────────────────────────────────────────────────────────
function addRuins(x, z) {
  const mat=new THREE.MeshStandardMaterial({color:0x504840,roughness:0.95});
  // Частичная стена
  const h=1.4+Math.random()*0.8;
  const wall=new THREE.Mesh(new THREE.BoxGeometry(0.45,h,2.2),mat); wall.position.set(x,h/2,z); wall.rotation.y=(Math.random()-0.5)*0.2; wall.castShadow=true; scene.add(wall);
  // Упавшие блоки
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
  const inner=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,0.65,16),new THREE.MeshStandardMaterial({color:0x0a0810})); inner.position.set(x,0.32,z); scene.add(inner);
  [-0.45,0.45].forEach(s=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.065,1.3,8),wdm); p.position.set(x+s,1.0,z); p.castShadow=true; scene.add(p);});
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,1.05,8),wdm); beam.position.set(x,1.55,z); beam.rotation.z=Math.PI/2; beam.castShadow=true; scene.add(beam);
  const rf=new THREE.Mesh(new THREE.ConeGeometry(0.65,0.5,8),new THREE.MeshStandardMaterial({color:0x1c1a14,roughness:0.8})); rf.position.set(x,1.9,z); scene.add(rf);
}
addWell(4, 2);

// ── Деревья ───────────────────────────────────────────────────────────────────
function addCherryTree(x, z) {
  const tm=new THREE.MeshStandardMaterial({color:0x1a0c08,roughness:0.9});
  const bm=new THREE.MeshStandardMaterial({color:0x6b1030,roughness:0.8,emissive:0x3a0618,emissiveIntensity:0.3});
  const tr=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.18,3.2,8),tm); tr.position.set(x,1.6,z); tr.castShadow=true; scene.add(tr);
  for(let i=0;i<4;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(0.55+Math.random()*0.38,10,8),bm); b.position.set(x+(Math.random()-0.5)*1.4,3.1+Math.random()*0.8,z+(Math.random()-0.5)*1.4); b.castShadow=true; scene.add(b);}
}
function addDeadTree(x, z) {
  const m=new THREE.MeshStandardMaterial({color:0x110808,roughness:1});
  const tr=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.15,4.2,7),m); tr.position.set(x,2.1,z); tr.rotation.z=(Math.random()-0.5)*0.22; tr.castShadow=true; scene.add(tr);
  for(let i=0;i<5;i++){const a=(i/5)*Math.PI*2; const br=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.06,0.65+Math.random()*0.7,6),m); br.position.set(x+Math.sin(a)*0.4,2.6+Math.random()*1.2,z+Math.cos(a)*0.4); br.rotation.z=Math.sin(a)*0.85; br.castShadow=true; scene.add(br);}
}
[[-5,-7],[-8,2],[-6,8],[5,-9],[9,0],[7,7],[-10,-3],[10,-5]].forEach(([x,z],i)=>{ (i%2===0?addCherryTree:addDeadTree)(x,z); });

// ── Костры / Маленькие языки пламени ─────────────────────────────────────────
// Текстура мягкого светящегося пятна
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
  // Угли / камни вокруг
  const stonM=new THREE.MeshStandardMaterial({color:0x303028,roughness:1});
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2; const s=new THREE.Mesh(new THREE.SphereGeometry(0.1+Math.random()*0.06,7,5),stonM); s.position.set(Math.cos(a)*0.3,0.06,Math.sin(a)*0.3); s.castShadow=true; grp.add(s);}
  // Языки пламени — конусы с emissive
  const flames = [];
  for(let i=0;i<5;i++){
    const h=0.18+Math.random()*0.14;
    const fm=new THREE.MeshStandardMaterial({color:0xff6600,emissive:0xff4400,emissiveIntensity:3,transparent:true,opacity:0.85,depthWrite:false});
    const f=new THREE.Mesh(new THREE.ConeGeometry(0.05,h,6),fm);
    f.position.set((Math.random()-0.5)*0.15,h/2,(Math.random()-0.5)*0.15);
    f.userData.baseHeight=h; f.userData.phase=Math.random()*Math.PI*2;
    grp.add(f); flames.push(f);
  }
  // Световое пятно
  const pl=new THREE.PointLight(0xff6600,2.5,5); pl.position.y=0.4; grp.add(pl);
  scene.add(grp);
  campfires.push({grp,flames,light:pl});
}
addFlames(-3, 0.5);
addFlames(6, -5);
addFlames(-7, -4);

// ── Текстура для частиц кармы (мягкий круг) ──────────────────────────────────
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

// ── Персонаж ──────────────────────────────────────────────────────────────────
const heroGroup = new THREE.Group();
scene.add(heroGroup);
heroGroup.add(karmaParticles.pts);

const fallbackMat = new THREE.MeshStandardMaterial({ color:0x3a4050, roughness:0.6, metalness:0.5 });
const fallback = new THREE.Mesh(new THREE.CapsuleGeometry(0.4,1.2,8,16), fallbackMat);
fallback.position.y = 1.0; fallback.castShadow = true;
heroGroup.add(fallback);

let mixer=null, idleAction=null, walkAction=null;

new GLTFLoader().load(
  'https://raw.githubusercontent.com/mrdoob/three.js/r168/examples/models/gltf/Soldier.glb',
  (gltf) => {
    heroGroup.remove(fallback);
    const model = gltf.scene;
    model.traverse(c => { if(c.isMesh){ c.castShadow=true; c.receiveShadow=true; } });
    heroGroup.add(model);
    mixer = new THREE.AnimationMixer(model);
    const clips = gltf.animations;
    idleAction = mixer.clipAction(THREE.AnimationClip.findByName(clips,'Idle') || clips[0]);
    walkAction = mixer.clipAction(THREE.AnimationClip.findByName(clips,'Run') || THREE.AnimationClip.findByName(clips,'Walk') || clips[1]);
    if(walkAction) walkAction.timeScale = 1.0;
    idleAction.play();
  },
  undefined,
  err => console.warn('GLB load error:', err)
);

// ── Click-to-move ─────────────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);
const targetPos = new THREE.Vector3();
let isMoving = false;
const MOVE_SPEED = 4.2;
let ringAlpha = 0;

window.addEventListener('click', (e) => {
  if(e.target.closest('#hud-bottom')) return;
  mouse.x = (e.clientX/window.innerWidth)*2-1;
  mouse.y = -(e.clientY/window.innerHeight)*2+1;
  raycaster.setFromCamera(mouse, camera);
  const hit = new THREE.Vector3();
  if(raycaster.ray.intersectPlane(groundPlane, hit)){
    targetPos.set(hit.x, 0, hit.z);
    targetRing.position.set(hit.x, 0.02, hit.z);
    ringAlpha = 1.0; isMoving = true;
    if(mixer && walkAction && idleAction && !walkAction.isRunning()){ idleAction.fadeOut(0.2); walkAction.reset().fadeIn(0.2).play(); }
  }
});

// ── Состояние игрока ──────────────────────────────────────────────────────────
const player = { hp:100, maxHp:100, karma:0 };
const clamp = (v,lo,hi) => Math.min(hi,Math.max(lo,v));

function updateKarmaFX() {
  const k=player.karma, abs=Math.abs(k);
  if(abs<25){ karmaParticles.mat.opacity=0; heroLight.intensity=0; bloom.strength=0.55; return; }
  const t=(abs-25)/75;
  if(k>0){ karmaParticles.mat.color.setHex(0xffcc44); karmaParticles.mat.opacity=t*0.75; heroLight.color.setHex(0xffcc44); heroLight.intensity=t*3; bloom.strength=0.55+t*1.1; }
  else    { karmaParticles.mat.color.setHex(0x9900ff); karmaParticles.mat.opacity=t*0.85; heroLight.color.setHex(0x6600cc); heroLight.intensity=t*3.8; bloom.strength=0.55+t*1.6; }
}

function changeKarma(delta) { player.karma=clamp(player.karma+delta,-100,100); syncHUD(); updateKarmaFX(); }

const avatar=document.getElementById('avatar'), hpFill=document.getElementById('hp-bar-fill'), karmaValue=document.getElementById('karma-value');

function syncHUD() {
  const p=(player.hp/player.maxHp)*100;
  hpFill.style.width=p+'%';
  karmaValue.textContent=(player.karma>0?'+':'')+player.karma;
  avatar.classList.toggle('hero--angel',player.karma>50);
  avatar.classList.toggle('hero--demon',player.karma<-50);
  hpFill.style.background=p>60?'linear-gradient(90deg,#2ecc71,#27ae60)':p>30?'linear-gradient(90deg,#f39c12,#e67e22)':'linear-gradient(90deg,#e74c3c,#c0392b)';
  karmaValue.style.color=player.karma>30?'#ffcc44':player.karma<-30?'#cc44ff':'#c8b89a';
}
syncHUD();

document.getElementById('btn-good').addEventListener('click',()=>{ changeKarma(+10); player.hp=clamp(player.hp+5,0,player.maxHp); syncHUD(); });
document.getElementById('btn-evil').addEventListener('click',()=>{ changeKarma(-10); player.hp=clamp(player.hp-8,0,player.maxHp); syncHUD(); });

window.addEventListener('resize',()=>{
  camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  composer.setSize(window.innerWidth,window.innerHeight);
});

// ── Цикл ─────────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
const CAM_OFFSET = new THREE.Vector3(0, 5.5, 9);
const camTarget  = new THREE.Vector3();
let heroFacing   = 0;

renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  const t  = clock.elapsedTime;

  if(mixer) mixer.update(dt);

  // Движение к цели
  if(isMoving){
    const dir=new THREE.Vector3().subVectors(targetPos,heroGroup.position); dir.y=0;
    const dist=dir.length();
    if(dist>0.12){
      dir.normalize();
      heroGroup.position.addScaledVector(dir,MOVE_SPEED*dt);
      // +Math.PI — модель Soldier смотрит по +Z, нам нужен разворот
      heroFacing = Math.atan2(dir.x,dir.z) + Math.PI;
    } else {
      heroGroup.position.x=targetPos.x; heroGroup.position.z=targetPos.z;
      isMoving=false;
      if(mixer&&idleAction&&walkAction){ walkAction.fadeOut(0.25); idleAction.reset().fadeIn(0.25).play(); }
    }
  } else {
    heroFacing += (Math.sin(t*0.3)*0.05 - heroFacing) * 0.03;
  }
  // Плавное поворачивание
  heroGroup.rotation.y += (heroFacing - heroGroup.rotation.y) * 0.15;

  // Частицы кармы
  karmaParticles.pts.rotation.y = t * 0.85;
  heroLight.position.set(heroGroup.position.x, heroGroup.position.y+1.5, heroGroup.position.z);

  // Фонари — мерцание
  lanternLights.forEach((l,i)=>{ l.intensity=2.0+Math.sin(t*7.2+i*1.8)*0.25; });

  // Костры — анимация пламени
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

  // Кольцо цели
  if(ringAlpha>0){ ringAlpha=Math.max(0,ringAlpha-dt*1.8); targetRingMat.opacity=ringAlpha; }

  // Камера следует за героем
  camTarget.set(heroGroup.position.x+CAM_OFFSET.x, heroGroup.position.y+CAM_OFFSET.y, heroGroup.position.z+CAM_OFFSET.z);
  camera.position.lerp(camTarget,0.06);
  camera.lookAt(heroGroup.position.x, heroGroup.position.y+1.2, heroGroup.position.z);

  composer.render();
});
