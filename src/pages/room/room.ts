import { Component } from '@angular/core';
import { NavController, Events } from 'ionic-angular';
import * as x from '../../providers/videocenter';
import { LobbyPage } from '../lobby/lobby';
export interface MESSAGELIST {
    messages: Array< x.MESSAGE >
}
@Component({
  selector: 'page-room',
  templateUrl: 'room.html'
})
export class RoomPage {
  title: string;
  inputMessage: string;
  listMessage: MESSAGELIST = <MESSAGELIST> {};
  dmode;
  dsize;
  dcolor;
  DrawMode;
  DrawSize;
  DrawColor;

video_url;
  constructor(
    public navCtrl: NavController, 
    private vc: x.Videocenter,
    private events: Events ) {
      this.inputMessage = '';
      if ( this.listMessage[0] === void 0 ) {
        this.listMessage[0] = { messages: [] };
      }
      vc.getRoomname().then( roomname => {
        this.title = roomname;
        let data :any = { room_name : roomname };
        data.command = "history";
        this.vc.whiteboard( data,() => { console.log("get whiteboard history")} );
        connection.openOrJoin( roomname );
      });
     
      this.listenEvents();




    let connection = x.Videocenter.connection;

//// connection a room
connection.onstream = (event) => {
    //console.log('connection id: ' + connection.userid);
    //console.log('event id: ' + event.userid);
    //console.log(connection);

console.log('onstream : ', event);
let video = event.mediaElement;
console.log( 'video: ', video);

let videos= document.getElementById('videos');
videos.appendChild( video );

    ///
//    roomAddVideo( event );

//    videoLayout( Cookies.get('video-list-style') );
};
  }
  onClickLobby() {
    this.vc.leaveRoom(()=> {
      this.navCtrl.setRoot( LobbyPage );
    });    
  }
  onSendMessage(message: string) {
    if(message != ""){
      this.vc.sendMessage(message, ()=> {
        this.inputMessage = '';             
      });
         
    }
  }
  listenEvents() {
    this.events.subscribe( 'join-room', re => {
      console.log("RoomPage::listenEvents() => someone joins the room: ", re );          
      let message = { name: re[0].name, message: ' joins into ' + re[0].room };//Set Message
      this.addMessage( message );    
    });    
    this.events.subscribe( 'chatMessage', re => {
      console.log("RoomPage::listenEvents() => One user receive message: ", re ); 
      let message = re[0];
      this.addMessage( message );         
    });
      
    
  }
  addMessage( message ) {
    this.listMessage[0].messages.push( message )
    setTimeout(()=>{ this.events.publish( 'scroll-to-bottom' ); }, 100);
  }
  //Canvas Clear
  onClickClear() {
    this.events.publish( 'click-clear-canvas' );
  } 
  drawMode() {
    this.dmode = "l";
  } 
  eraseMode() {
    this.dmode = "e";
  }
 
}
