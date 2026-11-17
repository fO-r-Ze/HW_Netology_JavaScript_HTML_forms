import Popover from './Popover.js';

export default class PopoverWidget {
  constructor(container) {
    this.container = container;
    this.popover = new Popover();
    this.onTriggerClick = this.onTriggerClick.bind(this);
  }

  init() {
    this.container.addEventListener('click', this.onTriggerClick);
  }

  onTriggerClick(event) {
    const trigger = event.target.closest('[data-popover-title]');
    if (!trigger) return;

    event.preventDefault();
    event.stopPropagation();

    // Если popover уже открыт для этого же триггера — закрываем (toggle)
    if (this.popover.trigger === trigger && this.popover.element) {
      this.popover.hide();
      return;
    }

    this.popover.show(trigger, {
      title: trigger.dataset.popoverTitle,
      content: trigger.dataset.popoverContent,
    });
  }

  destroy() {
    this.container.removeEventListener('click', this.onTriggerClick);
    this.popover.destroy();
  }
}