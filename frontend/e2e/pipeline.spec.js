import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
});

test('builds and submits a pipeline with dynamic text handles', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.getByRole('button', { name: 'Add Input node' }).click();
  await page.getByRole('button', { name: 'Add Text node' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(2);

  const textNode = page.locator('.react-flow__node-text');
  const before = await textNode.boundingBox();
  await textNode.getByRole('textbox', { name: 'Text' }).fill(
    `Hello {{ customer_name }} - ${'personalized pipeline content '.repeat(8)}`,
  );
  await expect(textNode.locator('span', { hasText: '{{ customer_name }}' })).toBeVisible();
  await expect(textNode.locator('.react-flow__handle-left')).toHaveCount(1);
  const after = await textNode.boundingBox();
  expect(after.width).toBeGreaterThan(before.width);

  const source = page.locator('.react-flow__node-customInput .react-flow__handle-right');
  const target = textNode.locator('.react-flow__handle-left');
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator('.react-flow__edge')).toHaveCount(1);

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('dialog', { name: 'Pipeline result' })).toBeVisible();
  await expect(page.getByText('Valid Pipeline')).toBeVisible();
  await page.getByRole('dialog', { name: 'Pipeline result' }).getByText('Close', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Submit' })).toBeFocused();
  expect(errors).toEqual([]);
});

test('rapid node insertion does not overlap and invalid drops do not crash', async ({ page }) => {
  for (const name of ['Input', 'LLM', 'Math', 'Threshold', 'API Request']) {
    await page.getByRole('button', { name: `Add ${name} node` }).click();
  }
  const nodes = page.locator('.react-flow__node');
  await expect(nodes).toHaveCount(5);
  const boxes = await nodes.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    }),
  );
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const overlaps = !(
        boxes[i].right <= boxes[j].left ||
        boxes[j].right <= boxes[i].left ||
        boxes[i].bottom <= boxes[j].top ||
        boxes[j].bottom <= boxes[i].top
      );
      expect(overlaps).toBe(false);
    }
  }

  await page.locator('.react-flow').evaluate((element) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('application/reactflow', '{invalid-json');
    element.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));
  });
  await expect(page.getByText('That dragged item is not a valid pipeline node.')).toBeVisible();
});
