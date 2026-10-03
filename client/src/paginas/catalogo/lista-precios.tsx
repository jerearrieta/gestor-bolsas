import { useState } from "react";
import { Link } from "react-router";
import { Check, Copy, MessageCircle, RotateCcw, Send, Users } from "lucide-react";
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

  function guardar(ids: string[]) {
    if (!texto) return;
    setGuardado({ texto, ids });
    try {
      localStorage.setItem(CLAVE, JSON.stringify({ texto, ids }));
    } catch {
      // Sin almacenamiento: la marca dura mientras la página esté abierta.
    }
  }
  const marcar = (id: string) => guardar(enviados.includes(id) ? enviados : [...enviados, id]);
  const desmarcar = (id: string) => guardar(enviados.filter((e) => e !== id));
  const reiniciar = () => guardar([]);
  return { enviados, marcar, desmarcar, reiniciar };
}

export function ListaPrecios() {
  useTitulo("Enviar lista de precios");
  const { datos, error } = useDatos<DatosLista>("/productos/lista-precios");
  const { enviados, marcar, desmarcar, reiniciar } = useEnviados(datos?.texto);
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
              <p className="mb-3 text-sm text-stone-500">Tocá el botón de cada cliente: se abre su chat con el mensaje escrito y vos lo enviás. Si no llegaste a mandarlo, tocá ↺ y vuelve a quedar como "Enviar".</p>
              {enviados.length > 0 && (
                <button
                  type="button"
                  onClick={() => confirm("¿Reiniciar el envío? Todos los clientes vuelven a quedar sin enviar.") && reiniciar()}
                  className="boton-secundario mb-3 min-h-9 w-full px-3 py-1.5 text-xs sm:w-auto"
                >
                  <RotateCcw className="size-4" /> Reiniciar envío
                </button>
              )}
              <ul className="divide-y divide-stone-100">
                {datos.clientes.map((c) => {
                  const enviado = enviados.includes(c.id);
                  return (
                    <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                      <span className={`min-w-0 truncate font-medium ${enviado ? "text-stone-400" : "text-stone-800"}`}>{c.nombre}</span>
                      {enviado ? (
                        <span className="flex shrink-0 items-center gap-1">
                          <span className="boton-secundario pointer-events-none min-h-9 px-3 py-1.5 text-xs">
                            <Check className="size-4" /> Enviado
                          </span>
                          <button
                            type="button"
                            onClick={() => desmarcar(c.id)}
                            aria-label={`Marcar a ${c.nombre} como no enviado`}
                            title="Marcar como no enviado"
                            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                          >
                            <RotateCcw className="size-4" />
                          </button>
                        </span>
                      ) : (
                        <a
                          href={c.whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => marcar(c.id)}
                          className="boton-whatsapp min-h-9 shrink-0 px-3 py-1.5 text-xs"
                        >
                          <MessageCircle className="size-4" /> Enviar
                        </a>
                      )}
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
