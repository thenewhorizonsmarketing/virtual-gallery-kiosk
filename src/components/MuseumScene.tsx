import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import backdropImage from '@/assets/museum-backdrop.jpg';
import schoolLogo from '@/assets/school-of-law-logo.svg';
import carraraMarble from '@/assets/textures/marble/carrara-marble.jpg';
import floorMarble from '@/assets/textures/marble/floor-marble.jpg';
import wallTravertine from '@/assets/textures/marble/wall-travertine.jpg';
import darkGranite from '@/assets/textures/marble/dark-granite.jpg';

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

function Door({ doorData, onDoorClick, marbleTexture }: { 
  doorData: typeof DOORS[0]; 
  onDoorClick: (key: string) => void;
  marbleTexture: THREE.Texture;
}) {
  const leftDoorRef = useRef<THREE.Mesh>(null);
  const rightDoorRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (leftDoorRef.current && rightDoorRef.current) {
      const mat = leftDoorRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = THREE.MathUtils.lerp(
        mat.emissiveIntensity,
        hovered ? 0.35 : 0.12,
        0.1
      );
    }
  });

  return (
    <group position={[doorData.x, 0, -8]}>
      {/* Left Column with fluting */}
      <group position={[-1.4, 2.5, 0]}>
        {/* Column shaft with flutes */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.18, 0.20, 4.2, 24]} />
          <meshStandardMaterial 
            map={marbleTexture}
            roughness={0.25}
            metalness={0.05}
          />
        </mesh>
        {/* Column base */}
        <mesh position={[0, -2.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.24, 0.28, 0.35, 24]} />
          <meshStandardMaterial map={marbleTexture} roughness={0.3} metalness={0.05} />
        </mesh>
        {/* Column capital */}
        <mesh position={[0, 2.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.28, 0.20, 0.4, 24]} />
          <meshStandardMaterial map={marbleTexture} roughness={0.25} metalness={0.05} />
        </mesh>
      </group>

      {/* Right Column with fluting */}
      <group position={[1.4, 2.5, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.18, 0.20, 4.2, 24]} />
          <meshStandardMaterial 
            map={marbleTexture}
            roughness={0.25}
            metalness={0.05}
          />
        </mesh>
        <mesh position={[0, -2.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.24, 0.28, 0.35, 24]} />
          <meshStandardMaterial map={marbleTexture} roughness={0.3} metalness={0.05} />
        </mesh>
        <mesh position={[0, 2.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.28, 0.20, 0.4, 24]} />
          <meshStandardMaterial map={marbleTexture} roughness={0.25} metalness={0.05} />
        </mesh>
      </group>

      {/* Entablature (top architectural element) */}
      <mesh position={[0, 4.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.25, 0.35]} />
        <meshStandardMaterial map={marbleTexture} roughness={0.2} metalness={0.05} />
      </mesh>
      <mesh position={[0, 5.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.22, 0.4]} />
        <meshStandardMaterial map={marbleTexture} roughness={0.25} metalness={0.05} />
      </mesh>

      {/* Door frame surround */}
      <mesh position={[0, 2.5, -0.08]} castShadow receiveShadow>
        <boxGeometry args={[2.9, 4.3, 0.12]} />
        <meshStandardMaterial map={marbleTexture} roughness={0.25} metalness={0.05} />
      </mesh>

      {/* Label above door */}
      <mesh position={[0, 4.7, 0.1]}>
        <planeGeometry args={[2.8, 0.5]} />
        <meshBasicMaterial transparent>
          <primitive attach="map" object={createLabelTexture(doorData.key)} />
        </meshBasicMaterial>
      </mesh>

      {/* Left Door Panel */}
      <mesh
        ref={leftDoorRef}
        position={[-0.63, 2.5, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onDoorClick(doorData.key)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1.15, 4.0, 0.12]} />
        <meshStandardMaterial
          color="#B89968"
          metalness={0.65}
          roughness={0.25}
          emissive="#C9A972"
          emissiveIntensity={0.12}
        />
      </mesh>

      {/* Left door panels (decorative) */}
      <mesh position={[-0.63, 3.2, 0.07]} castShadow>
        <boxGeometry args={[0.85, 1.3, 0.04]} />
        <meshStandardMaterial color="#A88858" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[-0.63, 1.6, 0.07]} castShadow>
        <boxGeometry args={[0.85, 1.3, 0.04]} />
        <meshStandardMaterial color="#A88858" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Right Door Panel */}
      <mesh
        ref={rightDoorRef}
        position={[0.63, 2.5, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onDoorClick(doorData.key)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1.15, 4.0, 0.12]} />
        <meshStandardMaterial
          color="#B89968"
          metalness={0.65}
          roughness={0.25}
          emissive="#C9A972"
          emissiveIntensity={0.12}
        />
      </mesh>

      {/* Right door panels (decorative) */}
      <mesh position={[0.63, 3.2, 0.07]} castShadow>
        <boxGeometry args={[0.85, 1.3, 0.04]} />
        <meshStandardMaterial color="#A88858" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.63, 1.6, 0.07]} castShadow>
        <boxGeometry args={[0.85, 1.3, 0.04]} />
        <meshStandardMaterial color="#A88858" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Door handles */}
      <mesh position={[-0.3, 2.5, 0.12]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.15, 16]} />
        <meshStandardMaterial color="#8B7355" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.3, 2.5, 0.12]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.15, 16]} />
        <meshStandardMaterial color="#8B7355" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Subtle glow effect */}
      <mesh position={[0, 2.5, 0.14]} renderOrder={-1}>
        <planeGeometry args={[2.6, 4.2]} />
        <meshBasicMaterial
          color={doorData.color}
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
        />
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
  
  // Elegant engraved text style
  ctx.fillStyle = '#F5F3EF';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  
  // Handle text wrapping for long titles
  const maxWidth = canvas.width - 80;
  let fontSize = 72;
  ctx.font = `700 ${fontSize}px Cinzel, Georgia, serif`;
  
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
  while (lines.length > 2 && fontSize > 48) {
    fontSize -= 6;
    ctx.font = `700 ${fontSize}px Cinzel, Georgia, serif`;
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

function RotatingArtifact({ position, graniteTexture }: { 
  position: [number, number, number];
  graniteTexture: THREE.Texture;
}) {
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
        <meshStandardMaterial 
          map={graniteTexture} 
          roughness={0.15} 
          metalness={0.1} 
        />
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
  // Load all textures
  const backdropTexture = useTexture(backdropImage);
  const logoTexture = useTexture(schoolLogo);
  const carraraTexture = useTexture(carraraMarble);
  const floorTexture = useTexture(floorMarble);
  const wallTexture = useTexture(wallTravertine);
  const graniteTexture = useTexture(darkGranite);
  
  const particlesRef = useRef<THREE.Points>(null);
  const { camera } = useThree();
  
  // Configure marble textures for seamless tiling and quality
  useEffect(() => {
    [carraraTexture, floorTexture, wallTexture, graniteTexture].forEach(texture => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 4); // Tile for better detail
      texture.anisotropy = 16; // Maximum quality
      texture.colorSpace = THREE.SRGBColorSpace;
    });
    
    // Floor needs different repeat for larger tiles
    floorTexture.repeat.set(8, 8);
    
    // Walls need different repeat
    wallTexture.repeat.set(6, 3);
  }, [carraraTexture, floorTexture, wallTexture, graniteTexture]);
  
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
      {/* Lighting - Warm Museum Lighting */}
      <ambientLight intensity={0.45} color="#F5F0E8" />
      
      {/* Main directional light - dramatic side lighting */}
      <directionalLight
        position={[25, 28, -12]}
        intensity={2.8}
        color="#FFF8E7"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-radius={3}
        shadow-bias={-0.0001}
      />
      
      {/* Fill light from opposite side */}
      <directionalLight
        position={[-15, 20, -8]}
        intensity={0.8}
        color="#FFE8C5"
      />
      
      {/* Warm accent light */}
      <pointLight position={[0, 5, -6]} intensity={1.2} color="#FFD8A8" distance={15} decay={2} />

      {/* Floor - Polished Marble */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 160]} />
        <meshStandardMaterial 
          map={floorTexture}
          metalness={0.08} 
          roughness={0.15}
          envMapIntensity={0.5}
        />
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

      {/* Ceiling - Light colored */}
      <mesh position={[0, 7.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          map={wallTexture}
          metalness={0.0}
          roughness={0.6}
        />
      </mesh>

      {/* Backdrop wall with photo */}
      <mesh position={[0, backdropHeight * 0.5 - 1.0, -12]}>
        <planeGeometry args={[backdropWidth, backdropHeight]} />
        <meshStandardMaterial map={backdropTexture} roughness={1.0} metalness={0.0} />
      </mesh>

      {/* Side walls - Warm limestone */}
      <mesh position={[-12, 4, -2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial 
          map={wallTexture} 
          roughness={0.7} 
          metalness={0.0} 
        />
      </mesh>
      <mesh position={[12, 4, -2]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial 
          map={wallTexture} 
          roughness={0.7} 
          metalness={0.0} 
        />
      </mesh>

      {/* Back receiver wall - Warm limestone */}
      <mesh position={[0, 4, -9.2]} receiveShadow>
        <planeGeometry args={[40, 10]} />
        <meshStandardMaterial 
          map={wallTexture} 
          roughness={0.65} 
          metalness={0.0} 
        />
      </mesh>

      {/* Shadow plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -7.8]} receiveShadow>
        <planeGeometry args={[24, 8]} />
        <shadowMaterial opacity={0.25} />
      </mesh>

      {/* Doors */}
      {DOORS.map((door) => (
        <Door key={door.key} doorData={door} onDoorClick={onDoorClick} marbleTexture={carraraTexture} />
      ))}

      {/* Vitrines */}
      <RotatingArtifact position={[-4.2, 0, -3.0]} graniteTexture={graniteTexture} />
      <RotatingArtifact position={[4.2, 0, -3.0]} graniteTexture={graniteTexture} />

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
