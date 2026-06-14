import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@cdc.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123';

const TERMINO_INEXISTENTE = 'xzxzxz_no_existe_99999';

test.describe('CP-008 — Búsqueda sin resultados en módulo de consultas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
  });

  test('Debe mostrar estado vacío cuando la búsqueda no produce resultados', async ({ page }) => {
    // Paso 1: Navegar al módulo de consultas
    await page.goto(`${BASE_URL}/consultas`);
    await expect(page).toHaveURL(/consultas/);

    // Paso 2: Localizar el campo de búsqueda
    // La app usa input tipo text con placeholder, no input[type="search"]
    const campoBusqueda = page.locator(
      'input[placeholder*="buscar"], input[placeholder*="Buscar"], [data-testid="input-busqueda"]'
    );
    await expect(campoBusqueda).toBeVisible();

    // Paso 3: Ingresar término inexistente
    await campoBusqueda.fill(TERMINO_INEXISTENTE);

    // Paso 4: Activar búsqueda
    await campoBusqueda.press('Enter');

    // Paso 5: Esperar que la tabla actualice (petición async a la API)
    await page.waitForTimeout(1000);

    // Resultado esperado: estado vacío — verificación dual
    const mensajeVacio = page.locator(
      '[data-testid="empty-state"], p:has-text("No se encontraron"), p:has-text("Sin resultados")'
    );
    const filasTabla = page.locator('table tbody tr');

    const hayMensaje = await mensajeVacio.isVisible().catch(() => false);
    const tablaVacia = await filasTabla.count().then(c => c === 0).catch(() => false);

    expect(hayMensaje || tablaVacia).toBeTruthy();

    // El campo conserva el término buscado
    await expect(campoBusqueda).toHaveValue(TERMINO_INEXISTENTE);
  });

  test('Debe mostrar resultados al limpiar el campo de búsqueda', async ({ page }) => {
    await page.goto(`${BASE_URL}/consultas`);

    const campoBusqueda = page.locator(
      'input[placeholder*="buscar"], input[placeholder*="Buscar"], [data-testid="input-busqueda"]'
    );

    await campoBusqueda.fill(TERMINO_INEXISTENTE);
    await campoBusqueda.press('Enter');
    await page.waitForTimeout(800);

    await campoBusqueda.clear();
    await campoBusqueda.press('Enter');
    await page.waitForTimeout(800);

    const filasTabla = page.locator('table tbody tr');
    await expect(filasTabla).not.toHaveCount(0);
  });
});
