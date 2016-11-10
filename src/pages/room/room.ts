import { Component } from '@angular/core';
import { Platform, NavController, Events } from 'ionic-angular';
import * as x from '../../providers/videocenter';
import { LobbyPage } from '../lobby/lobby';

import { Post } from '../../fireframe2/post';
import { Data } from '../../fireframe2/data';
export interface MESSAGELIST {
    messages: Array< x.MESSAGE >
}
@Component({
  selector: 'page-room',
  templateUrl: 'room.html'
})
export class RoomPage {
  defaultCanvasSize:string = '340px';
  title: string;
  inputMessage: string;
  listMessage: MESSAGELIST = <MESSAGELIST> {};
  settings:boolean;
  dmode:any;
  dsize:any;
  dcolor:any;
  DrawMode:any;
  DrawSize:any;
  DrawColor:any;
  video_url:any;
  audios:any = [];
  videos:any = [];
  oldvideo:any;
  selectedAudio:any;
  defaultAudio:any;
  selectedVideo:any;
  defaultVideo:any;
  // File upload
  urlPhoto: string = "x-assets/1.png";
  position:number = 0;
  progress = null;
  file_progress = null;
 

  constructor(
    public navCtrl: NavController, 
    private vc: x.Videocenter,
    private events: Events,
    private post: Post,
    private platform: Platform,
    private file: Data) {
      this.defaultAudio = false;
      this.defaultVideo = false;
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
      setTimeout(()=>{this.settings = true; this.showSettings()},600);
  }
  ngOnInit() {
    this.setCanvasSize(this.defaultCanvasSize,this.defaultCanvasSize);
  }
  setCanvasSize(h, w) {
     let mycanvas= document.getElementById('mycanvas');
     mycanvas.setAttribute('height', h);
     mycanvas.setAttribute('width', w);
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
                if(!this.defaultVideo){
                  this.defaultVideo = true;
                  // this.selectedVideo = video.value;
                  this.vc.setConfig('default-video',video.value);
                }
                // console.log('audios:',this.videos);
                // if(connection.mediaConstraints.video.optional.length && connection.mediaConstraints.video.optional[0].sourceId === device.id) {
                //     option.selected = true;
                // }
            }
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
                if(!this.defaultAudio){
                  this.defaultAudio = true;
                  // this.selectedVideo = video.value;
                  this.vc.setConfig('default-audio',audio.value);
                }
                // if(!this.defaultAudio){
                //   this.defaultAudio = true;
                //   this.selectedAudio = audio.value;
                // }
                // console.log('audios:',this.audios);
                // selected audio
                // if(connection.mediaConstraints.audio.optional.length && connection.mediaConstraints.audio.optional[0].sourceId === device.id) {
                //     option.selected = true;
                // }
                if(connection.mediaConstraints.audio.optional.length && connection.mediaConstraints.audio.optional[0].sourceId === device.id) {
                    console.log(device.id);
                }
            }
        });
        this.getDefaultAudio();
        this.getDefaultVideo();
    });


    //////
  }
  getDefaultAudio(){
    this.vc.config('default-audio',(value)=>{
      console.log("Default-audio",value);
      this.selectedAudio = value;
      this.changeAudio(value);
    });
  }
  getDefaultVideo(){
    this.vc.config('default-video',(value)=>{
      this.selectedVideo = value;
      this.changeVideo(value);
    });
  }
  onClickLobby() {
    this.vc.leaveRoom(()=> {
      this.navCtrl.setRoot( LobbyPage );
    });    
  }
  changeVideo( videoSourceId ) {
    let connection = x.Videocenter.connection;
    this.vc.setConfig('default-video',videoSourceId);
    
    if(connection.mediaConstraints.video.optional.length && connection.attachStreams.length) {
        if(connection.mediaConstraints.video.optional[0].sourceId === videoSourceId) {
            // alert('Selected video device is already selected.');
            console.log('Selected video device is already selected.');
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
    if(this.oldvideo){
      videos.removeChild( this.oldvideo );
      connection.captureUserMedia();
    }  
  }
  
  changeAudio( audioSourceId ) {
    let connection = x.Videocenter.connection;
    this.vc.setConfig('default-audio',audioSourceId);
    if(connection.mediaConstraints.audio.optional.length && connection.attachStreams.length) {
        if(connection.mediaConstraints.audio.optional[0].sourceId === audioSourceId) {
            // alert('Selected audio device is already selected.');
            console.log('Selected audio device is already selected.');
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
    if(this.oldvideo){
      videos.removeChild( this.oldvideo );
      connection.captureUserMedia();
    }  
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

  // File Upload
  onChangeFile(event) {
      let file = event.target.files[0];
      if ( file === void 0 ) return;
      this.file_progress = true;
      let ref = 'videocenter/' +  file.name;
      this.file.upload( { file: file, ref: ref }, uploaded => {
          this.onFileUploaded( uploaded.url, uploaded.ref );
      },
      e => {
          this.file_progress = false;
          alert(e);
      },
      percent => {
          this.position = percent;
      } );
  }
  onFileUploaded( url, ref ) {
      this.file_progress = false;
      this.urlPhoto = url;
  }
  onClickPhoto() {
    alert("I Click the Photo!");
  }
}
