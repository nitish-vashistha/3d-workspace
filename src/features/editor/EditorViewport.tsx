import { useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { FloorGrid } from './FloorGrid';
import { SceneItems } from './SceneItems';
import { DragController } from './DragController';
import { useEditorStore } from '../../store/useEditorStore';
import { GRID } from '../../types/scene';


function PerformanceMonitor({ onStats }: { onStats: (fps: number, drawCalls: number) => void }) {
  const { gl } = useThree();
  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef(performance.now());

  useFrame(() => {
    const now = performance.now();
    const delta = now - lastTimeRef.current;
    lastTimeRef.current = now;
    frameTimesRef.current.push(delta);

    // Report every 30 frames
    if (frameTimesRef.current.length >= 30) {
      const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
      const fps = Math.round(1000 / avgFrameTime);
      const drawCalls = gl.info.render.calls;
      onStats(fps, drawCalls);
      frameTimesRef.current = [];
    }
  });

  return null;
}

interface EditorViewportProps {
  onStats: (fps: number, drawCalls: number) => void;
}

export function EditorViewport({ onStats }: EditorViewportProps) {
  const draggedItemId = useEditorStore(s => s.draggedItemId);

  return (
    <div className="flex-1 relative">
      <Canvas
        camera={{
          position: [10, 12, 20],
          fov: 50,
          near: 0.1,
          far: 200,
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        shadows
      >
        <color attach="background" args={['#0f1923']} />
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[15, 20, 10]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[5, 8, 5]} intensity={0.3} />

        <FloorGrid />
        <SceneItems />
        <DragController />
        <PerformanceMonitor onStats={onStats} />

        <OrbitControls
          enabled={!draggedItemId}
          target={[GRID.WIDTH / 2, 0, GRID.DEPTH / 2]}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={3}
          maxDistance={50}
          enableDamping
          dampingFactor={0.1}
        />
      </Canvas>
    </div>
  );
}
