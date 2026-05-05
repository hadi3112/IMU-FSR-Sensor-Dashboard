import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function ExoskeletonGroup() {
  const group = useRef(/** @type {THREE.Group | null} */ (null));
  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.rotation.y += dt * 0.18;
    group.current.position.y = Math.sin(performance.now() / 1400) * 0.03;
  });

  return (
    <group ref={group} scale={0.95}>
      <mesh castShadow receiveShadow position={[0, 0.95, 0]}>
        <boxGeometry args={[0.62, 0.38, 0.26]} />
        <meshStandardMaterial color="#1f1f22" metalness={0.9} roughness={0.28} />
      </mesh>
      <mesh castShadow receiveShadow position={[0.18, 0.35, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.95, 16]} />
        <meshStandardMaterial color="#2b2b30" metalness={0.82} roughness={0.32} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.18, 0.35, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.95, 16]} />
        <meshStandardMaterial color="#2b2b30" metalness={0.82} roughness={0.32} />
      </mesh>
      <mesh castShadow receiveShadow position={[0.18, -0.55, 0.05]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.16, 0.62, 0.18]} />
        <meshStandardMaterial color="#232326" metalness={0.88} roughness={0.26} />
      </mesh>
      <mesh castShadow receiveShadow position={[-0.18, -0.55, 0.05]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.16, 0.62, 0.18]} />
        <meshStandardMaterial color="#232326" metalness={0.88} roughness={0.26} />
      </mesh>
      <mesh position={[0, 0.15, 0.16]}>
        <torusGeometry args={[0.3, 0.014, 8, 40]} />
        <meshStandardMaterial color="#5ee8dc" emissive="#0a3d40" emissiveIntensity={0.25} metalness={0.25} roughness={0.45} />
      </mesh>
    </group>
  );
}

/** Right half: 3D hero / optics only. */
export function Exo3DPanel() {
  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b from-[#0d0d10] to-black shadow-[0_0_24px_rgba(20,168,160,0.04)]">
      <div className="pointer-events-none absolute inset-0 opacity-40 hero-vignette" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black to-transparent" />
      <Canvas
        className="h-full min-h-0 w-full flex-1"
        shadows
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [1.2, 0.75, 1.35], fov: 40 }}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 3.8, 8.5]} />
        <ambientLight intensity={0.16} />
        <directionalLight
          castShadow
          position={[2, 2.8, 1.4]}
          intensity={1.1}
          color="#ffffff"
          shadow-mapSize-width={768}
          shadow-mapSize-height={768}
        />
        <pointLight position={[-1.1, 1.2, 0.5]} intensity={0.16} color="#5ee8dc" />
        <ExoskeletonGroup />
      </Canvas>
    </div>
  );
}
