export interface AlumniRecord {
  id: string;
  full_name: string;
  title: string | null;
  class_year: number | null;
  bio: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CsvAlumniRow {
  full_name: string;
  title?: string;
  class_year?: string;
  bio?: string;
  photo_filename?: string;
}
