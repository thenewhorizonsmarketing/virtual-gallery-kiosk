import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface DoorwayLandingProps {
  title: string;
  description: string;
  highlights?: Array<{ title: string; description: string }>;
  children?: ReactNode;
}

export function DoorwayLanding({ title, description, highlights = [], children }: DoorwayLandingProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="bg-gradient-to-b from-primary to-primary/85 px-6 py-10 text-primary-foreground shadow-[0_12px_36px_rgba(0,0,0,0.45)] md:px-12 md:py-16">
        <div className="mx-auto w-full max-w-5xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-foreground/70">MC Virtual Museum</p>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">{title}</h1>
          <p className="max-w-2xl text-base font-medium text-primary-foreground/85 md:text-lg">{description}</p>
          <Button asChild size="lg" variant="secondary" className="mt-4">
            <Link to="/">Return to Lobby</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-10 px-6 py-10 md:px-12 md:py-14">
        {highlights.length > 0 && (
          <section>
            <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">Highlights</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {highlights.map((item, index) => (
                <article key={`${item.title}-${index}`} className="rounded-xl border border-white/10 bg-primary/10 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {children}
      </main>

      <footer className="bg-primary/80 px-6 py-4 text-xs text-muted-foreground md:px-12 md:py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span>© {new Date().getFullYear()} Mississippi College School of Law</span>
          <span className="hidden md:inline">Navigate back to explore more exhibits</span>
        </div>
      </footer>
    </div>
  );
}
