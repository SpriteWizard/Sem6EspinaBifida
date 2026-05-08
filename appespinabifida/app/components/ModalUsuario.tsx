"use client";

import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";

type UsuarioDetalle = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  estatus: "Activo" | "Inactivo" | "Pendiente";
  fechaAlta: string;
  ultimoAcceso: string;
  telefono: string;
  empresa?: string;
};

type ModalUsuarioProps = {
  open: boolean;
  usuario: UsuarioDetalle;
  onClose: () => void;
};

export default function ModalUsuario({ open, usuario, onClose }: ModalUsuarioProps) {
  const isActive = usuario.estatus === "Activo";

  return (
    <Modal open={open} onClose={onClose} titleId="usuario-modal-title" title={`Usuario: ${usuario.nombre}`}>
      <div className="space-y-4 px-5 py-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-slate-500">ID</p>
            <p className="text-sm font-medium text-slate-900">{usuario.id}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Correo</p>
            <p className="text-sm font-medium text-slate-900">{usuario.email}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Rol</p>
            <p className="text-sm font-medium text-slate-900">{usuario.rol}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Estatus</p>
            <p className="text-sm font-medium text-slate-900">{usuario.estatus}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Fecha de alta</p>
            <p className="text-sm font-medium text-slate-900">{usuario.fechaAlta}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Último acceso</p>
            <p className="text-sm font-medium text-slate-900">{usuario.ultimoAcceso}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs uppercase text-slate-500">Teléfono</p>
            <p className="text-sm font-medium text-slate-900">{usuario.telefono}</p>
          </div>
          {usuario.empresa && (
            <div className="sm:col-span-2">
              <p className="text-xs uppercase text-slate-500">Empresa</p>
              <p className="text-sm font-medium text-slate-900">{usuario.empresa}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            variant={isActive ? "destructive" : "primary"}
            onClick={() => alert(`${isActive ? "Desactivar" : "Reactivar"} cuenta: ${usuario.nombre}`)}
          >
            {isActive ? "Desactivar cuenta" : "Reactivar cuenta"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export type { UsuarioDetalle };
