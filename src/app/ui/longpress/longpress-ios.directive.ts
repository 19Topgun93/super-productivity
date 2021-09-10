import { Directive, ElementRef, EventEmitter, OnDestroy, Output } from '@angular/core';
import { UI_LONG_PRESS_DURATION } from '../ui.const';
import { IS_IOS } from '../../util/is-ios';

@Directive({
  selector: '[longPressIOS]',
})
export class LongPressIOSDirective implements OnDestroy {
  @Output()
  longPressIOS: EventEmitter<MouseEvent | TouchEvent> = new EventEmitter();

  private longPressTimeout: any;

  constructor(el: ElementRef) {
    if (IS_IOS) {
      const htmlEl: HTMLHtmlElement = el.nativeElement;
      ['touchstart'].forEach((evtName) =>
        htmlEl.addEventListener(evtName, (event) => {
          this.longPressTimeout = window.setTimeout(() => {
            this.longPressIOS.emit(event as MouseEvent | TouchEvent);
          }, UI_LONG_PRESS_DURATION);
        }),
      );

      ['touchend', 'touchmove'].forEach((evtName) =>
        htmlEl.addEventListener(evtName, (event) => {
          window.clearTimeout(this.longPressTimeout);
        }),
      );
    }
  }

  ngOnDestroy(): void {
    if (this.longPressTimeout) {
      window.clearTimeout(this.longPressTimeout);
    }
  }
}
