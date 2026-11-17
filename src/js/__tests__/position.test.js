import { calculatePosition } from '../position.js';

describe('calculatePosition', () => {
  test('центрирует popover по горизонтали относительно триггера', () => {
    const triggerRect = { left: 100, top: 200, width: 120, height: 40 };
    const popoverRect = { width: 200, height: 80 };

    const { top, left } = calculatePosition({
      triggerRect,
      popoverRect,
      offset: 10,
    });

    // left = 100 + 120/2 - 200/2 = 100 + 60 - 100 = 60
    expect(left).toBe(60);
    // top = 200 - 80 - 10 = 110
    expect(top).toBe(110);
  });

  test('корректно работает при нулевых размерах триггера', () => {
    const triggerRect = { left: 0, top: 0, width: 0, height: 0 };
    const popoverRect = { width: 100, height: 50 };

    const { top, left } = calculatePosition({ triggerRect, popoverRect });

    expect(left).toBe(-50);
    expect(top).toBe(-60);
  });

  test('использует отступ 10 по умолчанию', () => {
    const triggerRect = { left: 0, top: 100, width: 100, height: 20 };
    const popoverRect = { width: 100, height: 50 };

    const { top } = calculatePosition({ triggerRect, popoverRect });
    expect(top).toBe(40);
  });
});