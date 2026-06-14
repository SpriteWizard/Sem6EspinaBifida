import { test, expect } from '@playwright/test';

/**
 * CP-009 — Modificación de consulta exitosa (Escenario POSITIVO)
 * HU: Editar consulta registrada
 * Sprint: 1
 *
 * Generado con asistencia de GitHub Copilot.
 * Prompt usado: "Write a Playwright TypeScript test for editing an existing medical
 * consultation in a clinic management system. The user needs to log in first,
 * navigate to the consultas module, select an existing record, edit a field,
 * and verify the update was saved."
 *
 * Ajustes manuales realizados:
 * - Se adaptaron los selectores al DOM real de la app CDC (Next.js)
 * - Se añadió espera explícita para la redirección post-login
 * - Se ajustó el flujo de edición al modal real (no inline edit como sugirió Copilot)
 * - Se añadió verificación del toast de éxito
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@cdc.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123';

test.describe('CP-009 — Modificación de consulta exitosa', () => {
  test.beforeEach(async ({ page }) => {
    // Precondición: el usuario inicia sesión antes de cada test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    // Esperar a que el login redirija al dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
  });

  test('Debe permitir editar una consulta existente y guardar los cambios', async ({ page }) => {
    // Paso 1: Navegar al módulo de consultas
    await page.goto(`${BASE_URL}/consultas`);
    await expect(page).toHaveURL(/consultas/);

    // Paso 2: Verificar que existe al menos una consulta en la tabla
    const filas = page.locator('table tbody tr');
    await expect(filas).not.toHaveCount(0);

    // Paso 3: Hacer click en el botón de editar de la primera consulta
    // Copilot sugirió usar 'button[aria-label="edit"]' — ajustado al ícono real de la app
    const botonEditar = filas.first().locator('button[aria-label="editar"], button:has-text("Editar"), [data-testid="btn-editar"]');
    await botonEditar.first().click();

    // Paso 4: Verificar que el modal/formulario de edición se abrió
    const modal = page.locator('[role="dialog"], .modal, [data-testid="modal-editar-consulta"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Paso 5: Modificar el campo de motivo de consulta
    // Copilot inicialmente sugirió locator('#motivo') — se ajustó para ser más robusto
    const campoMotivo = modal.locator(
      'textarea[name="motivo"], input[name="motivo"], [placeholder*="motivo"], [data-testid="input-motivo"]'
    );
    await campoMotivo.fill('Dolor de cabeza persistente - modificado por prueba automatizada');

    // Paso 6: Guardar los cambios
    const botonGuardar = modal.locator('button:has-text("Guardar"), button[type="submit"], [data-testid="btn-guardar"]');
    await botonGuardar.click();

    // Paso 7: Verificar que el modal se cerró (cambios guardados)
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Paso 8: Verificar mensaje de éxito (toast / snackbar)
    // Copilot sugirió .toast — se añadieron alternativas para cubrir diferentes implementaciones
    const mensajeExito = page.locator('.toast, [role="alert"], .notification, [data-testid="toast-exito"]');
    await expect(mensajeExito).toBeVisible({ timeout: 5000 });
    await expect(mensajeExito).toContainText(/éxito|guardado|actualizado/i);

    // Resultado esperado: la tabla muestra la consulta con datos actualizados
    await expect(page.locator('table')).toContainText('modificado por prueba automatizada');
  });
});
