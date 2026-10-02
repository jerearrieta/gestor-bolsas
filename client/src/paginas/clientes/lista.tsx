import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ChevronRight, MapPin, Phone, Plus, Search, Users } from "lucide-react";
import { useDatos } from "../../lib/datos";
import { useTitulo } from "../../lib/titulo";
import type { Cliente } from "../../lib/tipos";
import { Encabezado, EstadoCarga, Vacio } from "../../components/ui";

type ClienteLista = Cliente & { pedidos: number; total_comprado: number };

export function Clientes() {
  useTitulo("Clientes");
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const [texto, setTexto] = useState(q);
  const { datos, error } = useDatos<ClienteLista[]>(`/clientes${q ? `?q=${encodeURIComponent(q)}` : ""}`);

  // Busca mientras se escribe (con una pequeña pausa)
  useEffect(() => {
    const t = setTimeout(() => {
      if (texto.trim() !== q) setParams(texto.trim() ? { q: texto.trim() } : {}, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [texto, q, setParams]);

  const lista = datos ?? [];

  return (
    <>
      <Encabezado
        titulo="Clientes"
        subtitulo={datos ? `${lista.length} ${lista.length === 1 ? "cliente" : "clientes"}${q ? " encontrados" : ""}` : " "}
        acciones={
          <Link to="/clientes/nuevo" className="boton-primario">
            <Plus className="size-4" /> Nuevo cliente
          </Link>
        }
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar por nombre, teléfono o localidad…" className="campo pl-10" type="search" aria-label="Buscar clientes" />
      </div>

      {!datos ? (
        <EstadoCarga error={error} />
      ) : lista.length === 0 ? (
        <Vacio
          icono={<Users className="size-10" />}
          titulo={q ? "No encontramos clientes con esa búsqueda" : "Todavía no cargaste clientes"}
          texto={q ? "Probá con otra palabra." : "Guardá acá los datos de contacto y la dirección de envío de cada cliente."}
          accion={!q && <Link to="/clientes/nuevo" className="boton-primario"><Plus className="size-4" /> Cargar el primero</Link>}
        />
      ) : (
        <ul className="tarjeta divide-y divide-stone-100 overflow-hidden">
          {lista.map((c) => (
            <li key={c.id}>
              <Link to={`/clientes/${c.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-stone-50">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-marca-100 font-semibold text-marca-800">
                  {c.nombre.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-stone-900">{c.nombre}</span>
                  <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-stone-500">
                    {c.telefono && <span className="inline-flex items-center gap-1"><Phone className="size-3" />{c.telefono}</span>}
                    {c.localidad && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{c.localidad}</span>}
                  </span>
                </span>
                {c.pedidos > 0 && (
                  <span className="hidden text-right text-xs text-stone-500 sm:block">
                    {c.pedidos} {c.pedidos === 1 ? "pedido" : "pedidos"}
                  </span>
                )}
                <ChevronRight className="size-4 shrink-0 text-stone-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
