import { Escudo, Ornamento } from './Escudo'

/** Marco comun de las pantallas de acceso: misma marca y estilo. */
export function MarcoAcceso({
  rotulo,
  titulo,
  subtitulo,
}: {
  rotulo: string
  titulo: string
  subtitulo: string
}) {
  return (
    <header className="mb-7 flex flex-col items-center text-center">
      <Escudo alto="h-24" />
      <p className="rotulo mt-4">{rotulo}</p>
      <h1 className="font-display mt-1 text-3xl leading-tight font-semibold text-perla-50">
        {titulo}
      </h1>
      <p className="mt-1 text-sm italic text-perla-300">{subtitulo}</p>
      <div className="mt-4 w-40">
        <Ornamento />
      </div>
    </header>
  )
}