export interface RoomContentEntry {
  title: string;
  items: Array<{ title: string; description: string }>;
}

export const ROOM_CONTENT: Record<string, RoomContentEntry> = {
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

export const DOOR_CONTENT: Record<'Alumni' | 'Publications' | 'Archives' | 'Faculty', RoomContentEntry> = {
  Alumni: ROOM_CONTENT['Alumni/Class Composites'],
  Publications: ROOM_CONTENT['Publications (Amicus, Legal Eye, Law Review, Directory)'],
  Archives: ROOM_CONTENT['Historical Photos/Archives'],
  Faculty: ROOM_CONTENT['Faculty & Staff'],
};
