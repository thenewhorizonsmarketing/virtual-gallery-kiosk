export interface Doorway {
  key: string;
  title: string;
  shortTitle: string;
  description: string;
  angle: number;
  link: string;
}

export const DOORWAYS: Doorway[] = [
  {
    key: 'Alumni/Class Composites',
    title: 'Alumni / Class Composites',
    shortTitle: 'Alumni',
    description: 'Historic class portraits and alumni achievements',
    angle: 0,
    link: 'https://law.mc.edu/alumni/class-composites/',
  },
  {
    key: 'Publications (Amicus, Legal Eye, Law Review, Directory)',
    title: 'Publications',
    shortTitle: 'Publications',
    description: 'Student and faculty publications, journals, and newsletters',
    angle: (Math.PI * 3) / 2,
    link: 'https://law.mc.edu/publications/',
  },
  {
    key: 'Historical Photos/Archives',
    title: 'Historical Photos / Archives',
    shortTitle: 'Archives',
    description: 'Photographic and archival collections from MC Law history',
    angle: Math.PI,
    link: 'https://law.mc.edu/library/archives/',
  },
  {
    key: 'Faculty & Staff',
    title: 'Faculty & Staff',
    shortTitle: 'Faculty',
    description: 'Profiles and contact information for MC Law faculty and staff',
    angle: Math.PI / 2,
    link: 'https://law.mc.edu/faculty/',
  },
];
