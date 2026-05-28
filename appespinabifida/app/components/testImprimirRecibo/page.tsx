// app/print/page.tsx

import ImprimirReciboTemplate from "@/components/imprimirRecibo";

type MetodoPago =
  | "efectivo"
  | "transferencia"
  | "depósito"
  | "tarjeta";

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
  descuentoPct?: number;
  descuentoMonto?: number;
  exencionMonto?: number;
  productos?: Producto[] | null;
  pagos?: Pago[];
};

const mockRecibo: Recibo = {
  id: 99,
  reciboId: 99,

  asociado: "Rigoberto Garcia Lozano",

  fechaEmision: "2026-05-26T22:53:53Z",
  fechaLimite: "2026-05-31",

  montoTotal: 950,
  montoPagado: 300,

  tipoPaciente: "rural",

  descuentoPct: 10,
  descuentoMonto: 95,

  exencionMonto: 50,

  productos: [
    {
      itemId: 182,
      itemName: "Consulta primera",
      cantidad: 1,
      precioUnitario: 50,
      tipo: "Consulta",
    },
    {
      itemId: 167,
      itemName: "TAC cerebro",
      cantidad: 1,
      precioUnitario: 500,
      tipo: "Estudio",
    },
    {
      itemId: 41,
      itemName: "Paratapas",
      cantidad: 2,
      precioUnitario: 200,
      tipo: "Inventario",
    },
  ],

  pagos: [
    {
      id: 1,
      fecha: "2026-05-27T10:30:00Z",
      monto: 100,
      metodo: "efectivo",
    },
    {
      id: 2,
      fecha: "2026-05-28T14:15:00Z",
      monto: 200,
      metodo: "tarjeta",
    },
  ],
};

export default function PrintPage() {
  return <ImprimirReciboTemplate recibo={mockRecibo} />;
}