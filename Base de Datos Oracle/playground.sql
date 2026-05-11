alter table usuarios drop constraint CHK_USUARIOS_ROL

alter table usuarios add constraint CHK_USUARIOS_ROL check (ROL in ('superadmin', 'admin', 'secretaria', 'CEO'))

update usuarios set rol = 'secretaria' where rol = 'not assigned';
commit;