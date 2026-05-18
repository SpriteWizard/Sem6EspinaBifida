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

alter table asociado add fecha_solicitud date;
alter table asociado add telefono_casa varchar2(20);
alter table asociado add correo varchar2(255);
select * from padres;
select * from historial_medico;

-- Procedure to delete a user and all related records sequentially
CREATE OR REPLACE PROCEDURE delete_user(p_id_usuario IN NUMBER) IS
BEGIN
  -- Delete MOVIMIENTO_INVENTARIO records that reference the user directly
  DELETE FROM MOVIMIENTO_INVENTARIO WHERE ID_USUARIO = p_id_usuario;

  -- Delete PAGO records for RECIBO of the user
  DELETE FROM PAGO WHERE ID_RECIBO IN (SELECT ID_RECIBO FROM RECIBO WHERE ID_USUARIO = p_id_usuario);

  -- Delete DETALLE_RECIBO records for RECIBO of the user
  DELETE FROM DETALLE_RECIBO WHERE ID_RECIBO IN (SELECT ID_RECIBO FROM RECIBO WHERE ID_USUARIO = p_id_usuario);

  -- Delete CONSULTA records for RECIBO of the user
  DELETE FROM CONSULTA WHERE ID_RECIBO IN (SELECT ID_RECIBO FROM RECIBO WHERE ID_USUARIO = p_id_usuario);

  -- Delete MOVIMIENTO_INVENTARIO records for RECIBO of the user (additional ones)
  DELETE FROM MOVIMIENTO_INVENTARIO WHERE ID_RECIBO IN (SELECT ID_RECIBO FROM RECIBO WHERE ID_USUARIO = p_id_usuario);

  -- Delete RECIBO records for the user
  DELETE FROM RECIBO WHERE ID_USUARIO = p_id_usuario;

  -- Finally, delete the user
  DELETE FROM USUARIOS WHERE ID_USUARIO = p_id_usuario;

  COMMIT;
EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    RAISE;
END;
/

-- Example usage: EXEC delete_user(1);

-- Procedure to delete an asociado and all related records sequentially
CREATE OR REPLACE PROCEDURE delete_asociado(p_id_asociado IN NUMBER) IS
BEGIN
  -- Delete HISTORIAL_EMBARAZO for PADRES of the asociado
  DELETE FROM HISTORIAL_EMBARAZO
  WHERE ID_PADRE IN (SELECT ID_PADRE FROM PADRES WHERE ID_ASOCIADO = p_id_asociado);

  -- Delete PADRES records for the asociado
  DELETE FROM PADRES WHERE ID_ASOCIADO = p_id_asociado;

  -- Delete ASOCIADO_PADECIMIENTO records for the asociado
  DELETE FROM ASOCIADO_PADECIMIENTO WHERE ID_ASOCIADO = p_id_asociado;

  -- Delete ESTUDIO records directly linked to the asociado
  DELETE FROM ESTUDIO WHERE ID_ASOCIADO = p_id_asociado;

  -- Also delete ESTUDIO records that still reference consultas owned by the asociado
  DELETE FROM ESTUDIO
  WHERE ID_CONSULTA IN (
    SELECT ID_CONSULTA FROM CONSULTA WHERE ID_ASOCIADO = p_id_asociado
  );

  -- Delete CONSULTA records for the asociado after removing dependent estudios
  DELETE FROM CONSULTA WHERE ID_ASOCIADO = p_id_asociado;

  -- Delete COMODATO records for the asociado
  DELETE FROM COMODATO WHERE ID_ASOCIADO = p_id_asociado;

  -- Delete HISTORIAL_MEDICO records for the asociado
  DELETE FROM HISTORIAL_MEDICO WHERE ID_ASOCIADO = p_id_asociado;

  -- Delete TELEFONO records for the asociado
  DELETE FROM TELEFONO WHERE ID_ASOCIADO = p_id_asociado;

  -- Delete ASOCIADO_DIRECCION records for the asociado
  DELETE FROM ASOCIADO_DIRECCION WHERE ID_ASOCIADO = p_id_asociado;

  -- Delete MOVIMIENTO_INVENTARIO records for RECIBO of the asociado
  DELETE FROM MOVIMIENTO_INVENTARIO WHERE ID_RECIBO IN (
    SELECT ID_RECIBO FROM RECIBO WHERE ID_ASOCIADO = p_id_asociado
  );

  -- Delete DETALLE_RECIBO records for RECIBO of the asociado
  DELETE FROM DETALLE_RECIBO WHERE ID_RECIBO IN (
    SELECT ID_RECIBO FROM RECIBO WHERE ID_ASOCIADO = p_id_asociado
  );

  -- Delete PAGO records for RECIBO of the asociado
  DELETE FROM PAGO WHERE ID_RECIBO IN (
    SELECT ID_RECIBO FROM RECIBO WHERE ID_ASOCIADO = p_id_asociado
  );

  -- Delete CONSULTA records for RECIBO of the asociado that were not already deleted
  DELETE FROM CONSULTA WHERE ID_RECIBO IN (
    SELECT ID_RECIBO FROM RECIBO WHERE ID_ASOCIADO = p_id_asociado
  );

  -- Delete RECIBO records for the asociado
  DELETE FROM RECIBO WHERE ID_ASOCIADO = p_id_asociado;

  -- Delete SOLICITUD records for the asociado
  DELETE FROM SOLICITUD WHERE ID_ASOCIADO = p_id_asociado;

  -- Finally, delete the asociado
  DELETE FROM ASOCIADO WHERE ID_ASOCIADO = p_id_asociado;

  COMMIT;
EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    RAISE;
END;
/

-- Example usage: EXEC delete_asociado(1);

-- For loop to delete the first 100 asociados (IDs 1 to 100)
BEGIN
  FOR i IN 1..80 LOOP
    BEGIN
      delete_asociado(i);
      DBMS_OUTPUT.PUT_LINE('Deleted asociado ' || i);
    EXCEPTION
      WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error deleting asociado ' || i || ': ' || SQLERRM);
    END;
  END LOOP;
END;
/

