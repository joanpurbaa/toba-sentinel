import * as React from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";
import { Maximize, Minimize, Package, X } from "lucide-react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useFullscreen } from "@/hooks/useFullscreen";

type RackId = "leftRack" | "middleRack" | "rightRack" | "right2Rack";
type StockStatus = "AMAN" | "MENIPIS" | "KRITIS";

interface WarehouseItem {
  id: string;
  batchId: string;
  itemName: string;
  stock: number;
  status: StockStatus;
  category: string;
  description: string;
  rackIndex: number;
  slotIndex: number;
  position: [number, number, number];
  boxSize?: [number, number, number];
  expiryDate: string;
}

interface RackLayout {
  id: RackId;
  center: [number, number, number];
  origin: [number, number, number];
  spacing: [number, number, number]; // [width, height, depth] per slot
  width: number;
  height: number;
  depth: number;
}

interface ShelfBatchPayload {
  batchId: string;
  itemId: string;
  itemName: string;
  category: string;
  description: string | null;
  quantityRemaining: number;
  expiryDate: string;
  receivedAt: string;
  status: StockStatus;
}

const SHELF_LAYOUT_CONFIG = {
  rows: 4,          
  columns: 5,       
  levels: 5,        
  rackPaddingRatio: 0.10, 
  yPaddingRatio: 0.06,    
  depthForwardRatio: 0.40,
  yOffsetRatio: -0.25,    
};

const BOX_DIMENSION_RATIOS = {
  widthRatio: 0.82,
  heightRatio: 0.50,   
  depthRatio: 0.60,   
};

const SELECTED_SCALE_BOOST = 1.12;

const CAMERA_CONFIG = {
  focusOffsetXFactor: 0.6,
  focusOffsetYFactor: 1.5,
  focusOffsetZFactor: 4.0,
};

const LERP_FACTOR = 0.06;
const ANIMATION_THRESHOLD = 0.1;
const MAX_ANIMATION_FRAMES = 240;

const RACK_NODE_NAMES = ["LeftRack", "MIddleRack", "RightRack", "Right2Rack"];

const MAX_INSTANCE_CAPACITY =
  RACK_NODE_NAMES.length *
  SHELF_LAYOUT_CONFIG.rows *
  SHELF_LAYOUT_CONFIG.columns *
  SHELF_LAYOUT_CONFIG.levels;

// ── helpers ──────────────────────────────────────────
function getItemColor(status: StockStatus): string {
  if (status === "KRITIS") return "#ef4444";
  if (status === "MENIPIS") return "#f59e0b";
  return "#22c55e";
}

function buildRacksFromNodes(scene: THREE.Object3D): RackLayout[] {
  const racks: RackLayout[] = [];

  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (!RACK_NODE_NAMES.includes(child.name)) return;

    const box = new THREE.Box3().setFromObject(child);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // ◄── UBAH BAGIAN INI ──►
    const pad = Math.min(size.x, size.y, size.z) * SHELF_LAYOUT_CONFIG.rackPaddingRatio;
    const padY = size.y * SHELF_LAYOUT_CONFIG.yPaddingRatio; // Hitung padding Y secara independen

    const width = Math.max(size.x - pad * 2, 1);
    const height = Math.max(size.y - padY * 2, 1); // Gunakan padY di sini
    const depth = Math.max(size.z - pad * 2, 1);

    const slotWidth = width / SHELF_LAYOUT_CONFIG.columns;
    const slotHeight = height / SHELF_LAYOUT_CONFIG.levels;
    const slotDepth = depth / SHELF_LAYOUT_CONFIG.rows;

    const origin: [number, number, number] = [
      box.min.x + pad + slotWidth / 2,
      box.min.y + padY + slotHeight / 2, // Gunakan padY di sini
      box.min.z + pad + slotDepth / 2,
    ];
    // ◄──────────────────────►

    racks.push({
      id: child.name as RackId,
      center: [center.x, center.y, center.z],
      origin,
      spacing: [slotWidth, slotHeight, slotDepth],
      width,
      height,
      depth,
    });
  });

  racks.sort((a, b) => RACK_NODE_NAMES.indexOf(a.id) - RACK_NODE_NAMES.indexOf(b.id));
  return racks;
}

function getSlotPosition(rack: RackLayout, slotIndex: number): [number, number, number] {
  const totalSlotsPerLevel = SHELF_LAYOUT_CONFIG.rows * SHELF_LAYOUT_CONFIG.columns;
  const level = Math.floor(slotIndex / totalSlotsPerLevel);
  const remainder = slotIndex % totalSlotsPerLevel;
  const row = Math.floor(remainder / SHELF_LAYOUT_CONFIG.columns);
  const column = remainder % SHELF_LAYOUT_CONFIG.columns;

  const position: [number, number, number] = [
    rack.origin[0] + column * rack.spacing[0], // x → width
    rack.origin[1] + level * rack.spacing[1],  // y → height
    rack.origin[2] + row * rack.spacing[2],    // z → depth
  ];

  // dorong ke depan & sedikit naik agar kotak terlihat di tengah slot
  position[2] += rack.spacing[2] * SHELF_LAYOUT_CONFIG.depthForwardRatio;
  position[1] += rack.spacing[1] * SHELF_LAYOUT_CONFIG.yOffsetRatio;

  return position;
}

function buildWarehouseItems(
  batches: ShelfBatchPayload[],
  racks: RackLayout[],
): WarehouseItem[] {
  const slotsPerRack =
    SHELF_LAYOUT_CONFIG.rows *
    SHELF_LAYOUT_CONFIG.columns *
    SHELF_LAYOUT_CONFIG.levels;

  const slotPool = racks.flatMap((_, rackIndex) =>
    Array.from({ length: slotsPerRack }, (_, slotIndex) => ({ rackIndex, slotIndex })),
  );

  const sortedBatches = [...batches].sort(
    (a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime(),
  );

  const expandedUnits = sortedBatches.flatMap((batch) =>
    Array.from({ length: batch.quantityRemaining }, (_, unitIndex) => ({
      batch,
      unitIndex,
    })),
  );

  const cappedUnits = expandedUnits.slice(0, slotPool.length);

  return cappedUnits.map(({ batch, unitIndex }, index) => {
    const slot = slotPool[index];
    const rack = racks[slot.rackIndex];
    const pos = getSlotPosition(rack, slot.slotIndex);

    // perbaikan: gunakan spacing[1] untuk tinggi, spacing[2] untuk kedalaman
    const boxWidth = rack.spacing[0] * BOX_DIMENSION_RATIOS.widthRatio;   // x
    const boxHeight = rack.spacing[1] * BOX_DIMENSION_RATIOS.heightRatio; // y ← tadi salah indeks
    const boxDepth = rack.spacing[2] * BOX_DIMENSION_RATIOS.depthRatio;   // z ← tadi salah indeks

    return {
      id: `${batch.batchId}-${unitIndex}`,
      batchId: batch.batchId,
      itemName: batch.itemName,
      stock: batch.quantityRemaining,
      status: batch.status,
      category: batch.category,
      description: batch.description ?? "Tidak ada deskripsi",
      rackIndex: slot.rackIndex,
      slotIndex: slot.slotIndex,
      position: pos,
      boxSize: [boxWidth, boxHeight, boxDepth],
      expiryDate: batch.expiryDate,
    };
  });
}

async function loadWarehouseBatches(): Promise<ShelfBatchPayload[]> {
  const response = await fetch("/api/warehouse", { cache: "no-store" });
  if (!response.ok) throw new Error("Gagal mengambil data warehouse");
  const payload = (await response.json()) as ShelfBatchPayload[];
  return payload.sort(
    (a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime(),
  );
}

function getBoxFocusCamera(
  boxPosition: THREE.Vector3,
  boxSize: [number, number, number],
): { camera: [number, number, number]; target: [number, number, number] } {
  const [w, h, d] = boxSize;
  const target: [number, number, number] = [boxPosition.x, boxPosition.y, boxPosition.z];
  const camera: [number, number, number] = [
    boxPosition.x + w * CAMERA_CONFIG.focusOffsetXFactor,
    boxPosition.y + h * CAMERA_CONFIG.focusOffsetYFactor,
    boxPosition.z + d * CAMERA_CONFIG.focusOffsetZFactor,
  ];
  return { camera, target };
}

// ── Camera Controller ────────────────────────────────
function CameraController({
  selectedId,
  controlsRef,
  items,
  racks,
  overviewCamera,
  overviewTarget,
}: {
  selectedId: string | null;
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  items: WarehouseItem[];
  racks: RackLayout[];
  overviewCamera: [number, number, number];
  overviewTarget: [number, number, number];
}) {
  const isAnimating = React.useRef(false);
  const frameCount = React.useRef(0);
  const targetCameraPos = React.useRef(new THREE.Vector3());
  const targetLookAt = React.useRef(new THREE.Vector3());

  React.useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const stop = () => {
      isAnimating.current = false;
      frameCount.current = 0;
    };
    controls.addEventListener("start", stop);
    return () => controls.removeEventListener("start", stop);
  }, [controlsRef]);

  React.useEffect(() => {
    isAnimating.current = true;
    frameCount.current = 0;
  }, [selectedId]);

  useFrame(({ camera }) => {
    const controls = controlsRef.current;
    if (!controls || !isAnimating.current) return;

    frameCount.current++;
    if (frameCount.current > MAX_ANIMATION_FRAMES) {
      isAnimating.current = false;
      frameCount.current = 0;
      return;
    }

    if (selectedId) {
      const item = items.find((entry) => entry.id === selectedId);
      if (item && item.boxSize) {
        const pos = new THREE.Vector3(...item.position);
        const { camera: camPos, target } = getBoxFocusCamera(pos, item.boxSize);
        targetCameraPos.current.set(...camPos);
        targetLookAt.current.set(...target);
      }
    } else {
      targetCameraPos.current.set(...overviewCamera);
      targetLookAt.current.set(...overviewTarget);
    }

    camera.position.lerp(targetCameraPos.current, LERP_FACTOR);
    controls.target.lerp(targetLookAt.current, LERP_FACTOR);
    controls.update();

    const posDist = camera.position.distanceTo(targetCameraPos.current);
    const tgtDist = controls.target.distanceTo(targetLookAt.current);
    if (posDist < ANIMATION_THRESHOLD && tgtDist < ANIMATION_THRESHOLD) {
      isAnimating.current = false;
      frameCount.current = 0;
    }
  });

  return null;
}

// ── Scene 3D ─────────────────────────────────────────
function WarehouseScene({
  selectedId,
  setSelectedId,
  batches,
  focusedId,
  onLayoutReady,
  onItemsReady,
}: {
  selectedId: string | null;
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
  batches: ShelfBatchPayload[];
  focusedId: string | null;
  onLayoutReady: (
    racks: RackLayout[],
    camera: [number, number, number],
    target: [number, number, number],
  ) => void;
  onItemsReady: (items: WarehouseItem[]) => void;
}) {
  const controlsRef = React.useRef<OrbitControlsImpl>(null);
  const instancedMeshRef = React.useRef<THREE.InstancedMesh>(null);
  const edgeMeshRef = React.useRef<THREE.InstancedMesh>(null);
  const { scene } = useGLTF("/models/warehousecompressed2.glb") as { scene: THREE.Group };
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [racks, setRacks] = React.useState<RackLayout[]>([]);
  const [overviewCamera, setOverviewCamera] = React.useState<[number, number, number]>([90, 110, 180]);
  const [overviewTarget, setOverviewTarget] = React.useState<[number, number, number]>([40, 45, 75]);

  React.useEffect(() => {
    const nextRacks = buildRacksFromNodes(scene);
    const overview = buildOverviewCamera(nextRacks);
    setRacks(nextRacks);
    setOverviewCamera(overview.camera);
    setOverviewTarget(overview.target);
    onLayoutReady(nextRacks, overview.camera, overview.target);
  }, [scene, onLayoutReady]);

  const renderItems = React.useMemo(() => {
    if (!racks || racks.length === 0) return [];
    return buildWarehouseItems(batches, racks);
  }, [batches, racks]);

  React.useEffect(() => {
    onItemsReady(renderItems);
  }, [renderItems, onItemsReady]);

  const itemRenderData = React.useMemo(
    () =>
      renderItems.map((item) => ({
        id: item.id,
        position: item.position,
        color: getItemColor(item.status),
        isSelected: selectedId === item.id,
        isHovered: hoveredId === item.id,
        isFocused: focusedId === item.id,
        boxSize: item.boxSize!,
        name: item.itemName,
        stock: item.stock,
        expiryDate: item.expiryDate,
      })),
    [renderItems, selectedId, hoveredId, focusedId],
  );

  const hoveredData = React.useMemo(() => {
    if (!hoveredId) return null;
    return itemRenderData.find((d) => d.id === hoveredId) ?? null;
  }, [hoveredId, itemRenderData]);

  const sharedMaterial = React.useMemo(
    () => new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.05 }),
    [],
  );

  const edgeMaterial = React.useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#0f172a",
        wireframe: true,
        transparent: true,
        opacity: 0.4,
      }),
    [],
  );

  React.useLayoutEffect(() => {
    const mesh = instancedMeshRef.current;
    const edgeMesh = edgeMeshRef.current;
    if (!mesh || racks.length === 0) return;
    mesh.count = itemRenderData.length;
    if (edgeMesh) edgeMesh.count = itemRenderData.length;

    const tempMatrix = new THREE.Matrix4();
    const tempPosition = new THREE.Vector3();
    const tempQuaternion = new THREE.Quaternion();
    const tempScale = new THREE.Vector3();

    itemRenderData.forEach((item, index) => {
      const [w, h, d] = item.boxSize;
      const sf = item.isSelected ? SELECTED_SCALE_BOOST : 1;
      tempPosition.set(...item.position);
      tempScale.set(w * sf, h * sf, d * sf);
      tempQuaternion.identity();
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      mesh.setMatrixAt(index, tempMatrix);

      if (edgeMesh) {
        const edgeBoost = sf * 1.005;
        tempScale.set(w * edgeBoost, h * edgeBoost, d * edgeBoost);
        tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
        edgeMesh.setMatrixAt(index, tempMatrix);
      }

      let colorValue = item.color;
      if (item.isSelected) colorValue = "#fef3c7";
      else if (item.isHovered) colorValue = "#fde68a";
      else if (item.isFocused) colorValue = "#cbd5e1";

      mesh.setColorAt(index, new THREE.Color(colorValue));
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (edgeMesh) edgeMesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [itemRenderData, racks]);

  const handleItemClick = React.useCallback(
    (e: ThreeEvent<PointerEvent>, id: string) => {
      e.stopPropagation();
      setSelectedId((prev) => (prev === id ? null : id));
    },
    [setSelectedId],
  );

  const handlePointerMove = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const instanceId = e.instanceId ?? -1;
      const nextId = instanceId >= 0 ? (itemRenderData[instanceId]?.id ?? null) : null;
      setHoveredId(nextId);
    },
    [itemRenderData],
  );

  const handlePointerOut = React.useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredId(null);
  }, []);

  React.useEffect(() => {
    const el = document.querySelector<HTMLDivElement>(".warehouse-canvas");
    if (el) el.style.cursor = hoveredId ? "pointer" : "grab";
  }, [hoveredId]);

  const selectedItem = renderItems.find((item) => item.id === selectedId) ?? null;

  const wireframeSize: [number, number, number] = React.useMemo(() => {
    if (!selectedItem) return [1, 1, 1];
    const [w, h, d] = selectedItem.boxSize!;
    const boost = SELECTED_SCALE_BOOST * 1.06;
    return [w * boost, h * boost, d * boost];
  }, [selectedItem]);

  const hoverPosition = React.useMemo(() => {
    if (!hoveredData) return null;
    const [x, y, z] = hoveredData.position;
    const [, h] = hoveredData.boxSize;
    return new THREE.Vector3(x, y + h * 0.6, z);
  }, [hoveredData]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[50, 90, 90]} intensity={1.3} castShadow />
      <primitive object={scene} />

      <group>
        {selectedItem && (
          <mesh position={selectedItem.position} renderOrder={2}>
            <boxGeometry args={wireframeSize} />
            <meshBasicMaterial color="#f8fafc" transparent opacity={0.45} wireframe />
          </mesh>
        )}

        <instancedMesh
          ref={instancedMeshRef}
          args={[undefined, undefined, MAX_INSTANCE_CAPACITY]}
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
          onPointerDown={(e) => {
            const instanceId = e.instanceId ?? -1;
            const itemId = instanceId >= 0 ? (itemRenderData[instanceId]?.id ?? null) : null;
            if (itemId) handleItemClick(e, itemId);
          }}
        >
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={sharedMaterial} attach="material" />
        </instancedMesh>

        <instancedMesh
          ref={edgeMeshRef}
          args={[undefined, undefined, MAX_INSTANCE_CAPACITY]}
          raycast={undefined}
        >
          <boxGeometry args={[1, 1, 1]} />
          <primitive object={edgeMaterial} attach="material" />
        </instancedMesh>
      </group>

      {hoveredData && hoverPosition && (
        <Html position={hoverPosition} center style={{ pointerEvents: "none" }}>
          <div className="rounded-lg border border-slate-700 bg-slate-900/95 backdrop-blur-md px-3 py-2 shadow-lg text-slate-100 text-xs leading-tight whitespace-nowrap">
            <div className="font-semibold text-sm mb-0.5">{hoveredData.name}</div>
            <div className="flex gap-3 text-[11px]">
              <span>Stok: <span className="font-medium">{hoveredData.stock}</span></span>
              <span>ED: <span className="font-medium">{new Date(hoveredData.expiryDate).toLocaleDateString("id-ID")}</span></span>
            </div>
          </div>
        </Html>
      )}

      <CameraController
        selectedId={selectedId}
        controlsRef={controlsRef}
        items={renderItems}
        racks={racks}
        overviewCamera={overviewCamera}
        overviewTarget={overviewTarget}
      />

      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        minDistance={25}
        maxDistance={150}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.3}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />
    </>
  );
}

function buildOverviewCamera(racks: RackLayout[]): {
  camera: [number, number, number];
  target: [number, number, number];
} {
  if (racks.length === 0) {
    return { camera: [90, 110, 180], target: [40, 45, 75] };
  }
  const combined = new THREE.Box3();
  racks.forEach((rack) => {
    const halfWidth = rack.width / 2;
    const halfHeight = rack.height / 2;
    const halfDepth = rack.depth / 2;
    combined.expandByPoint(new THREE.Vector3(rack.center[0] - halfWidth, rack.center[1] - halfHeight, rack.center[2] - halfDepth));
    combined.expandByPoint(new THREE.Vector3(rack.center[0] + halfWidth, rack.center[1] + halfHeight, rack.center[2] + halfDepth));
  });
  const size = combined.getSize(new THREE.Vector3());
  const center = combined.getCenter(new THREE.Vector3());
  return {
    camera: [center.x, center.y + size.y * 0.9, center.z + size.z * 1.45],
    target: [center.x, center.y, center.z],
  };
}

// ── Komponen utama ──────────────────────────────────
export function WarehouseView() {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [batches, setBatches] = React.useState<ShelfBatchPayload[]>([]);
  const [items, setItems] = React.useState<WarehouseItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [focusedId, setFocusedId] = React.useState<string | null>(null);
  const [racks, setRacks] = React.useState<RackLayout[]>([]);
  const [overviewCamera, setOverviewCamera] = React.useState<[number, number, number]>([90, 110, 180]);
  const [overviewTarget, setOverviewTarget] = React.useState<[number, number, number]>([40, 45, 75]);

  React.useEffect(() => {
    let isActive = true;
    async function loadItems() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await loadWarehouseBatches();
        if (isActive) setBatches(data);
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Gagal memuat data warehouse");
          setBatches([]);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }
    void loadItems();
    return () => { isActive = false; };
  }, []);

  const distinctItems = React.useMemo(() => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.batchId)) return false;
      seen.add(item.batchId);
      return true;
    });
  }, [items]);

  const categories = React.useMemo(() => {
    const uniqueCategories = new Set(distinctItems.map((item) => item.category));
    return ["All", ...Array.from(uniqueCategories).sort()];
  }, [distinctItems]);

  const filteredItems = React.useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return distinctItems.filter((item) => {
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchesQuery = normalizedQuery.length === 0 || item.itemName.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [distinctItems, searchQuery, selectedCategory]);

  React.useEffect(() => {
    if (filteredItems.length > 0 && (searchQuery.trim().length > 0 || selectedCategory !== "All")) {
      setFocusedId(filteredItems[0].id);
    } else {
      setFocusedId(null);
    }
  }, [filteredItems, searchQuery, selectedCategory]);

  const selectedItem = selectedId ? items.find((item) => item.id === selectedId) ?? null : null;

  const handleClosePanel = React.useCallback(() => setSelectedId(null), []);
  const handleResultSelect = React.useCallback((item: WarehouseItem) => {
    setSelectedId(item.id);
    setFocusedId(item.id);
  }, []);

  const handleLayoutReady = React.useCallback(
    (nextRacks: RackLayout[], nextCamera: [number, number, number], nextTarget: [number, number, number]) => {
      setRacks(nextRacks);
      setOverviewCamera(nextCamera);
      setOverviewTarget(nextTarget);
    },
    [],
  );

  const handleItemsReady = React.useCallback((nextItems: WarehouseItem[]) => setItems(nextItems), []);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef as React.RefObject<HTMLElement>);

  return (
    <div
      ref={containerRef}
      className="warehouse-canvas relative h-[calc(100vh-4rem)] w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-md"
    >
      <Canvas camera={{ position: overviewCamera, fov: 40 }}>
        <React.Suspense
          fallback={
            <Html center>
              <div className="text-sm font-medium text-slate-400">Memuat Aset 3D...</div>
            </Html>
          }
        >
          <WarehouseScene
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            batches={batches}
            focusedId={focusedId}
            onLayoutReady={handleLayoutReady}
            onItemsReady={handleItemsReady}
          />
        </React.Suspense>
      </Canvas>

      <button
        onClick={toggleFullscreen}
        className="absolute left-4 bottom-4 z-40 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/90 text-slate-200 backdrop-blur hover:bg-slate-800 transition-colors"
        title={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
      >
        {isFullscreen ? <Minimize className="h-4 w-4 text-white" /> : <Maximize className="h-4 w-4 text-white" />}
      </button>

      {isLoading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="rounded-xl border border-slate-800 bg-slate-950/90 px-5 py-4 text-sm text-slate-300 shadow-lg">Memuat data warehouse...</div>
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="rounded-xl border border-slate-800 bg-slate-950/90 px-5 py-4 text-sm text-slate-300 shadow-lg">Belum ada data stok yang tersedia.</div>
        </div>
      )}

      {error && !isLoading && (
        <div className="absolute left-6 top-20 z-40 max-w-[320px] rounded-xl border border-red-800/60 bg-red-950/80 px-4 py-3 text-sm text-red-200 shadow-lg backdrop-blur">{error}</div>
      )}

      <div className="absolute right-4 top-4 z-40 w-[300px] rounded-2xl border border-slate-800 bg-slate-950/90 backdrop-blur-lg shadow-2xl flex flex-col max-h-[calc(100%-2rem)]">
        <div className="shrink-0 border-b border-slate-800 px-5 pt-5 pb-4">
          <h2 className="text-sm font-semibold tracking-tight text-white mb-1">Live Warehouse 3D</h2>
          <p className="text-[11px] text-slate-400 leading-relaxed">Visualisasi stok barang yang telah diterima dan divalidasi oleh admin secara real-time.</p>
        </div>
        <div className="shrink-0 px-5 pt-4 pb-2 space-y-2.5">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari nama item..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-0 placeholder:text-slate-500 focus:border-slate-500 transition-colors"
          />
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-500 transition-colors"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "All" ? "Semua kategori" : category}
              </option>
            ))}
          </select>
        </div>
        <div className="px-5 pb-4 pt-1 min-h-0">
          {filteredItems.length > 0 ? (
            <div className="max-h-[140px] space-y-1.5 overflow-y-auto pr-0.5">
              {filteredItems.map((item) => (
                <button
                  key={item.batchId}
                  type="button"
                  onClick={() => handleResultSelect(item)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    selectedItem?.batchId === item.batchId
                      ? "border-cyan-500 bg-cyan-950/70 text-cyan-100"
                      : "border-slate-800 bg-slate-900/80 text-slate-200 hover:border-slate-600 hover:bg-slate-800"
                  }`}
                >
                  <div className="font-medium truncate">{item.itemName}</div>
                  <div className="text-xs text-slate-400">{item.category}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/60 px-3 py-3 text-sm text-slate-400">Tidak ada item yang cocok.</div>
          )}
        </div>
      </div>

      {selectedItem && (
        <div className="absolute right-4 bottom-4 z-40 w-[300px] rounded-2xl border border-slate-700 bg-slate-950/90 backdrop-blur-lg p-5 shadow-2xl text-slate-50 animate-in slide-in-from-bottom-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2 leading-snug">
              <Package className="w-4 h-4 shrink-0 text-slate-400" />
              <span className="line-clamp-2">{selectedItem.itemName}</span>
            </h3>
            <button onClick={handleClosePanel} className="shrink-0 ml-2 rounded-full p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2.5">
            <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Kategori</div>
              <div className="text-sm font-medium">{selectedItem.category}</div>
            </div>
            <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Stok Tersedia</div>
              <div className={`text-lg font-bold ${
                selectedItem.status === "KRITIS" ? "text-red-500" : selectedItem.status === "MENIPIS" ? "text-amber-400" : "text-slate-200"
              }`}>{selectedItem.stock} Box</div>
            </div>
            <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Deskripsi</div>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{selectedItem.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}