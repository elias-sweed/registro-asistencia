/** Marcos grises que aparecen mientras se recarga el panel. */
export function Esqueletos() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Actualizando los datos del panel…</span>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="panel-admin-fuerte h-[104px] animate-pulse rounded-xl bg-white/6"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="panel-admin h-[268px] animate-pulse rounded-xl bg-white/6"
            style={{ animationDelay: `${200 + i * 80}ms` }}
          />
        ))}
      </div>

      <div className="panel-admin mt-6 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-full max-w-xs animate-pulse rounded-lg bg-white/8" />
          <div className="ml-auto h-9 w-32 animate-pulse rounded-lg bg-white/8" />
        </div>
        <div className="mt-4 h-9 w-72 animate-pulse rounded-lg bg-white/6" />

        <ul className="mt-4 space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <li
              key={i}
              className="h-[62px] animate-pulse rounded-xl bg-white/5"
              style={{ animationDelay: `${300 + i * 70}ms` }}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}