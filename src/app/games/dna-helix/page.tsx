"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

// ─── Types ───────────────────────────────────────────────────────────
interface BasePairInfo {
  pairIndex: number;
  base1: string;
  base2: string;
  color1: string;
  color2: string;
  description: string;
  position: THREE.Vector3;
}

// ─── Constants ───────────────────────────────────────────────────────
const HELIX_TURNS = 2.5;
const PAIRS_PER_TURN = 8;
const TOTAL_PAIRS = HELIX_TURNS * PAIRS_PER_TURN;
const RADIUS = 2.0;
const VERTICAL_SPACING = 0.45;
const BASE_SIZE = 0.18;
const BOND_SIZE = 0.04;

const PAIR_TYPES = ["A-T", "G-C"] as const;

// ─── Scene setup ─────────────────────────────────────────────────────
function createScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050510);
  scene.fog = new THREE.FogExp2(0x050510, 0.025);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  // Lighting
  scene.add(new THREE.AmbientLight(0x334466, 0.8));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
  keyLight.position.set(5, 8, 6);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0x6366f1, 1.5, 30);
  rimLight.position.set(-8, 2, -4);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0xf97316, 0.8, 25);
  fillLight.position.set(6, -3, 2);
  scene.add(fillLight);

  return { renderer, scene, camera };
}

// ─── Stars ───────────────────────────────────────────────────────────
function createStarfield(scene: THREE.Scene) {
  const count = 1500;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i += 3) {
    pos[i] = (Math.random() - 0.5) * 60;
    pos[i + 1] = (Math.random() - 0.5) * 60;
    pos[i + 2] = -10 - Math.random() * 40;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.06,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.6,
  });
  scene.add(new THREE.Points(geo, mat));
}

// ─── Smooth helix curve ──────────────────────────────────────────────
function helixPoint(t: number, angle: number, radius: number, height: number): THREE.Vector3 {
  return new THREE.Vector3(
    Math.cos(angle) * radius,
    height,
    Math.sin(angle) * radius,
  );
}

function buildSmoothHelix(totalPairs: number, radius: number, spacing: number, turns: number) {
  const points1: THREE.Vector3[] = [];
  const points2: THREE.Vector3[] = [];

  for (let i = 0; i <= totalPairs * 4; i++) {
    const t = i / (totalPairs * 4);
    const angle = t * turns * Math.PI * 2;
    const y = (t * totalPairs - totalPairs / 2) * spacing;
    points1.push(helixPoint(t, angle, radius, y));
    points2.push(helixPoint(t, angle + Math.PI, radius, y));
  }

  const curve1 = new THREE.CatmullRomCurve3(points1);
  const curve2 = new THREE.CatmullRomCurve3(points2);

  return { curve1, curve2 };
}

// ─── Glow sprite ─────────────────────────────────────────────────────
function glowTexture() {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,0.35)");
  g.addColorStop(0.3, "rgba(255,255,255,0.12)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

// ─── DNA builder ─────────────────────────────────────────────────────
function buildDNA(scene: THREE.Scene) {
  const group = new THREE.Group();
  scene.add(group);

  const basePairs: BasePairInfo[] = [];
  const clickableMeshes: THREE.Mesh[] = [];
  const glowSprites: THREE.Sprite[] = [];

  const { curve1, curve2 } = buildSmoothHelix(
    TOTAL_PAIRS, RADIUS, VERTICAL_SPACING, HELIX_TURNS,
  );

  // Backbone tubes
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.35,
    metalness: 0.6,
    emissive: 0x1e293b,
    emissiveIntensity: 0.5,
  });

  group.add(new THREE.Mesh(new THREE.TubeGeometry(curve1, 200, 0.07, 12, false), tubeMat));
  group.add(new THREE.Mesh(new THREE.TubeGeometry(curve2, 200, 0.07, 12, false), tubeMat));

  // Total height
  const totalHeight = (TOTAL_PAIRS - 1) * VERTICAL_SPACING;
  const startY = -totalHeight / 2;

  for (let i = 0; i < TOTAL_PAIRS; i++) {
    const t = i / (TOTAL_PAIRS - 1);
    const angle = t * HELIX_TURNS * Math.PI * 2;
    const y = startY + i * VERTICAL_SPACING;

    const isGC = i % 3 !== 0;
    const pairType = isGC ? "G-C" : "A-T";
    const color1 = isGC ? "#22c55e" : "#ef4444";
    const color2 = isGC ? "#eab308" : "#3b82f6";
    const desc = isGC
      ? "鸟嘌呤-胞嘧啶: 3个氢键连接，结构更稳定"
      : "腺嘌呤-胸腺嘧啶: 2个氢键连接";

    const p1 = new THREE.Vector3(Math.cos(angle) * RADIUS, y, Math.sin(angle) * RADIUS);
    const p2 = new THREE.Vector3(Math.cos(angle + Math.PI) * RADIUS, y, Math.sin(angle + Math.PI) * RADIUS);

    // Base spheres
    const sphereGeo = new THREE.SphereGeometry(BASE_SIZE, 16, 16);

    const mat1 = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color1),
      emissive: new THREE.Color(color1),
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.1,
    });
    const mesh1 = new THREE.Mesh(sphereGeo, mat1);
    mesh1.position.copy(p1);
    mesh1.userData = { pairIndex: i, side: 1 };
    group.add(mesh1);
    clickableMeshes.push(mesh1);

    const mat2 = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color2),
      emissive: new THREE.Color(color2),
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.1,
    });
    const mesh2 = new THREE.Mesh(sphereGeo, mat2);
    mesh2.position.copy(p2);
    mesh2.userData = { pairIndex: i, side: 2 };
    group.add(mesh2);
    clickableMeshes.push(mesh2);

    // Glow sprites behind each base
    const glowMat = new THREE.SpriteMaterial({
      map: glowTexture(),
      color: new THREE.Color(color1),
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow1 = new THREE.Sprite(glowMat);
    glow1.position.copy(p1);
    glow1.scale.setScalar(0.8);
    group.add(glow1);
    glowSprites.push(glow1);

    const glowMat2 = glowMat.clone();
    glowMat2.color = new THREE.Color(color2);
    const glow2 = new THREE.Sprite(glowMat2);
    glow2.position.copy(p2);
    glow2.scale.setScalar(0.8);
    group.add(glow2);
    glowSprites.push(glow2);

    // Bond between bases
    const bondDir = p2.clone().sub(p1);
    const bondLen = bondDir.length();
    bondDir.normalize();

    const bondGeo = new THREE.CylinderGeometry(BOND_SIZE, BOND_SIZE, bondLen, 8);
    const bondMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      emissive: 0x334155,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.6,
      roughness: 0.5,
    });
    const bond = new THREE.Mesh(bondGeo, bondMat);
    bond.position.copy(p1).add(p2).multiplyScalar(0.5);
    bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bondDir);
    group.add(bond);

    basePairs.push({
      pairIndex: i,
      base1: isGC ? "G" : "A",
      base2: isGC ? "C" : "T",
      color1,
      color2,
      description: desc,
      position: bond.position.clone(),
    });
  }

  return { group, clickableMeshes, basePairs, glowSprites };
}

// ─── Component ───────────────────────────────────────────────────────
export default function DNAHelix() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPair, setSelectedPair] = useState<BasePairInfo | null>(null);
  const animRef = useRef(0);
  const groupRef = useRef<THREE.Group | null>(null);
  const meshesRef = useRef<THREE.Mesh[]>([]);
  const clickedRef = useRef<number>(-1);

  const resetView = useCallback(() => {
    setSelectedPair(null);
    if (clickedRef.current >= 0) {
      const m = meshesRef.current[clickedRef.current];
      if (m) {
        m.scale.setScalar(1);
        (m.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4;
      }
      clickedRef.current = -1;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { renderer, scene, camera } = createScene(canvas);
    createStarfield(scene);
    const { group, clickableMeshes, basePairs, glowSprites } = buildDNA(scene);
    groupRef.current = group;
    meshesRef.current = clickableMeshes;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function updateMouse(e: PointerEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function onPointerMove(e: PointerEvent) {
      updateMouse(e);
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(clickableMeshes);

      // Reset previous hover
      if (clickedRef.current < 0 && canvas) {
        canvas.style.cursor = hits.length > 0 ? "pointer" : "default";
      }

      if (hits.length > 0) {
        const obj = hits[0].object as THREE.Mesh;
        const idx = clickableMeshes.indexOf(obj);
        if (idx >= 0 && idx !== clickedRef.current) {
          obj.scale.setScalar(1.25);
          (obj.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;
        }
      }
    }

    function onClick(e: PointerEvent) {
      updateMouse(e);
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(clickableMeshes);

      // Reset previous click
      if (clickedRef.current >= 0) {
        const prev = clickableMeshes[clickedRef.current];
        if (prev) {
          prev.scale.setScalar(1);
          (prev.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4;
        }
      }

      if (hits.length > 0) {
        const obj = hits[0].object as THREE.Mesh;
        clickedRef.current = clickableMeshes.indexOf(obj);
        obj.scale.setScalar(1.5);
        (obj.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2;

        const pi = obj.userData.pairIndex as number;
        setSelectedPair(basePairs[pi]);

        // Zoom camera toward selected pair
        const target = basePairs[pi].position;
        animateCamera(target);
      } else {
        clickedRef.current = -1;
        setSelectedPair(null);
        animateCameraBack(camera);
      }
    }

    function animateCamera(target: THREE.Vector3) {
      const startPos = camera.position.clone();
      const startLookAt = new THREE.Vector3(0, 0, 0);
      const endPos = target.clone().add(new THREE.Vector3(0, 0, 8));
      const endLookAt = target.clone();
      let t = 0;

      function step() {
        t += 0.025;
        if (t > 1) t = 1;
        const ease = t * t * (3 - 2 * t);
        camera.position.lerpVectors(startPos, endPos, ease);
        camera.lookAt(startLookAt.lerp(endLookAt, ease));
        if (t < 1) requestAnimationFrame(step);
      }
      step();
    }

    function animateCameraBack(cam: THREE.PerspectiveCamera) {
      const startPos = cam.position.clone();
      let t = 0;
      function step() {
        t += 0.025;
        if (t > 1) t = 1;
        const ease = t * t * (3 - 2 * t);
        cam.position.lerpVectors(startPos, new THREE.Vector3(0, 0, 14), ease);
        cam.lookAt(0, 0, 0);
        if (t < 1) requestAnimationFrame(step);
      }
      step();
    }

    if (canvas) {
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("click", onClick);
    }

    function resize() {
      if (!canvas) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    // Gentle auto-rotate
    let running = true;
    function animate() {
      animRef.current = requestAnimationFrame(animate);
      if (group && clickedRef.current < 0) {
        group.rotation.y += 0.004;
      }
      // Pulse glow sprites
      const time = performance.now() * 0.001;
      glowSprites.forEach((s, i) => {
        const pulse = 0.4 + 0.15 * Math.sin(time * 1.5 + i * 0.5);
        s.material.opacity = pulse;
      });
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      if (canvas) {
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("click", onClick);
      }
      window.removeEventListener("resize", resize);
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 sm:px-8 lg:px-12">
      <a href="/" className="page-back">← 返回首页</a>

      <div className="mb-8">
        <h1 className="page-title">DNA 双螺旋</h1>
        <p className="page-subtitle">交互式 3D 结构模型 · 点击碱基对查看详情</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <canvas
          ref={canvasRef}
          className="w-full rounded-xl border border-border bg-[#050510]"
          style={{ height: "min(65vh, 600px)", cursor: "default" }}
        />

        {selectedPair && (
          <div className="details-panel">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">碱基对 #{selectedPair.pairIndex + 1}</h2>
              <button onClick={resetView} className="details-close">关闭</button>
            </div>

            <div className="base-display">
              <div className="base-circle" style={{ backgroundColor: selectedPair.color1 }}>
                {selectedPair.base1}
              </div>
              <span className="base-equals">═</span>
              <div className="base-circle" style={{ backgroundColor: selectedPair.color2 }}>
                {selectedPair.base2}
              </div>
            </div>

            <p className="text-sm text-foreground/70 mb-4">{selectedPair.description}</p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: selectedPair.color1 }}
                />
                <span className="text-foreground/60">
                  {selectedPair.base1 === "A" ? "腺嘌呤 (Adenine)" : "鸟嘌呤 (Guanine)"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: selectedPair.color2 }}
                />
                <span className="text-foreground/60">
                  {selectedPair.base2 === "T" ? "胸腺嘧啶 (Thymine)" : "胞嘧啶 (Cytosine)"}
                </span>
              </div>
            </div>
          </div>
        )}

        {!selectedPair && (
          <div className="hidden lg:block lg:w-72 rounded-xl border border-border bg-card/30 p-5 flex items-center justify-center">
            <p className="text-sm text-foreground/30 text-center leading-relaxed">
              点击螺旋上的碱基对<br />查看化学结构详情
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
