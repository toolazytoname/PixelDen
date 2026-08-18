"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import * as THREE from "three";
import {
  BASE_SIZE,
  BOND_SIZE,
  buildPairModels,
  HELIX_TURNS,
  pairAt,
  pairSelectionPayload,
  RADIUS,
  selectPair,
  TOTAL_PAIRS,
  VERTICAL_SPACING,
  type PairModel,
} from "@/lib/dna";

interface BasePairInfo extends PairModel {
  position: THREE.Vector3;
}

// ─── Scene setup ─────────────────────────────────────────────────────
function createScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
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

    const pair = pairAt(i);
    const { color1, color2 } = pair;

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
    bond.userData = { pairIndex: i, side: 0 };
    group.add(bond);
    clickableMeshes.push(bond);

    basePairs.push({
      ...pair,
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
  const selectedIndexRef = useRef(-1);
  const hoverIndexRef = useRef(-1);
  const focusRef = useRef<(index: number | null) => void>(() => {});

  const resetView = useCallback(() => {
    focusRef.current(null);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { renderer, scene, camera } = createScene(canvas);
    createStarfield(scene);
    const { group, clickableMeshes, basePairs, glowSprites } = buildDNA(scene);
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const camPos = camera.position.clone();
    const camLook = new THREE.Vector3(0, 0, 0);
    const goalPos = new THREE.Vector3(0, 0, 14);
    const goalLook = new THREE.Vector3(0, 0, 0);

    function updateMouse(e: PointerEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function applyHighlights() {
      const selected = selectedIndexRef.current;
      const hover = hoverIndexRef.current;
      clickableMeshes.forEach((mesh) => {
        const pairIndex = mesh.userData.pairIndex as number;
        const bond = mesh.userData.side === 0;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (pairIndex === selected) {
          mat.emissiveIntensity = bond ? 1.0 : 1.4;
          mesh.scale.setScalar(bond ? 1 : 1.32);
        } else if (pairIndex === hover) {
          mat.emissiveIntensity = 0.8;
          mesh.scale.setScalar(bond ? 1 : 1.16);
        } else {
          mat.emissiveIntensity = selected >= 0 ? 0.12 : 0.4;
          mesh.scale.setScalar(1);
        }
      });
    }

    function aimAtPair(index: number) {
      const selected = selectPair(basePairs, index);
      if (!selected) return;
      const worldPos = selected.position.clone();
      group.localToWorld(worldPos);
      goalLook.copy(worldPos);
      goalPos.set(worldPos.x * 0.18, worldPos.y + 0.3, 7.6);
    }

    function focusPair(index: number | null) {
      selectedIndexRef.current = index ?? -1;
      if (index == null || index < 0) {
        setSelectedPair(null);
        goalPos.set(0, 0, 14);
        goalLook.set(0, 0, 0);
      } else {
        const selected = selectPair(basePairs, index);
        setSelectedPair(selected);
        aimAtPair(index);
      }
      applyHighlights();
    }

    focusRef.current = focusPair;

    function onPointerMove(e: PointerEvent) {
      updateMouse(e);
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(clickableMeshes);
      const next = hits.length > 0 ? (hits[0].object.userData.pairIndex as number) : -1;
      if (canvas) canvas.style.cursor = next >= 0 ? "pointer" : "default";
      if (next !== hoverIndexRef.current) {
        hoverIndexRef.current = next;
        applyHighlights();
      }
    }

    function onClick(e: PointerEvent) {
      updateMouse(e);
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(clickableMeshes);
      if (hits.length > 0) {
        focusPair(hits[0].object.userData.pairIndex as number);
      } else {
        focusPair(null);
      }
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
    function animate() {
      animRef.current = requestAnimationFrame(animate);
      if (group) {
        group.rotation.y += selectedIndexRef.current < 0 ? 0.004 : 0.0008;
      }
      if (selectedIndexRef.current >= 0) {
        aimAtPair(selectedIndexRef.current);
      }
      camPos.lerp(goalPos, 0.08);
      camLook.lerp(goalLook, 0.08);
      camera.position.copy(camPos);
      camera.lookAt(camLook);
      const time = performance.now() * 0.001;
      glowSprites.forEach((sprite, i) => {
        const pairIndex = Math.floor(i / 2);
        const focused = pairIndex === selectedIndexRef.current;
        const pulse = (focused ? 0.7 : 0.35) + 0.15 * Math.sin(time * 1.5 + i * 0.5);
        sprite.material.opacity = pulse;
      });
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      if (canvas) {
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("click", onClick);
      }
      window.removeEventListener("resize", resize);
      renderer.dispose();
    };
  }, []);

  const selection = selectedPair ? pairSelectionPayload(selectedPair) : null;
  const pairList = buildPairModels();

  const pickPair = (index: number) => {
    focusRef.current(index);
  };

  return (
    <div className="site-shell">
      <Link href="/" className="page-back">
        返回
      </Link>

      <div className="mb-8">
        <h1 className="page-title">DNA 双螺旋</h1>
        <p className="page-subtitle">交互式 3D 结构模型 · 点击碱基对或下方序号查看详情</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <canvas
          ref={canvasRef}
          className="min-w-0 flex-1 w-full rounded-xl border border-border bg-[#050510]"
          style={{ height: "min(65vh, 600px)", cursor: "default" }}
        />

        {selectedPair && selection && (
          <div className="details-panel">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">碱基对 #{selectedPair.pairIndex + 1}</h2>
              <button onClick={resetView} className="details-close">关闭</button>
            </div>

            <div className="base-display">
              <div className="base-circle" style={{ backgroundColor: selectedPair.color1 }}>
                {selection.base1}
              </div>
              <span className="base-equals">═</span>
              <div className="base-circle" style={{ backgroundColor: selectedPair.color2 }}>
                {selection.base2}
              </div>
            </div>

            <p className="text-sm text-foreground/70 mb-4">{selection.description}</p>

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
          <div className="details-panel hidden lg:block">
            <p className="text-sm text-foreground/50 leading-relaxed">
              点击螺旋上的碱基、中间的氢键，或使用下方序号，查看该碱基对的化学结构。
            </p>
          </div>
        )}
      </div>

      <div className="pair-index-row" role="list" aria-label="碱基对列表">
        {pairList.map((pair) => (
          <button
            key={pair.pairIndex}
            type="button"
            role="listitem"
            className={`pair-index-btn${selectedPair?.pairIndex === pair.pairIndex ? " active" : ""}`}
            onClick={() => pickPair(pair.pairIndex)}
          >
            {pair.pairIndex + 1}
            <span className="sr-only">{pair.pairType}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
