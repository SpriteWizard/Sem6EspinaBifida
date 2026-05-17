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

create table LOG_PAGOS(
  ID_LOG_PAGO NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  ID_RECIBO NUMBER not null,
  CANT_PAGADA NUMBER not null,
  METODO_PAGO VARCHAR2(50) not null,
  FECHA_PAGO DATE not null,
  ID_ASOCIADO NUMBER not null,
  ID_USUARIO NUMBER not null,
  CONSTRAINT FK_LOG_PAGOS_RECIBO FOREIGN KEY (ID_RECIBO) REFERENCES RECIBO(ID_RECIBO) ON DELETE CASCADE,
  CONSTRAINT FK_LOG_PAGOS_ASOCIADO FOREIGN KEY (ID_ASOCIADO) REFERENCES ASOCIADO(ID_ASOCIADO) ON DELETE CASCADE,
  CONSTRAINT FK_LOG_PAGOS_USUARIO FOREIGN KEY (ID_USUARIO) REFERENCES USUARIOS(ID_USUARIO) ON DELETE CASCADE
)

select * from LOG_PAGOS;


DECLARE 
  v_body CLOB := TO_CLOB(:body);

  TYPE t_map IS TABLE OF NUMBER INDEX BY VARCHAR2(100);

  consulta_map t_map;

  v_real_id NUMBER;
BEGIN

  FOR r IN (
    SELECT * from JSON_TABLE(
      v_body,
      '$.consultas[*]' COLUMNS (
        local_id NUMBER PATH '$.id_consulta_local',
        id_asociado NUMBER PATH '$.id_asociado',
        id_medico NUMBER PATH '$.id_medico',
        tipo_consulta VARCHAR2(50) PATH '$.tipo_consulta',
        id_medico NUMBER PATH '$.id_medico',
        fecha_cita DATE PATH '$.fecha_cita',
        aportacion NUMBER PATH '$.aportacion',
        id_recibo NUMBER PATH '$.id_recibo'
      )
    )
  )
  LOOP 
    INSERT INTO CONSULTA (ID_ASOCIADO, ID_MEDICO, TIPO_CONSULTA, ID_RECIBO, FECHA, APORTACION, ESTATUS)
    VALUES (r.id_asociado, r.id_medico, r.tipo_consulta, r.id_recibo, r.fecha_cita, r.aportacion, 'Pendiente')
    returning ID_CONSULTA INTO v_real_id);

    consulta_map(r.local_id) := v_real_id;
  END LOOP;
  
  FOR e in (
    SELECT * from JSON_TABLE(
      v_body,
      '$.estudios[*]' COLUMNS (
        id_consulta NUMBER PATH '$.id_consulta',
        id_asociado NUMBER PATH '$.id_asociado',
        id_medico NUMBER PATH '$.id_medico',
        id_tipo_estudio NUMBER PATH '$.id_tipo_estudio',
        laboratorio VARCHAR2(255) PATH '$.laboratorio',
        aportacion NUMBER PATH '$.aportacion',
        ya_aporto VARCHAR2(5) PATH '$.ya_aporto',
        fecha_cita VARCHAR2(50) PATH '$.fecha_cita',
        estatus VARCHAR2(50) PATH '$.estatus'
        resultados VARCHAR2(255) PATH '$.resultados'
      )
    )
  )
  LOOP
    INSERT INTO ESTUDIO (ID_ASOCIADO, ID_MEDICO, ID_TIPO_ESTUDIO, LABORATORIO, FECHA, APORTACION, YA_APORTO, FECHA_CITA, ESTATUS, RESULTADOS, ID_CONSULTA)
    values (e.id_asociado, e.id_medico, e.id_tipo_estudio, e.laboratorio, SYSDATE, e.aportacion, e.ya_aporto, TO_DATE(e.fecha_cita, 'YYYY-MM-DD HH24:MI:SS'), e.estatus, e.resultados, consulta_map(e.id_consulta));
  END LOOP;

END;