import { test, expect } from '@playwright/test';

/**
 * CP-008 — Búsqueda y filtrado de consultas sin resultados (Escenario NEGATIVO)
 * HU: Buscar y filtrar consultas
 * Sprint: 1
 *
 * Generado con asistencia de GitHub Copilot.
 * Prompt usado: "Write a Playwright TypeScript test for a negative search scenario
 * in a medical consultation management module. The user searches for a term that
 * doesn't exist in the database and the system should display an empty state message."
 *
 * Ajustes manuales realizados:
 * - Copilot usó page.type() (deprecado) → reemplazado con page.fill()
 * - Se añadió espera al resultado de búsqueda (Copilot no la incluyó)
 * - Se ajustó el selector del mensaje de "sin resultados" al componente real CDC
 * - Se añadió verificación de que la tabla esté vacía como alternativa al mensaje
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@cdc.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123';

// Término de búsqueda diseñado para no producir resultados en la BD
const TERMINO_INEXISTENTE = 'xzxzxzxz_no_existe_99999';

test.describe('CP-008 — Búsqueda sin resultados en módulo de consultas', () => {
  test.beforeEach(async ({ page }) => {
    // Precondición: el usuario inicia sesión
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
    // Copilot sugirió input[type="search"] — se añadieron alternativas por si el input es tipo text
    const campoBusqueda = page.locator(
      'input[type="search"], input[placeholder*="buscar"], input[placeholder*="Buscar"], [data-testid="input-busqueda"]'
    );
    await expect(campoBusqueda).toBeVisible();

    // Paso 3: Ingresar un término que no existe en el sistema
    await campoBusqueda.fill(TERMINO_INEXISTENTE);

    // Paso 4: Activar la búsqueda (Enter o botón de buscar)
    await campoBusqueda.press('Enter');

    // Alternativa: hacer click en botón de buscar si existe
    const botonBuscar = page.locator('button:has-text("Buscar"), button[aria-label="buscar"], [data-testid="btn-buscar"]');
    if (await botonBuscar.isVisible()) {
      await botonBuscar.click();
    }

    // Paso 5: Esperar que la tabla/lista actualice su contenido
    // Copilot no incluyó este wait — se añadió para evitar race conditions
    await page.waitForTimeout(1000);

    // Resultado esperado: el sistema muestra que no hay resultados
    // Verificación A: Mensaje de estado vacío visible
    const mensajeVacio = page.locator(
      '[data-testid="empty-state"], .empty-state, p:has-text("No se encontraron"), p:has-text("Sin resultados"), p:has-text("no hay consultas")'
    );

    // Verificación B: Tabla sin filas de datos
    const filasTabla = page.locator('table tbody tr:not(.loading-row):not(.skeleton-row)');

    // Al menos una de las dos verificaciones debe pasar
    const hayMensajeVacio = await mensajeVacio.isVisible().catch(() => false);
    const hayFilasVacias = await filasTabla.count().then(c => c === 0).catch(() => false);

    expect(hayMensajeVacio || hayFilasVacias).toBeTruthy();

    // Verificación adicional: el campo de búsqueda aún contiene el término buscado
    await expect(campoBusqueda).toHaveValue(TERMINO_INEXISTENTE);
  });

  test('Debe limpiar los resultados al borrar el término de búsqueda', async ({ page }) => {
    // Test complementario: verificar que al limpiar la búsqueda, vuelven los resultados
    await page.goto(`${BASE_URL}/consultas`);

    const campoBusqueda = page.locator(
      'input[type="search"], input[placeholder*="buscar"], input[placeholder*="Buscar"], [data-testid="input-busqueda"]'
    );

    // Buscar término inexistente
    await campoBusqueda.fill(TERMINO_INEXISTENTE);
    await campoBusqueda.press('Enter');
    await page.waitForTimeout(800);

    // Limpiar la búsqueda
    await campoBusqueda.clear();
    await campoBusqueda.press('Enter');
    await page.waitForTimeout(800);

    // Verificar que vuelven a aparecer resultados
    const filasTabla = page.locator('table tbody tr');
    await expect(filasTabla).not.toHaveCount(0);
  });
});
