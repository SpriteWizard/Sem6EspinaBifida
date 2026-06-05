"use client";

import React from "react";

type MetodoPago = "efectivo" | "transferencia" | "depósito" | "tarjeta";

type Pago = {
  id?: number;
  fecha: string;
  monto: number;
  metodo: MetodoPago;
};

type Producto = {
  itemId: number;
  itemName: string;
  cantidad: number;
  precioUnitario: number;
  tipo: "Consulta" | "Estudio" | "Inventario";
};

type Recibo = {
  id: number;
  reciboId?: number;
  asociado: string;
  fechaEmision: string;
  fechaLimite: string;
  montoTotal: number;
  montoPagado: number;
  tipoPaciente: "urbano" | "rural";
  descuento: number;
  exencionMonto?: number;
  productos?: Producto[] | null;
  pagos?: Pago[];
  exento?: boolean;
};

type Props = {
  recibo: Recibo;
};

const currency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));

export default function ImprimirReciboTemplate({ recibo }: Props) {

  const subtotal =
    recibo.productos?.reduce(
      (acc, item) => acc + item.cantidad * item.precioUnitario,
      0
    ) || 0;

  const descuento =
    recibo.descuento

  const exencion = recibo.exento ? subtotal : 0;

  const total = subtotal - descuento - exencion;

  const saldoPendiente = Math.max(total - recibo.montoPagado, 0);

  const estatus = saldoPendiente <= 0 ? "Pagado" : total - saldoPendiente != 0? "Pagado Parcialmente": "Pendiente de Pago";

  const pagosOrdenados =
    recibo.pagos?.sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    ) || [];

  return (
    <div
      className="
        w-[210mm]
        min-h-[297mm]
        bg-white
        text-black
        p-10
        mx-auto
        print:p-6
      "
    >
      {/* HEADER */}
      <div className="flex justify-between items-start border-b-2 border-gray-300 pb-5 print:pb-3 print-block">
        <div className="flex items-center gap-4">
          <img
            src="/LOGO-08.jpg"
            alt="Logo clínica"
            className="w-24 h-24 object-contain print:w-20 print:h-20"
          />

          <div>
            <h1 className="text-3xl font-bold uppercase print:text-2xl">
              Recibo de Pago
            </h1>
            <p className="text-gray-600 mt-1">Clínica Espina Bífida</p>
            <p className="text-gray-500 text-sm">
              Documento oficial de cobro
            </p>
          </div>
        </div>

        <div className="text-right">
          <h2 className="text-2xl font-bold print:text-xl">
            REC-{String(recibo.reciboId || recibo.id).padStart(4, "0")}
          </h2>

          <div
            className={`mt-3 inline-flex px-4 py-1 rounded-full text-sm font-semibold ${
              estatus === "Pagado"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            } print:border print:bg-transparent`}
          >
            {estatus}
          </div>
        </div>
      </div>

      {/* INFORMACION */}
      <div className="grid grid-cols-2 gap-8 mt-8 print:mt-6 print:gap-4 print-block">
        <div className="border rounded-lg p-5 print:p-3">
          <h3 className="text-lg font-bold border-b pb-2 mb-4 print:text-base">
            Información del Asociado
          </h3>
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-semibold">Nombre:</span>{" "}
              {recibo.asociado}
            </p>
            <p>
              <span className="font-semibold">Tipo de zona:</span>{" "}
              {recibo.tipoPaciente}
            </p>
          </div>
        </div>

        <div className="border rounded-lg p-5 print:p-3">
          <h3 className="text-lg font-bold border-b pb-2 mb-4 print:text-base">
            Información del Recibo
          </h3>
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-semibold">Fecha emisión:</span>{" "}
              {formatDate(recibo.fechaEmision)}
            </p>
            <p>
              <span className="font-semibold">Fecha límite:</span>{" "}
              {formatDate(recibo.fechaLimite)}
            </p>
            <p>
              <span className="font-semibold">Estatus:</span> {estatus}
            </p>
          </div>
        </div>
      </div>

      {/* CONCEPTOS */}
      <div className="mt-10 print:mt-6 print-block">
        <h3 className="text-xl font-bold mb-4 print:text-lg">
          Conceptos
        </h3>

        <table className="w-full border border-gray-300 text-sm print:text-xs">
          <thead className="bg-gray-100 print:bg-gray-200">
            <tr>
              <th className="border p-3 text-left">Concepto</th>
              <th className="border p-3 text-left">Tipo</th>
              <th className="border p-3 text-center">Cantidad</th>
              <th className="border p-3 text-right">Precio</th>
              <th className="border p-3 text-right">Total</th>
            </tr>
          </thead>

          <tbody>
            {recibo.productos?.length ? (
              recibo.productos.map((p) => (
                <tr key={p.itemId} className="print:break-inside-avoid">
                  <td className="border p-3">{p.itemName}</td>
                  <td className="border p-3">{p.tipo}</td>
                  <td className="border p-3 text-center">{p.cantidad}</td>
                  <td className="border p-3 text-right">
                    {currency(p.precioUnitario)}
                  </td>
                  <td className="border p-3 text-right">
                    {currency(p.cantidad * p.precioUnitario)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="border p-4 text-center text-gray-500">
                  Sin conceptos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* RESUMEN */}
      <div className="flex justify-end mt-8 print:mt-6 print-block">
        <div className="w-[360px] border rounded-lg p-5 print:p-3">
          <h3 className="text-lg font-bold border-b pb-2 mb-4">
            Resumen
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{currency(subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span>Descuento</span>
              <span>-{currency(descuento)}</span>
            </div>

            <div className="flex justify-between">
              <span>Exención</span>
              <span>-{currency(exencion)}</span>
            </div>

            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>{currency(total)}</span>
            </div>

            <div className="flex justify-between">
              <span>Pagado</span>
              <span>{currency(recibo.montoPagado)}</span>
            </div>

            <div className="flex justify-between">
              <span>Saldo</span>
              <span>{currency(saldoPendiente)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PAGOS */}
      <div className="mt-10 print:mt-6 print-block">
        <h3 className="text-xl font-bold mb-4">Historial de Pagos</h3>

        <table className="w-full border text-sm print:text-xs">
          <thead className="bg-gray-100 print:bg-gray-200">
            <tr>
              <th className="border p-3 text-left">Fecha</th>
              <th className="border p-3 text-right">Monto</th>
              <th className="border p-3 text-left">Método</th>
            </tr>
          </thead>

          <tbody>
            {pagosOrdenados.map((p, i) => (
              <tr key={p.id || i} className="print:break-inside-avoid">
                <td className="border p-3">{formatDate(p.fecha)}</td>
                <td className="border p-3 text-right">
                  {currency(p.monto)}
                </td>
                <td className="border p-3 capitalize">{p.metodo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* NOTAS + FIRMA */}
      <div className="mt-10 print:mt-6 print-block">
        <h3 className="text-xl font-bold mb-4 pt-6">Notas</h3>
        <div className="border h-[140px]">
          
        </div>

        <div className="flex justify-between pt-30">
          <div className="w-1/3 text-center">
            <div className="border-t border-black pt-2" />
            <p className="text-xs mt-2">Firma paciente</p>
          </div>

          <div className="w-1/3 text-center">
            <div className="border-t border-black pt-2" />
            <p className="text-xs mt-2">Sello/Firma</p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-16 border-t pt-4 text-xs text-gray-500 flex justify-between print:mt-8">
        <span>Generado automáticamente</span>
        <span>{formatDate(new Date().toISOString())}</span>
      </div>
    </div>
  );
}