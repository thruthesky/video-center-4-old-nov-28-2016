import { Directive, ElementRef } from '@angular/core';
import { Events } from 'ionic-angular';

@Directive({
  selector: '[myautoscroll]' // Attribute selector
})
export class AutoscrollDirective {
  private myScrollContainer: any;
  constructor(
     private el: ElementRef,
     private events: Events) {
      this.myScrollContainer = el.nativeElement;
      this.listenEvents();
  }
  listenEvents() {
    this.events.subscribe( 'scroll-to-bottom', () => {
      this.scrollToBottom();
    });
  }
  scrollToBottom(): void {
    this.myScrollContainer.scrollTop = this.myScrollContainer.scrollHeight;
  }
}
