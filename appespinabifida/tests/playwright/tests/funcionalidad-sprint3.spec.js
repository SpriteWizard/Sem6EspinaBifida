 const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'https://sem6-espina-bifida.vercel.app';
const USER_EMAIL = process.env.PLAYWRIGHT_USER_EMAIL || 'test@test.com';
const USER_PASSWORD = process.env.PLAYWRIGHT_USER_PASSWORD || 'testpassword';


async function login(page, email = USER_EMAIL, password = USER_PASSWORD) {
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

test.describe.serial('Funcionalidad Sprint 3', () => {

  test('Recibos muestra la lista y columnas esperadas @Sprint3=1', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/recibos`);

    await expect(page.getByRole('heading', { name: 'Recibos' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('columnheader', { name: 'Pagado / Total' })).toBeVisible();
    await expect(page.getByRole('row').nth(1)).toBeVisible();
  });

  test('Abrir detalle de recibo desde la lista muestra el diálogo Desglose @Sprint3=2', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/recibos`);

    await expect(page.getByRole('button', { name: 'Ver' }).first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Ver' }).first().click();

    const dialog = page.getByRole('dialog', { name: /Desglose —/i });
    await expect(dialog).toBeVisible({ timeout: 15000 });
    await expect(dialog.getByText('PRODUCTO')).toBeVisible();

    await dialog.locator('button').filter({ hasText: 'Cerrar' }).click();
  });

  test('Filtrar recibos por ID regresa el recibo esperado @Sprint3=3', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/recibos`);

    const idFilter = page.locator('input[placeholder="Buscar por ID"]');
    await idFilter.fill('REC-2026-0001');

    await expect(page.getByRole('cell', { name: 'REC-2026-0001' })).toBeVisible({ timeout: 15000 });
    const matchingRows = page.getByRole('row').filter({ hasText: 'REC-2026-0001' });
    await expect(matchingRows).toHaveCount(1);
  });

  // ✅ FIXED TEST

test('Gestión médicos muestra lista y permite filtrar @Sprint3=4', async ({ page }) => {
  await page.goto('https://sem6-espina-bifida.vercel.app/');

  // 🔐 Login
  await page.getByRole('textbox', { name: 'Usuario' }).fill('test@test.com');
  await page.getByRole('textbox', { name: 'Contraseña' }).fill('testpassword');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

  // ✅ Wait for login to complete
  await page.waitForLoadState('networkidle');

  if (await page.getByRole('textbox', { name: 'Usuario' }).isVisible()) {
    throw new Error('Login failed');
  }

  // 📍 Go to Gestión
  const gestion = page.locator('a, button', { hasText: /gesti[oó]n/i }).first();
  await expect(gestion).toBeVisible({ timeout: 10000 });
  await gestion.click();

  // ✅ IMPORTANT: wait for Gestión content (NOT just networkidle)
  await page.waitForTimeout(2000); // give React time to render

  // 🧠 Try to find Médicos in a more flexible way
  const medicos = page.locator('text=/m[eé]dicos/i');

  // 👇 If not found, dump debug info
  if (await medicos.count() === 0) {
    console.log('Current URL:', await page.url());
    console.log('Page content snippet:', await page.content());
    throw new Error('Médicos option not found - UI structure is different');
  }

  await medicos.first().click();

  // ✅ Wait for list/table
  const table = page.locator('table, [role="table"]');
  await expect(table.first()).toBeVisible({ timeout: 10000 });

  // 🔎 Filter by status
  const statusFilter = page.getByLabel(/estatus/i);
  await statusFilter.selectOption('Activo');

  // 🔎 Filter by name
  const searchInput = page.getByRole('textbox', { name: /buscar/i });
  await searchInput.fill('Carlos');

  // ✅ Validate result
  const result = page.locator('text=/Carlos/i').first();
  await expect(result).toBeVisible({ timeout: 10000 });

  // 👁 Open detail
  await result.click();

  // ❌ Close modal
  await page.getByLabel(/cerrar/i).click();
});

  test('Dashboard muestra el usuario autenticado y confirma el acceso @Sprint3=5', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard`);

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Autenticacion verificada correctamente.')).toBeVisible();
    await expect(page.getByText(USER_EMAIL)).toBeVisible();
  });

});