import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import backdropImage from '@/assets/museum-backdrop.jpg';
import schoolLogo from '@/assets/school-of-law-logo.svg';
import marblePattern from '@/assets/textures/marble/marble-pattern.svg';

interface MuseumSceneProps {
  onDoorClick: (key: string) => void;
  onResetCamera?: () => void;
  selectedRoom?: string | null;
  onZoomComplete?: (roomKey: string) => void;
}

const DOORS = [
  { key: 'Alumni/Class Composites', angle: -60, radius: 9, color: '#c9a227' },
  { key: 'Publications (Amicus, Legal Eye, Law Review, Directory)', angle: -20, radius: 9, color: '#c9a227' },
  { key: 'Historical Photos/Archives', angle: 20, radius: 9, color: '#c9a227' },
  { key: 'Faculty & Staff', angle: 60, radius: 9, color: '#c9a227' },
];

function Door({ doorData, onDoorClick, marbleTexture }: { 
  doorData: typeof DOORS[0]; 
  onDoorClick: (key: string) => void;
  marbleTexture: THREE.Texture;
}) {
  const [hovered, setHovered] = useState(false);
  
  // Calculate position on semi-circle
  const angleRad = (doorData.angle * Math.PI) / 180;
  const x = doorData.radius * Math.sin(angleRad);
  const z = -doorData.radius * Math.cos(angleRad);
  const rotation = -angleRad; // Rotate to face center

  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
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

      {/* Floating title in center of entryway */}
      <mesh position={[0, 2.8, 0.2]}>
        <planeGeometry args={[2.6, 0.8]} />
        <meshBasicMaterial transparent>
          <primitive attach="map" object={createLabelTexture(doorData.key)} />
        </meshBasicMaterial>
      </mesh>

      {/* Inviting entrance portal - clickable area */}
      <mesh
        position={[0, 2.5, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onDoorClick(doorData.key)}
      >
        <planeGeometry args={[2.6, 4.2]} />
        <meshBasicMaterial
          transparent
          opacity={0}
        />
      </mesh>

      {/* Warm inviting glow from entryway - always visible */}
      <pointLight 
        position={[0, 2.5, -1]} 
        intensity={hovered ? 4.5 : 3.2} 
        color="#FFE8B8" 
        distance={7} 
        decay={2}
      />
      
      {/* Secondary warm light for depth */}
      <pointLight 
        position={[0, 3.5, -0.5]} 
        intensity={hovered ? 2.5 : 1.8} 
        color="#FFF5E1" 
        distance={5} 
        decay={2}
      />
      
      {/* Soft ambient glow effect - always visible */}
      <mesh position={[0, 2.5, -0.1]}>
        <planeGeometry args={[2.8, 4.4]} />
        <meshBasicMaterial
          color={doorData.color}
          transparent
          opacity={hovered ? 0.25 : 0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Additional glow layer for richness */}
      <mesh position={[0, 2.5, -0.2]}>
        <planeGeometry args={[2.4, 4.0]} />
        <meshBasicMaterial
          color="#FFF8DC"
          transparent
          opacity={hovered ? 0.2 : 0.12}
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
  canvas.height = 512;

  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Elegant glowing serif text
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(255, 232, 184, 0.8)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 0;
  
  // Handle text wrapping for long titles
  const maxWidth = canvas.width - 100;
  let fontSize = 80;
  ctx.font = `700 ${fontSize}px Georgia, "Times New Roman", serif`;
  
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
  while (lines.length > 2 && fontSize > 52) {
    fontSize -= 6;
    ctx.font = `700 ${fontSize}px Georgia, "Times New Roman", serif`;
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

export function MuseumScene({ onDoorClick, onResetCamera, selectedRoom, onZoomComplete }: MuseumSceneProps) {
  // Load all textures
  const backdropTexture = useTexture(backdropImage);
  const logoTexture = useTexture(schoolLogo);
  const marbleTexture = useTexture(marblePattern);
  
  const particlesRef = useRef<THREE.Points>(null);
  const { camera } = useThree();
  
  // Configure marble texture for seamless tiling and quality
  useEffect(() => {
    marbleTexture.wrapS = marbleTexture.wrapT = THREE.RepeatWrapping;
    marbleTexture.repeat.set(3, 3); // Better tiling for columns and walls
    marbleTexture.anisotropy = 16; // Maximum quality
    marbleTexture.colorSpace = THREE.SRGBColorSpace;
    marbleTexture.needsUpdate = true;
  }, [marbleTexture]);
  
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
    
    // Only animate camera when actively transitioning to/from a door
    if (isAnimating.current) {
      // Smooth camera transition with easing
      const lerpFactor = 1 - Math.pow(0.001, delta); // Smooth easing
      camera.position.lerp(targetCameraPos.current, lerpFactor);
      
      // Check if animation is complete
      const distance = camera.position.distanceTo(targetCameraPos.current);
      if (distance < 0.01) {
        isAnimating.current = false;
        // Update target to current position to prevent snapping back
        targetCameraPos.current.copy(camera.position);
        if (selectedRoom && !hasNotifiedComplete.current && onZoomComplete) {
          hasNotifiedComplete.current = true;
          onZoomComplete(selectedRoom);
        }
      }
    }
  });
  
  // Update target position when room selection changes
  useEffect(() => {
    if (selectedRoom) {
      // Find the door and zoom into it
      const door = DOORS.find(d => d.key === selectedRoom);
      if (door) {
        const angleRad = (door.angle * Math.PI) / 180;
        const x = door.radius * Math.sin(angleRad);
        const z = -door.radius * Math.cos(angleRad) + 3.5; // Zoom close to entryway
        targetCameraPos.current.set(x, 1.8, z);
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
          map={marbleTexture}
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
          map={marbleTexture}
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
          map={marbleTexture} 
          roughness={0.7} 
          metalness={0.0} 
        />
      </mesh>
      <mesh position={[12, 4, -2]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial 
          map={marbleTexture} 
          roughness={0.7} 
          metalness={0.0} 
        />
      </mesh>

      {/* Back receiver wall - Warm limestone */}
      <mesh position={[0, 4, -9.2]} receiveShadow>
        <planeGeometry args={[40, 10]} />
        <meshStandardMaterial 
          map={marbleTexture} 
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
        <Door key={door.key} doorData={door} onDoorClick={onDoorClick} marbleTexture={marbleTexture} />
      ))}

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
