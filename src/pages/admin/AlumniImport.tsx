import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { parseAlumniCsv } from '@/utils/csv';
import type { CsvAlumniRow } from '@/types/alumni';
import { getAlumnusByFullName, upsertAlumnus } from '@/lib/alumniStore';

interface NormalisedRow {
  full_name: string;
  title?: string;
  class_year?: number | null;
  bio?: string;
  photo_filename?: string;
}

function normaliseRows(rows: CsvAlumniRow[]): NormalisedRow[] {
  return rows
    .map((row) => ({
      full_name: row.full_name?.trim() ?? '',
      title: row.title?.trim() || undefined,
      class_year: (() => {
        if (!row.class_year) {
          return null;
        }
        const parsed = Number.parseInt(row.class_year.trim(), 10);
        return Number.isNaN(parsed) ? null : parsed;
      })(),
      bio: row.bio?.trim() || undefined,
      photo_filename: row.photo_filename?.trim(),
    }))
    .filter((row) => row.full_name.length > 0);
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Invalid image data.'));
      }
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error('Unable to read image file.'));
    };
    reader.readAsDataURL(file);
  });
}

const AlumniImport = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [previewRows, setPreviewRows] = useState<NormalisedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);

  const photoMap = useMemo(() => {
    const map = new Map<string, File>();
    photoFiles.forEach((file) => {
      map.set(file.name, file);
      map.set(file.name.toLowerCase(), file);
    });
    return map;
  }, [photoFiles]);

  const handleCsvChange = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      setCsvFile(null);
      setPreviewRows([]);
      return;
    }

    const file = fileList[0];
    setCsvFile(file);
    setIsParsing(true);

    try {
      const text = await file.text();
      const { rows } = parseAlumniCsv(text);
      const normalised = normaliseRows(rows);
      if (normalised.length === 0) {
        toast.error('The CSV did not contain any rows.');
      }
      setPreviewRows(normalised);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to read the CSV file.';
      toast.error(message);
      setPreviewRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handlePhotosChange = (fileList: FileList | null) => {
    if (!fileList) {
      setPhotoFiles([]);
      return;
    }

    const files = Array.from(fileList);
    setPhotoFiles(files);
  };

  const resolvePhoto = async (row: NormalisedRow): Promise<string | undefined> => {
    const filename = row.photo_filename;
    const matchingFile = filename
      ? photoMap.get(filename) ?? photoMap.get(filename.toLowerCase())
      : undefined;

    if (!matchingFile) {
      return undefined;
    }

    try {
      return await fileToDataUrl(matchingFile);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to process photo file.';
      toast.error(`${matchingFile.name}: ${message}`);
      return undefined;
    }
  };

  const handleUpload = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file before uploading.');
      return;
    }

    if (previewRows.length === 0) {
      toast.error('No rows ready to import. Please check the CSV contents.');
      return;
    }

    setIsUploading(true);
    setProcessedCount(0);

    try {
      for (let index = 0; index < previewRows.length; index += 1) {
        const row = previewRows[index];
        try {
          const existing = await getAlumnusByFullName(row.full_name);
          const photoDataUrl = await resolvePhoto(row);
          await upsertAlumnus({
            id: existing?.id,
            full_name: row.full_name,
            title: row.title ?? null,
            class_year: row.class_year ?? null,
            bio: row.bio ?? null,
            photo_url: photoDataUrl,
            created_at: existing?.created_at ?? null,
          });
          setProcessedCount(index + 1);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          toast.error(`Failed to import ${row.full_name}: ${message}`);
        }
      }

      toast.success('Alumni records imported to the kiosk successfully.');
      queryClient.invalidateQueries({ queryKey: ['alumni'] });
      navigate('/alumni');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to upload records.';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Alumni CSV Import</h1>
            <p className="text-sm text-muted-foreground">
              Upload a CSV and optional photo files to refresh the kiosk&apos;s offline alumni gallery.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Offline admin mode</span>
            <Button
              variant="outline"
              onClick={() => {
                signOut();
                toast.success('Admin session locked.');
                navigate('/admin/login');
              }}
            >
              Lock tools
            </Button>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>1. Upload CSV</CardTitle>
              <CardDescription>CSV columns: full_name, title, class_year, bio, photo_filename</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="alumni-csv">Choose CSV file</Label>
              <Input
                id="alumni-csv"
                type="file"
                accept=".csv"
                onChange={(event) => handleCsvChange(event.target.files)}
              />
              {isParsing && <p className="text-xs text-muted-foreground">Parsing CSV…</p>}
              {csvFile && !isParsing && (
                <p className="text-xs text-muted-foreground">Loaded {csvFile.name}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Upload Photos</CardTitle>
              <CardDescription>
                Optional: select JPG or PNG files whose names match the photo_filename column.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="alumni-photos">Select photo files</Label>
              <Input
                id="alumni-photos"
                type="file"
                accept="image/png,image/jpeg"
                multiple
                onChange={(event) => handlePhotosChange(event.target.files)}
              />
              {photoFiles.length > 0 && (
                <p className="text-xs text-muted-foreground">Selected {photoFiles.length} photo(s)</p>
              )}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>3. Review and Import</CardTitle>
            <CardDescription>
              Confirm the rows below, then start the upload. Missing photos reuse the previous photo if available.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Photo filename</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                        Upload a CSV to preview rows.
                      </TableCell>
                    </TableRow>
                  )}
                  {previewRows.map((row) => (
                    <TableRow key={`${row.full_name}-${row.class_year ?? 'unknown'}`}>
                      <TableCell className="font-medium">{row.full_name}</TableCell>
                      <TableCell>{row.title ?? '—'}</TableCell>
                      <TableCell>{row.class_year ?? '—'}</TableCell>
                      <TableCell>{row.photo_filename ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <Progress value={(processedCount / Math.max(previewRows.length, 1)) * 100} />
                <p className="text-xs text-muted-foreground">
                  Processed {processedCount} of {previewRows.length} rows…
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-muted-foreground">
                Tip: test with a small CSV first. You can rerun the upload at any time.
              </p>
              <Button onClick={handleUpload} disabled={isUploading || isParsing || previewRows.length === 0}>
                {isUploading ? 'Importing…' : 'Start import'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AlumniImport;
