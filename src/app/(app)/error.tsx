"use client";

export default function ErrorApp({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-xl font-bold text-stone-900">Algo salió mal</h1>
      <p className="mt-2 text-sm text-stone-600">{error.message || "Ocurrió un error inesperado."}</p>
      <button onClick={reset} className="boton-primario mt-6">Reintentar</button>
    </div>
  );
}
