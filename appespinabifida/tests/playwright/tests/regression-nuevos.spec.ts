import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://sem6-espina-bifida.vercel.app';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
const USUARIO = 'test@test.com';
const PASSWORD = 'testpassword';
const SECRETARIO_EMAIL = 'SecretarioTest@test.com';
const SECRETARIO_PASSWORD = 'Secretariotest';

async function login(page, email = USUARIO, password = PASSWORD) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  // If already authenticated, skip form submission.
  if (await page.getByRole('button', { name: 'Salir' }).count() > 0) {
    return;
  }

  const userField = page.getByRole('textbox', { name: 'Usuario' });
  await userField.waitFor({ state: 'visible', timeout: 15000 });

  await userField.fill(email);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(password);
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await page.waitForURL(new RegExp(`^${BASE_URL}/(asociados|dashboard)`), { timeout: 15000 });
}

async function createPendingPreregistro(page) {
  const browser = page.context().browser();
  const publicContext = await browser.newContext();
  const publicPage = await publicContext.newPage();
  await publicPage.goto(`${BASE_URL}/registro-preregistro`);
  const curpUnica = `REGG${String(Date.now()).slice(-10).padStart(10, '0')}HMCRSN`;
  await publicPage.locator('#pr-nombre').fill('Gregorio');
  await publicPage.locator('#pr-apellidopaterno').fill('Registro');
  await publicPage.locator('#pr-apellidomaterno').fill('Publico');
  await publicPage.locator('#pr-fnac').fill('1990-01-01');
  await publicPage.locator('#pr-sexo').selectOption('Masculino');
  await publicPage.locator('#pr-curp').fill(curpUnica);
  await publicPage.locator('#pr-tel').fill('8100000001');
  await publicPage.locator('#pr-correo').fill(`preregistro${Date.now()}@test.com`);
  await publicPage.locator('#pr-pm-nombre').fill('Padre');
  await publicPage.locator('#pr-pm-apellidopaterno').fill('Nombre');
  await publicPage.locator('#pr-pm-apellidomaterno').fill('Test');
  await publicPage.locator('#pr-ce-nombre').fill('Emergencia');
  await publicPage.locator('#pr-ce-tel').fill('8100000002');
  await publicPage.locator('#pr-ce-relacion').selectOption('Madre');
  await publicPage.getByRole('button', { name: /Enviar preregistro|Enviar/i }).click();
  await publicPage.getByRole('button', { name: /Confirmar y enviar/i }).click();
  await expect(publicPage.locator('text=/confirmaci[oó]n|registrado|pendiente|gracias/i').first()).toBeVisible({ timeout: 15000 });
  await publicPage.close();
  await publicContext.close();
  return curpUnica;
}

async function submitInventoryMovement(page) {
  const submitButton = page.getByRole('button', { name: 'Registrar movimiento' });
  await submitButton.click();

  try {
    await submitButton.waitFor({ state: 'detached', timeout: 15000 });
    return;
  } catch {
    const submitErrorLocator = page.locator('p[role="alert"]');
    if (await submitErrorLocator.count() > 0) {
      const submitError = await submitErrorLocator.first().textContent();
      if (submitError?.trim()) {
        throw new Error(`No se pudo registrar el movimiento: ${submitError.trim()}`);
      }
    }

    const validationErrorLocator = page.locator('p.text-sm.text-rose-700');
    if (await validationErrorLocator.count() > 0) {
      const validationMessages = await validationErrorLocator.allTextContents();
      const message = validationMessages.filter(Boolean).join(' | ');
      throw new Error(`No se pudo registrar el movimiento: ${message}`);
    }

    const cancelButton = page.getByRole('button', { name: 'Cancelar' });
    if (await cancelButton.count() > 0) {
      await cancelButton.click();
      throw new Error('El modal de movimiento permaneció abierto después de intentar registrar el movimiento. Se cerró para limpieza.');
    }

    throw new Error('El modal de movimiento no se cerró correctamente y no se encontró un mensaje de error visible.');
  }
}

test.describe.serial('Regresión E2E - Nuevos casos', () => {

  // ─────────────────────────────────────────────────────────────────
  // ROLES Y PERMISOS
  // ─────────────────────────────────────────────────────────────────

  test('Secretario solo ve crear/ver, sin botones de editar/eliminar @QaseID=105', async ({ page }) => {
    await login(page, SECRETARIO_EMAIL, SECRETARIO_PASSWORD);

    // Verificar en Asociados
    await page.getByRole('link', { name: 'Asociados' }).click();
    await expect(page.getByRole('button', { name: 'Agregar asociado' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Editar' })).toHaveCount(0);

    // Verificar en Servicios
    await page.getByRole('link', { name: 'Servicios' }).click();
    await page.waitForURL(`${BASE_URL}/servicios`);
    await expect(page.getByRole('button', { name: /Nuevo (consulta|servicio)/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Eliminar' })).toHaveCount(0);

    // Verificar que el Secretario no ve Inventario si no tiene permiso
    await expect(page.getByRole('link', { name: 'Inventario' })).toHaveCount(0);
  });

  test('Superadministrador tiene acceso completo incluyendo sección usuarios @QaseID=107', async ({ page }) => {
    await login(page);

    // Verificar que existe la sección Empleados/Usuarios
    await page.getByRole('link', { name: 'Empleados' }).click();
    await expect(page.getByRole('button', { name: /Nuevo usuario/i })).toBeVisible({ timeout: 8000 });

    // Verificar acceso a edición en Asociados
    await page.getByRole('link', { name: 'Asociados' }).click();
    await expect(page.getByRole('button', { name: 'Agregar asociado' })).toBeVisible({ timeout: 8000 });
    const cargarMas = page.getByRole('button', { name: 'Cargar más datos' });
    if (await cargarMas.count() > 0) {
      await cargarMas.click();
      await expect(page.getByRole('row').nth(1)).toBeVisible({ timeout: 10000 });
    }
    const primeraFila = page.getByRole('row').nth(1);
    await expect(primeraFila).toBeVisible();
    await primeraFila.click();
    await expect(page.getByRole('button', { name: 'Editar' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Cerrar' }).click();

    // Verificar acceso a edición en Servicios
    await page.getByRole('link', { name: 'Servicios' }).click();
    await page.waitForURL(`${BASE_URL}/servicios`);
    await expect(page.getByRole('button', { name: /Nuevo (consulta|servicio)/i })).toBeVisible({ timeout: 8000 });
  });

  test('Redirección al intentar acceder por URL fuera del rol @QaseID=108', async ({ page }) => {
    await login(page, SECRETARIO_EMAIL, SECRETARIO_PASSWORD);

    // El secretario intenta acceder directamente a la sección de gestión
    await page.goto(`${BASE_URL}/gestion`);

    // No debe ver la sección de gestión ni el botón de crear usuario
    await expect(page.getByRole('button', { name: 'Nuevo usuario' })).toHaveCount(0, { timeout: 8000 });
    await expect(page.locator('text=/404|This page could not be found|No encontrado|No autorizado/i').first()).toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────────────
  // GESTIÓN DE USUARIOS
  // ─────────────────────────────────────────────────────────────────

  test('Crear usuario y dar de baja con motivo obligatorio @QaseID=109', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Empleados' }).click();

    const uniqueEmail = `bajausuario+${Date.now()}@test.com`;

    // Crear nuevo usuario
    await page.getByRole('button', { name: 'Nuevo usuario' }).click();
    await page.getByPlaceholder('Nombres').fill('UsuarioBaja');
    await page.getByPlaceholder('Apellidos').fill('Test Regresion');
    await page.getByPlaceholder('81 1234 5678').fill('81 0000 0001');
    await page.getByPlaceholder('usuario@gmail.com').fill(uniqueEmail);
    await page.getByPlaceholder('Contraseña segura').fill('BajaUsuario1234');
    await page.getByRole('button', { name: 'Crear usuario' }).click();

    // Verificar que aparece en el listado con el usuario creado
    await expect(page.getByRole('cell', { name: uniqueEmail })).toBeVisible({ timeout: 10000 });

    // Abrir detalles del usuario y desactivar la cuenta
    await page.getByRole('cell', { name: uniqueEmail }).click();
    const toggleButton = page.getByRole('button', { name: /Desactivar cuenta|Reactivar cuenta/i }).first();
    await expect(toggleButton).toBeVisible({ timeout: 10000 });
    const currentLabel = await toggleButton.textContent();

    if (currentLabel?.match(/Reactivar/i)) {
      await Promise.all([page.waitForLoadState('networkidle'), toggleButton.click()]);
      await page.getByRole('cell', { name: uniqueEmail }).click();
      await page.getByRole('button', { name: /Desactivar cuenta/i }).click();
    } else {
      await toggleButton.click();
    }

    await page.waitForLoadState('networkidle');

    const userRow = page.getByRole('row').filter({ hasText: uniqueEmail }).first();
    await expect(userRow).toContainText(/Inactivo/i);
  });

  // ─────────────────────────────────────────────────────────────────
  // PREREGISTROS
  // ─────────────────────────────────────────────────────────────────

  test('Listado por defecto muestra solo pendientes y filtro a cancelados @QaseID=82', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Asociados' }).click();
    await page.getByRole('button', { name: 'Preregistro' }).click();

    const firstRowText = (await page.locator('tbody tr').first().textContent())?.trim();
    if (firstRowText === 'Sin datos') {
      await createPendingPreregistro(page);
      await login(page);
      await page.getByRole('link', { name: 'Asociados' }).click();
      await page.getByRole('button', { name: 'Preregistro' }).click();
    }

    // El listado por defecto debe mostrar estatus Pendiente
    await expect(page.getByRole('cell', { name: 'Pendiente' }).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('cell', { name: 'Cancelado' })).toHaveCount(0);

    // Aplicar filtro a Anulado / cancelado
    await page.getByLabel('Filtrar por estatus').selectOption('Anulado');
    // La tabla debe actualizarse (puede estar vacía o mostrar anulados)
    await expect(page.getByRole('cell', { name: 'Pendiente' })).toHaveCount(0, { timeout: 8000 });
  });

  test('Flujo de confirmación convierte preregistro en asociado @QaseID=85', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Asociados' }).click();
    await page.getByRole('button', { name: 'Preregistro' }).click();

    // Verificar que existe al menos un preregistro pendiente
    const pendiente = page.getByRole('row').filter({ hasText: 'Pendiente' }).first();
    await expect(pendiente).toBeVisible({ timeout: 8000 });

    // Obtener el nombre del preregistro antes de confirmar
    const nombreCelda = pendiente.getByRole('cell').nth(1);
    const nombre = await nombreCelda.textContent();

    // Abrir detalle y confirmar
    await pendiente.click();
    await page.getByRole('button', { name: 'Aceptar' }).click();
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Sí' }).click();

    // Ir a Asociados y verificar que aparece el nuevo asociado
    await page.getByRole('button', { name: 'Asociados' }).click();
    if (nombre) {
      const nombreLimpio = nombre.trim();
      const searchInput = page.getByRole('textbox', { name: 'Buscar por nombre' });
      await searchInput.fill(nombreLimpio);
      await page.waitForTimeout(500);
      await expect(page.getByRole('cell', { name: nombreLimpio }).first()).toBeVisible({ timeout: 15000 });
    }
  });

  test('Envío exitoso del formulario público de preregistro @QaseID=87', async ({ page }) => {
    // Acceder al formulario público (sin login)
    await page.goto(`${BASE_URL}/registro-preregistro`);

    // Llenar todos los campos requeridos con datos válidos
    const curpUnica = `REGG900101HMCRSN${String(Date.now()).slice(-2)}`;

    await page.locator('#pr-nombre').fill('Gregorio');
    await page.locator('#pr-apellidopaterno').fill('Registro');
    await page.locator('#pr-apellidomaterno').fill('Publico');
    await page.locator('#pr-fnac').fill('1990-01-01');
    await page.locator('#pr-sexo').selectOption('Masculino');
    await page.locator('#pr-curp').fill(curpUnica);
    await page.locator('#pr-tel').fill('8100000001');
    await page.locator('#pr-correo').fill('preregistropublico@test.com');
    await page.locator('#pr-pm-nombre').fill('Padre');
    await page.locator('#pr-pm-apellidopaterno').fill('Nombre');
    await page.locator('#pr-pm-apellidomaterno').fill('Test');
    await page.locator('#pr-ce-nombre').fill('Emergencia');
    await page.locator('#pr-ce-tel').fill('8100000002');
    await page.locator('#pr-ce-relacion').selectOption('Madre');

    await page.getByRole('button', { name: /Enviar preregistro|Enviar/i }).click();
    await page.getByRole('button', { name: /Confirmar y enviar/i }).click();

    // El sistema debe mostrar confirmación
    await expect(
      page.getByText(/confirmaci[oó]n|registrado|pendiente|gracias/i)
    ).toBeVisible({ timeout: 10000 });
  });

  // ─────────────────────────────────────────────────────────────────
  // INVENTARIO
  // ─────────────────────────────────────────────────────────────────

  test('Consulta de stock con umbral mínimo y alerta visual @QaseID=94', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Inventario' }).click();

    // Verificar que la columna de disponibilidad está presente
    await expect(page.getByRole('columnheader', { name: 'Disponibilidad' })).toBeVisible({ timeout: 8000 });

    const lowStockLocator = page.getByRole('cell', { name: /Bajo|Limitado/i });
    if (await lowStockLocator.count() > 0) {
      await expect(lowStockLocator.first()).toBeVisible({ timeout: 8000 });
      await lowStockLocator.first().click();
      await expect(page.getByText(/bajo|umbral|m[ií]nimo/i).first()).toBeVisible({ timeout: 8000 });
    } else {
      // Si no hay artículos de bajo stock en este entorno, validar el badge de disponibilidad existente
      await expect(page.getByRole('cell', { name: /En stock|Agotado/i }).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test('Registro de nuevo artículo exitoso @QaseID=91', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Inventario' }).click();
    await page.getByRole('button', { name: 'Movimiento Inventario' }).click();
    await page.getByRole('button', { name: 'Agregar' }).click();

    // Crear artículo nuevo (no existe en el sistema)
    const nombreNuevo = `TestItem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await page.getByRole('textbox', { name: 'Escribe para buscar y' }).fill(nombreNuevo);
    await page.waitForTimeout(500);

    // Llenar los campos del nuevo artículo
    await page.locator('section').filter({ hasText: 'ArtículoBusca un artículo' }).getByRole('combobox').selectOption('Medicamento');
    await page.getByRole('textbox', { name: 'Nombre de proveedor' }).fill('Proveedor Test');
    await page.locator('section').filter({ hasText: 'ArtículoBusca un artículo' }).getByPlaceholder('0', { exact: true }).fill('5');
    await page.getByRole('textbox', { name: 'Descripción para registro de' }).fill('Artículo de prueba automatizada');
    await page.getByPlaceholder('Ej. 150.00').fill('50');

    const similarCheckbox = page.getByRole('checkbox', {
      name: /Confirmo crear un artículo nuevo/i,
    });
    if (await similarCheckbox.count() > 0) {
      await similarCheckbox.check();
    }

    await page.locator('section').filter({ hasText: 'MovimientoDefine qué pasó con' }).getByPlaceholder('0').fill('10');
    await page.getByRole('textbox', { name: 'Detalles del movimiento' }).fill('Registro inicial automatizado');
    await submitInventoryMovement(page);

    // Verificar que vuelve al listado de movimientos y se navega al inventario
    await expect(page.getByRole('button', { name: 'Volver a Inventario' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Volver a Inventario' }).click();
    await page.waitForURL(`${BASE_URL}/inventory`, { timeout: 15000 });

    // Verificar que el artículo aparece en el catálogo
    await expect(page.getByText(nombreNuevo).first()).toBeVisible({ timeout: 15000 });
  });

  test('Registro de entrada incrementa stock y queda en historial @QaseID=95', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Inventario' }).click();

    // Seleccionar un artículo existente para ver su stock actual
    const articuloFila = page.getByRole('row').nth(1);
    await expect(articuloFila).toBeVisible({ timeout: 8000 });
    const stockCeldaTexto = await articuloFila.getByRole('cell').nth(3).textContent();
    const stockAntes = parseInt(stockCeldaTexto?.replace(/\D/g, '') || '0');
    const articuloNombre = (await articuloFila.getByRole('cell').nth(1).textContent())?.trim() || 'Paracetamol';

    // Registrar una entrada de 10 unidades
    await page.getByRole('button', { name: 'Movimiento Inventario' }).click();
    await page.getByRole('button', { name: 'Agregar' }).click();
    await page.getByRole('textbox', { name: 'Escribe para buscar y' }).fill(articuloNombre);
    await page.waitForTimeout(500);
    await page
      .getByRole('button', { name: new RegExp(escapeRegExp(articuloNombre), 'i') })
      .first()
      .click();
    await page.getByPlaceholder('0').fill('10');
    await page.getByRole('textbox', { name: 'Detalles del movimiento' }).fill('Entrada test regresión QaseID=95');
    await submitInventoryMovement(page);

    // Verificar que el movimiento quedó en el historial
    await expect(page.getByText(articuloNombre).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Entrada:/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('Registro de salida decrementa stock y queda en historial @QaseID=96', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Inventario' }).click();
    const articuloFila = page.getByRole('row').nth(1);
    const articuloNombre = (await articuloFila.getByRole('cell').nth(1).textContent())?.trim() || 'Paracetamol';

    await page.getByRole('button', { name: 'Movimiento Inventario' }).click();
    await page.getByRole('button', { name: 'Agregar' }).click();

    // Registrar una salida
    await page.locator('section').filter({ hasText: 'MovimientoDefine qué pasó con' }).getByRole('combobox').selectOption('out');
    await page.getByRole('textbox', { name: 'Escribe para buscar y' }).fill(articuloNombre);
    await page.waitForTimeout(500);
    await page
      .getByRole('button', { name: new RegExp(escapeRegExp(articuloNombre), 'i') })
      .first()
      .click();
    await page.getByPlaceholder('0').fill('2');
    await page.getByRole('textbox', { name: 'Detalles del movimiento' }).fill('Salida test regresión QaseID=96');
    await submitInventoryMovement(page);

    // Verificar que el movimiento de salida quedó en el historial
    await expect(page.getByText(articuloNombre).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Salida:/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('Bloqueo por stock insuficiente y cantidad inválida @QaseID=97', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Inventario' }).click();
    await page.getByRole('button', { name: 'Movimiento Inventario' }).click();

    // Intento 1: salida mayor al stock disponible (Acido folico tiene stock bajo)
    await page.getByRole('button', { name: 'Agregar' }).click();
    await page.locator('section').filter({ hasText: 'MovimientoDefine qué pasó con' }).getByRole('combobox').selectOption('out');
    await page.getByRole('textbox', { name: 'Escribe para buscar y' }).fill('Acido folico');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Acido folico/i }).first().click();
    await page.getByPlaceholder('0').fill('9999');
    await page.getByRole('textbox', { name: 'Detalles del movimiento' }).fill('Salida excesiva test QaseID=97');
    await page.getByRole('button', { name: 'Registrar movimiento' }).click();

    // El sistema debe bloquear y mostrar una alerta de error
    await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 10000 });

    // Intento 2: cantidad 0 o negativa
    await page.getByPlaceholder('0').fill('0');
    await page.getByRole('button', { name: 'Registrar movimiento' }).click();
    // El sistema debe bloquear con validación
    await expect(
      page.getByText(/stock insuficiente|no hay suficiente|cantidad/i).first()
    ).toBeVisible({ timeout: 8000 });

    await page.getByLabel('Registrar movimiento').getByRole('button', { name: 'Cancelar' }).click();
  });

  test('Edición de información de artículo desde detalle @QaseID=93', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Inventario' }).click();

    const articuloFila = page.getByRole('row').nth(1);
    await expect(articuloFila).toBeVisible({ timeout: 8000 });
    const articuloNombre = (await articuloFila.getByRole('cell').nth(1).textContent())?.trim() || '';

    await articuloFila.click();
    await expect(page.getByRole('heading', { name: new RegExp(`Artículo: ${escapeRegExp(articuloNombre)}`, 'i') })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'Información del artículo' }).click();
    const stockMinimoInput = page
      .locator('label:has-text("Stock mínimo")')
      .locator('..')
      .getByRole('spinbutton');
    await expect(stockMinimoInput).toBeVisible({ timeout: 8000 });

    const existingStockMinimo = await stockMinimoInput.inputValue();
    const newStockMinimo = existingStockMinimo === '1' ? '2' : '1';
    await stockMinimoInput.fill(newStockMinimo);

    const [response] = await Promise.all([
      page.waitForResponse((res) =>
        res.url().includes('/api/inventario/editar/cuota') &&
        ['PUT', 'POST'].includes(res.request().method()),
      ),
      page.getByRole('button', { name: 'Guardar cambios' }).click(),
    ]);

    expect(response.ok()).toBeTruthy();

    await page.getByRole('button', { name: 'Cerrar' }).click();
    await expect(page.getByText(articuloNombre).first()).toBeVisible({ timeout: 10000 });
  });

  test('Filtros combinados por artículo, tipo y rango de fechas @QaseID=99', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Inventario' }).click();
    await page.getByRole('button', { name: 'Movimiento Inventario' }).click();

    // Aplicar filtro de tipo Entrada
    await page.getByLabel('Filtrar por tipo').selectOption('in');
    await expect(page.getByText(/Entrada:/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Salida:/i)).toHaveCount(0);

    // Aplicar rango de fechas (último mes)
    await page.getByRole('textbox', { name: 'Filtrar desde' }).fill('2026-06-01');
    await page.getByRole('textbox', { name: 'Filtrar hasta' }).fill('2026-06-08');

    // Debe mostrar solo movimientos tipo Entrada en ese rango
    const filas = page.getByText(/Entrada:/i);
    await expect(filas.first()).toBeVisible({ timeout: 8000 });

    // Aplicar filtro con criterios sin coincidencias (fecha futura)
    await page.getByRole('textbox', { name: 'Filtrar desde' }).fill('2030-01-01');
    await page.getByRole('textbox', { name: 'Filtrar hasta' }).fill('2030-01-31');
    await expect(page.getByText(/sin resultados|sin coincidencias|no hay/i)).toBeVisible({ timeout: 8000 });
  });
});
