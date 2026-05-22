import { test, expect } from '@playwright/test';

const BASE_URL = 'https://sem6-espina-bifida.vercel.app';
const USUARIO = 'test@test.com';
const PASSWORD = 'testpassword';

async function login(page) {
  await page.goto(BASE_URL);
  await page.getByRole('textbox', { name: 'Usuario' }).fill(USUARIO);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await page.waitForURL(`${BASE_URL}/asociados`, { timeout: 15000 });
}

test.describe.serial('Regresión E2E - Espina Bífida', () => {
  test('Login exitoso con credenciales válidas @QaseID=1', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByRole('textbox', { name: 'Usuario' }).fill(USUARIO);
    await page.getByRole('textbox', { name: 'Contraseña' }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    await expect(page).toHaveURL(`${BASE_URL}/asociados`, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Asociados' })).toBeVisible();
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
    await login(page);
    await page.getByRole('button', { name: 'Agregar asociado' }).click();

    await page.getByRole('textbox').nth(2).fill('2026-05-21');
    await page.getByRole('combobox').nth(1).selectOption('Masculino');
    await page.getByRole('textbox').nth(3).fill('Jesus');
    await page.getByRole('textbox').nth(4).fill('Cumbian');
    await page.getByRole('textbox').nth(5).fill('Sanchez');

    await page.locator('.grid.grid-cols-1.gap-4 > div:nth-child(4) > .h-10').first().fill('XEXX010101HNEXXXA4');
    await page.locator('input[type="date"]').nth(2).fill('2008-03-18');
    await page.locator('div:nth-child(7) > .h-10').first().fill('Carlos Cumbian');
    await page.locator('input[type="date"]').nth(3).fill('2026-05-05');
    await page.locator('.sm\\:col-span-2 > .h-10').fill('Avenida Jesus Cantu Leal 1525');
    await page.locator('div:nth-child(3) > div:nth-child(2) > .h-10').fill('Monterrey');
    await page.getByRole('combobox').nth(3).selectOption('Nuevo León');
    await page.getByRole('textbox', { name: 'dígitos' }).fill('84700');
    await page.locator('div:nth-child(2) > div:nth-child(4) > div > .h-10').first().fill('8129085779');
    await page.locator('div:nth-child(2) > div:nth-child(4) > div:nth-child(2) > .h-10').fill('8102906893');
    await page.locator('div:nth-child(4) > div:nth-child(3) > .h-10').fill('8129223456');
    await page.locator('input[type="email"]').fill('test@gmail.com');
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-3 > div:nth-child(1) > .h-10').fill('Carlos Cumbian');
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-3 > div:nth-child(2) > .h-10').fill('8129085779');
    await page.locator('.grid.grid-cols-1.gap-4.sm\\:grid-cols-3 > div:nth-child(3) > .h-10').fill('Padre');
    await page.locator('input[type="date"]').nth(4).fill('2026-05-20');
    await page.locator('input[type="date"]').nth(5).fill('2027-06-20');

    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Guardar asociado' }).click();

    await expect(page.getByText('Asociado creado correctamente')).toBeVisible({ timeout: 10000 });
    await page.getByLabel('Cerrar').click();
  });

  test('Registro de asociado fallido por CURP vacía @QaseID=22', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Agregar asociado' }).click();

    await page.getByRole('textbox').nth(2).fill('2026-05-21');
    await page.getByRole('combobox').nth(1).selectOption('Masculino');
    await page.getByRole('textbox').nth(3).fill('Jesus');
    await page.getByRole('textbox').nth(4).fill('Cumbian');
    await page.getByRole('textbox').nth(5).fill('Sanchez');

    await page.locator('label:has-text("CURP")').locator('..').locator('input').fill('');
    await page.locator('label:has-text("Fecha de nacimiento")').locator('..').locator('input').fill('2008-03-18');

    page.once('dialog', dialog => dialog.dismiss().catch(() => {}));
    await page.getByRole('button', { name: 'Guardar asociado' }).click();

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
  });

  test('Búsqueda de asociado por nombre @QaseID=23', async ({ page }) => {
    await login(page);
    await page.getByRole('textbox', { name: 'Buscar por nombre' }).fill('Jesus');
    await expect(page.getByRole('cell', { name: /Jesus/i }).first()).toBeVisible({ timeout: 8000 });
    await page.getByRole('textbox', { name: 'Buscar por nombre' }).fill('');
    await expect(page.getByRole('row').nth(1)).toBeVisible();
  });

  test('Filtrado de asociados por estatus Activo @QaseID=24', async ({ page }) => {
    await login(page);
    await page.getByLabel('Filtrar por estatus').selectOption('Activo');
    await expect(page.getByRole('cell', { name: 'Activo' }).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('cell', { name: 'Inactivo' })).toHaveCount(0);
  });

  test('Cambio de estatus de asociado Activo a Inactivo @QaseID=28', async ({ page }) => {
    await login(page);
    await page.getByLabel('Filtrar por estatus').selectOption('Activo');
    await expect(page.getByRole('cell', { name: 'Bruno Diaz Morales' })).toBeVisible({ timeout: 8000 });
    await page.getByRole('cell', { name: 'Bruno Diaz Morales' }).click();
    await page.getByRole('button', { name: 'Editar' }).click();
    await page.getByRole('combobox').nth(2).selectOption('Inactivo');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await page.getByLabel('Filtrar por estatus').selectOption('Inactivo');
    await expect(page.getByRole('cell', { name: 'Bruno Diaz Morales' })).toBeVisible({ timeout: 8000 });
    await page.getByRole('cell', { name: 'Bruno Diaz Morales' }).click();
    await page.getByRole('button', { name: 'Editar' }).click();
    await page.getByRole('combobox').nth(2).selectOption('Activo');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
  });

  test('Registro de consulta exitoso @QaseID=7', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Servicios' }).click();
    await page.waitForURL(`${BASE_URL}/servicios`);
    await page.getByRole('button', { name: 'Nuevo servicio' }).click();
    await page.getByRole('button', { name: 'Consulta' }).click();
    await page.getByRole('textbox', { name: 'Nombre o número de asociado...' }).fill('j');
    await page.getByRole('button', { name: 'Jose Carlos Pendulos Perez Asociado #93' }).click();
    await page.getByRole('combobox').nth(4).selectOption('seguimiento');
    await page.getByRole('combobox').nth(5).selectOption('54');
    await page.getByRole('dialog', { name: 'Nueva consulta' }).locator('input[type="date"]').fill('2026-05-23');
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
    const primeraConsultaPendiente = page.locator('tbody tr', { hasText: 'Consulta' }).filter({ hasText: 'Pendiente' }).first();
    await expect(primeraConsultaPendiente).toBeVisible({ timeout: 10000 });
    await primeraConsultaPendiente.click();

    await expect(page.getByRole('heading', { name: 'Detalle de consulta' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('link', { name: 'Editar consulta' }).click();
    await page.getByRole('combobox').nth(1).selectOption('Completado');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page).toHaveURL(/\/servicios\/\d+\/detalle-consulta/, { timeout: 10000 });
    await expect(page.getByText('Completado')).toBeVisible({ timeout: 10000 });
  });

  test('Registro de estudio exitoso @QaseID=14', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Servicios' }).click();
    await page.waitForURL(`${BASE_URL}/servicios`);
    await page.getByRole('button', { name: 'Nuevo servicio' }).click();
    await page.getByRole('button', { name: 'Estudio' }).click();
    await page.getByRole('textbox', { name: 'Nombre o número de asociado...' }).fill('Jesus');
    await page.getByRole('button', { name: 'Jesus Cumbian Sanchez' }).click();
    await page.getByRole('combobox').nth(4).selectOption('29');
    await page.getByRole('combobox').nth(5).selectOption('L05');
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
