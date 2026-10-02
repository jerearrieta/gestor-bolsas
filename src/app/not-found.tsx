import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-xl font-bold text-stone-900">No encontramos esa página</h1>
      <p className="mt-2 text-sm text-stone-600">Puede que se haya borrado o que el enlace esté mal.</p>
      <Link href="/" className="boton-primario mt-6">Volver al inicio</Link>
    </main>
  );
}
