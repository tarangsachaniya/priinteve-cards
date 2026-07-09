type LogoItem = { name: string };

export function LogoMarquee({ logos }: { logos: LogoItem[] }) {
  if (logos.length === 0) return null;

  return (
    <section className="border-y border-border/80 py-10">
      <div className="mx-auto max-w-5xl px-6">
        <p className="text-center text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Trusted by teams at
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {logos.map((logo) => (
            <span
              key={logo.name}
              className="text-lg font-semibold tracking-tight text-muted-foreground/70"
            >
              {logo.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
