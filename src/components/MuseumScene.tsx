import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import backdropImage from '@/assets/museum-backdrop.jpg';

interface MuseumSceneProps {
  onDoorClick: (key: string) => void;
  onResetCamera?: () => void;
}

const DOORS = [
  { key: 'Alumni/Class Composites', x: -6.5, color: '#c9a227' },
  { key: 'Publications (Amicus, Legal Eye, Law Review, Directory)', x: -2.2, color: '#c9a227' },
  { key: 'Historical Photos/Archives', x: 2.2, color: '#c9a227' },
  { key: 'Faculty & Staff', x: 6.5, color: '#c9a227' },
];

function Door({ doorData, onDoorClick }: { doorData: typeof DOORS[0]; onDoorClick: (key: string) => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = THREE.MathUtils.lerp(
        mat.emissiveIntensity,
        hovered ? 0.65 : 0.15,
        0.1
      );
      meshRef.current.scale.lerp(
        new THREE.Vector3(hovered ? 1.02 : 1, hovered ? 1.02 : 1, 1),
        0.1
      );
    }
  });

  return (
    <group position={[doorData.x, 1.8, -8]}>
      {/* Frame */}
      <mesh position={[0, 0, -0.01]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 3.8, 0.15]} />
        <meshStandardMaterial color="#0f2244" metalness={0.35} roughness={0.4} />
      </mesh>

      {/* Door panel */}
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onDoorClick(doorData.key)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[2.2, 3.6, 0.25]} />
        <meshStandardMaterial
          color="#0b1a34"
          metalness={0.2}
          roughness={0.7}
          emissive={doorData.color}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Glow */}
      <mesh position={[0, 0, 0.14]} renderOrder={-1}>
        <planeGeometry args={[2.3, 3.7]} />
        <meshBasicMaterial
          color={doorData.color}
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Label */}
      <mesh position={[0, 1.3, 0.3]}>
        <planeGeometry args={[2.2, 0.9]} />
        <meshBasicMaterial transparent opacity={0}>
          <primitive attach="map" object={createLabelTexture(doorData.key)} />
        </meshBasicMaterial>
      </mesh>
    </group>
  );
}

function createLabelTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 1024;
  canvas.height = 256;

  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 14;
  ctx.font = '800 72px system-ui, -apple-system, Segoe UI, Roboto';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}

function RotatingArtifact({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <group position={position}>
      {/* Plinth */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.8, 1.1]} />
        <meshStandardMaterial color="#e9ecef" roughness={0.9} />
      </mesh>

      {/* Glass vitrine */}
      <mesh position={[0, 1.35, 0]}>
        <boxGeometry args={[1.05, 1.1, 1.05]} />
        <meshPhysicalMaterial
          color={0xffffff}
          roughness={0.05}
          transmission={0.92}
          thickness={0.06}
          transparent
        />
      </mesh>

      {/* Stand */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.25, 24]} />
        <meshStandardMaterial color="#b1b7c3" roughness={0.6} />
      </mesh>

      {/* Artifact */}
      <mesh ref={meshRef} position={[0, 1.25, 0]} castShadow>
        <torusKnotGeometry args={[0.22, 0.07, 120, 16]} />
        <meshStandardMaterial
          color="#c9a227"
          metalness={0.6}
          roughness={0.35}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Plaque */}
      <mesh position={[0, 0.85, 0.62]}>
        <boxGeometry args={[0.7, 0.12, 0.02]} />
        <meshStandardMaterial color="#0f2244" roughness={0.7} />
      </mesh>
    </group>
  );
}

function Bench({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Seat */}
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[2.8, 0.18, 0.5]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.6} />
      </mesh>
      {/* Legs */}
      <mesh position={[-1.1, 0.25, 0]}>
        <boxGeometry args={[0.12, 0.5, 0.4]} />
        <meshStandardMaterial color="#1f1f1f" roughness={0.8} />
      </mesh>
      <mesh position={[1.1, 0.25, 0]}>
        <boxGeometry args={[0.12, 0.5, 0.4]} />
        <meshStandardMaterial color="#1f1f1f" roughness={0.8} />
      </mesh>
    </group>
  );
}

export function MuseumScene({ onDoorClick, onResetCamera }: MuseumSceneProps) {
  const backdropTexture = useTexture(backdropImage);
  const particlesRef = useRef<THREE.Points>(null);

  const particlesGeometry = useMemo(() => {
    const positions = new Float32Array(800 * 3);
    for (let i = 0; i < 800 * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 36;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useFrame((state, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.02;
    }
  });

  backdropTexture.anisotropy = 8;
  backdropTexture.colorSpace = THREE.SRGBColorSpace;

  const backdropAspect = 1600 / 1066;
  const backdropHeight = 12;
  const backdropWidth = backdropHeight * backdropAspect;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.18} />
      <hemisphereLight args={['#8793a4', '#0d1016', 0.35]} />
      
      {/* Sun/Daylight */}
      <directionalLight
        position={[7.5, 10.5, 3]}
        intensity={0.55}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />

      {/* Rim lights */}
      <rectAreaLight
        width={5}
        height={1.5}
        intensity={2.5}
        color="#c9a227"
        position={[-6, 3.0, -2.2]}
        rotation={[0, Math.PI / 4, 0]}
      />
      <rectAreaLight
        width={5}
        height={1.5}
        intensity={2.5}
        color="#c9a227"
        position={[6, 3.0, -2.2]}
        rotation={[0, -Math.PI / 4, 0]}
      />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#cfd4db" metalness={0.05} roughness={0.92} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 6.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          color="#061226"
          metalness={0.2}
          roughness={0.85}
          emissive="#c9a227"
          emissiveIntensity={0.02}
        />
      </mesh>

      {/* Backdrop wall with photo */}
      <mesh position={[0, backdropHeight * 0.5 - 1.0, -12]}>
        <planeGeometry args={[backdropWidth, backdropHeight]} />
        <meshStandardMaterial map={backdropTexture} roughness={1.0} metalness={0.0} />
      </mesh>

      {/* Side walls */}
      <mesh position={[-12, 4, -2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color="#e5e9ef" roughness={0.95} metalness={0.02} />
      </mesh>
      <mesh position={[12, 4, -2]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color="#e5e9ef" roughness={0.95} metalness={0.02} />
      </mesh>

      {/* Back receiver wall */}
      <mesh position={[0, 4, -9.2]} receiveShadow>
        <planeGeometry args={[40, 8]} />
        <meshStandardMaterial color="#e3e8ee" roughness={0.97} />
      </mesh>

      {/* Shadow plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -7.8]} receiveShadow>
        <planeGeometry args={[24, 8]} />
        <shadowMaterial opacity={0.25} />
      </mesh>

      {/* Doors */}
      {DOORS.map((door) => (
        <Door key={door.key} doorData={door} onDoorClick={onDoorClick} />
      ))}

      {/* Vitrines */}
      <RotatingArtifact position={[-4.2, 0, -3.0]} />
      <RotatingArtifact position={[4.2, 0, -3.0]} />

      {/* Benches */}
      <Bench position={[-5.8, 0, -1.6]} />
      <Bench position={[5.8, 0, -1.6]} />

      {/* Dust particles */}
      <points ref={particlesRef}>
        <bufferGeometry {...particlesGeometry} />
        <pointsMaterial
          size={0.018}
          color={0xffffff}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </points>

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.49}
        rotateSpeed={0.5}
        enableDamping
        dampingFactor={0.06}
        makeDefault
      />
    </>
  );
}

// Add missing import
import { useState } from 'react';
