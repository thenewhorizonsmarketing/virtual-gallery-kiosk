import * as THREE from 'three';
import { DOORWAYS } from '@/data/doorways';

export type DoorKey = 'Alumni' | 'Publications' | 'Archives' | 'Faculty';

export const DOOR_LINKS: Record<DoorKey, string> = {
  Alumni: '/alumni',
  Publications: '/publications',
  Archives: '/archives',
  Faculty: '/faculty',
};

export interface DoorwayTarget {
  key: DoorKey;
  hitbox: THREE.Object3D;
  label?: THREE.Object3D;
}

const DOOR_RADIUS = 9;
const HITBOX_SIZE = new THREE.Vector3(3.8, 7.2, 0.6);

const DOOR_NAME_LOOKUP: Partial<Record<DoorKey, string>> = {
  Alumni: 'alumni',
  Publications: 'publications',
  Archives: 'archives',
  Faculty: 'faculty',
};

function calculateDoorPosition(angle: number, radius: number = DOOR_RADIUS) {
  return new THREE.Vector3(
    Math.cos(angle) * radius,
    3.2,
    Math.sin(angle) * radius,
  );
}

function findObjectsByName(root: THREE.Object3D, fragment: string) {
  const matches: THREE.Object3D[] = [];
  root.traverse((obj) => {
    if (!obj.name) return;
    if (obj.name.toLowerCase().includes(fragment.toLowerCase())) {
      matches.push(obj);
    }
  });
  return matches;
}

function findLabelForDoor(root: THREE.Object3D, key: DoorKey) {
  let label: THREE.Object3D | undefined;
  const needle = key.toLowerCase();
  root.traverse((obj) => {
    const directName = obj.name?.toLowerCase();
    const userDataText = typeof obj.userData?.doorKey === 'string'
      ? String(obj.userData.doorKey).toLowerCase()
      : typeof obj.userData?.text === 'string'
        ? String(obj.userData.text).toLowerCase()
        : undefined;
    const textContent = typeof (obj as any).text === 'string'
      ? String((obj as any).text).toLowerCase()
      : undefined;

    if (directName === needle || userDataText === needle || textContent === needle) {
      label = obj;
    }
  });
  return label;
}

export function buildDoorwayTargets(root: THREE.Object3D): DoorwayTarget[] {
  const targets: DoorwayTarget[] = [];

  (Object.keys(DOOR_LINKS) as DoorKey[]).forEach((key) => {
    const doorwayConfig = DOORWAYS.find((door) => door.shortTitle.toLowerCase() === key.toLowerCase());
    if (!doorwayConfig) {
      return;
    }

    const label = findLabelForDoor(root, key);
    const nameFragment = DOOR_NAME_LOOKUP[key] ?? key.toLowerCase();
    const candidateMeshes = findObjectsByName(root, nameFragment);
    const doorMesh = candidateMeshes.find((obj) => obj instanceof THREE.Mesh) as THREE.Mesh | undefined;

    let hitboxCenter = calculateDoorPosition(doorwayConfig.angle, DOOR_RADIUS);
    const hitboxSize = HITBOX_SIZE.clone();

    if (doorMesh) {
      doorMesh.updateWorldMatrix(true, true);
      const bounds = new THREE.Box3().setFromObject(doorMesh);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      bounds.getSize(size);
      bounds.getCenter(center);
      hitboxCenter = center;
      hitboxSize.set(
        Math.max(size.x * 1.1, HITBOX_SIZE.x),
        Math.max(size.y * 1.05, HITBOX_SIZE.y),
        Math.max(size.z || HITBOX_SIZE.z, HITBOX_SIZE.z)
      );
    } else if (label) {
      label.updateWorldMatrix(true, true);
      const worldPos = new THREE.Vector3();
      label.getWorldPosition(worldPos);
      hitboxCenter = worldPos;
      hitboxCenter.y = Math.max(hitboxCenter.y, HITBOX_SIZE.y * 0.45);
    }

    const geometry = new THREE.BoxGeometry(hitboxSize.x, hitboxSize.y, hitboxSize.z);
    const material = new THREE.MeshBasicMaterial({ visible: false });
    const hitbox = new THREE.Mesh(geometry, material);
    hitbox.userData.doorKey = key;
    hitbox.userData.autoDoorHitbox = true;
    hitbox.name = `door-hitbox-${key.toLowerCase()}`;

    hitbox.position.copy(hitboxCenter);
    const rotationY = (doorwayConfig.angle + Math.PI) % (Math.PI * 2);
    hitbox.rotation.set(0, rotationY, 0);

    root.add(hitbox);

    targets.push({
      key,
      hitbox,
      label,
    });
  });

  return targets;
}

interface EnableDoorwayInteractionsOptions {
  canvas: HTMLCanvasElement;
  sceneRoot: THREE.Object3D;
  camera: THREE.Camera;
  navigate?: (path: string) => void;
  onDoorActivated?: (key: DoorKey) => void;
}

export function enableDoorwayInteractions({
  canvas,
  sceneRoot,
  camera,
  navigate,
  onDoorActivated,
}: EnableDoorwayInteractionsOptions) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const targets = buildDoorwayTargets(sceneRoot);
  const hitObjects = targets.flatMap((target) => [target.hitbox, target.label].filter(Boolean)) as THREE.Object3D[];

  let pointerDownX = 0;
  let pointerDownY = 0;

  const setPointerFromEvent = (event: MouseEvent | PointerEvent | TouchEvent) => {
    let clientX: number;
    let clientY: number;

    if (event instanceof TouchEvent) {
      if (!event.changedTouches.length) return;
      clientX = event.changedTouches[0].clientX;
      clientY = event.changedTouches[0].clientY;
    } else {
      const mouseEvent = event as MouseEvent;
      clientX = mouseEvent.clientX;
      clientY = mouseEvent.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  };

  const pickObject = (event: MouseEvent | PointerEvent | TouchEvent) => {
    setPointerFromEvent(event);
    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects(hitObjects, true);
    return intersections[0]?.object ?? null;
  };

  const resolveDoorKey = (object: THREE.Object3D | null): DoorKey | null => {
    if (!object) return null;

    const directKey = object.userData?.doorKey as DoorKey | undefined;
    if (directKey && DOOR_LINKS[directKey]) {
      return directKey;
    }

    const parentKey = object.parent?.userData?.doorKey as DoorKey | undefined;
    if (parentKey && DOOR_LINKS[parentKey]) {
      return parentKey;
    }

    const found = targets.find((target) => object === target.hitbox || object === target.label);
    return found?.key ?? null;
  };

  const handlePointerMove = (event: PointerEvent) => {
    const hoveredObject = pickObject(event);
    const key = resolveDoorKey(hoveredObject);
    canvas.style.cursor = key ? 'pointer' : 'default';
  };

  const activateDoor = (key: DoorKey) => {
    onDoorActivated?.(key);
    const path = DOOR_LINKS[key];
    if (navigate) {
      navigate(path);
    } else {
      window.location.href = path;
    }
  };

  const handleClick = (event: MouseEvent) => {
    if (Math.hypot(event.clientX - pointerDownX, event.clientY - pointerDownY) > 6) {
      return;
    }
    const hoveredObject = pickObject(event);
    const key = resolveDoorKey(hoveredObject);
    if (!key) return;
    activateDoor(key);
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (!event.changedTouches.length) return;
    const touch = event.changedTouches[0];
    if (Math.hypot(touch.clientX - pointerDownX, touch.clientY - pointerDownY) > 10) {
      return;
    }
    const hoveredObject = pickObject(event);
    const key = resolveDoorKey(hoveredObject);
    if (!key) return;
    activateDoor(key);
  };

  const handlePointerDown = (event: PointerEvent) => {
    pointerDownX = event.clientX;
    pointerDownY = event.clientY;
  };

  const handleTouchStart = (event: TouchEvent) => {
    if (!event.changedTouches.length) return;
    pointerDownX = event.changedTouches[0].clientX;
    pointerDownY = event.changedTouches[0].clientY;
  };

  canvas.addEventListener('pointermove', handlePointerMove, { passive: true });
  canvas.addEventListener('pointerdown', handlePointerDown, { passive: true });
  canvas.addEventListener('click', handleClick, { passive: true });
  canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: true });

  const cleanup = () => {
    canvas.style.cursor = 'default';
    canvas.removeEventListener('pointermove', handlePointerMove);
    canvas.removeEventListener('pointerdown', handlePointerDown);
    canvas.removeEventListener('click', handleClick);
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchend', handleTouchEnd);

    targets.forEach(({ hitbox }) => {
      if (hitbox.parent) {
        hitbox.parent.remove(hitbox);
      }
      if (hitbox instanceof THREE.Mesh && hitbox.userData?.autoDoorHitbox) {
        hitbox.geometry.dispose();
        if (Array.isArray(hitbox.material)) {
          hitbox.material.forEach((mat) => mat.dispose());
        } else {
          hitbox.material.dispose();
        }
      }
    });
  };

  return cleanup;
}
