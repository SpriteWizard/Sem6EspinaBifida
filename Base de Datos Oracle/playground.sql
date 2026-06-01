alter table usuarios drop constraint CHK_USUARIOS_ROL

alter table usuarios add constraint CHK_USUARIOS_ROL check (ROL in ('superadmin', 'admin', 'secretaria', 'CEO'))

update usuarios set rol = 'secretaria' where rol = 'not assigned';
commit;

update consulta set fecha_creacion = sysdate where id_consulta = 185;


alter table usuarios add fecha_acceso date;

select * from usuarios;

update consulta set fecha = sysdate where id_consulta = 111;

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
    returning ID_CONSULTA INTO v_real_id;

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
        estatus VARCHAR2(50) PATH '$.estatus',
        resultados VARCHAR2(255) PATH '$.resultados'
      )
    )
  )
  LOOP
    INSERT INTO ESTUDIO (ID_ASOCIADO, ID_MEDICO, ID_TIPO_ESTUDIO, LABORATORIO, FECHA, APORTACION, YA_APORTO, FECHA_CITA, ESTATUS, RESULTADOS, ID_CONSULTA)
    values (e.id_asociado, e.id_medico, e.id_tipo_estudio, e.laboratorio, SYSDATE, e.aportacion, e.ya_aporto, TO_DATE(e.fecha_cita, 'YYYY-MM-DD HH24:MI:SS'), e.estatus, e.resultados, consulta_map(e.id_consulta));
  END LOOP;

END;

declare

  v_body CLOB := TO_CLOB(:body);

  v_id_asociado Number;
  v_id_usuario Number;
  v_fecha_limite Date;
  v_tipo_zona Varchar(10);
  v_tipo_cuota Varchar2(10);
  v_total Number;
  v_total_pagado Number;
  v_saldo_pendiente Number;
  v_estatus Varchar(20);
  v_nota CLOB;
  
  v_id_recibo_retornado Number;

begin

  v_id_asociado := JSON_VALUE(v_body, '$.id_asociado');
  v_id_usuario := JSON_VALUE(v_body, '$.id_usuario');
  v_fecha_limite := TO_DATE(JSON_VALUE(v_body, '$.fecha_limite'), 'YYYY-MM-DD');
  v_tipo_zona := JSON_VALUE(v_body, '$.tipo_zona');
  v_tipo_cuota := JSON_VALUE(v_body, '$.tipo_cuota');
  v_total := JSON_VALUE(v_body, '$.total');
  v_total_pagado := JSON_VALUE(v_body, '$.total_pagado');
  v_saldo_pendiente := JSON_VALUE(v_body, '$.saldo_pendiente');
  v_estatus := JSON_VALUE(v_body, '$.estatus');
  v_nota := JSON_VALUE(v_body, '$.nota');

  insert into recibo(ID_ASOCIADO, ID_USUARIO, FECHA, FECHA_LIMITE, TIPO_ZONA, TIPO_CUOTA, TOTAL, TOTAL_PAGADO, SALDO_PENDIENTE, ESTATUS, NOTA) values
  (v_id_asociado, v_id_usuario, SYSDATE, v_fecha_limite, v_tipo_zona, v_tipo_cuota, v_total, v_total_pagado, v_saldo_pendiente, v_estatus, v_nota)
  returning id_recibo into v_id_recibo_retornado;

  commit;

  update recibo set folio = 'REC-' || v_id_recibo_retornado where id_recibo = v_id_recibo_retornado;

  commit;

  HTP.P('{
    "status": "' || CASE WHEN v_id_recibo_retornado is not null then 'Success' else 'Failed'  end || '",
    "id_recibo":' || v_id_recibo_retornado || '
  }');

end;

select * from RECIBO;

commit;

select * from pago;

declare 
  v_body CLOB := TO_CLOB(:body);

  v_id_recibo number;
  v_monto number;
  v_metodo_pago VARCHAR2;
  v_fecha_pago date;
  v_id_asociado number;
  v_id_usuario number;

begin

  v_id_recibo := JSON_VALUE(v_body, '$.idRecibo');
  v_metodo_pago := JSON_VALUE(v_body, '$.metodoPago');
  v_monto := JSON_VALUE(v_body, '$.monto');
  v_fecha_pago := JSON_VALUE(v_body, '$.fechaPago');
  
  select id_asociado into v_id_asociado from recibo where id_recibo = v_id_recibo;

  v_id_usuario := JSON_VALUE(v_body, '.$idUsuario');

  insert into LOG_PAGOS (ID_RECIBO, METODO_PAGO, CANT_PAGADA, FECHA_PAGO, ID_USUARIO, ID_ASOCIADO ) values
  (v_id_recibo, v_metodo_pago, v_monto, v_fecha_pago, v_id_usuario, v_id_asociado);

  update RECIBO set TOTAL_PAGADO = TOTAL_PAGADO + v_monto where id_recibo = v_id_recibo;
  update RECIBO set SALDO_PENDIENTE = TOTAL - TOTAL_PAGADO where id_recibo = v_id_recibo;

  commit;

end;

alter table recibo add descuento number

select * from recibo;

select r.id_recibo, a.NOMBRE || ' ' || a.APELLIDOS as ASOCIADO, r.id_asociado, r.FECHA as FECHAEMISION, r.TOTAL as MONTOTOTAL, r.TOTAL_PAGADO as MONTOPAGADO, r.TIPO_ZONA as TIPOPACIENTE, r.descuento as DESCUENTOPCT, '[]' as productos
from RECIBO r
inner join asociado a on a.id_asociado = r.id_asociado;

select 
    c.ID_CONSULTA as itemId,
    c.TIPO_CONSULTA as itemName,
    1 as cantidad,
    0 as precioUnitario
from CONSULTA c
where c.ID_RECIBO = 118

union all

select
    e.ID_ESTUDIO as itemId,
    te.NOMBRE as itemName,
    1 as cantidad,
    0 as precioUnitario
  from estudio e
inner join TIPO_ESTUDIO te on e.id_tipo_estudio = te.id_tipo_estudio
where e.id_consulta = 100

union all

select
    i.ID_ARTICULO as itemId,
    i.NOMBRE as itemName,
    mi.CANTIDAD as cantidad,
    i.CUOTA_RECUPERACION as precioUnitario
from MOVIMIENTO_INVENTARIO mi
join ARTICULO i
    on i.ID_ARTICULO = mi.ID_ARTICULO
where mi.ID_RECIBO = 118;

begin 
  for element in (select * from estudio)
  loop
    if (element.fecha is null) then
    update estudio set fecha = sysdate;
    end if;
  end loop;
end;

commit;

select 
    r.id_recibo,
    a.NOMBRE || ' ' || a.APELLIDOS as ASOCIADO,
    r.id_asociado,
    r.FECHA as FECHAEMISION,
    r.TOTAL as MONTOTOTAL,
    r.TOTAL_PAGADO as MONTOPAGADO,
    r.TIPO_ZONA as TIPOPACIENTE,
    r.descuento as DESCUENTOPCT,

    (
        select json_arrayagg(
            json_object(
                'itemId' value itemId,
                'itemName' value itemName,
                'cantidad' value cantidad,
                'precioUnitario' value precioUnitario
            )
        )
        from (

            -- CONSULTAS
            select 
                c.ID_CONSULTA as itemId,
                'Consulta ' || c.TIPO_CONSULTA as itemName,
                1 as cantidad,
                0 as precioUnitario
            from CONSULTA c
            where c.ID_RECIBO = r.ID_RECIBO

            union all

            -- ESTUDIOS OF EACH CONSULTA
            select
                e.ID_ESTUDIO as itemId,
                te.NOMBRE as itemName,
                1 as cantidad,
                0 as precioUnitario
            from CONSULTA c
            inner join ESTUDIO e
                on e.ID_CONSULTA = c.ID_CONSULTA
            inner join TIPO_ESTUDIO te
                on te.ID_TIPO_ESTUDIO = e.ID_TIPO_ESTUDIO
            where c.ID_RECIBO = r.ID_RECIBO

            union all

            -- INVENTARIO
            select
                i.ID_ARTICULO as itemId,
                i.NOMBRE as itemName,
                mi.CANTIDAD as cantidad,
                i.CUOTA_RECUPERACION as precioUnitario
            from MOVIMIENTO_INVENTARIO mi
            inner join ARTICULO i
                on i.ID_ARTICULO = mi.ID_ARTICULO
            where mi.ID_RECIBO = r.ID_RECIBO

        )
    ) as productos

from RECIBO r
inner join ASOCIADO a
    on a.ID_ASOCIADO = r.ID_ASOCIADO;

commit;

update recibo set total_pagado = 0;
update recibo set descuento = 0;


BEGIN

    -- Reset totals
    UPDATE recibo
    SET total = 0;

    ----------------------------------------------------------------
    -- Add consulta aportaciones
    ----------------------------------------------------------------
    UPDATE recibo r
    SET total = (
        SELECT NVL(SUM(NVL(c.aportacion, 0)), 0)
        FROM consulta c
        WHERE c.id_recibo = r.id_recibo
    );

    ----------------------------------------------------------------
    -- Add estudio aportaciones
    ----------------------------------------------------------------
    UPDATE recibo r
    SET total = total + (
        SELECT NVL(SUM(NVL(e.aportacion, 0)), 0)
        FROM estudio e
        INNER JOIN consulta c
            ON c.id_consulta = e.id_consulta
        WHERE c.id_recibo = r.id_recibo
    );

    update recibo r set total = total + (
      select NVL(SUM(NVL(m.cuota_recuperacion * mi.cantidad,0)),0) 
      from movimiento_inventario mi 
      inner join articulo m on m.id_articulo = mi.id_articulo
      where mi.id_recibo = r.id_recibo
    );

    COMMIT;

END;
/

select * from recibo;

create or replace trigger actualizarPrecioRecibo
before update of id_recibo
on consulta
for each ROW
declare
  total_viejo number;
  total_pagado_viejo number;
  total_movimiento number;
  v_descuento number;
begin

  if (:new.aportacion is not null) then
    total_movimiento :=  :new.aportacion;
  else
    total_movimiento := 0;
  end if;

  if (:new.id_recibo = :old.id_recibo) then
    return;
  end if;

  select descuento into v_descuento from recibo where id_recibo = :new.id_recibo;

  if ((v_descuento is not null) and (v_descuento > 0)) then
    RAISE_APPLICATION_ERROR(-20005,'No se pueden modificar recibos con descuento');
  end if;

  for element in (select * from estudio where id_consulta = :new.id_consulta)
  loop
    if (element.aportacion is not null) THEN
      total_movimiento := total_movimiento + element.aportacion;
    end if;
  end loop;

  if :old.id_recibo is null then
    update recibo set total = total + total_movimiento where id_recibo = :new.id_recibo;
    return;
  end if;
  select total, total_pagado into total_viejo, total_pagado_viejo from recibo where id_recibo = :old.id_recibo;

  if (total_viejo - total_pagado_viejo < total_movimiento) then
    RAISE_APPLICATION_ERROR(-20001, 'No se puede mover un recibo si ya se pagaron las consultas o los recibos siendo relocalizados');
    return;
  end if;

  update recibo set total = total + total_movimiento where id_recibo = :new.id_recibo;
  update recibo set total = total - total_movimiento where id_recibo = :old.id_recibo;
  
  return;

end;

CREATE OR REPLACE TRIGGER cambiosDeAportacionConsulta
BEFORE UPDATE OF aportacion
ON consulta
FOR EACH ROW
DECLARE
    diferencia NUMBER;
    total_viejo NUMBER;
    total_pagado_viejo NUMBER;
    v_descuento NUMBER := 0;
BEGIN

    ----------------------------------------------------------------
    -- Skip if no real change
    ----------------------------------------------------------------
    IF NVL(:NEW.aportacion, 0) = NVL(:OLD.aportacion, 0) THEN
        RETURN;
    END IF;

    ----------------------------------------------------------------
    -- No receipt -> nothing to update
    ----------------------------------------------------------------
    IF :OLD.id_recibo IS NULL THEN
        RETURN;
    END IF;

    ----------------------------------------------------------------
    -- Get discount safely
    ----------------------------------------------------------------
    BEGIN
        SELECT NVL(descuento, 0)
        INTO v_descuento
        FROM recibo
        WHERE id_recibo = :OLD.id_recibo;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            v_descuento := 0;
    END;

    ----------------------------------------------------------------
    -- Prevent changes on discounted receipts
    ----------------------------------------------------------------
    IF v_descuento > 0 THEN
        RAISE_APPLICATION_ERROR(
            -20005,
            'No se pueden modificar recibos con descuento'
        );
    END IF;

    ----------------------------------------------------------------
    -- Calculate difference
    ----------------------------------------------------------------
    diferencia := NVL(:NEW.aportacion, 0)
                - NVL(:OLD.aportacion, 0);

    ----------------------------------------------------------------
    -- Validate paid amount
    ----------------------------------------------------------------
    SELECT total, total_pagado
    INTO total_viejo, total_pagado_viejo
    FROM recibo
    WHERE id_recibo = :OLD.id_recibo;

    IF (total_viejo + diferencia) < total_pagado_viejo THEN
        RAISE_APPLICATION_ERROR(
            -20002,
            'No se puede reducir el total debajo del monto pagado'
        );
    END IF;

    ----------------------------------------------------------------
    -- Update receipt
    ----------------------------------------------------------------
    UPDATE recibo
    SET total = total + diferencia
    WHERE id_recibo = :OLD.id_recibo;

END;
/

alter table consulta add FECHA_CREACION date;

update consulta set fecha_creacion = sysdate;
commit;

CREATE OR REPLACE TRIGGER cambiosDeAportacionEstudio
BEFORE UPDATE OF aportacion
ON estudio
FOR EACH ROW
DECLARE
    diferencia NUMBER;
    v_id_recibo NUMBER;
    total_viejo NUMBER;
    total_pagado_viejo NUMBER;
    v_descuento NUMBER := 0;
BEGIN

    ----------------------------------------------------------------
    -- Skip if no real change
    ----------------------------------------------------------------
    IF NVL(:NEW.aportacion, 0) = NVL(:OLD.aportacion, 0) THEN
        RETURN;
    END IF;

    ----------------------------------------------------------------
    -- Find receipt safely
    ----------------------------------------------------------------
    BEGIN
        SELECT id_recibo
        INTO v_id_recibo
        FROM consulta
        WHERE id_consulta = :OLD.id_consulta;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN;
    END;

    ----------------------------------------------------------------
    -- No receipt -> nothing to update
    ----------------------------------------------------------------
    IF v_id_recibo IS NULL THEN
        RETURN;
    END IF;

    ----------------------------------------------------------------
    -- Get discount safely
    ----------------------------------------------------------------
    BEGIN
        SELECT NVL(descuento, 0)
        INTO v_descuento
        FROM recibo
        WHERE id_recibo = v_id_recibo;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            v_descuento := 0;
    END;

    ----------------------------------------------------------------
    -- Prevent changes on discounted receipts
    ----------------------------------------------------------------
    IF v_descuento > 0 THEN
        RAISE_APPLICATION_ERROR(
            -20005,
            'No se pueden modificar recibos con descuento'
        );
    END IF;

    ----------------------------------------------------------------
    -- Calculate difference
    ----------------------------------------------------------------
    diferencia := NVL(:NEW.aportacion, 0)
                - NVL(:OLD.aportacion, 0);

    ----------------------------------------------------------------
    -- Validate paid amount
    ----------------------------------------------------------------
    SELECT total, total_pagado
    INTO total_viejo, total_pagado_viejo
    FROM recibo
    WHERE id_recibo = v_id_recibo;

    IF (total_viejo + diferencia) < total_pagado_viejo THEN
        RAISE_APPLICATION_ERROR(
            -20003,
            'No se puede reducir el total debajo del monto pagado'
        );
    END IF;

    ----------------------------------------------------------------
    -- Update receipt
    ----------------------------------------------------------------
    UPDATE recibo
    SET total = total + diferencia
    WHERE id_recibo = v_id_recibo;

END;
/

create or replace trigger ultimo_recibo_asociado
after insert
on recibo 
for each row
begin

  update asociado set fecha_ult_recibo = :new.fecha where id_asociado = :new.id_asociado;

end;

begin

  for element in (
    select * from recibo
  )
  loop
    
    update asociado set fecha_ult_recibo = element.fecha where id_asociado = element.id_asociado;
  end loop;
  commit;
end;

select * from asociado;

update laboratorio set nombre = 'Laboratorio Maria Luisa' where nombre = 'Lab ABC';
commit;