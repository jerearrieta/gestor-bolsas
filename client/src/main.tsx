import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import "./estilos.css";
import { ProveedorSesion } from "./lib/sesion";
import { Marco } from "./components/marco";
import { Login } from "./paginas/login";
import { Inicio } from "./paginas/inicio";
import { Pedidos } from "./paginas/pedidos/lista";
import { NuevoPedido, EditarPedido } from "./paginas/pedidos/formulario";
import { DetallePedido } from "./paginas/pedidos/detalle";
import { Clientes } from "./paginas/clientes/lista";
import { NuevoCliente, EditarCliente } from "./paginas/clientes/formulario";
import { DetalleCliente } from "./paginas/clientes/detalle";
import { Catalogo } from "./paginas/catalogo/lista";
import { NuevoProducto, EditarProducto } from "./paginas/catalogo/formulario";
import { ListaPrecios } from "./paginas/catalogo/lista-precios";
import { Finanzas } from "./paginas/finanzas";
import { Ajustes } from "./paginas/ajustes";
import { NoEncontrado } from "./paginas/no-encontrado";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProveedorSesion>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Marco />}>
            <Route index element={<Inicio />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="pedidos/nuevo" element={<NuevoPedido />} />
            <Route path="pedidos/:id" element={<DetallePedido />} />
            <Route path="pedidos/:id/editar" element={<EditarPedido />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="clientes/nuevo" element={<NuevoCliente />} />
            <Route path="clientes/:id" element={<DetalleCliente />} />
            <Route path="clientes/:id/editar" element={<EditarCliente />} />
            <Route path="catalogo" element={<Catalogo />} />
            <Route path="catalogo/nuevo" element={<NuevoProducto />} />
            <Route path="catalogo/lista-precios" element={<ListaPrecios />} />
            <Route path="catalogo/:id" element={<EditarProducto />} />
            <Route path="finanzas" element={<Finanzas />} />
            <Route path="ajustes" element={<Ajustes />} />
            <Route path="inicio" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NoEncontrado />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProveedorSesion>
  </StrictMode>,
);
