import { Directive, ElementRef, HostListener, Input, Renderer } from '@angular/core';
import { Events } from 'ionic-angular';
import * as x from '../../providers/videocenter';

@Directive({
  selector: '[mycanvas]' // Attribute selector
  
})
export class MycanvasDirective {
  @Input() drawSize: string;
  @Input() drawColor: string;
  @Input() drawMode: string;
  private canvas: any;
  private canvas_context: any;
  private mouse : x.Mouse = x.mouse;
  constructor(
     private el: ElementRef,
     private renderer: Renderer,
     private vc: x.Videocenter,
     private events: Events) {
      this.canvas = el.nativeElement;
      this.canvas_context = this.canvas.getContext('2d');
      this.drawSize = "2";
      this.drawColor = "#161515";
      this.drawMode = "l";
      this.listenEvents();
  }
  //Mouse Event
  @HostListener('mousedown', ['$event'])
  onMouseDown(event) {
    event.preventDefault();    
    this.mouse.click = true;
    this.mouse.pos_prev = {x: -12345, y: -12345};
    this.draw(event, this.canvas);
  }
  @HostListener('mouseup', ['$event'])
  onMouseUp(event) {
    event.preventDefault();
    this.mouse.click = false;
  }
  @HostListener('mousemove', ['$event'])
  onMouseMove(event) {
    event.preventDefault();
    if( !this.mouse.click ) return;
    this.draw(event, this.canvas);   
  }
  @HostListener('mouseleave', ['$event'])
  onMouseLeave(event) {
    event.preventDefault();    
    this.mouse.click = false;
    this.mouse.pos_prev = {x: -12345, y: -12345};
  }
  //Touch Event
  @HostListener('touchstart', ['$event'])
  onTouchStart(event) {
    event.preventDefault();    
    this.mouse.click = true;
    this.mouse.pos_prev = {x: -12345, y: -12345};
    this.draw(event, this.canvas);
  }
  @HostListener('touchend', ['$event'])
  onTouchEnd(event) {
    event.preventDefault();
    this.mouse.click = false;
  }
  @HostListener('touchmove', ['$event'])
  onTouchMove(event) {
    event.preventDefault();
    if( !this.mouse.click ) return;
    this.draw(event, this.canvas);   
  }
  



  //Canvas Functionality
  draw( e , obj) {
    let m_posx = 0, m_posy = 0, e_posx = 0, e_posy = 0;
    //get mouse position on document crossbrowser        
    if ( ! e ) e = window.event;
    if (e.pageX || e.pageY){
        m_posx = e.pageX;
        m_posy = e.pageY;
    } else if (e.clientX || e.clientY){
        m_posx = e.clientX + document.body.scrollLeft
            + document.documentElement.scrollLeft;
        m_posy = e.clientY + document.body.scrollTop
            + document.documentElement.scrollTop;
    } else if ( e.changedTouches[0].pageX || e.changedTouches[0].pageY) {
        m_posx = e.changedTouches[0].pageX;
        m_posy = e.changedTouches[0].pageY;
    } else if ( e.changedTouches[0].clientX || e.changedTouches[0].clientY) {
        m_posx = e.changedTouches[0].clientX + document.body.scrollLeft
            + document.documentElement.scrollLeft;
        m_posy = e.changedTouches[0].clientY + document.body.scrollTop
            + document.documentElement.scrollTop;
    }

    //get parent element position in document
    if ( obj.offsetParent){
        do {
            e_posx += obj.offsetLeft;
            e_posy += obj.offsetTop;
        } while ( obj = obj.offsetParent);
    }
    let scrollContent = document.getElementsByClassName('scroll-content');
    let scrollContentX = scrollContent[0].scrollLeft;
    let scrollContentY = scrollContent[0].scrollTop;
    let x : number = m_posx-e_posx;
    let y : number = m_posy-e_posy;
    this.mouse.pos.x = x+scrollContentX;
    this.mouse.pos.y = y+scrollContentY;
    if ( this.mouse.pos_prev.x == -12345 ) {
        this.mouse.pos_prev.x = this.mouse.pos.x;
        this.mouse.pos_prev.y = this.mouse.pos.y;
    }
    let data :any =  { line : [this.mouse.pos, this.mouse.pos_prev] };
    data.lineWidth = this.drawSize;
    data.color = this.drawColor;
    data.draw_mode = this.drawMode;
    data.command = "draw"; 
    this.vc.getRoomname().then( roomname => {
        data.room_name = roomname;
        this.vc.whiteboard( data, ()=>{
          console.log('success');
        });
        this.draw_on_canvas( data );
        this.mouse.pos_prev.x = this.mouse.pos.x;
        this.mouse.pos_prev.y = this.mouse.pos.y;
    });
  }
  draw_on_canvas( data ) {
    let line = data.line;
    if ( typeof data.lineJoin == 'undefined' ) data.lineJoin = 'round';
    if ( typeof data.draw_mode == 'undefined' ) data.draw_mode = 'l';
    if ( typeof data.lineWidth == 'undefined' ) data.lineWidth = 3;
    if ( typeof data.color == 'undefined' ) data.color = 'black';
    let ox = line[0].x;
    let oy = line[0].y;
    let dx = line[1].x;
    let dy = line[1].y; 
    let ctx = this.canvas_context;  
    ctx.beginPath();
    ctx.lineJoin = data.lineJoin;
    if ( data.draw_mode == 'e' ) {       
    ctx.globalCompositeOperation = 'destination-out';
        data.lineWidth = 15;
    }
    else if ( data.draw_mode == 'l' ) {
        ctx.globalCompositeOperation = 'source-over';
    }
    if ( ox == dx && oy == dy ) {           
        ctx.fillStyle = data.color;
        ctx.arc( dx, dy, data.lineWidth * 0.5, 0, Math.PI*2, false);            
        ctx.closePath();
        ctx.fill();
    }
    else {
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.lineWidth;
        ctx.moveTo( ox, oy);
        ctx.lineTo( dx, dy);
        ctx.stroke();
        ctx.fillStyle = data.color;
        ctx.arc( dx, dy, data.lineWidth * 0.5, 0, Math.PI*2, false);            
        ctx.closePath();
        ctx.fill();
      
    }      
  }
  clear_my_canvas() {
    //get the canvas context
    let ctx = this.canvas_context; 
    let canvas = this.canvas; 
    // Store the current transformation matrix
    ctx.save(); 
    // Use the identity matrix while clearing the canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Restore the transform
    ctx.restore();
  }
  broadcastClearCanvas() {    
    this.vc.getRoomname().then( roomname => {
        let data :any = { command : "clear" };
        data.room_name = roomname;
        this.vc.whiteboard( data, ()=>{
          console.log('clear whiteboard');
        });
    });
  }
  // Event Listener
  listenEvents() {
    this.events.subscribe( 'click-clear-canvas', () => {
      this.broadcastClearCanvas();
    });
    this.events.subscribe( 'whiteboard', re => {
      console.log("Whiteboard::listenEvents() =>  ", re );          
      let data = re[0];
      if ( data.command == 'draw' ) {
          this.draw_on_canvas(data);
      }
      else if ( data.command == 'history' ) { 
          this.draw_on_canvas(data);
      }     
      else if ( data.command == 'clear' ) {
          this.clear_my_canvas();        
      }
      // else if ( data.command == 'show-whiteboard' ) {
      //     console.log('socket_on_from_server() : command = ' + data.command );
      //     // this.show();
      // }
      // else if ( data.command == 'hide-whiteboard' ) {
      //     console.log('socket_on_from_server() : command = ' + data.command );
      //     this.hide();
      // }
      // else if ( data.command == 'canvas-size' ) { 
      //     console.log('socket_on_from_server() : command = ' + data.command );
      //     this.change_canvas_size( data.size );
      // }   
    });    
  }
}

