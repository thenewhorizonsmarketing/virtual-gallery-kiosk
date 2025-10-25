import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { LibraryRoom } from '@/components/rooms/LibraryRoom';
import { ArchiveRoom } from '@/components/rooms/ArchiveRoom';
import { OfficeRoom } from '@/components/rooms/OfficeRoom';
import MarbleDoors from '@/components/MarbleDoors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrbitControls } from '@react-three/drei';

const ROOM_CONTENT: Record<string, { title: string; items: Array<{ title: string; description: string }> }> = {
  'Alumni/Class Composites': {
    title: 'Alumni/Class Composites',
    items: [
      { title: 'Class of 2023', description: 'Recent graduates and their achievements' },
      { title: 'Class of 2020', description: 'Celebrating our alumni' },
      { title: 'Class of 2015', description: 'A decade of success' },
    ],
  },
  'Publications (Amicus, Legal Eye, Law Review, Directory)': {
    title: 'Publications (Amicus, Legal Eye, Law Review, Directory)',
    items: [
      { title: 'Amicus Newsletter', description: 'Latest legal insights and updates' },
      { title: 'Legal Eye Journal', description: 'Student perspectives on law' },
      { title: 'Law Review', description: 'Scholarly articles and analysis' },
      { title: 'Law School Directory', description: 'Comprehensive faculty and student listings' },
    ],
  },
  'Historical Photos/Archives': {
    title: 'Historical Photos/Archives',
    items: [
      { title: 'Founding Years', description: 'The establishment of MC Law School' },
      { title: 'Notable Cases', description: 'Historic legal proceedings' },
      { title: 'Campus Evolution', description: 'How our facilities have grown' },
    ],
  },
  'Faculty & Staff': {
    title: 'Faculty & Staff',
    items: [
      { title: 'Dean of Law', description: 'Leadership and vision for the school' },
      { title: 'Distinguished Professors', description: 'Meet our expert faculty' },
      { title: 'Support Staff', description: 'The team behind student success' },
    ],
  },
};

const Index = () => {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [showRoomPanel, setShowRoomPanel] = useState(false);
  const [year] = useState(new Date().getFullYear());

  const handleDoorClick = (roomKey: string) => {
    setSelectedRoom(roomKey);
    setShowRoomPanel(true);
  };

  const handleCloseRoom = () => {
    setSelectedRoom(null);
    setShowRoomPanel(false);
  };

  const roomData = selectedRoom ? ROOM_CONTENT[selectedRoom] : null;
  
  // Map rooms to their 3D environments
  const getRoomComponent = () => {
    if (!selectedRoom) return null;
    
    if (selectedRoom.includes('Alumni') || selectedRoom.includes('Publications')) {
      return <LibraryRoom />;
    } else if (selectedRoom.includes('Historical') || selectedRoom.includes('Archives')) {
      return <ArchiveRoom />;
    } else if (selectedRoom.includes('Faculty')) {
      return <OfficeRoom />;
    }
    return <LibraryRoom />; // Default fallback
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="relative z-10 flex items-center gap-4 bg-gradient-to-b from-primary to-primary/90 px-5 py-4 text-primary-foreground shadow-[0_10px_28px_rgba(0,0,0,0.35)]">
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">
          MC Virtual Museum — Gallery
        </h1>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 overflow-hidden">
        {!selectedRoom ? (
          <MarbleDoors onDoorClick={handleDoorClick} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a2d4a] via-[#121a2d] to-[#0d1420]">
            <Canvas
              camera={{ position: [0, 1.75, 12], fov: 60 }}
              shadows
              gl={{ 
                antialias: true, 
                powerPreference: 'high-performance',
                toneMapping: 2,
                toneMappingExposure: 0.9
              }}
            >
              {getRoomComponent()}
              <OrbitControls
                enablePan={false}
                enableZoom={true}
                minDistance={5}
                maxDistance={20}
                minPolarAngle={Math.PI * 0.2}
                maxPolarAngle={Math.PI * 0.48}
                enableDamping
                dampingFactor={0.05}
              />
            </Canvas>
          </div>
        )}

        {/* Room Panel */}
        {showRoomPanel && selectedRoom && roomData && (
          <div className="absolute inset-0 z-[3] grid place-items-center bg-black/80 backdrop-blur-sm">
            <Card className="h-[min(70vh,820px)] w-[min(1200px,92vw)] overflow-hidden border-2 border-primary/50 bg-card shadow-[0_28px_80px_rgba(0,0,0,0.6)]">
              <CardHeader className="flex flex-row items-center gap-3 bg-primary/90 text-primary-foreground">
                <CardTitle className="flex-1 text-2xl font-black tracking-tight">
                  {roomData.title}
                </CardTitle>
                <Button
                  onClick={handleCloseRoom}
                  className="bg-accent font-black text-accent-foreground hover:bg-accent/90"
                >
                  Close ✕
                </Button>
              </CardHeader>
              <CardContent className="grid auto-rows-min grid-cols-1 gap-4 overflow-auto p-4 md:grid-cols-2 lg:grid-cols-3">
                {roomData.items.map((item, idx) => (
                  <Card key={idx} className="min-h-[160px] border-primary/30 bg-primary/20">
                    <CardHeader>
                      <div className="aspect-[4/3] rounded-lg bg-primary/40" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <h3 className="font-bold text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
