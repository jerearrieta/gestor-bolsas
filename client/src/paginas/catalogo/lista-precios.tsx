import { useState } from "react";
import { Link } from "react-router";
import { Check, Copy, MessageCircle, Send, Users } from "lucide-react";
import { useDatos } from "../../lib/datos";
import { useTitulo } from "../../lib/titulo";
import { Aviso, Encabezado, EstadoCarga, Tarjeta, TituloSeccion, Vacio } from "../../components/ui";

type DatosLista = {
  texto: string;
  clientes: { id: string; nombre: string; whatsapp: string }[];
  sin_telefono: number;
};

const CLAVE = "lista-precios-enviados";

/** A quiénes ya se les mandó esta lista (se reinicia sola cuando cambian los precios). */
function useEnviados(texto: string | undefined) {
  const [guardado, setGuardado] = useState<{ texto: string; ids: string[] } | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(CLAVE) ?? "null");
    } catch {
      return null;
    }
  });
  const enviados = texto && guardado?.texto === texto ? guardado.ids : [];

  function marcar(id: string) {
    if (!texto) return;
    const ids = enviados.includes(id) ? enviados : [...enviados, id];
    setGuardado({ texto, ids });
    try {
      localStorage.setItem(CLAVE, JSON.stringify({ texto, ids }));
    } catch {
      // Sin almacenamiento: la marca dura mientras la página esté abierta.
    }
  }
  return { enviados, marcar };
}

export function ListaPrecios() {
  useTitulo("Enviar lista de precios");
  const { datos, error } = useDatos<DatosLista>("/productos/lista-precios");
  const { enviados, marcar } = useEnviados(datos?.texto);
  const [copiado, setCopiado] = useState(false);

  if (!datos) return <EstadoCarga error={error} />;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(datos!.texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      alert("No se pudo copiar. Mantené apretado el texto para copiarlo.");
    }
  }

  return (
    <>
      <Encabezado
        titulo="Enviar lista de precios"
        subtitulo="Mandales a tus clientes los precios actualizados por WhatsApp."
        volver="/catalogo"
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Tarjeta>
          <TituloSeccion>Mensaje</TituloSeccion>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-stone-50 p-3 font-sans text-sm text-stone-800">{datos.texto}</pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={copiar} className="boton-secundario flex-1 sm:flex-none">
              {copiado ? <Check className="size-4" /> : <Copy className="size-4" />} {copiado ? "Copiado" : "Copiar texto"}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(datos.texto)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="boton-whatsapp flex-1 sm:flex-none"
            >
              <Send className="size-4" /> Elegir chats en WhatsApp
            </a>
          </div>
          <p className="ayuda mt-3">
            Para mandarlo a todos de una vez, armá en WhatsApp una <strong>lista de difusión</strong> con tus clientes y pegá el texto ahí.
            Sólo les llega a quienes tienen tu número agendado.
          </p>
        </Tarjeta>

        <Tarjeta>
          <TituloSeccion accion={<span className="text-xs text-stone-500">{enviados.length} de {datos.clientes.length} enviados</span>}>
            Uno por uno
          </TituloSeccion>
          {datos.clientes.length === 0 ? (
            <Vacio
              icono={<Users className="size-10" />}
              titulo="No hay clientes con teléfono"
              texto="Cargales el teléfono a tus clientes para poder mandarles la lista."
              accion={<Link to="/clientes" className="boton-primario">Ir a clientes</Link>}
            />
          ) : (
            <>
              <p className="mb-3 text-sm text-stone-500">Tocá el botón de cada cliente: se abre su chat con el mensaje escrito y vos lo enviás.</p>
              <ul className="divide-y divide-stone-100">
                {datos.clientes.map((c) => {
                  const enviado = enviados.includes(c.id);
                  return (
                    <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                      <span className={`min-w-0 truncate font-medium ${enviado ? "text-stone-400" : "text-stone-800"}`}>{c.nombre}</span>
                      <a
                        href={c.whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => marcar(c.id)}
                        className={`${enviado ? "boton-secundario" : "boton-whatsapp"} min-h-9 shrink-0 px-3 py-1.5 text-xs`}
                      >
                        {enviado ? <Check className="size-4" /> : <MessageCircle className="size-4" />} {enviado ? "Enviado" : "Enviar"}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          {datos.sin_telefono > 0 && (
            <div className="mt-3">
              <Aviso tipo="info">
                {datos.sin_telefono === 1 ? "1 cliente no tiene" : `${datos.sin_telefono} clientes no tienen`} teléfono cargado.
              </Aviso>
            </div>
          )}
        </Tarjeta>
      </div>
    </>
  );
}
