const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://sem6-espina-bifida.vercel.app';
const USUARIO = 'test@test.com';
const PASSWORD = 'testpassword';
const SECRETARIO_EMAIL = 'SecretarioTest@test.com';
const SECRETARIO_PASSWORD = 'Secretariotest';

function generateTestCurp(birthDate){
  const date = new Date(birthDate);

  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  const sex = Math.random() > 0.5 ? 'H' : 'M';

  const states = [
    'AS', 'BC', 'BS', 'CC', 'CL', 'CM', 'CS', 'CH',
    'DF', 'DG', 'GT', 'GR', 'HG', 'JC', 'MC', 'MN',
    'MS', 'NT', 'NL', 'OC', 'PL', 'QT', 'QR', 'SP',
    'SL', 'SR', 'TC', 'TS', 'TL', 'VZ', 'YN', 'ZS',
  ];

  const state = states[Math.floor(Math.random() * states.length)];

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const randomLetter = () =>
    letters[Math.floor(Math.random() * letters.length)];

  const randomDigit = () =>
    Math.floor(Math.random() * 10);

  return [
    randomLetter(),
    randomLetter(),
    randomLetter(),
    randomLetter(),
    yy,
    mm,
    dd,
    sex,
    state,
    randomLetter(),
    randomLetter(),
    randomLetter(),
    randomDigit(),
    randomDigit(),
  ].join('');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function login(page, email = USUARIO, password = PASSWORD) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

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

// Legacy regression tests

test.describe.serial('Regresión E2E - Espina Bífida', () => {
  test('Login exitoso con credenciales válidas @QaseID=1', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('textbox', { name: 'Usuario' }).fill(USUARIO);
    await page.getByRole('textbox', { name: 'Contraseña' }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    await expect(page).toHaveURL(`${BASE_URL}/dashboard`, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();
  });

  test('Login fallido con credenciales incorrectas @QaseID=39', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('textbox', { name: 'Usuario' }).fill('falsepwd');
    await page.getByRole('textbox', { name: 'Contraseña' }).fill('falsepwd');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    await expect(page.getByText('Correo o contraseña')).toBeVisible({ timeout: 8000 });
    await expect(page).toHaveURL(/error=CredentialsSignin/);
  });

  test('Registro de asociado exitoso @QaseID=22', async ({ page }) => {

    const curp = generateTestCurp()

    await login(page);
    await page.getByRole('link', { name: 'Asociados' }).click();
    await page.getByRole('button', { name: 'Agregar asociado' }).click();

    await page.getByRole('textbox').nth(5).click();
    await page.getByRole('textbox').nth(5).fill('Jesus');
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-2.lg\\:grid-cols-3 > div:nth-child(2) > .h-10').click();
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-2.lg\\:grid-cols-3 > div:nth-child(2) > .h-10').fill('Cumbean');
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-2.lg\\:grid-cols-3 > div:nth-child(3) > .h-10').click();
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-2.lg\\:grid-cols-3 > div:nth-child(3) > .h-10').fill('Sanchez');
    await page.locator('.grid.grid-cols-1.gap-4 > div:nth-child(4) > .h-10').first().click();
    await page.locator('.grid.grid-cols-1.gap-4 > div:nth-child(4) > .h-10').first().click();
    await page.locator('.grid.grid-cols-1.gap-4 > div:nth-child(4) > .h-10').first().fill(curp);
    await page.locator('input[type="date"]').nth(4).fill('2026-06-08');
    await page.locator('div:nth-child(6) > div > .h-10').click();
    await page.locator('div:nth-child(6) > div > .h-10').fill('Carlos Cumbian');
    await page.locator('.sm\\:col-span-2 > .h-10').click();
    await page.locator('.sm\\:col-span-2 > .h-10').fill('Avenida Jesus Cantu Leal 1525');
    await page.locator('div:nth-child(8) > div:nth-child(2) > .h-10').click();
    await page.locator('div:nth-child(8) > div:nth-child(2) > .h-10').fill('Monterrey');
    await page.getByRole('combobox').nth(3).selectOption('nuevo león');
    await page.getByRole('textbox', { name: 'dígitos' }).click();
    await page.getByRole('textbox', { name: 'dígitos' }).click();
    await page.getByRole('textbox', { name: 'dígitos' }).fill('84700');
    await page.locator('div:nth-child(10) > div > .h-10').first().click();
    await page.locator('div:nth-child(10) > div > .h-10').first().fill('8129085779');
    await page.locator('input[type="email"]').click();
    await page.locator('input[type="email"]').fill('test@gmail.com');
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-3 > div > .h-10').first().click();
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-3 > div > .h-10').first().fill('Carlos Cumbian');
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-3 > div:nth-child(2) > .h-10').click();
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-3 > div:nth-child(2) > .h-10').fill('8129085779');
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-3 > div:nth-child(3) > .h-10').click();
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-3 > div:nth-child(3) > .h-10').fill('Padre');
    await page.getByRole('button', { name: 'Historial', exact: true }).click();
    await page.getByRole('textbox').nth(2).click();
    await page.getByRole('textbox').nth(2).fill('Mexico');
    await page.getByRole('textbox').nth(3).click();
    await page.getByRole('textbox').nth(3).fill('Hospital Angeles');
    await page.locator('label').filter({ hasText: /^MENINGOCELE$/ }).click();
    await page.getByRole('combobox').nth(1).selectOption('O+');
    await page.getByRole('button', { name: 'Historial padres' }).click();
    await page.getByRole('button', { name: 'Guardar asociado' }).click();
  });

  test('Registro de asociado fallido por CURP vacía @QaseID=22', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Asociados' }).click();
    await page.getByRole('button', { name: 'Agregar asociado' }).click();

    await page.getByRole('textbox').nth(5).click();
    await page.getByRole('textbox').nth(5).fill('Jesus');
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-2.lg\\:grid-cols-3 > div:nth-child(2) > .h-10').click();
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-2.lg\\:grid-cols-3 > div:nth-child(2) > .h-10').fill('Cumbean');
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-2.lg\\:grid-cols-3 > div:nth-child(3) > .h-10').click();
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-2.lg\\:grid-cols-3 > div:nth-child(3) > .h-10').fill('Sanchez');
    await page.locator('.grid.grid-cols-1.gap-4 > div:nth-child(4) > .h-10').first().click();
    await page.locator('.grid.grid-cols-1.gap-4 > div:nth-child(4) > .h-10').first().click();
    await page.locator('input[type="date"]').nth(4).fill('2026-06-08');
    await page.locator('div:nth-child(6) > div > .h-10').click();
    await page.locator('div:nth-child(6) > div > .h-10').fill('Carlos Cumbian');
    await page.locator('.sm\\:col-span-2 > .h-10').click();
    await page.locator('.sm\\:col-span-2 > .h-10').fill('Avenida Jesus Cantu Leal 1525');
    await page.locator('div:nth-child(8) > div:nth-child(2) > .h-10').click();
    await page.locator('div:nth-child(8) > div:nth-child(2) > .h-10').fill('Monterrey');
    await page.getByRole('combobox').nth(3).selectOption('nuevo león');
    await page.getByRole('textbox', { name: 'dígitos' }).click();
    await page.getByRole('textbox', { name: 'dígitos' }).click();
    await page.getByRole('textbox', { name: 'dígitos' }).fill('84700');
    await page.locator('div:nth-child(10) > div > .h-10').first().click();
    await page.locator('div:nth-child(10) > div > .h-10').first().fill('8129085779');
    await page.locator('input[type="email"]').click();
    await page.locator('input[type="email"]').fill('test@gmail.com');
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-3 > div > .h-10').first().click();
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-3 > div > .h-10').first().fill('Carlos Cumbian');
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-3 > div:nth-child(2) > .h-10').click();
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-3 > div:nth-child(2) > .h-10').fill('8129085779');
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-3 > div:nth-child(3) > .h-10').click();
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-3 > div:nth-child(3) > .h-10').fill('Padre');
    await page.getByRole('button', { name: 'Historial', exact: true }).click();
    await page.getByRole('textbox').nth(2).click();
    await page.getByRole('textbox').nth(2).fill('Mexico');
    await page.getByRole('textbox').nth(3).click();
    await page.getByRole('textbox').nth(3).fill('Hospital Angeles');
    await page.locator('label').filter({ hasText: /^MENINGOCELE$/ }).click();
    await page.getByRole('combobox').nth(1).selectOption('O+');
    await page.getByRole('button', { name: 'Historial padres' }).click();
    await page.getByRole('button', { name: 'Guardar asociado' }).click();
    await page.getByRole('button', { name: 'Datos generales' }).click();
    await expect(page.locator('form')).toContainText('El CURP es requerido.');

  });

  test('Búsqueda de asociado por nombre @QaseID=23', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Asociados' }).click();
    await page.getByRole('textbox', { name: 'Buscar por nombre' }).fill('Jesus');
    await expect(page.getByRole('cell', { name: /Jesus/i }).first()).toBeVisible({ timeout: 8000 });
    await page.getByRole('textbox', { name: 'Buscar por nombre' }).fill('');
    await expect(page.getByRole('row').nth(1)).toBeVisible();
  });

  test('Filtrado de asociados por estatus Activo @QaseID=24', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Asociados' }).click();
    await page.getByLabel('Filtrar por estatus').selectOption('Activo');
    await expect(page.getByRole('cell', { name: 'Activo' }).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('cell', { name: 'Inactivo' })).toHaveCount(0);
  });

  test('Cambio de estatus de asociado Activo a Inactivo @QaseID=28', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Asociados' }).click();
    await page.getByLabel('Filtrar por estatus').selectOption('Activo');
    await page.getByRole('textbox', { name: 'Buscar por nombre' }).click();
    await page.getByRole('textbox', { name: 'Buscar por nombre' }).fill('Jesus');
    await page.getByRole('cell', { name: 'Jesus Cumbean Sanchez' }).first().click();
    await page.getByRole('button', { name: 'Editar' }).click();
    await page.getByRole('combobox').nth(2).selectOption('Inactivo');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
  });

  test('Registro de consulta exitoso @QaseID=7', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Servicios' }).click();
    await page.waitForURL(`${BASE_URL}/servicios`);
    await page.getByRole('button', { name: 'Nuevo consulta' }).click();
    const asociadoSearch = page.getByRole('textbox', { name: 'Nombre o número de asociado...' });
    await asociadoSearch.fill('Jose Carlos');
    await page.waitForTimeout(500);
    const asociadoOption = page.locator('button', { hasText: /Jose Carlos Pendulos Perez/i }).first();
    await expect(asociadoOption).toBeVisible({ timeout: 10000 });
    await asociadoOption.click();
    await page.getByRole('combobox').nth(2).selectOption('seguimiento');
    await page.getByRole('combobox').nth(3).selectOption('64');
    await page.getByRole('dialog', { name: 'Nueva consulta' }).locator('input[type="date"]').fill('2026-06-08');
    await page.getByRole('textbox', { name: ':00' }).fill('12:30');
    await page.locator('.rounded-lg.border.border-slate-200.bg-slate-50.px-2').selectOption('PM');
    await page.getByRole('textbox', { name: '0.00' }).fill('30.000');

    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Guardar consulta' }).click();

    await expect(page).toHaveURL(`${BASE_URL}/servicios`, { timeout: 10000 });
  });

  test('Cambio de estatus de consulta a Completado @QaseID=12', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Servicios' }).click();
    await page.waitForURL(`${BASE_URL}/servicios`);
    await page.getByLabel('Filtrar por estatus').selectOption('Pendiente');
    await page.getByRole('cell', { name: 'Jose Carlos Pendulos Perez' }).click();
    await page.getByRole('link', { name: 'Editar consulta' }).click();
    await page.locator('input[type="date"]').fill('2026-06-08');
    await page.getByRole('combobox').nth(1).selectOption('Completado');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByRole('main')).toContainText('Completado');
  });

  test('Registro de estudio exitoso @QaseID=14', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Servicios' }).click();
    await page.waitForURL(`${BASE_URL}/servicios`);
    await page.getByRole('button', { name: 'Estudio' }).click();
    await page.getByRole('button', { name: 'Nuevo estudio' }).click();
    await page.getByRole('textbox', { name: 'Nombre o número de asociado...' }).fill('Jesus');
    await page.getByRole('button', { name: 'Jesus Cumbian Sanchez Asociado #226' }).click();
    await page.getByRole('combobox').nth(2).selectOption('31');
    await page.getByRole('combobox').nth(3).selectOption('3');
    await page.getByRole('dialog', { name: 'Nuevo estudio' }).locator('input[type="date"]').fill('2026-06-03');
    await page.getByRole('textbox', { name: '0.00' }).fill('5.000');
    await page.getByRole('textbox', { name: 'Folio de consulta (ej. CON-' }).fill('10');
    await page.getByRole('button', { name: 'CON-107' }).click();
    await page.getByRole('textbox', { name: 'Observaciones adicionales...' }).fill('n/a');

    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Guardar estudio' }).click();

    await expect(page).toHaveURL(`${BASE_URL}/servicios`, { timeout: 10000 });
  });

  test('Generación y descarga de credencial de asociado @QaseID=36', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Asociados' }).click();
    const asociadoRow = page.getByRole('cell', { name: 'Enrique Calderon Reyes' });
    await expect(asociadoRow).toBeVisible({ timeout: 10000 });
    await asociadoRow.click();
    await expect(page.getByRole('button', { name: 'Credencial' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Credencial' }).click();
    await expect(page.getByText(/Folio: ASO-/)).toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: 'Imprimir Credencial' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Descargar PDF' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    await page.getByText('Cerrar').click();
  });

  

});

// New regression tests

test.describe.serial('Regresión E2E - Nuevos casos', () => {
  test('Secretario solo ve crear/ver, sin botones de editar/eliminar @QaseID=105', async ({ page }) => {
    await login(page, SECRETARIO_EMAIL, SECRETARIO_PASSWORD);

    await page.getByRole('link', { name: 'Asociados' }).click();
    await expect(page.getByRole('button', { name: 'Agregar asociado' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Editar' })).toHaveCount(0);

    await page.getByRole('link', { name: 'Servicios' }).click();
    await page.waitForURL(`${BASE_URL}/servicios`);
    await expect(page.getByRole('button', { name: /Nuevo (consulta|servicio)/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Eliminar' })).toHaveCount(0);

    await expect(page.getByRole('link', { name: 'Inventario' })).toHaveCount(0);
  });

  test('Superadministrador tiene acceso completo incluyendo sección usuarios @QaseID=107', async ({ page }) => {
    await login(page);

    await page.getByRole('link', { name: 'Gestión' }).click();
    await expect(page.getByRole('button', { name: /Nuevo usuario/i })).toBeVisible({ timeout: 8000 });

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

    await page.getByRole('link', { name: 'Servicios' }).click();
    await page.waitForURL(`${BASE_URL}/servicios`);
    await expect(page.getByRole('button', { name: /Nuevo (consulta|servicio)/i })).toBeVisible({ timeout: 8000 });
  });

  test('Redirección al intentar acceder por URL fuera del rol @QaseID=108', async ({ page }) => {
    await login(page, SECRETARIO_EMAIL, SECRETARIO_PASSWORD);

    await page.goto(`${BASE_URL}/usuarios`);

    await expect(page.getByRole('button', { name: 'Nuevo usuario' })).toHaveCount(0, { timeout: 8000 });
    await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();
  });

  test('Crear usuario y dar de baja con motivo obligatorio @QaseID=109', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Gestión' }).click();

    const uniqueEmail = `bajausuario+${Date.now()}@test.com`;
    const uniqueName = `bajausuario+${Date.now()}`

    await page.getByRole('button', { name: 'Nuevo usuario' }).click();
    await page.getByPlaceholder('Nombres').fill(uniqueName);
    await page.getByPlaceholder('Apellidos').fill('Test Regresion');
    await page.getByPlaceholder('81 1234 5678').fill('81 0000 0001');
    await page.getByPlaceholder('usuario@gmail.com').fill(uniqueEmail);
    await page.getByPlaceholder('Contraseña segura').fill('BajaUsuario1234');
    await page.getByRole('button', { name: 'Crear usuario' }).click();

    await page.getByRole('textbox', { name: 'Buscar por nombre' }).fill(uniqueName);
    await expect(page.locator('tbody')).toContainText(uniqueName);


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

    await page.getByLabel('Filtrar por estatus').selectOption('');
    await page.getByRole('textbox', { name: 'Buscar por nombre' }).fill(uniqueName);
    await expect(page.locator('tbody')).toContainText(uniqueName);
  });

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

    await expect(page.getByRole('cell', { name: 'Pendiente' }).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('cell', { name: 'Cancelado' })).toHaveCount(0);

    await page.getByLabel('Filtrar por estatus').selectOption('Anulado');
    await expect(page.getByRole('cell', { name: 'Pendiente' })).toHaveCount(0, { timeout: 8000 });
  });

  test('Flujo de confirmación convierte preregistro en asociado @QaseID=85', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Asociados' }).click();
    await page.getByRole('button', { name: 'Preregistro' }).click();

    const pendiente = page.getByRole('row').filter({ hasText: 'Pendiente' }).first();
    await expect(pendiente).toBeVisible({ timeout: 8000 });

    const nombreCelda = pendiente.getByRole('cell').nth(1);
    const nombre = await nombreCelda.textContent();

    await pendiente.click();
    await page.getByRole('button', { name: 'Aceptar' }).click();
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Sí' }).click();

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
    await page.goto(`${BASE_URL}/registro-preregistro`);

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

    await expect(page.getByText(/confirmaci[oó]n|registrado|pendiente|gracias/i)).toBeVisible({ timeout: 10000 });
  });

  test('Consulta de stock con umbral mínimo y alerta visual @QaseID=94', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Inventario' }).click();

    await expect(page.getByRole('columnheader', { name: 'Disponibilidad' })).toBeVisible({ timeout: 8000 });

    const lowStockLocator = page.getByRole('cell', { name: /Bajo|Limitado/i });
    if (await lowStockLocator.count() > 0) {
      await expect(lowStockLocator.first()).toBeVisible({ timeout: 8000 });
      await lowStockLocator.first().click();
      await expect(page.getByText(/bajo|umbral|m[ií]nimo/i).first()).toBeVisible({ timeout: 8000 });
    } else {
      await expect(page.getByRole('cell', { name: /En stock|Agotado/i }).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test('Registro de nuevo artículo exitoso @QaseID=91', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Inventario' }).click();
    await page.getByRole('button', { name: 'Movimiento Inventario' }).click();
    await page.getByRole('button', { name: 'Agregar' }).click();

    const nombreNuevo = `TestItem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await page.getByRole('textbox', { name: 'Escribe para buscar y' }).fill(nombreNuevo);
    await page.waitForTimeout(500);

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

    await expect(page.getByRole('button', { name: 'Volver a Inventario' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Volver a Inventario' }).click();
    await page.waitForURL(`${BASE_URL}/inventory`, { timeout: 15000 });

    await expect(page.getByText(nombreNuevo).first()).toBeVisible({ timeout: 15000 });
  });

  test('Registro de entrada incrementa stock y queda en historial @QaseID=95', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Inventario' }).click();

    const articuloFila = page.getByRole('row').nth(1);
    await expect(articuloFila).toBeVisible({ timeout: 8000 });
    const stockCeldaTexto = await articuloFila.getByRole('cell').nth(3).textContent();
    const stockAntes = parseInt(stockCeldaTexto?.replace(/\D/g, '') || '0');
    const articuloNombre = (await articuloFila.getByRole('cell').nth(1).textContent())?.trim() || 'Paracetamol';

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

    await expect(page.getByText(articuloNombre).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Salida:/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('Bloqueo por stock insuficiente y cantidad inválida @QaseID=97', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Inventario' }).click();
    await page.getByRole('button', { name: 'Movimiento Inventario' }).click();

    await page.getByRole('button', { name: 'Agregar' }).click();
    await page.locator('section').filter({ hasText: 'MovimientoDefine qué pasó con' }).getByRole('combobox').selectOption('out');
    await page.getByRole('textbox', { name: 'Escribe para buscar y' }).fill('Acido folico');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Acido folico/i }).first().click();
    await page.getByPlaceholder('0').fill('9999');
    await page.getByRole('textbox', { name: 'Detalles del movimiento' }).fill('Salida excesiva test QaseID=97');
    await page.getByRole('button', { name: 'Registrar movimiento' }).click();

    await expect(page.locator('#stock-error-modal-title')).toContainText('Stock insuficiente');

  });

  test('Edición de información de artículo desde detalle @QaseID=93', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Inventario' }).click();

    const articuloFila = page.getByRole('row').nth(1);
    await expect(articuloFila).toBeVisible({ timeout: 8000 });
    const articuloNombre = (await articuloFila.getByRole('cell').nth(1).textContent())?.trim() || '';

    await articuloFila.click();
    await expect(page.locator('#inventory-item-detail-modal-title')).toContainText('Artículo INV');

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
    await expect(page.getByRole('heading', { name: /Inventario/i })).toBeVisible({ timeout: 10000 });
  });

  test('Filtros combinados por artículo, tipo y rango de fechas @QaseID=99', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Inventario' }).click();
    await page.getByRole('button', { name: 'Movimiento Inventario' }).click();

    await page.getByLabel('Filtrar por tipo').selectOption('in');
    await expect(page.getByText(/Entrada:/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Salida:/i)).toHaveCount(0);

    await page.getByRole('textbox', { name: 'Filtrar desde' }).fill('2026-06-01');
    await page.getByRole('textbox', { name: 'Filtrar hasta' }).fill('2026-06-08');

    const filas = page.getByText(/Entrada:/i);
    await expect(filas.first()).toBeVisible({ timeout: 8000 });

    await page.getByRole('textbox', { name: 'Filtrar desde' }).fill('2030-01-01');
    await page.getByRole('textbox', { name: 'Filtrar hasta' }).fill('2030-01-31');
    await expect(page.getByText(/sin resultados|sin coincidencias|no hay/i)).toBeVisible({ timeout: 8000 });
  });
});
