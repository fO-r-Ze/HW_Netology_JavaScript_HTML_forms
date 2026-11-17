/**
 * Рассчитывает позицию popover относительно триггера.
 * Popover должен быть над триггером и центрирован по горизонтали.
 *
 * @param {Object} params
 * @param {DOMRect|{left:number, top:number, width:number, height:number}} params.triggerRect
 * @param {{width:number, height:number}} params.popoverRect
 * @param {number} [params.offset=10] — отступ между popover и триггером
 * @returns {{top:number, left:number}}
 */
export function calculatePosition({ triggerRect, popoverRect, offset = 10 }) {
  const top = triggerRect.top - popoverRect.height - offset;
  const left =
    triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2;
  return { top, left };
}