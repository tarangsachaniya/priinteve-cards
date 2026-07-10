type LogoItem = { name: string };

export function LogoMarquee({ logos }: { logos: LogoItem[] }) {
  if (logos.length === 0) return null;

  return (
    <section className="border-t border-border/60 py-12">
      <div className="mx-auto max-w-5xl px-6">
        <p className="text-center text-xs font-medium tracking-widest text-muted-foreground/60 uppercase">
          Trusted by teams at
        </p>
        <div className="group relative mt-6 overflow-hidden mask-fade-x">
          <div
            className="animate-marquee flex w-max items-center gap-x-16 group-hover:[animation-play-state:paused] motion-reduce:animate-none"
            style={{ "--marquee-duration": "26s" } as React.CSSProperties}
          >
            {[logos, logos].map((group, groupIndex) => (
              <div key={groupIndex} aria-hidden={groupIndex === 1} className="flex shrink-0 items-center gap-x-14">
                {group.map((logo, index) => (
                  <span
                    key={`${groupIndex}-${index}`}
                    className="text-lg font-semibold tracking-tight whitespace-nowrap text-muted-foreground/70"
                  >
                    {logo.name}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
