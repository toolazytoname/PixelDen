export const PIECE = 0.9;
export const GAP = 0.04;
export const STEP = PIECE + GAP;

export const FACE_COLORS: Record<string, number> = {
  right: 0xc0392b,
  left: 0xe67e22,
  top: 0xf1c40f,
  bottom: 0xecf0f1,
  front: 0x27ae60,
  back: 0x2980b9,
};

export const INNER = 0x1a1a2e;

/** Group rotation that keeps 前=绿 / 右=红 / 上=黄 with the default camera. */
export const HOME_VIEW: { rotX: number; rotY: number } = { rotX: 0, rotY: 0 };

function toCssHex(value: number) {
  return `#${value.toString(16).padStart(6, "0")}`;
}

export const FACE_HEX: Record<"R" | "L" | "U" | "D" | "F" | "B", string> = {
  R: toCssHex(FACE_COLORS.right),
  L: toCssHex(FACE_COLORS.left),
  U: toCssHex(FACE_COLORS.top),
  D: toCssHex(FACE_COLORS.bottom),
  F: toCssHex(FACE_COLORS.front),
  B: toCssHex(FACE_COLORS.back),
};

export type Axis = "x" | "y" | "z";

export interface LayerMove {
  axis: Axis;
  layer: number;
  dir: number;
}

export interface FaceSpec {
  axis: Axis;
  layer: number;
  cw: number;
  label: string;
}

export const FACE_MAP: Record<string, FaceSpec> = {
  R: { axis: "x", layer: 2, cw: -1, label: "R" },
  "R'": { axis: "x", layer: 2, cw: 1, label: "R'" },
  L: { axis: "x", layer: 0, cw: 1, label: "L" },
  "L'": { axis: "x", layer: 0, cw: -1, label: "L'" },
  U: { axis: "y", layer: 2, cw: -1, label: "U" },
  "U'": { axis: "y", layer: 2, cw: 1, label: "U'" },
  D: { axis: "y", layer: 0, cw: 1, label: "D" },
  "D'": { axis: "y", layer: 0, cw: -1, label: "D'" },
  F: { axis: "z", layer: 2, cw: -1, label: "F" },
  "F'": { axis: "z", layer: 2, cw: 1, label: "F'" },
  B: { axis: "z", layer: 0, cw: 1, label: "B" },
  "B'": { axis: "z", layer: 0, cw: -1, label: "B'" },
};

export interface LogicalCubie {
  id: number;
  homeX: number;
  homeY: number;
  homeZ: number;
  x: number;
  y: number;
  z: number;
}

export function createSolvedCubies(): LogicalCubie[] {
  const cubies: LogicalCubie[] = [];
  let id = 0;
  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      for (let z = 0; z < 3; z++) {
        cubies.push({ id: id++, homeX: x, homeY: y, homeZ: z, x, y, z });
      }
    }
  }
  return cubies;
}

export function worldPosFromGrid(x: number, y: number, z: number) {
  return {
    x: (x - 1) * STEP,
    y: (y - 1) * STEP,
    z: (z - 1) * STEP,
  };
}

export function rotateGridCoord(
  x: number,
  y: number,
  z: number,
  axis: Axis,
  dir: number,
): { x: number; y: number; z: number } {
  const cx = x - 1;
  const cy = y - 1;
  const cz = z - 1;
  const s = dir;
  let nx = cx;
  let ny = cy;
  let nz = cz;
  if (axis === "x") {
    ny = -s * cz;
    nz = s * cy;
  } else if (axis === "y") {
    nx = s * cz;
    nz = -s * cx;
  } else {
    nx = -s * cy;
    ny = s * cx;
  }
  return { x: nx + 1, y: ny + 1, z: nz + 1 };
}

export function onLayer(cubie: LogicalCubie, axis: Axis, layer: number): boolean {
  const coord = axis === "x" ? cubie.x : axis === "y" ? cubie.y : cubie.z;
  return coord === layer;
}

export function rotateLayer(cubies: LogicalCubie[], move: LayerMove): LogicalCubie[] {
  return cubies.map((cubie) => {
    if (!onLayer(cubie, move.axis, move.layer)) return cubie;
    const next = rotateGridCoord(cubie.x, cubie.y, cubie.z, move.axis, move.dir);
    return { ...cubie, ...next };
  });
}

export function applyMoves(cubies: LogicalCubie[], moves: LayerMove[]): LogicalCubie[] {
  return moves.reduce((state, move) => rotateLayer(state, move), cubies);
}

export function isSolved(cubies: LogicalCubie[]): boolean {
  return cubies.every(
    (cubie) => cubie.x === cubie.homeX && cubie.y === cubie.homeY && cubie.z === cubie.homeZ,
  );
}

export function recordMove(history: LayerMove[], move: LayerMove): LayerMove[] {
  return [...history, move];
}

export function invertMove(move: LayerMove): LayerMove {
  return { axis: move.axis, layer: move.layer, dir: -move.dir };
}

export function invertHistory(history: LayerMove[]): LayerMove[] {
  return [...history].reverse().map(invertMove);
}

export function generateScramble(count = 20, random: () => number = Math.random): LayerMove[] {
  const axes: Axis[] = ["x", "y", "z"];
  const layers = [0, 1, 2];
  const dirs = [-1, 1] as const;
  const moves: LayerMove[] = [];
  for (let i = 0; i < count; i++) {
    moves.push({
      axis: axes[Math.floor(random() * axes.length)],
      layer: layers[Math.floor(random() * layers.length)],
      dir: dirs[Math.floor(random() * dirs.length)],
    });
  }
  return moves;
}

export function solveFromHistory(history: LayerMove[]): LayerMove[] {
  return invertHistory(history);
}

export type FaceNormal = { axis: Axis; sign: 1 | -1 };

export function faceIndexToNormal(faceIndex: number): FaceNormal {
  switch (Math.floor(faceIndex / 2)) {
    case 0:
      return { axis: "x", sign: 1 };
    case 1:
      return { axis: "x", sign: -1 };
    case 2:
      return { axis: "y", sign: 1 };
    case 3:
      return { axis: "y", sign: -1 };
    case 4:
      return { axis: "z", sign: 1 };
    default:
      return { axis: "z", sign: -1 };
  }
}

function axisValue(v: { x: number; y: number; z: number }, axis: Axis): number {
  return v[axis];
}

function crossUnit(a: Axis, b: Axis): { axis: Axis; sign: number } {
  const order: Axis[] = ["x", "y", "z"];
  if (a === b) return { axis: a, sign: 0 };
  const i = order.indexOf(a);
  const j = order.indexOf(b);
  const even = (i + 1) % 3 === j;
  return { axis: order[3 - i - j], sign: even ? 1 : -1 };
}

export function inferLayerTurn(
  grid: { x: number; y: number; z: number },
  face: FaceNormal,
  drag: { x: number; y: number; z: number },
): LayerMove | null {
  const tangents = (["x", "y", "z"] as Axis[]).filter((axis) => axis !== face.axis);
  const d0 = axisValue(drag, tangents[0]);
  const d1 = axisValue(drag, tangents[1]);
  if (Math.abs(d0) < 1e-6 && Math.abs(d1) < 1e-6) return null;

  const dragAxis = Math.abs(d0) >= Math.abs(d1) ? tangents[0] : tangents[1];
  const dragSign = Math.sign(axisValue(drag, dragAxis)) || 1;
  const rotAxis = tangents.find((axis) => axis !== dragAxis)!;
  const crossed = crossUnit(rotAxis, face.axis);
  const motion = face.sign * crossed.sign;
  const dir = motion === dragSign ? 1 : -1;
  const layer = Math.round(axisValue(grid, rotAxis));
  if (layer < 0 || layer > 2) return null;
  return { axis: rotAxis, layer, dir };
}

export function gridFromWorld(x: number, y: number, z: number) {
  return {
    x: Math.round(x / STEP) + 1,
    y: Math.round(y / STEP) + 1,
    z: Math.round(z / STEP) + 1,
  };
}

export function faceNormalVector(face: FaceNormal): { x: number; y: number; z: number } {
  return {
    x: face.axis === "x" ? face.sign : 0,
    y: face.axis === "y" ? face.sign : 0,
    z: face.axis === "z" ? face.sign : 0,
  };
}

export function dominantFaceNormal(x: number, y: number, z: number): FaceNormal {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const az = Math.abs(z);
  if (ax >= ay && ax >= az) return { axis: "x", sign: x >= 0 ? 1 : -1 };
  if (ay >= az) return { axis: "y", sign: y >= 0 ? 1 : -1 };
  return { axis: "z", sign: z >= 0 ? 1 : -1 };
}
