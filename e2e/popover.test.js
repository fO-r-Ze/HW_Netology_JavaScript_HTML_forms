import puppeteer from 'puppeteer';

const APP_URL = process.env.APP_URL || 'http://localhost:9000';

describe('Popover (e2e)', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
  });

  afterEach(async () => {
    await page.close();
  });

  test('popover изначально отсутствует в DOM', async () => {
    const hasPopover = await page.$('.popover');
    expect(hasPopover).toBeNull();
  });

  test('клик по триггеру показывает popover с заголовком и содержимым', async () => {
    await page.click('[data-popover-title]');
    await page.waitForSelector('.popover');

    const title = await page.$eval('.popover__title', (el) => el.textContent);
    const content = await page.$eval('.popover__content', (el) => el.textContent);

    expect(title).toBe('Popover title');
    expect(content).toContain('some amazing content');
  });

  test('popover над триггером и отцентрирован по горизонтали', async () => {
    await page.click('[data-popover-title]');
    await page.waitForSelector('.popover.popover--visible');

    const positions = await page.evaluate(() => {
      const trigger = document.querySelector('[data-popover-title]');
      const popover = document.querySelector('.popover');
      const t = trigger.getBoundingClientRect();
      const p = popover.getBoundingClientRect();
      return {
        triggerTop: t.top,
        triggerLeft: t.left,
        triggerWidth: t.width,
        popoverTop: p.top,
        popoverLeft: p.left,
        popoverWidth: p.width,
        popoverBottom: p.bottom,
      };
    });

    // Popover выше триггера
    expect(positions.popoverBottom).toBeLessThanOrEqual(positions.triggerTop);

    // Popover отцентрирован по горизонтали (погрешность < 1px)
    const expectedLeft =
      positions.triggerLeft +
      positions.triggerWidth / 2 -
      positions.popoverWidth / 2;
    expect(Math.abs(positions.popoverLeft - expectedLeft)).toBeLessThan(1);
  });

  test('анимация появления завершается (opacity → 1)', async () => {
    await page.click('[data-popover-title]');
    await page.waitForSelector('.popover');

    // Изначально opacity может быть 0 — ждём, пока дойдёт до 1
    await page.waitForFunction(
      () => {
        const el = document.querySelector('.popover');
        if (!el) return false;
        return parseFloat(getComputedStyle(el).opacity) === 1;
      },
      { timeout: 2000 }
    );

    const opacity = await page.$eval('.popover', (el) =>
      parseFloat(getComputedStyle(el).opacity)
    );
    expect(opacity).toBe(1);
  });

  test('повторный клик по триггеру скрывает popover (toggle)', async () => {
    const trigger = '[data-popover-title]';

    await page.click(trigger);
    await page.waitForSelector('.popover.popover--visible');

    await page.click(trigger);
    await page.waitForFunction(() => !document.querySelector('.popover'));

    expect(await page.$('.popover')).toBeNull();
  });

  test('клик вне popover и триггера закрывает popover', async () => {
    await page.click('[data-popover-title]');
    await page.waitForSelector('.popover.popover--visible');

    // Кликаем в пустое место страницы (по body)
    await page.evaluate(() => {
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await page.waitForFunction(() => !document.querySelector('.popover'));
    expect(await page.$('.popover')).toBeNull();
  });

  test('клик по самому popover не закрывает его', async () => {
    await page.click('[data-popover-title]');
    await page.waitForSelector('.popover.popover--visible');

    await page.click('.popover__content');

    // Небольшая пауза, чтобы скрытие (если бы оно было) успело произойти
    await new Promise((r) => setTimeout(r, 100));
    expect(await page.$('.popover')).not.toBeNull();
  });

  test('заголовок и содержимое экранируются (XSS-safe)', async () => {
    await page.evaluate(() => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.popoverTitle = '<b>bad</b>';
      btn.dataset.popoverContent = '<script>window.__xss = true</script>';
      btn.id = 'xss-trigger';
      btn.textContent = 'xss';
      document.querySelector('.container').append(btn);
    });

    await page.click('#xss-trigger');
    await page.waitForSelector('.popover.popover--visible');

    const titleHTML = await page.$eval('.popover__title', (el) => el.innerHTML);
    const contentHTML = await page.$eval('.popover__content', (el) => el.innerHTML);

    expect(titleHTML).toContain('&lt;b&gt;');
    expect(contentHTML).toContain('&lt;script&gt;');

    // Скрипт не выполнился
    const xss = await page.evaluate(() => window.__xss);
    expect(xss).toBeUndefined();
  });

  test('поддерживает несколько триггеров', async () => {
    const triggers = await page.$$('[data-popover-title]');
    expect(triggers.length).toBe(3);

    // Клик по первому
    await triggers[0].click();
    await page.waitForSelector('.popover.popover--visible');
    const firstTitle = await page.$eval('.popover__title', (el) => el.textContent);
    expect(firstTitle).toBe('Popover title');

    // Клик по второму — первый закрывается, второй открывается
    await triggers[1].click();
    await page.waitForFunction(
      () =>
        document.querySelector('.popover__title')?.textContent === 'Второй Popover'
    );
    const secondTitle = await page.$eval('.popover__title', (el) => el.textContent);
    expect(secondTitle).toBe('Второй Popover');
  });
});