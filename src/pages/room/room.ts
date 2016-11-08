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
  canvaswidth:string;
  canvasheight:string;
  dmode;
  dsize;
  dcolor;
  DrawMode;
  DrawSize;
  DrawColor;
  video_url;
  audios = [];
  videos = [];
  oldvideo;
  constructor(
    public navCtrl: NavController, 
    private vc: x.Videocenter,
    private events: Events ) {
      this.canvaswidth = "340px";
      this.canvasheight = "340px";
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
  
  // console.log('onstream : ', event);
  let video = event.mediaElement;
  // console.log( 'video: ', video);

  let videos= document.getElementById('video-container');
  videos.appendChild( video );
  this.oldvideo = video;
      ///
  //    roomAddVideo( event );

  //    videoLayout( Cookies.get('video-list-style') );
  };
  this.showSettings();
}


  showSettings() {
    //////
    let connection = x.Videocenter.connection;
    
    /**
     * @todo Open camera first and change camera...
     */
    connection.DetectRTC.load(() => {
        connection.DetectRTC.MediaDevices.forEach((device) => {
          /*
            if(document.getElementById(device.id)) {
                return;
            }
            */
            if(device.kind === 'audioinput') {
                //var option = document.createElement('option');
                //option.id = device.id;
                //option.innerHTML = device.label || device.id;
                //option.value = device.id;
                //console.log('audio: ', option);
                //audioDevices.appendChild(option);
                let audio = {
                  text: device.label || device.id,
                  value: device.id
                };
                this.audios.push( audio );
                // console.log('audios:',this.audios);
                // selected audio
                // if(connection.mediaConstraints.audio.optional.length && connection.mediaConstraints.audio.optional[0].sourceId === device.id) {
                //     option.selected = true;
                // }
            }

            if(device.kind.indexOf('video') !== -1) {
                // var option = document.createElement('option');
                // option.id = device.id;
                // option.innerHTML = device.label || device.id;
                // option.value = device.id;
                //videoDevices.appendChild(option);
                // console.log('video: ', option);
                let video = {
                  text: device.label || device.id,
                  value: device.id
                };
                this.videos.push( video );
                // console.log('audios:',this.videos);
                // if(connection.mediaConstraints.video.optional.length && connection.mediaConstraints.video.optional[0].sourceId === device.id) {
                //     option.selected = true;
                // }
            }
        });
    });


    //////
  }
  onClickLobby() {
    this.vc.leaveRoom(()=> {
      this.navCtrl.setRoot( LobbyPage );
    });    
  }
  onChangeVideo( data ) {
    let connection = x.Videocenter.connection;
    let videoSourceId = data;
    if(connection.mediaConstraints.video.optional.length && connection.attachStreams.length) {
        if(connection.mediaConstraints.video.optional[0].sourceId === videoSourceId) {
            alert('Selected video device is already selected.');
            return;
        }
    }
    connection.attachStreams.forEach(function(stream) {
        stream.getVideoTracks().forEach(function(track) {
            stream.removeTrack(track);
            if(track.stop) {
                track.stop();
            }
        });
    });
    connection.mediaConstraints.video.optional = [{
        sourceId: videoSourceId
    }];
    
    let videos= document.getElementById('video-container');
    console.log(this.oldvideo);
    videos.removeChild( this.oldvideo );
    connection.captureUserMedia();
  }
  
  onChangeAudio( data ) {
    console.log("change audio", data);
    let connection = x.Videocenter.connection;
    var audioSourceId = data;
    if(connection.mediaConstraints.audio.optional.length && connection.attachStreams.length) {
        if(connection.mediaConstraints.audio.optional[0].sourceId === audioSourceId) {
            alert('Selected audio device is already selected.');
            return;
        }
    }
    connection.attachStreams.forEach(function(stream) {
        stream.getAudioTracks().forEach(function(track) {
            stream.removeTrack(track);
            if(track.stop) {
                track.stop();
            }
        });
    });
    connection.mediaConstraints.audio.optional = [{
        sourceId: audioSourceId
    }];
    let videos= document.getElementById('video-container');
    console.log(this.oldvideo);
    videos.removeChild( this.oldvideo );
    connection.captureUserMedia();
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
