"use client";

import HalfLogoSrc from "../assets/HalfLogo.png";
import type { AsociadoDetalle } from "./ModalAsociado";

interface Props {
  asociado: AsociadoDetalle;
  foto: string;
}

function FieldLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="mb-1.5 border-b border-gray-300 pb-px">
      <span className="text-[11px] font-bold text-gray-800">{label} </span>
      <span className="text-[11px] text-gray-700">{value || "—"}</span>
    </div>
  );
}

export default function CredencialPreview({ asociado, foto }: Props) {
  const valvStr =
    asociado.valvula === true ? "Sí" : asociado.valvula === false ? "No" : "—";

  return (
    <div className="flex flex-wrap justify-center gap-3">

      {/* ── FRENTE ── */}
      <div className="flex min-h-[218px] w-[340px] flex-shrink-0 flex-col rounded border border-gray-400 bg-white p-2.5">

        {/* Top: logo + folio + nombre + dirección */}
        <div className="mb-2 flex gap-2">
          <img
            src={HalfLogoSrc.src}
            alt="Logo"
            className="h-[63px] w-[68px] flex-shrink-0 object-contain"
          />
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 text-right text-[9px] font-bold text-gray-600">
              Folio: {asociado.folio || "—"}
            </div>
            <FieldLine label="Nombre:" value={asociado.nombre} />
            <FieldLine label="Dirección:" value={asociado.direccion} />
          </div>
        </div>

        {/* Middle: foto + tel + padres */}
        <div className="flex flex-1 gap-2">
          {foto ? (
            <img
              src={foto}
              alt="Foto"
              className="h-[79px] w-[66px] flex-shrink-0 border border-gray-200 object-cover"
            />
          ) : (
            <div className="flex h-[79px] w-[66px] flex-shrink-0 items-center justify-center border border-dashed border-gray-300 bg-gray-50 text-[8px] text-gray-400">
              Foto
            </div>
          )}
          <div className="min-w-0 flex-1">
            <FieldLine label="Tel. Casa:" value={asociado.telCasa} />
            <FieldLine label="Nombre de padres:" value={asociado.nombrePadreMadre} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-1.5">
          <FieldLine label="Fecha de Expedición:" value={asociado.fechaAlta} />
        </div>
      </div>

      {/* ── REVERSO ── */}
      <div className="flex min-h-[218px] w-[340px] flex-shrink-0 flex-col rounded border border-gray-400 bg-white p-2.5">

        <div className="flex-1 space-y-0.5">
          <FieldLine label="Padecimiento:" value={asociado.padecimiento} />
          <div className="flex gap-4">
            <div className="flex-1">
              <FieldLine label="Tipo de Sangre:" value={asociado.tipoSangre} />
            </div>
            <div className="flex-1">
              <FieldLine label="Tiene Válvula?" value={valvStr} />
            </div>
          </div>
          <FieldLine label="En caso de accidente avisar a:" value={asociado.contactoEmergencia?.nombre} />
          <FieldLine label="Teléfono:" value={asociado.contactoEmergencia?.telefono} />
          <FieldLine label="Correo Electrónico:" value={asociado.correo} />
        </div>

        <div>
          <div className="my-1.5 border-t border-gray-300" />
          <div className="flex items-start gap-2">
            <img
              src={HalfLogoSrc.src}
              alt="Logo"
              className="h-7 w-8 flex-shrink-0 object-contain"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[8px] font-bold leading-tight">ASOCIACION DE ESPINA BIFIDA</div>
              <div className="text-[8px] font-bold leading-tight">DE NUEVO LEON ABP</div>
              <div className="text-[7px] text-gray-500">Monterrey, N.L.</div>
              <div className="text-[7px] text-gray-500">www.espinabifida.org.mx</div>
            </div>
            <div className="flex-shrink-0 space-y-0.5 text-[8px]">
              <div className="font-bold">Datos de Nacimiento:</div>
              <div><b>Fecha:</b> {asociado.fechaNacimiento || "—"}</div>
              <div><b>Lugar Nac.</b> {asociado.lugarNacimiento || "—"}</div>
              <div><b>Hospital</b> {asociado.hospital || "—"}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
