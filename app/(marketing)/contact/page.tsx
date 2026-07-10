import { Clock, Mail, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ContactForm } from "@/components/marketing/contact-form";

export const revalidate = 3600;

const CONTACT_POINTS = [
  {
    icon: Mail,
    title: "Email us",
    description: "We reply within one business day.",
  },
  {
    icon: MessageCircle,
    title: "Live questions",
    description: "Ask us anything about plans, cards, or setup.",
  },
  {
    icon: Clock,
    title: "Support hours",
    description: "Monday to Friday, 9am – 6pm.",
  },
];

export default function ContactPage() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="bg-dot mask-fade-b pointer-events-none absolute inset-0 -z-10 opacity-30"
      />

      <div className="mx-auto grid max-w-5xl gap-14 px-6 py-20 lg:grid-cols-2 lg:gap-12">
        <div>
          <Badge variant="secondary" className="h-auto rounded-full px-3 py-1">
            Contact
          </Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Contact us</h1>
          <p className="mt-3 text-muted-foreground">
            Have a question? Send us a message and we&apos;ll get back to you.
          </p>

          <div className="mt-10 flex flex-col gap-6">
            {CONTACT_POINTS.map((point) => (
              <div key={point.title} className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl text-primary">
                  <point.icon className="size-4.5" />
                </span>
                <div>
                  <p className="font-medium">{point.title}</p>
                  <p className="text-sm text-muted-foreground">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="shadow-elevated rounded-2xl border border-border/80 bg-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Send a message</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill out the form below and our team will follow up shortly.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
