import { Link } from 'react-router-dom';
import { DoorwayLanding } from '@/components/doorways/DoorwayLanding';
import { useAlumni } from '@/hooks/useAlumni';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

function getInitials(name: string) {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) {
    return 'A';
  }
  if (parts.length === 1) {
    return parts[0][0]?.toUpperCase() ?? 'A';
  }
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

const Alumni = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = useAlumni();

  return (
    <DoorwayLanding
      title="Alumni & Class Composites"
      description="Celebrate generations of MC Law graduates and explore class composites, milestone reunions, and alumni achievements."
    >
      <section className="space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl bg-card/60 p-6 shadow-lg ring-1 ring-border/30 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Latest alumni highlights</h2>
            <p className="text-sm text-muted-foreground">
              This kiosk stores alumni data locally. Refresh if you recently ran an import.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? 'Refreshing…' : 'Refresh list'}
            </Button>
            <Button asChild size="sm" variant="default">
              <Link to="/admin/alumni-import">Admin tools</Link>
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-36 animate-pulse rounded-2xl bg-muted/60" />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Unable to load alumni right now: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}

        {!isLoading && !isError && data && data.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/50 bg-muted/30 p-8 text-center">
            <p className="text-sm font-medium">No alumni imported yet.</p>
            <p className="text-xs text-muted-foreground">
              Upload a CSV from the admin tools page to populate this gallery.
            </p>
          </div>
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.map((alumnus) => (
              <article
                key={alumnus.id}
                className="group flex flex-col gap-4 rounded-2xl border border-border/40 bg-card/70 p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 ring-2 ring-primary/40 ring-offset-2">
                    {alumnus.photo_url ? (
                      <AvatarImage src={alumnus.photo_url} alt={alumnus.full_name} />
                    ) : null}
                    <AvatarFallback>{getInitials(alumnus.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold leading-tight">{alumnus.full_name}</h3>
                    {alumnus.title && <p className="text-sm text-muted-foreground">{alumnus.title}</p>}
                    {alumnus.class_year && (
                      <p className="text-xs uppercase tracking-wide text-primary">Class of {alumnus.class_year}</p>
                    )}
                  </div>
                </div>
                {alumnus.bio && <p className="text-sm text-muted-foreground">{alumnus.bio}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </DoorwayLanding>
  );
};

export default Alumni;
