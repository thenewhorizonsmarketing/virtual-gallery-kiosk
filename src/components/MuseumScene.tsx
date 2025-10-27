import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import backdropImage from '@/assets/museum-scene.svg';
import schoolLogo from '@/assets/school-of-law-logo.svg';
import marblePattern from '@/assets/textures/marble/marble-pattern.svg';
import museumWall from '@/assets/museum-wall.png';
import backWallImage from '@/assets/museum-back-wall.png';

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
      <group position={[-1.05, 1.8, 0]}>
        {/* Column shaft with flutes */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.14, 0.16, 3.0, 24]} />
          <meshStandardMaterial 
            map={marbleTexture}
            roughness={0.25}
            metalness={0.05}
          />
        </mesh>
        {/* Column base */}
        <mesh position={[0, -1.65, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.18, 0.22, 0.25, 24]} />
          <meshStandardMaterial map={marbleTexture} roughness={0.3} metalness={0.05} />
        </mesh>
        {/* Column capital */}
        <mesh position={[0, 1.65, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.22, 0.16, 0.3, 24]} />
          <meshStandardMaterial map={marbleTexture} roughness={0.25} metalness={0.05} />
        </mesh>
      </group>

      {/* Right Column with fluting */}
      <group position={[1.05, 1.8, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.14, 0.16, 3.0, 24]} />
          <meshStandardMaterial 
            map={marbleTexture}
            roughness={0.25}
            metalness={0.05}
          />
        </mesh>
        <mesh position={[0, -1.65, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.18, 0.22, 0.25, 24]} />
          <meshStandardMaterial map={marbleTexture} roughness={0.3} metalness={0.05} />
        </mesh>
        <mesh position={[0, 1.65, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.22, 0.16, 0.3, 24]} />
          <meshStandardMaterial map={marbleTexture} roughness={0.25} metalness={0.05} />
        </mesh>
      </group>

      {/* Entablature (top architectural element) */}
      <mesh position={[0, 3.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.18, 0.28]} />
        <meshStandardMaterial map={marbleTexture} roughness={0.2} metalness={0.05} />
      </mesh>
      <mesh position={[0, 3.73, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.55, 0.16, 0.32]} />
        <meshStandardMaterial map={marbleTexture} roughness={0.25} metalness={0.05} />
      </mesh>

      {/* Door frame surround */}
      <mesh position={[0, 1.8, -0.06]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 3.1, 0.09]} />
        <meshStandardMaterial map={marbleTexture} roughness={0.25} metalness={0.05} />
      </mesh>

      {/* Floating title in center of entryway - large and prominent */}
      <mesh position={[0, 1.8, 0.25]}>
        <planeGeometry args={[1.7, 2.3]} />
        <meshBasicMaterial transparent>
          <primitive attach="map" object={createLabelTexture(doorData.key)} />
        </meshBasicMaterial>
      </mesh>

      {/* Inviting entrance portal - clickable area */}
      <mesh
        position={[0, 1.8, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onDoorClick(doorData.key)}
      >
        <planeGeometry args={[2.0, 3.0]} />
        <meshBasicMaterial
          transparent
          opacity={0}
        />
      </mesh>

      {/* Warm inviting glow from entryway - always visible */}
      <pointLight 
        position={[0, 1.8, -1]} 
        intensity={hovered ? 4.5 : 3.2} 
        color="#FFE8B8" 
        distance={6} 
        decay={2}
      />
      
      {/* Secondary warm light for depth */}
      <pointLight 
        position={[0, 2.5, -0.5]} 
        intensity={hovered ? 2.5 : 1.8} 
        color="#FFF5E1" 
        distance={4.5} 
        decay={2}
      />
      
      {/* Soft ambient glow effect - always visible */}
      <mesh position={[0, 1.8, -0.1]}>
        <planeGeometry args={[2.1, 3.2]} />
        <meshBasicMaterial
          color={doorData.color}
          transparent
          opacity={hovered ? 0.25 : 0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Additional glow layer for richness */}
      <mesh position={[0, 1.8, -0.2]}>
        <planeGeometry args={[1.85, 2.9]} />
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
  canvas.width = 2048;
  canvas.height = 2048;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Elegant glowing serif text - large and prominent
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(255, 232, 184, 0.95)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // Handle text wrapping for long titles with proper margins
  const margin = 180;
  const maxWidth = canvas.width - (margin * 2);
  let fontSize = 240;
  ctx.font = `700 ${fontSize}px Georgia, "Times New Roman", serif`;
  
  const words = text.split(' ');
  let lines: string[] = [];
  let currentLine = '';
  
  // Function to calculate lines with current font size
  const calculateLines = () => {
    lines = [];
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
  };
  
  calculateLines();
  
  // Adjust font size to fit properly - ensure text doesn't overflow
  const maxLines = 5;
  const lineHeightFactor = 1.3;
  
  while ((lines.length > maxLines || (lines.length * fontSize * lineHeightFactor) > (canvas.height - margin * 2)) && fontSize > 80) {
    fontSize -= 8;
    ctx.font = `700 ${fontSize}px Georgia, "Times New Roman", serif`;
    calculateLines();
  }
  
  // Final calculation with optimized size
  const lineHeight = fontSize * lineHeightFactor;
  const totalTextHeight = lines.length * lineHeight;
  const startY = canvas.height / 2 - (totalTextHeight / 2) + (lineHeight / 2);
  
  // Draw text with glow effect
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(255, 232, 184, 0.95)';
  ctx.shadowBlur = 30;
  
  lines.forEach((line, i) => {
    const y = startY + (i * lineHeight);
    ctx.fillText(line, canvas.width / 2, y);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

// Helper to create bookshelf
function Bookshelf({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const bookColors = ['#8B0000', '#00008B', '#006400', '#8B4513', '#483D8B', '#B8860B', '#2F4F4F'];
  
  return (
    <group position={position} rotation={rotation}>
      {/* Bookshelf frame */}
      <mesh>
        <boxGeometry args={[2.5, 3, 0.4]} />
        <meshStandardMaterial color="#8B6F47" roughness={0.7} />
      </mesh>
      
      {/* Shelves */}
      {[0, 1, 2, 3, 4].map((shelf) => (
        <group key={shelf} position={[0, 1.2 - shelf * 0.6, 0]}>
          <mesh position={[0, 0, 0.15]}>
            <boxGeometry args={[2.3, 0.05, 0.3]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
          
          {/* Books on shelf */}
          {Array.from({ length: 12 }).map((_, i) => (
            <mesh key={i} position={[-1.0 + i * 0.19, 0.2, 0.15]}>
              <boxGeometry args={[0.15, 0.4, 0.25]} />
              <meshStandardMaterial 
                color={bookColors[Math.floor(Math.random() * bookColors.length)]} 
                roughness={0.8}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// Helper to create chandelier
function Chandelier({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Central column */}
      <mesh>
        <cylinderGeometry args={[0.08, 0.08, 1.5, 8]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Crystal arms */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i * Math.PI * 2) / 6;
        const x = Math.cos(angle) * 0.6;
        const z = Math.sin(angle) * 0.6;
        return (
          <group key={i} position={[x, -0.5, z]}>
            <mesh>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial 
                color="#FFFFFF" 
                metalness={0.1} 
                roughness={0.0}
                transparent
                opacity={0.9}
                emissive="#FFE8B8"
                emissiveIntensity={0.5}
              />
            </mesh>
            <pointLight color="#FFE8B8" intensity={1.5} distance={8} decay={2} />
          </group>
        );
      })}
      
      {/* Main chandelier light */}
      <pointLight position={[0, -0.8, 0]} color="#FFF5E1" intensity={2.5} distance={12} decay={2} />
    </group>
  );
}

// Helper to create arched window
function ArchedWindow({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Window frame */}
      <mesh>
        <boxGeometry args={[2.2, 4.5, 0.2]} />
        <meshStandardMaterial color="#D4C5A9" roughness={0.6} />
      </mesh>
      
      {/* Glass panes */}
      {[0, 1, 2].map((col) => 
        [0, 1, 2, 3, 4].map((row) => (
          <mesh key={`${col}-${row}`} position={[-0.6 + col * 0.6, 1.5 - row * 0.7, 0.11]}>
            <planeGeometry args={[0.5, 0.6]} />
            <meshStandardMaterial 
              color="#E8F4F8" 
              transparent 
              opacity={0.3}
              roughness={0.1}
              metalness={0.1}
            />
          </mesh>
        ))
      )}
      
      {/* Arch top */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 0.2, 32, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#D4C5A9" roughness={0.6} />
      </mesh>
      
      {/* Window light */}
      <pointLight position={[0, 1, 0.5]} color="#FFF8E7" intensity={2} distance={6} />
    </group>
  );
}

export function MuseumScene({ onDoorClick, onResetCamera, selectedRoom, onZoomComplete }: MuseumSceneProps) {
  // Load all textures
  const backdropTexture = useTexture(backdropImage);
  const logoTexture = useTexture(schoolLogo);
  const marbleTexture = useTexture(marblePattern);
  const wallTexture = useTexture(museumWall);
  const backWallTexture = useTexture(backWallImage);
  
  const particlesRef = useRef<THREE.Points>(null);
  const { camera } = useThree();
  
  // Configure marble texture for seamless tiling and quality
  useEffect(() => {
    marbleTexture.wrapS = marbleTexture.wrapT = THREE.RepeatWrapping;
    marbleTexture.repeat.set(3, 3);
    marbleTexture.anisotropy = 16;
    marbleTexture.colorSpace = THREE.SRGBColorSpace;
    marbleTexture.needsUpdate = true;
    
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(2, 1);
    wallTexture.anisotropy = 16;
    wallTexture.colorSpace = THREE.SRGBColorSpace;
    wallTexture.needsUpdate = true;
    
    backWallTexture.wrapS = backWallTexture.wrapT = THREE.ClampToEdgeWrapping;
    backWallTexture.anisotropy = 16;
    backWallTexture.colorSpace = THREE.SRGBColorSpace;
    backWallTexture.needsUpdate = true;
  }, [marbleTexture, wallTexture, backWallTexture]);
  
  // Store initial camera position
  const initialCameraPos = useRef(new THREE.Vector3(0, 1.8, 8.5));
  const targetCameraPos = useRef(new THREE.Vector3(0, 1.8, 8.5));
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
  const logoWidth = 6;
  const logoHeight = logoWidth / logoAspect;

  return (
    <>
      {/* Bright natural lighting from windows */}
      <ambientLight intensity={1.2} color="#FFF8F0" />
      
      {/* Main sunlight from windows - left side */}
      <directionalLight
        position={[-20, 15, -5]}
        intensity={3.5}
        color="#FFF8E7"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-near={1}
        shadow-camera-far={100}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-radius={2}
        shadow-bias={-0.0001}
      />
      
      {/* Sunlight from right side windows */}
      <directionalLight
        position={[20, 15, -5]}
        intensity={3.0}
        color="#FFF8E7"
      />
      
      {/* Fill light from above */}
      <directionalLight
        position={[0, 25, -10]}
        intensity={1.5}
        color="#FFF5E8"
      />

      {/* Floor - Polished wood/carpet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 160]} />
        <meshStandardMaterial 
          color="#8B7355"
          metalness={0.0} 
          roughness={0.8}
        />
      </mesh>

      {/* Barrel vaulted ceiling - wooden planks */}
      {Array.from({ length: 40 }).map((_, i) => {
        const angle = (i / 40) * Math.PI - Math.PI / 2;
        const radius = 12;
        const y = radius * Math.sin(angle) + radius + 0.5;
        const z = radius * Math.cos(angle) - 8;
        return (
          <mesh 
            key={i} 
            position={[0, y, z]} 
            rotation={[-angle, 0, 0]}
          >
            <boxGeometry args={[28, 0.15, 1.2]} />
            <meshStandardMaterial 
              color="#8B4513" 
              roughness={0.7}
              metalness={0.0}
            />
          </mesh>
        );
      })}

      {/* Barrel vault ribs */}
      {[-12, -6, 0, 6, 12].map((x) => 
        Array.from({ length: 20 }).map((_, i) => {
          const angle = (i / 20) * Math.PI - Math.PI / 2;
          const radius = 12;
          const y = radius * Math.sin(angle) + radius + 0.5;
          const z = radius * Math.cos(angle) - 8;
          return (
            <mesh 
              key={`${x}-${i}`}
              position={[x, y, z]} 
              rotation={[-angle, 0, 0]}
            >
              <boxGeometry args={[0.3, 0.2, 1.2]} />
              <meshStandardMaterial color="#654321" roughness={0.6} />
            </mesh>
          );
        })
      )}

      {/* Stone walls with arched alcoves - Left side */}
      <group position={[-13, 0, -8]}>
        {/* Main wall */}
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[35, 15]} />
          <meshStandardMaterial color="#D4C5A9" roughness={0.8} />
        </mesh>
        
        {/* Columns */}
        {[-10, -5, 0, 5, 10].map((z) => (
          <mesh key={z} position={[0.5, 4, z]}>
            <cylinderGeometry args={[0.5, 0.6, 8, 16]} />
            <meshStandardMaterial color="#C4B5A0" roughness={0.6} />
          </mesh>
        ))}
        
        {/* Arched windows */}
        <ArchedWindow position={[0.8, 5, -7.5]} rotation={[0, Math.PI / 2, 0]} />
        <ArchedWindow position={[0.8, 5, -2.5]} rotation={[0, Math.PI / 2, 0]} />
        <ArchedWindow position={[0.8, 5, 2.5]} rotation={[0, Math.PI / 2, 0]} />
        <ArchedWindow position={[0.8, 5, 7.5]} rotation={[0, Math.PI / 2, 0]} />
      </group>

      {/* Stone walls with arched alcoves - Right side */}
      <group position={[13, 0, -8]}>
        {/* Main wall */}
        <mesh rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[35, 15]} />
          <meshStandardMaterial color="#D4C5A9" roughness={0.8} />
        </mesh>
        
        {/* Columns */}
        {[-10, -5, 0, 5, 10].map((z) => (
          <mesh key={z} position={[-0.5, 4, z]}>
            <cylinderGeometry args={[0.5, 0.6, 8, 16]} />
            <meshStandardMaterial color="#C4B5A0" roughness={0.6} />
          </mesh>
        ))}
        
        {/* Arched windows */}
        <ArchedWindow position={[-0.8, 5, -7.5]} rotation={[0, -Math.PI / 2, 0]} />
        <ArchedWindow position={[-0.8, 5, -2.5]} rotation={[0, -Math.PI / 2, 0]} />
        <ArchedWindow position={[-0.8, 5, 2.5]} rotation={[0, -Math.PI / 2, 0]} />
        <ArchedWindow position={[-0.8, 5, 7.5]} rotation={[0, -Math.PI / 2, 0]} />
      </group>

      {/* Back wall with large arched window */}
      <group position={[0, 0, -25]}>
        <mesh>
          <planeGeometry args={[28, 15]} />
          <meshStandardMaterial color="#D4C5A9" roughness={0.8} />
        </mesh>
        <ArchedWindow position={[0, 6, 0.5]} />
      </group>

      {/* Bookshelves - Left side */}
      {[-10, -5, 0, 5].map((z) => (
        <Bookshelf key={`left-${z}`} position={[-11, 1.5, z]} rotation={[0, Math.PI / 2, 0]} />
      ))}

      {/* Bookshelves - Right side */}
      {[-10, -5, 0, 5].map((z) => (
        <Bookshelf key={`right-${z}`} position={[11, 1.5, z]} rotation={[0, -Math.PI / 2, 0]} />
      ))}

      {/* Reading tables down center */}
      {[-10, -5, 0, 5, 10].map((z) => (
        <group key={`table-${z}`} position={[0, 0, z]}>
          {/* Table */}
          <mesh position={[0, 0.9, 0]}>
            <boxGeometry args={[6, 0.1, 2]} />
            <meshStandardMaterial color="#8B6F47" roughness={0.6} />
          </mesh>
          {/* Table legs */}
          {[[-2.5, -0.8], [2.5, -0.8], [-2.5, 0.8], [2.5, 0.8]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.45, z]}>
              <cylinderGeometry args={[0.08, 0.08, 0.9, 8]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
          ))}
          
          {/* Chairs */}
          {[-3, -1.5, 1.5, 3].map((x) => (
            <group key={`chair-${x}`} position={[x, 0.5, x > 0 ? 1.5 : -1.5]} rotation={[0, x > 0 ? Math.PI : 0, 0]}>
              {/* Seat */}
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.5, 0.05, 0.5]} />
                <meshStandardMaterial color="#8B6F47" />
              </mesh>
              {/* Back */}
              <mesh position={[0, 0.4, -0.2]}>
                <boxGeometry args={[0.5, 0.7, 0.05]} />
                <meshStandardMaterial color="#8B6F47" />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* Crystal chandeliers */}
      <Chandelier position={[0, 11.5, -15]} />
      <Chandelier position={[0, 11.5, -5]} />
      <Chandelier position={[0, 11.5, 5]} />

      {/* Doors - now integrated into the library */}
      {DOORS.map((door) => (
        <Door key={door.key} doorData={door} onDoorClick={onDoorClick} marbleTexture={marbleTexture} />
      ))}

      {/* Dust particles in light rays */}
      <points ref={particlesRef}>
        <bufferGeometry {...particlesGeometry} />
        <pointsMaterial
          size={0.012}
          color={0xffffff}
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </points>

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.48}
        rotateSpeed={0.5}
        enableDamping
        dampingFactor={0.06}
        makeDefault
      />
    </>
  );
}
