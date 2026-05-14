"use client";

import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";

type UsuarioDetalle = {
  id: string;
  nombre: string;
  apellidos?: string;
  email: string;
  rol: string;
  estatus: "Activo" | "Inactivo" | "Pendiente";
  fechaalta: string;
  ultimoacceso: string;
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

  async function toggleStatus(){
    await fetch("/api/usuarios/toggleUsuario",{
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body : JSON.stringify(usuario)
    });

    window.location.reload();
  }

  return (
    <Modal open={open} onClose={onClose} titleId="usuario-modal-title" title={`Usuario: ${usuario.nombre}${usuario.apellidos ? ` ${usuario.apellidos}` : ''}`}>
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
          {usuario.apellidos && (
            <div>
              <p className="text-xs uppercase text-slate-500">Apellidos</p>
              <p className="text-sm font-medium text-slate-900">{usuario.apellidos}</p>
            </div>
          )}
          <div>
            <p className="text-xs uppercase text-slate-500">Rol</p>
            <p className="text-sm font-medium text-slate-900">{usuario.rol}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Estatus</p>
            <p className="text-sm font-medium text-slate-900">{(usuario.estatus) ? "Activo" : "Inactivo"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Fecha de alta</p>
            <p className="text-sm font-medium text-slate-900">{usuario.fechaalta}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Último acceso</p>
            <p className="text-sm font-medium text-slate-900">{usuario.ultimoacceso}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs uppercase text-slate-500">Teléfono</p>
            <p className="text-sm font-medium text-slate-900">{usuario.telefono}</p>
          </div>
          
            <div className="sm:col-span-2">
              <p className="text-xs uppercase text-slate-500">Empresa</p>
              <p className="text-sm font-medium text-slate-900">Espina Bifida</p>
            </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            variant={isActive ? "destructive" : "primary"}
            onClick={async () => toggleStatus()}
          >
            {usuario.estatus ? "Desactivar cuenta" : "Reactivar cuenta"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export type { UsuarioDetalle };
