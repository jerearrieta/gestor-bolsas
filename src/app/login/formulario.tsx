"use client";

import { useActionState, useState } from "react";
import { ingresar } from "./actions";
import { BotonEnviar } from "@/components/botones";
import { Aviso } from "@/components/ui";

export function FormularioLogin() {
  const [estado, accion] = useActionState(ingresar, undefined);
  // Controlado para que el email no se borre si la contraseña es incorrecta
  const [email, setEmail] = useState("");
  return (
    <form action={accion} className="space-y-4">
      {estado?.error && <Aviso>{estado.error}</Aviso>}
      <div>
        <label htmlFor="email" className="etiqueta">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="campo" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label htmlFor="password" className="etiqueta">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="campo" />
      </div>
      <BotonEnviar className="boton-primario w-full" pendiente="Ingresando…">Ingresar</BotonEnviar>
    </form>
  );
}
