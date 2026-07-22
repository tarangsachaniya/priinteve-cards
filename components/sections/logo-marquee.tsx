import { Reveal } from "@/components/ui/reveal";
import type { HomepageLogoInput } from "@/lib/validations/admin";

export function LogoMarquee({ logos }: { logos: HomepageLogoInput[] }) {
  return (
    <section className="bg-background py-14">
      <Reveal>
        <p className="text-center text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Trusted by teams at
        </p>
      </Reveal>
      <div className="group relative mt-8 overflow-hidden mask-fade-x">
        <div
          className="animate-marquee flex w-max items-center gap-x-16 group-hover:[animation-play-state:paused]"
          style={{ "--marquee-duration": "28s" } as React.CSSProperties}
        >
          {[logos, logos].map((group, groupIndex) => (
            <div key={groupIndex} aria-hidden={groupIndex === 1} className="flex shrink-0 items-center gap-x-16">
              {group.map((logo, index) =>
                logo.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${groupIndex}-${index}`}
                    src={logo.logoUrl}
                    alt={logo.name}
                    className="h-7 w-auto shrink-0 object-contain grayscale"
                  />
                ) : (
                  <span
                    key={`${groupIndex}-${index}`}
                    className="text-lg font-semibold tracking-tight whitespace-nowrap text-muted-foreground/60 grayscale"
                  >
                    {logo.name}
                  </span>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
