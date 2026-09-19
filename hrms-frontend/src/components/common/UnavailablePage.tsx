import { Hourglass } from "lucide-react";
import Link from "next/link";

// Honest placeholder for modules whose backend API does not exist yet.
// Shows no records, amounts or balances.
export function UnavailablePage({
  title,
  heading,
  message,
  link,
}: {
  title: string;
  heading: string;
  message: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-ink">{title}</h1>
      <section
        role="status"
        className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary-dark">
          <Hourglass className="size-5" />
        </span>
        <h2 className="text-lg font-semibold text-ink">{heading}</h2>
        <p className="max-w-md text-sm text-ink-soft">{message}</p>
        {link && (
          <Link
            href={link.href}
            className="mt-2 text-sm font-semibold text-primary-dark underline-offset-2 hover:underline"
          >
            {link.label}
          </Link>
        )}
      </section>
    </div>
  );
}
