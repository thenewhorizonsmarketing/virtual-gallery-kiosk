import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useResponsive } from '@/hooks/useResponsive';
import { RotundaGeometry } from './RotundaGeometry';
import { DOORWAYS, type Doorway } from '@/data/doorways';
import { enableDoorwayInteractions } from '@/lib/scene/doorways';

interface MuseumSceneProps {
  onDoorClick: (door: Doorway) => void;
  onResetCamera?: () => void;
  selectedRoom?: string | null;
  onZoomComplete?: (roomKey: string) => void;
  navigateToPath?: (path: string) => void;
}

// Helper function to calculate niche positions in rotunda
const calculateNichePosition = (angle: number, radius: number = 9): [number, number, number] => {
  return [
    Math.cos(angle) * radius,
    2.5,
    Math.sin(angle) * radius
  ];
};

// Augment doorway metadata with positions and rotations for 3D interaction
const DOORS = DOORWAYS.map((door) => ({
  ...door,
  position: calculateNichePosition(door.angle),
  rotation: [0, (door.angle + Math.PI) % (Math.PI * 2), 0] as [number, number, number],
}));

export function MuseumScene({ onDoorClick, onResetCamera, selectedRoom, onZoomComplete, navigateToPath }: MuseumSceneProps) {
  const responsive = useResponsive();

  const particlesRef = useRef<THREE.Points>(null);
  const controlsRef = useRef<any>(null);
  const { camera, gl, scene } = useThree();

  const initialCameraPos = useRef(new THREE.Vector3(3, 2.5, 0));
  const initialLookTarget = useRef(new THREE.Vector3(-9, 2.5, 0));
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

  useEffect(() => {
    if (!gl?.domElement || !scene) {
      return;
    }

    const cleanup = enableDoorwayInteractions({
      canvas: gl.domElement,
      sceneRoot: scene,
      camera,
      navigate: navigateToPath,
      onDoorActivated: (doorKey) => {
        const door = DOORWAYS.find((entry) => entry.shortTitle.toLowerCase() === doorKey.toLowerCase());
        if (door) {
          onDoorClick(door);
          if (responsive.isMobile && 'vibrate' in navigator) {
            navigator.vibrate(50);
          }
        }
      },
    });

    return () => {
      cleanup?.();
    };
  }, [camera, gl, scene, navigateToPath, onDoorClick, responsive.isMobile]);

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
    // Ignore clicks during animation to prevent overlapping paths
    if (isAnimatingRef.current) return;

    const startAnimation = (points: THREE.Vector3[], lookTarget: THREE.Vector3, duration: number) => {
      animationCurve.current = new THREE.CatmullRomCurve3(points);
      animationCurve.current.curveType = 'catmullrom';
      animationCurve.current.tension = 0.5;
      animationProgress.current = 0;
      animationDuration.current = duration;
      animationLookTarget.current.copy(lookTarget);
      isAnimatingRef.current = true;
      setIsAnimating(true);
    };

    if (selectedRoom) {
      const door = DOORS.find(d => d.key === selectedRoom);
      if (door) {
        const start = camera.position.clone();
        const doorDirection = new THREE.Vector3(door.position[0], 0, door.position[2]).normalize();
        
        // Calculate distance and angle safely
        const horizontalDistanceFromCenter = Math.hypot(start.x, start.z);
        let angleToTarget = 0;
        
        if (horizontalDistanceFromCenter >= 0.25) {
          const currentRadial = new THREE.Vector3(start.x, 0, start.z).normalize();
          angleToTarget = currentRadial.angleTo(doorDirection);
        }
        
        const approachDistance = 4.5;
        const thresholdDistance = 9.5;
        const exitDistance = 12;

        const approachPoint = doorDirection.clone().multiplyScalar(approachDistance).add(new THREE.Vector3(0, 2.5, 0));
        const doorwayPoint = doorDirection.clone().multiplyScalar(thresholdDistance).add(new THREE.Vector3(0, 2.5, 0));
        const exitPoint = doorDirection.clone().multiplyScalar(exitDistance).add(new THREE.Vector3(0, 2.5, 0));
        
        // Route through center only if far from center or on opposite side
        const needsCenterTransit = horizontalDistanceFromCenter > 6 || angleToTarget > Math.PI * 0.5;

        const points = needsCenterTransit
          ? [
              start.clone(),
              new THREE.Vector3(0, 2.8, 0),
              approachPoint,
              doorwayPoint,
              exitPoint,
            ]
          : [
              start.clone(),
              start.clone().add(new THREE.Vector3(0, 0.4, 0)),
              approachPoint,
              doorwayPoint,
              exitPoint,
            ];

        const lookTarget = doorDirection.clone().multiplyScalar(exitDistance + 2).add(new THREE.Vector3(0, 2.5, 0));

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
        enablePan={false}
        enableZoom={true}
        minDistance={0.01}
        maxDistance={15}
        minPolarAngle={Math.PI * 0.4}
        maxPolarAngle={Math.PI * 0.6}
        rotateSpeed={responsive.isMobile ? 0.7 : 0.5}
        enableDamping
        dampingFactor={responsive.isMobile ? 0.08 : 0.06}
        makeDefault
      />
    </>
  );
}
