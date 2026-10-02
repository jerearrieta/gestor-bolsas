import { useEffect } from "react";

export function useTitulo(titulo: string) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · JFA Bolsas` : "JFA Bolsas · Gestión";
  }, [titulo]);
}
