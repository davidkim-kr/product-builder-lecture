'use client';

import { useRef, useState, useCallback } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useRoomStore } from '@/store/useRoomStore';
import { FurnitureItem, RoomData } from '@/types';

// --- 방 구조 ---
function RoomMesh({ room }: { room: RoomData }) {
  const { width, length, height } = room.dimensions;
  const wallThickness = 0.1;

  return (
    <group>
      {/* 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshLambertMaterial color="#f5f5dc" />
      </mesh>

      {/* 천장 (반투명) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[width, length]} />
        <meshLambertMaterial color="#ffffff" transparent opacity={0.1} />
      </mesh>

      {/* 남쪽 벽 (z = length/2) */}
      <mesh position={[0, height / 2, length / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, wallThickness]} />
        <meshLambertMaterial color="#e8e8e8" />
      </mesh>

      {/* 북쪽 벽 (z = -length/2) */}
      <mesh position={[0, height / 2, -length / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, wallThickness]} />
        <meshLambertMaterial color="#e8e8e8" />
      </mesh>

      {/* 동쪽 벽 (x = width/2) */}
      <mesh position={[width / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallThickness, height, length]} />
        <meshLambertMaterial color="#d8d8d8" />
      </mesh>

      {/* 서쪽 벽 (x = -width/2) */}
      <mesh position={[-width / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallThickness, height, length]} />
        <meshLambertMaterial color="#d8d8d8" />
      </mesh>
    </group>
  );
}

// --- 가구 박스 ---
interface FurnitureMeshProps {
  item: FurnitureItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragMove: (id: string, x: number, z: number) => void;
}

function FurnitureMesh({ item, isSelected, onSelect, onDragMove }: FurnitureMeshProps) {
  const { camera, gl } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, z: 0 });

  const { width, depth, height } = item.dimensions;

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onSelect(item.id);
      isDragging.current = true;
      dragStart.current = { x: e.point.x, z: e.point.z };
      gl.domElement.setPointerCapture(e.pointerId);
    },
    [item.id, onSelect, gl]
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isDragging.current) return;
      e.stopPropagation();
      const dx = e.point.x - dragStart.current.x;
      const dz = e.point.z - dragStart.current.z;
      dragStart.current = { x: e.point.x, z: e.point.z };
      onDragMove(item.id, item.position.x + dx, item.position.z + dz);
    },
    [item.id, item.position, onDragMove]
  );

  const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    isDragging.current = false;
    gl.domElement.releasePointerCapture(e.pointerId);
  }, [gl]);

  return (
    <group
      position={[item.position.x, item.position.y, item.position.z]}
      rotation={[0, item.rotation, 0]}
    >
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <boxGeometry args={[width, height, depth]} />
        <meshLambertMaterial
          color={item.color}
          transparent
          opacity={isSelected ? 0.85 : 0.75}
        />
      </mesh>

      {/* 선택 외곽선 */}
      {isSelected && (
        <mesh>
          <boxGeometry args={[width + 0.05, height + 0.05, depth + 0.05]} />
          <meshBasicMaterial color="#ffffff" wireframe />
        </mesh>
      )}

      {/* 가구 이름 라벨은 생략 (성능 최적화) */}
    </group>
  );
}

// --- 빈 공간 클릭으로 선택 해제 ---
function DeselectPlane({ onDeselect }: { onDeselect: () => void }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      onPointerDown={(e) => {
        e.stopPropagation();
        onDeselect();
      }}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}

// --- 메인 뷰어 ---
export default function RoomViewer3D() {
  const { room, furniture, selectedFurnitureId, selectFurniture, updateFurniture } =
    useRoomStore();

  const handleDragMove = useCallback(
    (id: string, x: number, z: number) => {
      if (!room) return;
      const item = furniture.find((f) => f.id === id);
      if (!item) return;

      const hw = room.dimensions.width / 2 - item.dimensions.width / 2;
      const hl = room.dimensions.length / 2 - item.dimensions.depth / 2;
      const clampedX = Math.max(-hw, Math.min(hw, x));
      const clampedZ = Math.max(-hl, Math.min(hl, z));

      updateFurniture(id, { position: { x: clampedX, y: item.dimensions.height / 2, z: clampedZ } });
    },
    [room, furniture, updateFurniture]
  );

  if (!room) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 rounded-lg">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">🏠</div>
          <p className="text-lg">평면도를 업로드하여 3D 방을 생성하세요</p>
        </div>
      </div>
    );
  }

  return (
    <Canvas
      shadows
      camera={{ position: [0, room.dimensions.height * 2.5, room.dimensions.length * 1.5], fov: 50 }}
      style={{ background: '#1a1a2e' }}
    >
      {/* 조명 */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[0, room.dimensions.height - 0.2, 0]} intensity={0.3} color="#fff8e7" />

      {/* 방 */}
      <RoomMesh room={room} />

      {/* 가구 */}
      {furniture.map((item) => (
        <FurnitureMesh
          key={item.id}
          item={item}
          isSelected={selectedFurnitureId === item.id}
          onSelect={selectFurniture}
          onDragMove={handleDragMove}
        />
      ))}

      {/* 선택 해제용 바닥 */}
      <DeselectPlane onDeselect={() => selectFurniture(null)} />

      {/* 그리드 */}
      <Grid
        args={[room.dimensions.width, room.dimensions.length]}
        position={[0, 0.001, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#444"
        sectionSize={2}
        sectionColor="#666"
        fadeDistance={30}
      />

      {/* 카메라 컨트롤 */}
      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2}
        minDistance={2}
        maxDistance={30}
      />
    </Canvas>
  );
}
