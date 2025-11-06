import type { CsvAlumniRow } from '@/types/alumni';

interface ParsedCsv<T> {
  headers: string[];
  rows: T[];
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function normaliseHeader(header: string): string {
  return header.trim();
}

export function parseAlumniCsv(content: string): ParsedCsv<CsvAlumniRow> {
  const cleaned = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!cleaned) {
    return { headers: [], rows: [] };
  }

  const lines = cleaned.split('\n').filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]).map(normaliseHeader);
  const rows: CsvAlumniRow[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const values = parseCsvLine(lines[lineIndex]);
    if (values.every((value) => value === '')) {
      continue;
    }

    if (values.length > headers.length) {
      throw new Error(`Row ${lineIndex} has more columns than the header.`);
    }

    const row: Record<string, string> = {};
    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex] ?? '';
    });

    rows.push({
      full_name: row.full_name ?? row['full_name'] ?? row['Full Name'] ?? row['name'] ?? '',
      title: row.title ?? row['Title'] ?? row['job_title'] ?? row['Job Title'] ?? undefined,
      class_year: row.class_year ?? row['Class Year'] ?? row['year'] ?? undefined,
      bio: row.bio ?? row['Bio'] ?? row['description'] ?? undefined,
      photo_filename:
        row.photo_filename ?? row['photo_filename'] ?? row['Photo Filename'] ?? row['photo'] ?? undefined,
    });
  }

  return { headers, rows };
}
