import { useEditorStore } from '../../store/useEditorStore';
import { PlacedItemMesh } from './PlacedItem';
import { GhostPreview } from './GhostPreview';

export function SceneItems() {
  const items = useEditorStore(s => s.items);

  return (
    <group name="scene-items">
      {Object.values(items).map(item => (
        <PlacedItemMesh key={item.id} item={item} />
      ))}
      <GhostPreview />
    </group>
  );
}
