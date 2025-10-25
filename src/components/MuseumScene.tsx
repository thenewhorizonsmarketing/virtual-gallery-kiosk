import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import backdropImage from '@/assets/museum-backdrop.jpg';
import schoolLogo from '@/assets/school-of-law-logo.svg';

interface MuseumSceneProps {
  onDoorClick: (key: string) => void;
  onResetCamera?: () => void;
  selectedRoom?: string | null;
  onZoomComplete?: (roomKey: string) => void;
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
        <meshStandardMaterial color="#4A5562" metalness={0.15} roughness={0.6} />
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
          color="#2C3744"
          metalness={0.1}
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

      {/* Label above door */}
      <mesh position={[0, 2.2, 0.2]}>
        <planeGeometry args={[2.6, 0.7]} />
        <meshBasicMaterial transparent>
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
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 16;
  
  // Handle text wrapping for long titles
  const maxWidth = canvas.width - 60;
  let fontSize = 112;
  ctx.font = `900 ${fontSize}px Cinzel, Georgia, serif`;
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  // Adjust font size if too many lines
  while (lines.length > 2 && fontSize > 64) {
    fontSize -= 8;
    ctx.font = `900 ${fontSize}px Cinzel, Georgia, serif`;
    lines.length = 0;
    currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
  }
  
  const lineHeight = fontSize * 1.2;
  const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
  
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
  });

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
        <meshStandardMaterial color="#D4D8DD" roughness={0.5} metalness={0.0} />
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
        <meshStandardMaterial color="#95A0AD" roughness={0.4} metalness={0.0} />
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
        <meshStandardMaterial color="#4A5562" roughness={0.6} metalness={0.0} />
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
        <meshStandardMaterial color="#5A4A3A" roughness={0.6} />
      </mesh>
      {/* Legs */}
      <mesh position={[-1.1, 0.25, 0]}>
        <boxGeometry args={[0.12, 0.5, 0.4]} />
        <meshStandardMaterial color="#3A3A3A" roughness={0.7} />
      </mesh>
      <mesh position={[1.1, 0.25, 0]}>
        <boxGeometry args={[0.12, 0.5, 0.4]} />
        <meshStandardMaterial color="#3A3A3A" roughness={0.7} />
      </mesh>
    </group>
  );
}

export function MuseumScene({ onDoorClick, onResetCamera, selectedRoom, onZoomComplete }: MuseumSceneProps) {
  const backdropTexture = useTexture(backdropImage);
  const logoTexture = useTexture(schoolLogo);
  const particlesRef = useRef<THREE.Points>(null);
  const { camera } = useThree();
  
  // Store initial camera position
  const initialCameraPos = useRef(new THREE.Vector3(0, 1.75, 10.5));
  const targetCameraPos = useRef(new THREE.Vector3(0, 1.75, 10.5));
  const isAnimating = useRef(false);
  const hasNotifiedComplete = useRef(false);

  const particlesGeometry = useMemo(() => {
    const positions = new Float32Array(800 * 3);
    for (let i = 0; i < 800 * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 36;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  // Handle camera zoom animations
  useFrame((state, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.02;
    }
    
    // Smooth camera transition with easing
    const lerpFactor = 1 - Math.pow(0.001, delta); // Smooth easing
    camera.position.lerp(targetCameraPos.current, lerpFactor);
    
    // Check if animation is complete
    const distance = camera.position.distanceTo(targetCameraPos.current);
    if (distance < 0.01 && isAnimating.current) {
      isAnimating.current = false;
      if (selectedRoom && !hasNotifiedComplete.current && onZoomComplete) {
        hasNotifiedComplete.current = true;
        onZoomComplete(selectedRoom);
      }
    }
  });
  
  // Update target position when room selection changes
  useEffect(() => {
    if (selectedRoom) {
      // Find the door and zoom into it
      const door = DOORS.find(d => d.key === selectedRoom);
      if (door) {
        targetCameraPos.current.set(door.x, 1.8, -4.5); // Zoom close to door
        isAnimating.current = true;
        hasNotifiedComplete.current = false;
      }
    } else {
      // Zoom back out to initial position
      targetCameraPos.current.copy(initialCameraPos.current);
      isAnimating.current = true;
      hasNotifiedComplete.current = false;
    }
  }, [selectedRoom]);

  backdropTexture.anisotropy = 8;
  backdropTexture.colorSpace = THREE.SRGBColorSpace;
  
  logoTexture.anisotropy = 8;
  logoTexture.colorSpace = THREE.SRGBColorSpace;

  const backdropAspect = 1600 / 1066;
  const backdropHeight = 12;
  const backdropWidth = backdropHeight * backdropAspect;
  
  const logoAspect = 577.88 / 199.75;
  const logoWidth = 12;
  const logoHeight = logoWidth / logoAspect;

  return (
    <>
      {/* Lighting - Cool Neutral Daylight */}
      <ambientLight intensity={0.6} color="#BFC7D1" />
      
      {/* Angled Sun for Long Diagonal Streaks */}
      <directionalLight
        position={[20, 30, -15]}
        intensity={2.0}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-radius={2}
      />

      {/* Floor - Polished Stone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 160]} />
        <meshStandardMaterial color="#C8CDD4" metalness={0.0} roughness={0.28} />
      </mesh>
      
      {/* Logo on floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 2]}>
        <planeGeometry args={[logoWidth, logoHeight]} />
        <meshStandardMaterial 
          map={logoTexture}
          transparent
          opacity={0.9}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>

      {/* Ceiling - Concrete */}
      <mesh position={[0, 6.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          color="#B8BEC5"
          metalness={0.0}
          roughness={0.45}
        />
      </mesh>

      {/* Backdrop wall with photo */}
      <mesh position={[0, backdropHeight * 0.5 - 1.0, -12]}>
        <planeGeometry args={[backdropWidth, backdropHeight]} />
        <meshStandardMaterial map={backdropTexture} roughness={1.0} metalness={0.0} />
      </mesh>

      {/* Side walls - Concrete */}
      <mesh position={[-12, 4, -2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color="#B8BEC5" roughness={0.45} metalness={0.0} />
      </mesh>
      <mesh position={[12, 4, -2]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color="#B8BEC5" roughness={0.45} metalness={0.0} />
      </mesh>

      {/* Back receiver wall - Concrete */}
      <mesh position={[0, 4, -9.2]} receiveShadow>
        <planeGeometry args={[40, 8]} />
        <meshStandardMaterial color="#B8BEC5" roughness={0.45} metalness={0.0} />
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

// Add missing imports
import { useState, useEffect } from 'react';
