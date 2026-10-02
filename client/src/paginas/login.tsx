import { useState, type FormEvent } from "react";
import { Navigate } from "react-router";
import { supabase } from "../lib/supabase";
import { useSesion } from "../lib/sesion";
import { useEnvio } from "../lib/datos";
import { Aviso } from "../components/ui";
import { Boton } from "../components/botones";

export function Login() {
  const { sesion } = useSesion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { enviando, error, enviar } = useEnvio();

  if (sesion) return <Navigate to="/" replace />;

  function ingresar(e: FormEvent) {
    e.preventDefault();
    enviar(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        throw new Error(
          error.message === "Invalid login credentials" ? "El email o la contraseña no son correctos." : `No se pudo ingresar: ${error.message}`,
        );
      }
    });
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/logo.svg" alt="" className="mb-3 size-14" />
          <h1 className="text-2xl font-bold text-stone-900">Gestión del taller</h1>
          <p className="mt-1 text-sm text-stone-500">Pedidos, clientes, precios y finanzas en un solo lugar.</p>
        </div>
        <form onSubmit={ingresar} className="tarjeta space-y-4 p-5 sm:p-6">
          {error && <Aviso>{error}</Aviso>}
          <div>
            <label htmlFor="email" className="etiqueta">Email</label>
            <input id="email" type="email" autoComplete="email" required className="campo" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="password" className="etiqueta">Contraseña</label>
            <input id="password" type="password" autoComplete="current-password" required className="campo" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Boton cargando={enviando} textoCargando="Ingresando…" className="boton-primario w-full">Ingresar</Boton>
        </form>
      </div>
    </main>
  );
}
