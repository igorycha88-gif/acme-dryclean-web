import Link from "next/link";

interface SearchVariationsProps {
  correctQueries: string[];
  typoQueries: string[];
  relatedLinks?: Array<{ href: string; label: string }>;
}

export default function SearchVariations({
  correctQueries,
  typoQueries,
  relatedLinks = [],
}: SearchVariationsProps) {
  return (
    <section className="bg-bg-alt" aria-label="Частые поисковые запросы">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-10">
        <h2 className="font-[family-name:var(--font-heading)] font-bold text-2xl sm:text-3xl text-center">
          Часто ищут
        </h2>
        <p className="mt-3 text-center text-text-secondary max-w-2xl mx-auto text-sm">
          Распространённые поисковые запросы, по которым клиенты находят нашу
          услугу в Москве. Если вы искали что-то похожее — вы по адресу.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {correctQueries.map((q) => (
            <span
              key={q}
              className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-text-secondary"
            >
              {q}
            </span>
          ))}
        </div>

        {typoQueries.length > 0 && (
          <div className="mt-6">
            <p className="text-center text-xs text-text-secondary/70 mb-3">
              Распространённые варианты написания с опечатками:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {typoQueries.map((q) => (
                <span
                  key={q}
                  className="inline-flex items-center rounded-full border border-gray-100 bg-white/60 px-3 py-1 text-xs text-text-secondary/70"
                >
                  {q}
                </span>
              ))}
            </div>
          </div>
        )}

        {relatedLinks.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1 text-sm text-secondary hover:text-accent transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
