import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Line, Text } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { GRID } from '../../types/scene';
import { useEditorStore } from '../../store/useEditorStore';
import { EQUIPMENT_TYPES } from '../../types/equipment';

/**
 * Floor grid: 20m × 12m with 0.5m cells.
 * Coordinate system: X = width (0-20), Y = up, Z = depth (0-12).
 * Origin is at (0, 0, 0) — the corner of the room.
 * The grid mesh is positioned so that the grid covers [0, 20] × [0, 12].
 */
export function FloorGrid() {
  const gridLines = useMemo(() => {
    const lines: { start: [number, number, number]; end: [number, number, number]; major: boolean }[] = [];

    // Vertical lines (along Z axis)
    for (let i = 0; i <= GRID.CELLS_X; i++) {
      const x = i * GRID.CELL_SIZE;
      lines.push({
        start: [x, 0.001, 0],
        end: [x, 0.001, GRID.DEPTH],
        major: i % 2 === 0,
      });
    }

    // Horizontal lines (along X axis)
    for (let j = 0; j <= GRID.CELLS_Z; j++) {
      const z = j * GRID.CELL_SIZE;
      lines.push({
        start: [0, 0.001, z],
        end: [GRID.WIDTH, 0.001, z],
        major: j % 2 === 0,
      });
    }

    return lines;
  }, []);

  const axisLabels = useMemo(() => {
    const labels: { text: string; position: [number, number, number] }[] = [];
    // X axis labels every 2m
    for (let x = 0; x <= GRID.WIDTH; x += 2) {
      labels.push({ text: `${x}m`, position: [x, 0.01, -0.5] });
    }
    // Z axis labels every 2m
    for (let z = 0; z <= GRID.DEPTH; z += 2) {
      labels.push({ text: `${z}m`, position: [-0.5, 0.01, z] });
    }
    return labels;
  }, []);

  const activeMode = useEditorStore(s => s.activeMode);
  const placingType = useEditorStore(s => s.placingType);
  const addItem = useEditorStore(s => s.addItem);
  const selectItem = useEditorStore(s => s.selectItem);

  const [hoverPos, setHoverPos] = useState<{ x: number; z: number } | null>(null);

  const placingDef = placingType ? EQUIPMENT_TYPES[placingType] : null;

  return (
    <group name="floor-grid">
      {/* Floor surface with interactive placement & selection */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[GRID.WIDTH / 2, 0, GRID.DEPTH / 2]}
        receiveShadow
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          if (activeMode === 'place' && placingType) {
            addItem(placingType, e.point.x, e.point.z);
          } else {
            selectItem(null);
          }
        }}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          if (activeMode === 'place' && e.point) {
            setHoverPos({
              x: Math.max(0.5, Math.min(GRID.WIDTH - 0.5, Math.round(e.point.x / GRID.CELL_SIZE) * GRID.CELL_SIZE)),
              z: Math.max(0.5, Math.min(GRID.DEPTH - 0.5, Math.round(e.point.z / GRID.CELL_SIZE) * GRID.CELL_SIZE)),
            });
          }
        }}
        onPointerOver={() => {
          if (activeMode === 'place') {
            document.body.style.cursor = 'crosshair';
          }
        }}
        onPointerOut={() => {
          setHoverPos(null);
          document.body.style.cursor = 'default';
        }}
      >
        <planeGeometry args={[GRID.WIDTH, GRID.DEPTH]} />
        <meshStandardMaterial color="#1a2332" side={THREE.DoubleSide} />
      </mesh>

      {/* Placement ghost preview when in place mode */}
      {activeMode === 'place' && placingDef && hoverPos && (
        <group position={[hoverPos.x, placingDef.height / 2, hoverPos.z]}>
          <mesh>
            <boxGeometry args={[placingDef.width, placingDef.height, placingDef.depth]} />
            <meshStandardMaterial
              color="#38bdf8"
              transparent
              opacity={0.4}
              emissive="#38bdf8"
              emissiveIntensity={0.3}
            />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(placingDef.width, placingDef.height, placingDef.depth)]} />
            <lineBasicMaterial color="#38bdf8" linewidth={2} />
          </lineSegments>
        </group>
      )}

      {/* Grid lines */}
      {gridLines.map((line, i) => (
        <Line
          key={i}
          points={[line.start, line.end]}
          color={line.major ? '#334e68' : '#243b53'}
          lineWidth={line.major ? 1.0 : 0.5}
        />
      ))}

      {/* Axis labels */}
      {axisLabels.map((label, i) => (
        <Text
          key={`label-${i}`}
          position={label.position}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.25}
          color="#627d98"
          anchorX="center"
          anchorY="middle"
        >
          {label.text}
        </Text>
      ))}

      {/* Room boundary outline */}
      <Line
        points={[
          [0, 0.002, 0],
          [GRID.WIDTH, 0.002, 0],
          [GRID.WIDTH, 0.002, GRID.DEPTH],
          [0, 0.002, GRID.DEPTH],
          [0, 0.002, 0],
        ]}
        color="#627d98"
        lineWidth={2}
      />
    </group>
  );
}
