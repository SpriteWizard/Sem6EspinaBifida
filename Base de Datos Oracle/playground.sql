alter table usuarios drop constraint CHK_USUARIOS_ROL

alter table usuarios add constraint CHK_USUARIOS_ROL check (ROL in ('superadmin', 'admin', 'secretaria', 'CEO'))

update usuarios set rol = 'secretaria' where rol = 'not assigned';
commit;

alter table usuarios add fecha_acceso date;

select * from usuarios;

select nombre, apellidos, id_usuario, correo, rol, activo, fecha_creacion, telefono from usuarios;

alter table asociado add razon_rechazo varchar2(255);

select * from asociado;

alter table asociado drop constraint CHK_ACT_ASC;

alter table usuarios add fecha_desactivado date;

commit;

alter table asociado add constraint CHK_ACT_ASC check (activo in ('Activo', 'Inactivo', 'Anulado', 'Pendiente'));