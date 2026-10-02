import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { api } from "../../lib/api";
import { useDatos, useEnvio } from "../../lib/datos";
import { useTitulo } from "../../lib/titulo";
import type { Cliente } from "../../lib/tipos";
import { Aviso, Encabezado, EstadoCarga } from "../../components/ui";
import { Boton } from "../../components/botones";

export function NuevoCliente() {
  useTitulo("Nuevo cliente");
  return (
    <>
      <Encabezado titulo="Nuevo cliente" volver="/clientes" />
      <FormularioCliente />
    </>
  );
}

export function EditarCliente() {
  const { id } = useParams();
  const { datos, error } = useDatos<{ cliente: Cliente }>(`/clientes/${id}`);
  useTitulo("Editar cliente");
  if (!datos) return <EstadoCarga error={error} />;
  return (
    <>
      <Encabezado titulo="Editar cliente" subtitulo={datos.cliente.nombre} volver={`/clientes/${id}`} />
      <FormularioCliente cliente={datos.cliente} />
    </>
  );
}

function FormularioCliente({ cliente }: { cliente?: Cliente }) {
  const navegar = useNavigate();
  const { enviando, error, enviar } = useEnvio();

  function guardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(e.currentTarget));
    enviar(async () => {
      const { id } = cliente ? await api.put<{ id: string }>(`/clientes/${cliente.id}`, datos) : await api.post<{ id: string }>("/clientes", datos);
      navegar(`/clientes/${id}`, { replace: true });
    });
  }

  return (
    <form onSubmit={guardar} className="tarjeta space-y-4 p-4 sm:p-6">
      {error && <Aviso>{error}</Aviso>}
      <div>
        <label htmlFor="nombre" className="etiqueta">Nombre y apellido *</label>
        <input id="nombre" name="nombre" required defaultValue={cliente?.nombre} className="campo" placeholder="Ej: Ana Gómez" autoFocus={!cliente} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="telefono" className="etiqueta">WhatsApp / teléfono</label>
          <input id="telefono" name="telefono" type="tel" inputMode="tel" defaultValue={cliente?.telefono ?? ""} className="campo" placeholder="Ej: 11 2345 6789" />
          <p className="ayuda">Como lo anotás normalmente: el 0 y el 15 se quitan solos.</p>
        </div>
        <div>
          <label htmlFor="email" className="etiqueta">Email</label>
          <input id="email" name="email" type="email" defaultValue={cliente?.email ?? ""} className="campo" placeholder="opcional" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <label htmlFor="direccion" className="etiqueta">Dirección de envío</label>
          <input id="direccion" name="direccion" defaultValue={cliente?.direccion ?? ""} className="campo" placeholder="Calle, número, piso" />
        </div>
        <div>
          <label htmlFor="localidad" className="etiqueta">Localidad</label>
          <input id="localidad" name="localidad" defaultValue={cliente?.localidad ?? ""} className="campo" placeholder="Ciudad / CP" />
        </div>
      </div>
      <div>
        <label htmlFor="notas" className="etiqueta">Notas</label>
        <textarea id="notas" name="notas" rows={3} defaultValue={cliente?.notas ?? ""} className="campo" placeholder="Preferencias, cómo nos conoció, etc." />
      </div>
      <div className="flex justify-end">
        <Boton cargando={enviando} className="boton-primario w-full sm:w-auto">{cliente ? "Guardar cambios" : "Crear cliente"}</Boton>
      </div>
    </form>
  );
}
