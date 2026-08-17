import Link from "next/link";

const services = [
  {
    title: "Documentation mirror",
    description: "Concise operations notes and static project resources for gateway administrators.",
  },
  {
    title: "Health landing page",
    description: "A predictable destination for uptime monitors, status probes, and generic visitors.",
  },
  {
    title: "Support inbox",
    description: "A quiet contact surface that does not expose private tunnel or certificate details.",
  },
];

export default function FallbackPage() {
  return (
    <main className="min-h-screen bg-[#f6f1e8] text-stone-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-6 py-8 sm:px-10 lg:px-12">
        <nav className="flex items-center justify-between">
          <Link className="text-sm font-bold uppercase tracking-[0.26em] text-stone-700" href="/">
            Mercury Harbor
          </Link>
          <span className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
            Fallback site
          </span>
        </nav>

        <div className="grid gap-10 py-16 lg:grid-cols-[1fr_0.82fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">Operational landing page</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-[-0.05em] text-stone-950 sm:text-7xl">
              A simple, stable website for ordinary edge traffic.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-700">
              This route is intentionally boring: it gives reverse proxies, CDNs, and monitors a normal destination while private transport services remain separated at the infrastructure layer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="rounded-full bg-stone-950 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-stone-950/20 transition hover:-translate-y-0.5" href="/api/health">
                View health JSON
              </Link>
              <Link className="rounded-full border border-stone-300 px-6 py-3 text-sm font-bold text-stone-900 transition hover:-translate-y-0.5 hover:border-stone-500" href="/">
                Return to console
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-stone-200 bg-white/70 p-5 shadow-2xl shadow-stone-900/10 backdrop-blur">
            <div className="rounded-[1.5rem] bg-stone-950 p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Edge handoff</p>
              <div className="mt-6 space-y-4">
                {services.map((service) => (
                  <article className="rounded-2xl border border-white/10 bg-white/5 p-4" key={service.title}>
                    <h2 className="font-semibold">{service.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-stone-300">{service.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-stone-300 py-5 text-sm text-stone-600 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Mercury Harbor fallback.</span>
          <span>Designed for authorized deployments and routine traffic.</span>
        </footer>
      </section>
    </main>
  );
}
