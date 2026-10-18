import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useEditorStore } from '../../store/useEditorStore';

export function DragController() {
  const { camera, gl } = useThree();
  const draggedItemId = useEditorStore(s => s.draggedItemId);
  const dragState = useEditorStore(s => s.dragState);
  const setLivePosition = useEditorStore(s => s.setLivePosition);
  const endDrag = useEditorStore(s => s.endDrag);

  const floorPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const intersectPoint = useMemo(() => new THREE.Vector3(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);

  useEffect(() => {
    if (!draggedItemId || !dragState) return;

    document.body.style.cursor = 'grabbing';

    const handlePointerMove = (e: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.ray.intersectPlane(floorPlane, intersectPoint);
      if (!hit) return;

      const targetX = intersectPoint.x + dragState.offsetX;
      const targetZ = intersectPoint.z + dragState.offsetZ;
      setLivePosition(dragState.itemId, targetX, targetZ);
    };

    const handlePointerUp = () => {
      document.body.style.cursor = 'default';
      endDrag();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      document.body.style.cursor = 'default';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [draggedItemId, dragState, camera, gl.domElement, floorPlane, raycaster, intersectPoint, pointer, setLivePosition, endDrag]);

  return null;
}

