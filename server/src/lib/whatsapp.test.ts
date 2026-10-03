import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizarTelefono } from "./whatsapp.js";
import { costoBolsa, precioSugerido, redondearPrecio } from "./precios.js";
import { textoListaPrecios } from "./mensajes.js";

test("normaliza teléfonos argentinos para wa.me", () => {
  const casos: [string, string | null][] = [
    ["011 15-2345-6789", "5491123456789"],
    ["11 2345 6789", "5491123456789"],
    ["(0351) 15 456-7890", "5493514567890"],
    ["+54 9 11 2345 6789", "5491123456789"],
    ["54 11 2345 6789", "5491123456789"],
    ["2966 15 12 3456", "5492966123456"],
    ["+598 99 123 456", "59899123456"],
    ["123", null],
  ];
  for (const [entrada, esperado] of casos) assert.equal(normalizarTelefono(entrada), esperado, entrada);
});

test("precio sugerido según margen sobre el precio", () => {
  const costo = costoBolsa(4000, 0.5, 800);
  assert.equal(costo, 2800);
  assert.equal(redondearPrecio(precioSugerido(costo, 50)), 5600);
  assert.equal(precioSugerido(0, 50), 0);
});

test("arma la lista de precios para WhatsApp", () => {
  const texto = textoListaPrecios(
    [
      { nombre: "Marinera", medidas: [{ medida: "10x10", precio: 1500 }, { medida: "20x20", precio: 2000 }] },
      { nombre: "Totebag", medidas: [{ medida: "", precio: 3000 }] },
      { nombre: "Sin medidas", medidas: [] },
    ],
    "JFA Bolsas",
    "Ana",
  );
  assert.match(texto, /^¡Hola Ana! Te paso la lista de precios actualizada de JFA Bolsas:/);
  assert.match(texto, /\*Marinera\*\n• 10x10: \$\s1\.500\n• 20x20: \$\s2\.000/);
  assert.match(texto, /\*Totebag\*: \$\s3\.000/);
  assert.doesNotMatch(texto, /Sin medidas/);
});
