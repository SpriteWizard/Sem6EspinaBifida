import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@cdc.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123';

test.describe('CP-009 — Modificación de consulta exitosa', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
  });

  test('Debe permitir editar una consulta existente y guardar los cambios', async ({ page }) => {
    // Paso 1: Navegar al módulo de consultas
    await page.goto(`${BASE_URL}/consultas`);
    await expect(page).toHaveURL(/consultas/);

    // Paso 2: Verificar que existe al menos una consulta
    const filas = page.locator('table tbody tr');
    await expect(filas).not.toHaveCount(0);

    // Paso 3: Click en botón de editar de la primera fila
    // Selector múltiple por si el atributo varía entre componentes
    const botonEditar = filas.first().locator(
      'button[aria-label="editar"], button:has-text("Editar"), [data-testid="btn-editar"]'
    );
    await botonEditar.first().click();

    // Paso 4: Verificar que el modal de edición apareció
    // Se usa role="dialog" porque los class names de Next.js cambian con cada build
    const modal = page.locator('[role="dialog"], [data-testid="modal-editar-consulta"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Paso 5: Modificar el campo de motivo
    const campoMotivo = modal.locator(
      'textarea[name="motivo"], input[name="motivo"], [data-testid="input-motivo"]'
    );
    await campoMotivo.fill('Dolor de cabeza persistente - modificado');

    // Paso 6: Guardar los cambios
    const botonGuardar = modal.locator(
      'button:has-text("Guardar"), button[type="submit"], [data-testid="btn-guardar"]'
    );
    await botonGuardar.click();

    // Paso 7: Verificar que el modal se cerró
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Paso 8: Verificar mensaje de éxito
    const mensajeExito = page.locator(
      '.toast, [role="alert"], [data-testid="toast-exito"]'
    );
    await expect(mensajeExito).toBeVisible({ timeout: 5000 });
    await expect(mensajeExito).toContainText(/éxito|guardado|actualizado/i);
  });
});
