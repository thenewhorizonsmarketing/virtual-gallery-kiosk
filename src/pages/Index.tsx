import { useState, Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { MuseumScene } from '@/components/MuseumScene';
import { LibraryRoom } from '@/components/rooms/LibraryRoom';
import { ArchiveRoom } from '@/components/rooms/ArchiveRoom';
import { OfficeRoom } from '@/components/rooms/OfficeRoom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrbitControls } from '@react-three/drei';
import { useResponsive } from '@/hooks/useResponsive';
import { DOORWAYS, type Doorway } from '@/data/doorways';
import { ROOM_CONTENT } from '@/data/roomContent';
import { useNavigate } from 'react-router-dom';
import { DOOR_LINKS, type DoorKey } from '@/lib/scene/doorways';

const Index = () => {
  const responsive = useResponsive();
  const [selectedDoor, setSelectedDoor] = useState<Doorway | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [showRoomPanel, setShowRoomPanel] = useState(false);
  const [year] = useState(new Date().getFullYear());
  const [cameraKey, setCameraKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [queuedPath, setQueuedPath] = useState<string | null>(null);
  const routerNavigate = useNavigate();

  const queueNavigation = useCallback((path: string) => {
    setQueuedPath(path);
  }, []);

  const clearNavigationQueue = useCallback(() => {
    setQueuedPath(null);
  }, []);

  const handleDoorClick = useCallback((door: Doorway) => {
    setSelectedDoor(door);
    setSelectedRoom(door.key);
    setActiveRoom(null);
    setShowRoomPanel(false); // Hide panel during transition
    const doorKey = door.shortTitle as DoorKey;
    if (doorKey && DOOR_LINKS[doorKey]) {
      queueNavigation(DOOR_LINKS[doorKey]);
    } else {
      clearNavigationQueue();
    }
  }, [queueNavigation, clearNavigationQueue]);

  const handleCloseRoom = () => {
    setSelectedDoor(null);
    setSelectedRoom(null);
    setActiveRoom(null);
    setShowRoomPanel(false);
  };
  
  const handleZoomComplete = useCallback((roomKey: string) => {
    const door = DOORWAYS.find((entry) => entry.key === roomKey);
    if (door) {
      setSelectedDoor(door);
    }
    setActiveRoom(roomKey);
    setShowRoomPanel(true);

    let path = queuedPath;
    if (!path && door) {
      const fallbackKey = door.shortTitle as DoorKey;
      if (fallbackKey && DOOR_LINKS[fallbackKey]) {
        path = DOOR_LINKS[fallbackKey];
      }
    }

    if (path) {
      routerNavigate(path);
      clearNavigationQueue();
    }
  }, [queuedPath, routerNavigate, clearNavigationQueue]);

  const handleResetCamera = () => {
    setSelectedDoor(null);
    setSelectedRoom(null);
    setActiveRoom(null);
    setShowRoomPanel(false);
    setCameraKey(prev => prev + 1); // Force camera reset by remounting Canvas
  };

  const handleFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).msRequestFullscreen) {
      (elem as any).msRequestFullscreen();
    }
  };

  // Dynamic controls hint based on device
  const getControlsHint = () => {
    if (responsive.isMobile) {
      return "Tap door to enter • Pinch to zoom • Swipe to look";
    }
    return "Tap a doorway to enter • Alumni • Publications • Archives • Faculty";
  };

  const roomData = selectedRoom ? ROOM_CONTENT[selectedRoom] : null;
  
  // Map rooms to their 3D environments
  const getRoomComponent = () => {
    if (!activeRoom) return null;
    
    if (activeRoom.includes('Alumni') || activeRoom.includes('Publications')) {
      return <LibraryRoom />;
    } else if (activeRoom.includes('Historical') || activeRoom.includes('Archives')) {
      return <ArchiveRoom />;
    } else if (activeRoom.includes('Faculty')) {
      return <OfficeRoom />;
    }
    return <LibraryRoom />; // Default fallback
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="relative z-10 flex items-center gap-2 bg-gradient-to-b from-primary to-primary/90 px-3 py-3 text-primary-foreground shadow-[0_10px_28px_rgba(0,0,0,0.35)] md:gap-4 md:px-5 md:py-4">
        <h1 className="text-lg font-black tracking-tight md:text-2xl lg:text-3xl">
          MC Virtual Museum{responsive.isMobile ? "" : " — 3D Gallery"}
        </h1>
        <div className="ml-auto flex gap-2 md:gap-3">
          {!responsive.isMobile && (
            <Button
              onClick={handleFullscreen}
              className="bg-accent px-3 py-2 text-sm font-black text-accent-foreground shadow-[0_10px_24px_rgba(0,0,0,0.35)] hover:bg-accent/90 md:px-4 md:text-base"
            >
              Fullscreen
            </Button>
          )}
          <Button
            onClick={handleResetCamera}
            className="bg-accent px-3 py-2 text-sm font-black text-accent-foreground shadow-[0_10px_24px_rgba(0,0,0,0.35)] hover:bg-accent/90 md:px-4 md:text-base"
          >
            {responsive.isMobile ? "🏠" : "Home"}
          </Button>
        </div>
      </header>

      {/* 3D Scene */}
      <main className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a2d4a] via-[#121a2d] to-[#0d1420]">
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background">
              <div className="text-center">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-lg font-bold text-foreground">Loading Museum...</p>
              </div>
            </div>
          )}

          {/* Museum Hall - visible until room becomes active */}
          <div style={{ display: activeRoom ? 'none' : 'block', width: '100%', height: '100%' }}>
            <Canvas
              key={cameraKey}
              camera={{ position: [-2.6, 2.8, 5.2], near: 0.01, far: 60, fov: responsive.cameraFOV }}
              shadows
              gl={{ 
                antialias: !responsive.isMobile, 
                powerPreference: responsive.isMobile ? 'low-power' : 'high-performance',
                toneMapping: 2,
                toneMappingExposure: 0.9
              }}
              dpr={responsive.pixelRatio}
              onCreated={() => setIsLoading(false)}
            >
              <Suspense fallback={null}>
                <MuseumScene
                  onDoorClick={handleDoorClick}
                  selectedRoom={selectedRoom}
                  onZoomComplete={handleZoomComplete}
                  navigateToPath={queueNavigation}
                />
              </Suspense>
            </Canvas>
          </div>

          {/* Destination Room - appears after zoom completes */}
          {activeRoom && (
            <div style={{ width: '100%', height: '100%' }}>
              <Canvas
                camera={{ position: [0, 1.75, 12], fov: responsive.cameraFOV }}
                shadows
                gl={{ 
                  antialias: !responsive.isMobile, 
                  powerPreference: responsive.isMobile ? 'low-power' : 'high-performance',
                  toneMapping: 2,
                  toneMappingExposure: 0.9
                }}
                dpr={responsive.pixelRatio}
              >
                <Suspense fallback={null}>
                  {getRoomComponent()}
                </Suspense>
                <OrbitControls
                  enablePan={false}
                  enableZoom={true}
                  minDistance={5}
                  maxDistance={20}
                  minPolarAngle={Math.PI * 0.2}
                  maxPolarAngle={Math.PI * 0.48}
                  enableDamping
                  dampingFactor={responsive.isMobile ? 0.08 : 0.05}
                  rotateSpeed={responsive.isMobile ? 0.7 : 0.5}
                />
              </Canvas>
            </div>
          )}
        </div>

        {/* Overlay controls */}
        <div className="pointer-events-none absolute inset-0 z-[2]">
          <nav aria-label="Doorway shortcuts" className="pointer-events-auto">
            {Object.entries(DOOR_LINKS).map(([name, path]) => (
              <a
                key={name}
                href={path}
                aria-label={name}
                className="sr-only-link"
                onClick={(event) => {
                  event.preventDefault();
                  clearNavigationQueue();
                  routerNavigate(path);
                }}
                onKeyDown={(event) => {
                  if (event.key === ' ' || event.key === 'Spacebar') {
                    event.preventDefault();
                    clearNavigationQueue();
                    routerNavigate(path);
                  }
                }}
              >
                {name}
              </a>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-2 p-2 md:p-3">
            <Button
              onClick={handleResetCamera}
              className="pointer-events-auto bg-accent px-3 py-2 text-sm font-black text-accent-foreground shadow-[0_10px_24px_rgba(0,0,0,0.35)] hover:bg-accent/90 md:px-4 md:text-base"
            >
              Reset View
            </Button>
          </div>

          {/* Hint text */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-bold tracking-wide text-muted backdrop-blur-sm md:bottom-6 md:px-4 md:py-2 md:text-sm">
            {getControlsHint()}
          </div>

          {/* Legend - hidden on mobile */}
          {!responsive.isMobile && (
            <div className="absolute bottom-3 right-3 rounded-2xl border border-white/10 bg-gradient-to-b from-[#0b1429] to-[#0a1020] px-4 py-3 text-sm text-muted shadow-[0_14px_34px_rgba(0,0,0,0.45)]">
              <div className="font-bold text-foreground">Navigation</div>
              <div>Tap/Click door → enter room</div>
              <div>Hold + drag → look around</div>
            </div>
          )}
        </div>

        {/* Room Panel - Full screen on mobile */}
        {showRoomPanel && selectedRoom && roomData && (
          <div className="absolute inset-0 z-[3] grid place-items-center bg-black/80 backdrop-blur-sm">
            <Card className={`overflow-hidden border-2 border-primary/50 bg-card shadow-[0_28px_80px_rgba(0,0,0,0.6)] ${
              responsive.isMobile 
                ? 'h-full w-full' 
                : 'h-[min(70vh,820px)] w-[min(1200px,92vw)]'
            }`}>
              <CardHeader className="flex flex-row items-center gap-2 bg-primary/90 px-3 py-3 text-primary-foreground md:gap-3 md:px-6 md:py-4">
                <CardTitle className="flex-1 text-lg font-black tracking-tight md:text-2xl">
                  {responsive.isMobile ? roomData.title.split('(')[0].trim() : roomData.title}
                </CardTitle>
                {selectedDoor && (
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="pointer-events-auto bg-white/15 text-primary-foreground hover:bg-white/25"
                  >
                    <a href={selectedDoor.link} target="_blank" rel="noreferrer">
                      Visit {selectedDoor.shortTitle} ↗
                    </a>
                  </Button>
                )}
                <Button
                  onClick={handleCloseRoom}
                  className="bg-accent px-3 py-2 text-sm font-black text-accent-foreground hover:bg-accent/90 md:px-4 md:text-base"
                >
                  {responsive.isMobile ? "✕" : "Close ✕"}
                </Button>
              </CardHeader>
              <CardContent className="grid auto-rows-min grid-cols-1 gap-3 overflow-auto p-3 md:grid-cols-2 md:gap-4 md:p-4 lg:grid-cols-3">
                {roomData.items.map((item, idx) => (
                  <Card key={idx} className="min-h-[140px] border-primary/30 bg-primary/20 md:min-h-[160px]">
                    <CardHeader className="p-3 md:p-6">
                      <div className="aspect-[4/3] rounded-lg bg-primary/40" />
                    </CardHeader>
                    <CardContent className="space-y-1.5 p-3 md:space-y-2 md:p-6">
                      <h3 className="text-sm font-bold text-foreground md:text-base">{item.title}</h3>
                      <p className="text-xs text-muted-foreground md:text-sm">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer - compact on mobile */}
      <footer className="flex items-center justify-between bg-primary/80 px-2 py-1.5 text-xs text-muted-foreground md:px-4 md:py-2 md:text-sm">
        <div>© {year} Mississippi College{responsive.isMobile ? "" : " — Kiosk Mode"}</div>
        {!responsive.isMobile && <div>Idle returns to Home</div>}
      </footer>
    </div>
  );
};

export default Index;
