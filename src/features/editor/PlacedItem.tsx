import { useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { useEditorStore } from '../../store/useEditorStore';
import { EQUIPMENT_TYPES } from '../../types/equipment';
import { isItemInViolation } from '../rule-validation/ruleEngine';
import type { PlacedItem as PlacedItemType } from '../../types/scene';
import type { ThreeEvent } from '@react-three/fiber';

interface PlacedItemProps {
  item: PlacedItemType;
}

// Shared geometries and materials — created once, reused across all instances
const geometryCache = new Map<string, THREE.BoxGeometry>();
const materialCache = new Map<string, THREE.MeshStandardMaterial>();

function getGeometry(w: number, h: number, d: number): THREE.BoxGeometry {
  const key = `${w}-${h}-${d}`;
  if (!geometryCache.has(key)) {
    geometryCache.set(key, new THREE.BoxGeometry(w, h, d));
  }
  return geometryCache.get(key)!;
}

function getMaterial(color: string, isViolation: boolean, isSelected: boolean, isHovered: boolean): THREE.MeshStandardMaterial {
  // Don't cache violation/selection state materials — they change dynamically
  if (isViolation) {
    const key = `violation-${color}`;
    if (!materialCache.has(key)) {
      materialCache.set(key, new THREE.MeshStandardMaterial({
        color: '#ef4444',
        transparent: true,
        opacity: 0.8,
        emissive: '#ef4444',
        emissiveIntensity: 0.3,
      }));
    }
    return materialCache.get(key)!;
  }
  if (isSelected) {
    const key = `selected-${color}`;
    if (!materialCache.has(key)) {
      materialCache.set(key, new THREE.MeshStandardMaterial({
        color,
        emissive: '#3b82f6',
        emissiveIntensity: 0.4,
      }));
    }
    return materialCache.get(key)!;
  }
  if (isHovered) {
    const key = `hovered-${color}`;
    if (!materialCache.has(key)) {
      materialCache.set(key, new THREE.MeshStandardMaterial({
        color,
        emissive: '#627d98',
        emissiveIntensity: 0.2,
      }));
    }
    return materialCache.get(key)!;
  }
  const key = `base-${color}`;
  if (!materialCache.has(key)) {
    materialCache.set(key, new THREE.MeshStandardMaterial({ color }));
  }
  return materialCache.get(key)!;
}

export function PlacedItemMesh({ item }: PlacedItemProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; z: number } | null>(null);

  const selectedItemId = useEditorStore(s => s.selectedItemId);
  const hoveredItemId = useEditorStore(s => s.hoveredItemId);
  const violations = useEditorStore(s => s.violations);
  const selectItem = useEditorStore(s => s.selectItem);
  const hoverItem = useEditorStore(s => s.hoverItem);
  const moveItem = useEditorStore(s => s.moveItem);
  const setDraggedItem = useEditorStore(s => s.setDraggedItem);

  const def = EQUIPMENT_TYPES[item.type];
  const isSelected = selectedItemId === item.id;
  const isHovered = hoveredItemId === item.id;
  const isViolation = isItemInViolation(item.id, violations);

  const geometry = useMemo(() => getGeometry(def.width, def.height, def.depth), [def.width, def.height, def.depth]);
  const material = getMaterial(def.color, isViolation, isSelected, isHovered);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!isDragging) {
      selectItem(item.id);
    }
  }, [selectItem, item.id, isDragging]);

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    selectItem(item.id);
    setIsDragging(true);
    setDraggedItem(item.id);
    dragStartRef.current = { x: item.x, z: item.z };
    (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
  }, [selectItem, item.id, item.x, item.z, setDraggedItem]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !e.point) return;
    // Move item to pointer position on the floor plane
    moveItem(item.id, e.point.x, e.point.z);
  }, [isDragging, moveItem, item.id]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setDraggedItem(null);
    dragStartRef.current = null;
  }, [setDraggedItem]);

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hoverItem(item.id);
    document.body.style.cursor = 'pointer';
  }, [hoverItem, item.id]);

  const handlePointerOut = useCallback(() => {
    hoverItem(null);
    document.body.style.cursor = 'default';
  }, [hoverItem]);

  return (
    <group
      position={[item.x, def.height / 2, item.z]}
      rotation={[0, (item.rotation * Math.PI) / 180, 0]}
    >
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow
        receiveShadow
      />
      {/* Selection outline */}
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[geometry]} />
          <lineBasicMaterial color="#3b82f6" linewidth={2} />
        </lineSegments>
      )}
      {/* Violation outline */}
      {isViolation && !isSelected && (
        <lineSegments>
          <edgesGeometry args={[geometry]} />
          <lineBasicMaterial color="#ef4444" linewidth={2} />
        </lineSegments>
      )}
    </group>
  );
}
