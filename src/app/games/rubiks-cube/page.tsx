"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import * as THREE from "three";
import {
  FACE_COLORS,
  FACE_HEX,
  FACE_MAP,
  HOME_VIEW,
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

  const state = useRef({
    cubies: [] as THREE.Mesh[],
    group: null as THREE.Group | null,
    camera: null as THREE.PerspectiveCamera | null,
    renderer: null as THREE.WebGLRenderer | null,
    scene: null as THREE.Scene | null,
    dragging: false,
    rotX: HOME_VIEW.rotX,
    rotY: HOME_VIEW.rotY,
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
    const surface = canvas;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: surface, antialias: true, preserveDrawingBuffer: true });
    } catch {
      surface.dataset.gl = "fail";
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    state.current.renderer = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x12121a);
    state.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(5.1, 4.5, 6.1);
    camera.lookAt(0, 0.5, 0);
    state.current.camera = camera;

    scene.add(new THREE.AmbientLight(0x2c2c3c, 0.9));
    const dl = new THREE.DirectionalLight(0xffffff, 2.2);
    dl.position.set(5, 9, 6);
    dl.castShadow = true;
    dl.shadow.mapSize.set(1024, 1024);
    scene.add(dl);
    const lamp = new THREE.PointLight(0xff5c2a, 0.5, 24);
    lamp.position.set(-6, 4, -2);
    scene.add(lamp);
    const fill = new THREE.PointLight(0x8a93b0, 0.22, 18);
    fill.position.set(2, -1, 6);
    scene.add(fill);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, 48),
      new THREE.ShadowMaterial({ opacity: 0.38 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.35;
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
      const rect = surface.getBoundingClientRect();
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
      if (e.target !== surface) return;

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
          surface.style.cursor = "grabbing";
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
          surface.style.cursor = "pointer";
          state.current.hoveredCubie = idx;
          return;
        }
      }
      state.current.hoveredCubie = -1;
      surface.style.cursor = "grab";
    }

    function onPointerUp(e: PointerEvent) {
      if (e.target !== surface) return;
      state.current.dragging = false;
      drag.mode = "none";
      drag.mesh = null;
      surface.style.cursor = "grab";
    }

    function onPointerLeave() {
      // Pointer left the canvas — stop dragging
      state.current.dragging = false;
    }

    surface.addEventListener("pointerdown", onPointerDown);
    surface.addEventListener("pointermove", onPointerMove);
    surface.addEventListener("pointerup", onPointerUp);
    surface.addEventListener("pointerleave", onPointerLeave);

    // ─── Resize ─────────────────────────────────────────────────
    function resize() {
      const w = surface.clientWidth;
      const h = surface.clientHeight;
      if (w < 2 || h < 2) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(surface);
    window.addEventListener("resize", resize);

    // ─── Render loop ────────────────────────────────────────────
    function animate() {
      rafRef.current = requestAnimationFrame(animate);
      try {
        if (group) {
          group.rotation.x = state.current.rotX;
          group.rotation.y = state.current.rotY;
        }
        renderer.render(scene, camera);
      } catch {
        cancelAnimationFrame(rafRef.current);
      }
    }
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      surface.removeEventListener("pointerdown", onPointerDown);
      surface.removeEventListener("pointermove", onPointerMove);
      surface.removeEventListener("pointerup", onPointerUp);
      surface.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", resize);
      ro.disconnect();
      resetAllHighlights();
      renderer.dispose();
    };
  }, []);

  // ─── Scramble ─────────────────────────────────────────────────
  const scramble = useCallback(() => {
    const moves = generateScramble(20);
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

  const faces = [
    { face: "U" as const, label: "上", moves: ["U", "U'"] },
    { face: "L" as const, label: "左", moves: ["L", "L'"] },
    { face: "F" as const, label: "前", moves: ["F", "F'"] },
    { face: "R" as const, label: "右", moves: ["R", "R'"] },
    { face: "B" as const, label: "后", moves: ["B", "B'"] },
    { face: "D" as const, label: "下", moves: ["D", "D'"] },
  ];

  return (
    <div className="cube-page">
      <div className="cube-stage">
        <canvas ref={canvasRef} className="cube-canvas" />
        <div className="cube-vignette" aria-hidden="true" />
        <p className="cube-fallback">这个魔方需要 WebGL</p>

        <header className="cube-bar">
          <div className="cube-bar-copy">
            <Link href="/" className="cube-back">
              返回
            </Link>
            <h1 className="cube-title">魔方</h1>
            <p className="cube-lede">色块上滑动转一层，空白处拖动转视角</p>
          </div>
          <p className="cube-steps">
            <span className="cube-steps-count">{moveCount}</span>
            <span className="cube-steps-meta">
              步{scrambled ? " · 已打乱" : ""}
            </span>
          </p>
        </header>

        <div className="cube-hud">
        <div className="cube-tools">
          <button
            type="button"
            onClick={scramble}
            disabled={isAnimating}
            className="cube-tool cube-tool-accent"
          >
            {scrambled ? "重新打乱" : "打乱"}
          </button>
          <button
            type="button"
            onClick={solve}
            disabled={isAnimating || !scrambled}
            className="cube-tool"
          >
            复原
          </button>
          <button
            type="button"
            onClick={() => {
              state.current.rotX = HOME_VIEW.rotX;
              state.current.rotY = HOME_VIEW.rotY;
            }}
            disabled={isAnimating}
            className="cube-tool"
          >
            重置视角
          </button>
          <p className="cube-hint">键盘 R L U D F B，Shift 反向</p>
        </div>

        <div className="cube-net" role="group" aria-label="按面转动">
          {faces.map(({ face, label, moves }) => (
            <div
              key={face}
              className="cube-cell"
              data-face={face}
              style={{ ["--cell" as string]: FACE_HEX[face] }}
            >
              <span className="cube-cell-name">
                {label}
                <span className="cube-cell-key">{face}</span>
              </span>
              <span className="cube-cell-turns">
                <button
                  type="button"
                  onClick={() => executeMove(moves[0])}
                  disabled={isAnimating}
                  className="cube-turn"
                  aria-label={`${label}面顺时针`}
                >
                  顺
                </button>
                <button
                  type="button"
                  onClick={() => executeMove(moves[1])}
                  disabled={isAnimating}
                  className="cube-turn"
                  aria-label={`${label}面逆时针`}
                >
                  逆
                </button>
              </span>
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}
