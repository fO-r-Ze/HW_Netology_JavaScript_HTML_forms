import { calculatePosition } from './position.js';

export default class Popover {
  constructor(parent = document.body) {
    this.parent = parent;
    this.element = null;
    this.trigger = null;
    this.onOutsideClick = this.onOutsideClick.bind(this);
  }

  static get markup() {
    return `
      <div class="popover" role="tooltip">
        <div class="popover__arrow"></div>
        <h3 class="popover__title"></h3>
        <div class="popover__content"></div>
      </div>
    `.trim();
  }

  show(trigger, { title, content }) {
    this.hide();
    this.trigger = trigger;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = Popover.markup;
    this.element = wrapper.firstElementChild;

    this.element.querySelector('.popover__title').textContent = title;
    this.element.querySelector('.popover__content').textContent = content;

    this.element.style.position = 'absolute';
    this.parent.append(this.element);

    // Сначала измеряем размеры и ставим top/left (элемент уже с opacity: 0 из CSS)
    this.position(trigger);

    // В следующем кадре добавляем класс — срабатывает transition на opacity
    requestAnimationFrame(() => {
      if (this.element) {
        this.element.classList.add('popover--visible');
      }
    });

    document.addEventListener('click', this.onOutsideClick);
  }

  position(trigger) {
    const triggerRect = trigger.getBoundingClientRect();
    const popoverRect = this.element.getBoundingClientRect();

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || 0;

    const { top, left } = calculatePosition({
      triggerRect: {
        left: triggerRect.left + scrollLeft,
        top: triggerRect.top + scrollTop,
        width: triggerRect.width,
        height: triggerRect.height,
      },
      popoverRect,
      offset: 10,
    });

    this.element.style.top = `${top}px`;
    this.element.style.left = `${left}px`;
  }

  onOutsideClick(event) {
    if (!this.element) return;
    if (this.element.contains(event.target)) return;
    if (this.trigger && this.trigger.contains(event.target)) return;
    this.hide();
  }

  hide() {
    if (this.element && this.element.parentNode) {
      this.element.remove();
    }
    this.element = null;
    this.trigger = null;
    document.removeEventListener('click', this.onOutsideClick);
  }

  destroy() {
    this.hide();
  }
}