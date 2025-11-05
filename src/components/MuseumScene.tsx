import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useResponsive } from '@/hooks/useResponsive';
import { RotundaGeometry } from './RotundaGeometry';

interface MuseumSceneProps {
  onDoorClick: (key: string) => void;
  onResetCamera?: () => void;
  selectedRoom?: string | null;
  onZoomComplete?: (roomKey: string) => void;
}

// Helper function to calculate niche positions in rotunda
const calculateNichePosition = (angle: number, radius: number = 9): [number, number, number] => {
  return [
    Math.cos(angle) * radius,
    2.5,
    Math.sin(angle) * radius
  ];
};

// Niche positions for clickable areas (4 main display niches in rotunda)
const DOORS = [
  { 
    key: 'Alumni/Class Composites', 
    position: calculateNichePosition(0), 
    rotation: [0, Math.PI, 0] as [number, number, number] 
  },
  { 
    key: 'Publications (Amicus, Legal Eye, Law Review, Directory)', 
    position: calculateNichePosition(Math.PI / 2), 
    rotation: [0, -Math.PI / 2, 0] as [number, number, number] 
  },
  { 
    key: 'Historical Photos/Archives', 
    position: calculateNichePosition(Math.PI), 
    rotation: [0, 0, 0] as [number, number, number] 
  },
  { 
    key: 'Faculty & Staff', 
    position: calculateNichePosition(Math.PI * 1.5), 
    rotation: [0, Math.PI / 2, 0] as [number, number, number] 
  },
];

export function MuseumScene({ onDoorClick, onResetCamera, selectedRoom, onZoomComplete }: MuseumSceneProps) {
  const responsive = useResponsive();
  
  const particlesRef = useRef<THREE.Points>(null);
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  const initialCameraPos = useRef(new THREE.Vector3(-2.6, 2.8, 5.2));
  const initialLookTarget = useRef(new THREE.Vector3(-0.6, 2.5, 0.4));
  const animationCurve = useRef<THREE.CatmullRomCurve3 | null>(null);
  const animationProgress = useRef(0);
  const animationDuration = useRef(3);
  const animationLookTarget = useRef(initialLookTarget.current.clone());
  const isAnimatingRef = useRef(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const hasNotifiedComplete = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (particlesRef.current) {
        particlesRef.current.geometry.dispose();
        (particlesRef.current.material as THREE.Material).dispose();
      }
    };
  }, []);

  useEffect(() => {
    camera.position.copy(initialCameraPos.current);
    camera.lookAt(initialLookTarget.current);

    if (controlsRef.current) {
      controlsRef.current.target.copy(initialLookTarget.current);
      controlsRef.current.update();
    }
  }, [camera]);

  const particlesGeometry = useMemo(() => {
    const count = responsive.particleCount;
    const positions = new Float32Array(count * 3);
    const rotundaRadius = 10;
    
    for (let i = 0; i < count; i++) {
      // Distribute particles in cylindrical volume (rotunda shape)
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * rotundaRadius;
      positions[i * 3] = Math.cos(angle) * radius; // x
      positions[i * 3 + 1] = Math.random() * 8; // y - from floor to dome
      positions[i * 3 + 2] = Math.sin(angle) * radius; // z
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [responsive.particleCount]);

  // Handle camera zoom animations and particle movement
  useFrame((state, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.01;
      
      // Animate dust motes floating up in light shafts
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += delta * 0.03; // Slower drift for dust motes
        
        // Subtle circular drift
        positions[i] += Math.sin(positions[i + 1] * 0.5) * delta * 0.02;
        positions[i + 2] += Math.cos(positions[i + 1] * 0.5) * delta * 0.02;
        
        // Reset particle when it reaches dome
        if (positions[i + 1] > 8) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 10;
          positions[i] = Math.cos(angle) * radius;
          positions[i + 1] = 0;
          positions[i + 2] = Math.sin(angle) * radius;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
    
    // Only animate camera when actively transitioning to/from a door
    if (isAnimatingRef.current && animationCurve.current) {
      animationProgress.current += delta / animationDuration.current;
      const t = Math.min(animationProgress.current, 1);

      const newPosition = animationCurve.current.getPoint(t);
      camera.position.copy(newPosition);

      if (controlsRef.current) {
        const lerpFactor = 1 - Math.pow(0.001, delta);
        controlsRef.current.target.lerp(animationLookTarget.current, lerpFactor);
        controlsRef.current.update();
      } else {
        camera.lookAt(animationLookTarget.current);
      }

      if (t >= 1) {
        isAnimatingRef.current = false;
        setIsAnimating(false);

        if (controlsRef.current) {
          controlsRef.current.target.copy(animationLookTarget.current);
          controlsRef.current.update();
        }

        if (selectedRoom && !hasNotifiedComplete.current && onZoomComplete) {
          hasNotifiedComplete.current = true;
          onZoomComplete(selectedRoom);
        }
      }
    }
  });

  useEffect(() => {
    const startAnimation = (points: THREE.Vector3[], lookTarget: THREE.Vector3, duration: number) => {
      animationCurve.current = new THREE.CatmullRomCurve3(points);
      animationCurve.current.curveType = 'catmullrom';
      animationCurve.current.tension = 0.6;
      animationProgress.current = 0;
      animationDuration.current = duration;
      animationLookTarget.current.copy(lookTarget);
      isAnimatingRef.current = true;
      setIsAnimating(true);
    };

    if (selectedRoom) {
      const door = DOORS.find(d => d.key === selectedRoom);
      if (door) {
        const doorDirection = new THREE.Vector3(door.position[0], 0, door.position[2]).normalize();
        const start = camera.position.clone();
        const liftOffset = new THREE.Vector3(0, 0.4, 0);

        const approachDistance = 4.5;
        const thresholdDistance = 9.5;
        const exitDistance = 12;

        const approachPoint = doorDirection.clone().multiplyScalar(approachDistance).add(new THREE.Vector3(0, 2.4, 0));
        const doorwayPoint = doorDirection.clone().multiplyScalar(thresholdDistance).add(new THREE.Vector3(0, 2.2, 0));
        const exitPoint = doorDirection.clone().multiplyScalar(exitDistance).add(new THREE.Vector3(0, 2.1, 0));

        const points = [
          start.clone(),
          start.clone().add(liftOffset),
          approachPoint,
          doorwayPoint,
          exitPoint,
        ];

        const lookTarget = doorDirection.clone().multiplyScalar(exitDistance + 2).add(new THREE.Vector3(0, 2.2, 0));

        startAnimation(points, lookTarget, responsive.isMobile ? 3.8 : 3.2);
        hasNotifiedComplete.current = false;
      }
    } else {
      const distance = camera.position.distanceTo(initialCameraPos.current);
      if (distance > 0.5) {
        const start = camera.position.clone();
        const mid = start.clone().lerp(initialCameraPos.current, 0.5).add(new THREE.Vector3(0, 0.6, 0));
        const points = [start, mid, initialCameraPos.current.clone()];
        const lookTarget = initialLookTarget.current.clone();

        startAnimation(points, lookTarget, responsive.isMobile ? 2.6 : 2.2);
        hasNotifiedComplete.current = false;
      }
    }
  }, [selectedRoom, camera, responsive.isMobile]);

  return (
    <>
      {/* Natural daylight from oculus */}
      <directionalLight
        position={[0, 15, 0]}
        intensity={3.5}
        color="#FFF5E1"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
        shadow-bias={-0.0001}
      />
      
      {/* Warm fill lights around columns */}
      <pointLight position={[-7, 3, 7]} intensity={0.4} color="#FFE4C4" distance={15} decay={2} />
      <pointLight position={[7, 3, 7]} intensity={0.4} color="#FFE4C4" distance={15} decay={2} />
      <pointLight position={[-7, 3, -7]} intensity={0.4} color="#FFE4C4" distance={15} decay={2} />
      <pointLight position={[7, 3, -7]} intensity={0.4} color="#FFE4C4" distance={15} decay={2} />
      
      {/* Low ambient base light */}
      <ambientLight intensity={0.15} color="#E8E8F0" />
      
      {/* Hemisphere light for natural sky dome effect */}
      <hemisphereLight 
        color="#E8F4FF"
        groundColor="#8B7355"
        intensity={0.5}
        position={[0, 10, 0]}
      />
      
      {/* Accent spotlights in niches */}
      {DOORS.map((door) => (
        <spotLight
          key={`spotlight-${door.key}`}
          position={[door.position[0] * 0.7, 4, door.position[2] * 0.7]}
          target-position={door.position}
          intensity={0.8}
          angle={0.5}
          penumbra={0.7}
          color="#FFFFFF"
          distance={15}
          decay={2}
        />
      ))}

      {/* Procedural Rotunda Geometry */}
      <RotundaGeometry radius={10} columnCount={12} />

      {/* Invisible clickable door areas - larger on mobile */}
      {DOORS.map((door) => (
        <mesh
          key={door.key}
          position={[door.position[0], responsive.isMobile ? 3.2 : 3, door.position[2]]}
          rotation={door.rotation}
          onClick={(e) => {
            e.stopPropagation();
            onDoorClick(door.key);
            // Haptic feedback on mobile
            if (responsive.isMobile && 'vibrate' in navigator) {
              navigator.vibrate(50);
            }
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            if (!responsive.isMobile) {
              document.body.style.cursor = 'pointer';
            }
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'default';
          }}
        >
          <planeGeometry args={responsive.isMobile ? [3.2, 6.8] : [2.6, 6]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} />
        </mesh>
      ))}

      {/* Atmospheric dust particles */}
      <points ref={particlesRef}>
        <bufferGeometry {...particlesGeometry} />
        <pointsMaterial
          size={0.025}
          color="#FFF8E8"
          transparent
          opacity={0.25}
          depthWrite={false}
          sizeAttenuation={true}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <OrbitControls
        ref={controlsRef}
        enabled={!isAnimating}
        target={[initialLookTarget.current.x, initialLookTarget.current.y, initialLookTarget.current.z]}
        enablePan={false}
        enableZoom={true}
        minDistance={0.01}
        maxDistance={15}
        minPolarAngle={Math.PI * 0.45}
        maxPolarAngle={Math.PI * 0.55}
        rotateSpeed={responsive.isMobile ? 0.7 : 0.5}
        enableDamping
        dampingFactor={responsive.isMobile ? 0.08 : 0.06}
        makeDefault
      />
    </>
  );
}
