"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import * as THREE from "three";
import {
  FACE_COLORS,
  FACE_MAP,
  dominantFaceNormal,
  faceIndexToNormal,
  faceNormalVector,
  generateScramble,
  gridFromWorld,
  inferLayerTurn,
  INNER,
  PIECE,
  recordMove,
  solveFromHistory,
  STEP,
  type LayerMove,
} from "@/lib/cube";

// ─── Helpers ─────────────────────────────────────────────────────────
function cubieMaterials(gx: number, gy: number, gz: number): THREE.Material[] {
  return [
    gx === 2 ? new THREE.MeshStandardMaterial({ color: FACE_COLORS.right, roughness: 0.45, metalness: 0.05 }) : new THREE.MeshStandardMaterial({ color: INNER, roughness: 0.8 }),
    gx === 0 ? new THREE.MeshStandardMaterial({ color: FACE_COLORS.left, roughness: 0.45, metalness: 0.05 }) : new THREE.MeshStandardMaterial({ color: INNER, roughness: 0.8 }),
    gy === 2 ? new THREE.MeshStandardMaterial({ color: FACE_COLORS.top, roughness: 0.45, metalness: 0.05 }) : new THREE.MeshStandardMaterial({ color: INNER, roughness: 0.8 }),
    gy === 0 ? new THREE.MeshStandardMaterial({ color: FACE_COLORS.bottom, roughness: 0.45, metalness: 0.05 }) : new THREE.MeshStandardMaterial({ color: INNER, roughness: 0.8 }),
    gz === 2 ? new THREE.MeshStandardMaterial({ color: FACE_COLORS.front, roughness: 0.45, metalness: 0.05 }) : new THREE.MeshStandardMaterial({ color: INNER, roughness: 0.8 }),
    gz === 0 ? new THREE.MeshStandardMaterial({ color: FACE_COLORS.back, roughness: 0.45, metalness: 0.05 }) : new THREE.MeshStandardMaterial({ color: INNER, roughness: 0.8 }),
  ];
}

// ─── Component ───────────────────────────────────────────────────────
export default function RubiksCube() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [scrambled, setScrambled] = useState(false);
  const [selectedCubie, setSelectedCubie] = useState<number>(-1);

  const state = useRef({
    cubies: [] as THREE.Mesh[],
    group: null as THREE.Group | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    scene: null as THREE.Scene | null,
    dragging: false,
    rotX: 0.6,
    rotY: -0.8,
    lastPointer: { x: 0, y: 0 },
    animQueue: [] as { axis: string; layer: number; dir: number; onComplete?: () => void }[],
    isAnimating: false,
    pointerDown: { x: 0, y: 0 },
    moveHistory: [] as LayerMove[],
    hoveredCubie: -1,
    lastInteraction: 0,
  });

  const rafRef = useRef(0);

  function executeRotation(
    axis: string,
    layer: number,
    dir: number,
    onComplete?: () => void,
  ) {
    const s = state.current;
    if (!s.group || !s.cubies.length) {
      s.isAnimating = false;
      setIsAnimating(false);
      onComplete?.();
      return;
    }

    const targetVal = (layer - 1) * STEP;
    const axisVec = axis === 'x' ? 'x' : axis === 'y' ? 'y' : 'z';
    const layerCubies = s.cubies.filter(
      (c) => Math.abs(c.position[axisVec as 'x' | 'y' | 'z'] - targetVal) < 0.1,
    );

    const pivot = new THREE.Group();
    s.group!.add(pivot);
    layerCubies.forEach((c) => pivot.attach(c));

    const angle = dir * (Math.PI / 2);
    const duration = 250;
    const startTime = performance.now();

    function animateStep(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);

      if (axis === "x") pivot.rotation.x = angle * ease;
      else if (axis === "y") pivot.rotation.y = angle * ease;
      else pivot.rotation.z = angle * ease;

      if (t < 1) {
        requestAnimationFrame(animateStep);
      } else {
        if (axis === "x") pivot.rotation.x = angle;
        else if (axis === "y") pivot.rotation.y = angle;
        else pivot.rotation.z = angle;

        pivot.updateMatrixWorld(true);
        layerCubies.forEach((c) => {
          s.group!.attach(c);
          c.position.x = Math.round(c.position.x / STEP) * STEP;
          c.position.y = Math.round(c.position.y / STEP) * STEP;
          c.position.z = Math.round(c.position.z / STEP) * STEP;
          c.rotation.x = Math.round(c.rotation.x / (Math.PI / 2)) * (Math.PI / 2);
          c.rotation.y = Math.round(c.rotation.y / (Math.PI / 2)) * (Math.PI / 2);
          c.rotation.z = Math.round(c.rotation.z / (Math.PI / 2)) * (Math.PI / 2);
          c.updateMatrixWorld(true);
        });

        s.group!.remove(pivot);
        s.isAnimating = false;
        setIsAnimating(false);
        onComplete?.();

        if (s.animQueue.length > 0) {
          const next = s.animQueue.shift()!;
          s.isAnimating = true;
          setIsAnimating(true);
          executeRotation(next.axis, next.layer, next.dir, next.onComplete);
        }
      }
    }

    requestAnimationFrame(animateStep);
  }

  const queueRotation = useCallback(
    (axis: string, layer: number, dir: number, onComplete?: () => void, record = true) => {
      const s = state.current;
      if (record) {
        s.moveHistory = recordMove(s.moveHistory, { axis: axis as LayerMove["axis"], layer, dir });
      }
      if (s.isAnimating) {
        s.animQueue.push({ axis, layer, dir, onComplete });
        return;
      }
      s.isAnimating = true;
      setIsAnimating(true);
      executeRotation(axis, layer, dir, onComplete);
    },
    // executeRotation is a function declaration in this component and only reads refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ─── Execute a named move ───────────────────────────────────────
  const executeMove = useCallback(
    (notation: string) => {
      const face = FACE_MAP[notation];
      if (!face) return;
      setMoveCount((c) => c + 1);
      queueRotation(face.axis, face.layer, face.cw);
    },
    [queueRotation],
  );

  const applyUserTurn = useRef<(move: LayerMove) => void>(() => {});
  useEffect(() => {
    applyUserTurn.current = (move: LayerMove) => {
      setMoveCount((count) => count + 1);
      setScrambled(true);
      queueRotation(move.axis, move.layer, move.dir);
    };
  }, [queueRotation]);

  // ─── Effect: setup scene ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    state.current.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a14);
    state.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(5, 4, 6);
    camera.lookAt(0, 0, 0);
    state.current.camera = camera;

    // Lights
    scene.add(new THREE.AmbientLight(0x404060, 1.0));
    const dl = new THREE.DirectionalLight(0xffffff, 2.5);
    dl.position.set(6, 10, 8);
    dl.castShadow = true;
    dl.shadow.mapSize.set(1024, 1024);
    scene.add(dl);
    const fl = new THREE.PointLight(0x6366f1, 1, 20);
    fl.position.set(-5, 3, -3);
    scene.add(fl);

    // Ground shadow
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.ShadowMaterial({ opacity: 0.25 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Build cubies
    const cubies: THREE.Mesh[] = [];
    const roundGeo = new THREE.BoxGeometry(PIECE, PIECE, PIECE, 2, 2, 2);
    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
          const mesh = new THREE.Mesh(roundGeo, cubieMaterials(x, y, z));
          mesh.position.set((x - 1) * STEP, (y - 1) * STEP, (z - 1) * STEP);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData.cubieIndex = cubies.length;
          cubies.push(mesh);
          scene.add(mesh);
        }
      }
    }
    state.current.cubies = cubies;

    const group = new THREE.Group();
    cubies.forEach((c) => group.add(c));
    scene.add(group);
    state.current.group = group;

    // ─── Interaction: raycaster ───────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    function updateNDC(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function highlightCubie(idx: number, color: number, intensity: number) {
      if (idx < 0 || idx >= cubies.length) return;
      const mesh = cubies[idx];
      const mats = mesh.material as THREE.Material[];
      if (!mats) return;
      mats.forEach((m) => {
        if (m instanceof THREE.MeshStandardMaterial) {
          m.emissive.setHex(color);
          m.emissiveIntensity = intensity;
        }
      });
    }

    function resetHighlight(idx: number) {
      if (idx < 0 || idx >= cubies.length) return;
      const mesh = cubies[idx];
      const mats = mesh.material as THREE.Material[];
      if (!mats) return;
      mats.forEach((m) => {
        if (m instanceof THREE.MeshStandardMaterial) {
          m.emissive.setHex(0x000000);
          m.emissiveIntensity = 0;
        }
      });
    }

    function resetAllHighlights() {
      cubies.forEach((_, i) => resetHighlight(i));
    }

    type DragMode = "none" | "pending" | "orbit" | "turn";
    const drag = {
      mode: "none" as DragMode,
      faceIndex: -1,
      mesh: null as THREE.Mesh | null,
    };

    function localDrag(dx: number, dy: number) {
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
      const world = right.multiplyScalar(dx).add(up.multiplyScalar(-dy));
      world.applyQuaternion(group.quaternion.clone().invert());
      return world;
    }

    function onPointerDown(e: PointerEvent) {
      state.current.lastPointer = { x: e.clientX, y: e.clientY };
      state.current.pointerDown = { x: e.clientX, y: e.clientY };
      state.current.dragging = true;
      updateNDC(e);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(cubies);
      if (hits.length > 0 && typeof hits[0].faceIndex === "number") {
        drag.mode = "pending";
        drag.faceIndex = hits[0].faceIndex;
        drag.mesh = hits[0].object as THREE.Mesh;
      } else {
        drag.mode = "orbit";
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (e.target !== canvas) return;

      if (state.current.dragging) {
        const totalX = e.clientX - state.current.pointerDown.x;
        const totalY = e.clientY - state.current.pointerDown.y;
        const dist = Math.hypot(totalX, totalY);

        if (drag.mode === "pending" && dist > 12 && drag.mesh) {
          const grid = gridFromWorld(drag.mesh.position.x, drag.mesh.position.y, drag.mesh.position.z);
          const local = faceNormalVector(faceIndexToNormal(drag.faceIndex));
          const worldN = new THREE.Vector3(local.x, local.y, local.z).applyQuaternion(drag.mesh.quaternion);
          const face = dominantFaceNormal(worldN.x, worldN.y, worldN.z);
          const move = inferLayerTurn(grid, face, localDrag(totalX, totalY));
          if (move && !state.current.isAnimating) {
            applyUserTurn.current(move);
            drag.mode = "turn";
          } else {
            drag.mode = "orbit";
          }
        }

        if (drag.mode === "orbit") {
          const ddx = e.clientX - state.current.lastPointer.x;
          const ddy = e.clientY - state.current.lastPointer.y;
          state.current.rotY += ddx * 0.005;
          state.current.rotX += ddy * 0.005;
          state.current.rotX = Math.round(state.current.rotX * 1000) / 1000;
          state.current.rotY = Math.round(state.current.rotY * 1000) / 1000;
          canvas!.style.cursor = "grabbing";
        }

        state.current.lastPointer = { x: e.clientX, y: e.clientY };
        return;
      }

      updateNDC(e);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(cubies);
      const prevHover = state.current.hoveredCubie;
      resetHighlight(prevHover);

      if (hits.length > 0) {
        const hit = hits[0].object as THREE.Mesh;
        const idx = hit.userData.cubieIndex as number;
        if (idx >= 0) {
          highlightCubie(idx, 0x444466, 0.3);
          canvas!.style.cursor = "pointer";
          state.current.hoveredCubie = idx;
          return;
        }
      }
      state.current.hoveredCubie = -1;
      canvas!.style.cursor = "grab";
    }

    function onPointerUp(e: PointerEvent) {
      if (e.target !== canvas) return;

      const dx = e.clientX - state.current.pointerDown.x;
      const dy = e.clientY - state.current.pointerDown.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const wasPending = drag.mode === "pending";

      state.current.dragging = false;
      drag.mode = "none";
      drag.mesh = null;

      if (wasPending && dist <= 12) {
        if (state.current.hoveredCubie >= 0) {
          setSelectedCubie(state.current.hoveredCubie);
          highlightCubie(state.current.hoveredCubie, 0xff5c2a, 0.6);
        } else {
          setSelectedCubie(-1);
        }
      }

      canvas!.style.cursor = "grab";
    }

    function onPointerLeave() {
      // Pointer left the canvas — stop dragging
      state.current.dragging = false;
    }

    if (canvas) {
      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerup", onPointerUp);
      canvas.addEventListener("pointerleave", onPointerLeave);
    }

    // ─── Resize ─────────────────────────────────────────────────
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

    // ─── Render loop ────────────────────────────────────────────
    function animate() {
      rafRef.current = requestAnimationFrame(animate);

      if (group) {
        group.rotation.x = state.current.rotX;
        group.rotation.y = state.current.rotY;
      }
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (canvas) {
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointerleave", onPointerLeave);
      }
      window.removeEventListener("resize", resize);
      resetAllHighlights();
      renderer.dispose();
    };
  }, []);

  // ─── Scramble ─────────────────────────────────────────────────
  const scramble = useCallback(() => {
    const moves = generateScramble(20);

    setSelectedCubie(-1);
    setMoveCount(0);
    setScrambled(true);

    let i = 0;
    function execNext() {
      if (i >= moves.length) return;
      const m = moves[i];
      i++;
      queueRotation(m.axis, m.layer, m.dir, execNext);
    }
    execNext();
  }, [queueRotation]);

  // ─── Solve (undo moves) ──────────────────────────────────────
  const solve = useCallback(() => {
    const s = state.current;
    const undo = solveFromHistory(s.moveHistory);
    s.moveHistory = [];

    setSelectedCubie(-1);
    setMoveCount(0);
    setScrambled(false);

    let i = 0;
    function execNext() {
      if (i >= undo.length) return;
      const move = undo[i];
      i++;
      queueRotation(move.axis, move.layer, move.dir, execNext, false);
    }
    execNext();
  }, [queueRotation]);

  // ─── Keyboard ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isAnimating) return;
      const key = e.key.toLowerCase();

      // Shift + letter = prime (counter-clockwise)
      if (e.shiftKey && key.length === 1) {
        const primeMap: Record<string, string> = {
          r: "R'", l: "L'", u: "U'", d: "D'", f: "F'", b: "B'",
        };
        const notation = primeMap[key];
        if (notation) {
          executeMove(notation);
          return;
        }
      }

      // Normal key = clockwise
      const cwMap: Record<string, string> = {
        r: "R", l: "L", u: "U", d: "D", f: "F", b: "B",
      };
      const notation = cwMap[key];
      if (notation) {
        executeMove(notation);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isAnimating, executeMove]);

  // ─── Build face buttons ─────────────────────────────────────
  // Group moves by face
  const faceGroups = [
    { face: "R", label: "右", moves: ["R", "R'"] },
    { face: "L", label: "左", moves: ["L", "L'"] },
    { face: "U", label: "上", moves: ["U", "U'"] },
    { face: "D", label: "下", moves: ["D", "D'"] },
    { face: "F", label: "前", moves: ["F", "F'"] },
    { face: "B", label: "后", moves: ["B", "B'"] },
  ];

  // SVG arrow icons for CW/CCW
  const ArrowCW = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10" />
      <path d="M12 12l6-6v6" />
    </svg>
  );
  const ArrowCCW = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 1-10 10" />
      <path d="M12 12l-6-6v6" />
    </svg>
  );

  return (
    <div className="mx-auto max-w-[900px]">
      <Link href="/" className="page-back">
        ← 返回首页
      </Link>

      <div className="mb-8">
        <h1 className="page-title">3D 魔方</h1>
        <p className="page-subtitle">
          在方块上滑动转一层 · 空白处拖动转视角
        </p>
        <p className="text-xs text-foreground/30 font-mono">
          {scrambled ? "已打乱 · " : ""}
          步数: {moveCount}
          {selectedCubie >= 0 && ` · 已选方块 #${selectedCubie + 1}`}
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full rounded-xl border border-border bg-[#0a0a14]"
          style={{ height: "min(55vh, 500px)", cursor: "grab" }}
        />

        {/* Controls */}
        <div className="w-full max-w-2xl">
          {/* Face rotation grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
            {faceGroups.map(({ face, label, moves }) => {
              const kbd = face;
              return (
                <div key={face} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
                    {label}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => executeMove(moves[0])}
                      disabled={isAnimating}
                      className="ctrl-btn group relative"
                      title={moves[0]}
                    >
                      {ArrowCW}
                      <span className="kbd-hint">{kbd}</span>
                    </button>
                    <button
                      onClick={() => executeMove(moves[1])}
                      disabled={isAnimating}
                      className="ctrl-btn group relative"
                      title={moves[1]}
                    >
                      {ArrowCCW}
                      <span className="kbd-hint kbd-hint-sm">{`${kbd}'`}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Keyboard shortcut legend */}
          <div className="text-center mb-2">
            <span className="text-[11px] text-foreground/30">
              键盘: <kbd className="kbd-hint inline">R</kbd> <kbd className="kbd-hint inline">L</kbd> <kbd className="kbd-hint inline">U</kbd> <kbd className="kbd-hint inline">D</kbd> <kbd className="kbd-hint inline">F</kbd> <kbd className="kbd-hint inline">B</kbd> 旋转 · <kbd className="kbd-hint inline">Shift</kbd>+键 反向
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={scramble}
              disabled={isAnimating}
              className="action-btn action-btn-accent"
            >
              {scrambled ? "重新打乱" : "打乱"}
            </button>
            <button
              onClick={solve}
              disabled={isAnimating || !scrambled}
              className="action-btn action-btn-green"
            >
              复原
            </button>
            <button
              onClick={() => {
                setSelectedCubie(-1);
                state.current.rotX = 0.6;
                state.current.rotY = -0.8;
              }}
              disabled={isAnimating}
              className="action-btn"
            >
              重置视角
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
