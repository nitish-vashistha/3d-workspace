import { useMemo } from 'react';
import * as THREE from 'three';
import { useEditorStore } from '../../store/useEditorStore';
import { EQUIPMENT_TYPES } from '../../types/equipment';
import type { EquipmentTypeId } from '../../types/equipment';

interface SingleGhostProps {
  itemId: string;
  newX: number;
  newZ: number;
  newRotation?: number;
}

function SingleGhost({ itemId, newX, newZ, newRotation }: SingleGhostProps) {
  const items = useEditorStore(s => s.items);
  const item = items[itemId];
  const def = item ? EQUIPMENT_TYPES[item.type as EquipmentTypeId] : null;

  const geometry = useMemo(() => {
    if (!def) return null;
    return new THREE.BoxGeometry(def.width, def.height, def.depth);
  }, [def]);

  if (!item || !def || !geometry) return null;

  const rotation = newRotation ?? item.rotation;

  return (
    <group
      position={[newX, def.height / 2, newZ]}
      rotation={[0, (rotation * Math.PI) / 180, 0]}
    >
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#22c55e"
          transparent
          opacity={0.45}
          emissive="#22c55e"
          emissiveIntensity={0.35}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial color="#22c55e" linewidth={2} />
      </lineSegments>
    </group>
  );
}

export function GhostPreview() {
  const aiProposal = useEditorStore(s => s.aiProposal);

  if (!aiProposal || aiProposal.status !== 'previewing') return null;

  // Multi-item batch preview
  if (aiProposal.moves && aiProposal.moves.length > 0) {
    return (
      <group name="ghost-preview-batch">
        {aiProposal.moves.map(m => (
          <SingleGhost
            key={m.itemId}
            itemId={m.itemId}
            newX={m.newX}
            newZ={m.newZ}
            newRotation={m.newRotation}
          />
        ))}
      </group>
    );
  }

  // Single-item preview
  return (
    <SingleGhost
      itemId={aiProposal.itemId}
      newX={aiProposal.newX}
      newZ={aiProposal.newZ}
      newRotation={aiProposal.newRotation}
    />
  );
}
