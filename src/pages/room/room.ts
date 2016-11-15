import { Component } from '@angular/core';
import { Platform, NavController, NavParams, AlertController, ActionSheetController, Events } from 'ionic-angular';
import * as x from '../../providers/videocenter';
import { LobbyPage } from '../lobby/lobby';

import { Post } from '../../fireframe2/post';
import { Data } from '../../fireframe2/data';
import * as _ from 'lodash';
export interface MESSAGELIST {
    messages: Array< x.MESSAGE >
}

export interface  PostEdit {
    key : string;
    namePhoto : string;
    urlPhoto?: string;
    refPhoto?: string;
}
@Component({
  selector: 'page-room',
  templateUrl: 'room.html'
})
export class RoomPage {
  whiteboard_container:any;
  defaultCanvasSize:string = '340px';
  title: string;
  inputMessage: string;
  listMessage: MESSAGELIST = <MESSAGELIST> {};
  settings:boolean = true;
  chatDisplay:boolean = true;
  documentDisplay:boolean = true;
  dmode:any;
  dsize:any;
  dcolor:any;
  DrawMode:any;
  DrawSize:any;
  DrawColor:any;
  video_url:any;
  audios:any = [];
  videos:any = [];
  selectedAudio:any;
  defaultAudio:any;
  selectedVideo:any;
  defaultVideo:any;
  // File upload
  data : PostEdit = <PostEdit> {};
  postKey: string;
  urlPhoto: string = "x-assets/1.png";
  position:number = 0;
  progress = null;
  file_progress = null;
  loader: boolean = false;
  cordova: boolean = false;
  // File Load
  posts = [];
  noMorePost: boolean = false;
  connectingToServer:string = 'Connecting to server...'
  // Addons
  canvasPhoto: string = "x-assets/1.png";
  constructor(
    public navCtrl: NavController, 
    private vc: x.Videocenter,
    private events: Events,
    private post: Post,
    private platform: Platform,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
    private file: Data,
    private navParams: NavParams,) {
      this.whiteboard_container = document.getElementById('whiteboard-container');
      if ( platform.is('cordova') ) this.cordova = true;
      this.postKey = navParams.get('postKey');
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
      // File Load
      this.loadPosts();
      
      // File Load
      // File Upload
      if ( this.postKey ) {
          console.log("PostEditPage:: post edit key=" + this.postKey);
          this.post
            .set('key', this.postKey)
            .get( snapValue => {
              if( snapValue ) {
                console.info('snapValue:: ', snapValue);
                this.data.key = this.postKey ;
                this.data.namePhoto = snapValue.namePhoto;
                this.data.urlPhoto = snapValue.urlPhoto;
                this.data.refPhoto = snapValue.refPhoto;
                this.urlPhoto = this.data.urlPhoto;
              }else {
                console.log('Key Doesnt Exist');
              }

            },e =>{
              console.info('Post get() fail on key:' + this.postKey + ', Error:' + e);
            });
        }

      // File Upload
      let connection = x.Videocenter.connection;

      // A new user's video stream arrives
      connection.onstream = (event) => this.addUserVideo( event );
      
      setTimeout(()=>{ this.showSettings()},1000);
  }
  addUserVideo( event ) {
    let connection = x.Videocenter.connection;
    console.log('connection id: ' + connection.userid);
    console.log('event id: ' + event.userid); // socket
    //console.log(connection);
    let me: string = 'you';
    if ( connection.userid == event.userid ) me = 'me';
    
    console.log('onstream : ', event);
    let video = event.mediaElement;
    video.setAttribute('class', me);
    console.log( 'video: ', video);

    let videos= document.getElementById('video-container');
    if ( me == 'me' ) {
      videos.insertBefore(video, videos.firstChild);
    }
    else {
      videos.appendChild( video );
    }
        ///
    //    roomAddVideo( event );

    //    videoLayout( Cookies.get('video-list-style') );
  }
  // loadPosts
  loadPosts( infinite? ) {
    this.post
      // .nextPage( data => {
      //   console.log('loadPoss: ', data);
      //   if ( infinite ) infinite.complete();
      //   if ( ! _.isEmpty(data) ) this.displayPosts( data );
      //   else {
      //     this.noMorePost = true;
      //     infinite.enable( false );
      //   }
      // },
      .gets( data => {
        if ( ! _.isEmpty(data) ) this.displayPosts( data );
      },
      e => {
        console.log("fetch failed: ", e);
      });
  }
  displayPosts( data ) {
      for( let key of Object.keys(data).reverse() ) {
        this.posts.push ( {key: key, value: data[key]} );
      }
  }
 
  // loadPosts 
  // Addons
  onChangePhotoDisplay(url){
    this.urlPhoto = url;
  }
  showMiscellaneous() {
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Miscellaneous',
      buttons: [
        {
          text: 'Settings',
          icon: 'settings',
          handler: () => {
            this.settings = ! this.settings;
          }
        },{
          text: 'Chat',
          icon: 'md-chatboxes',
          handler: () => {
            this.chatDisplay = ! this.chatDisplay;
          }
        },{
          text: 'Document',
          icon: 'ios-images',
          handler: () => {
            this.documentDisplay = ! this.documentDisplay;
          }
        },{
          text: 'Cancel',
          role: 'cancel',
          icon: 'md-close',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    actionSheet.present();
  }
  // Addons
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
      
            if(device.kind.indexOf('video') !== -1) {
               
                let video = {
                  text: device.label || device.id,
                  value: device.id
                };
                
                this.videos.push( video );
                if(!this.defaultVideo){
                  this.defaultVideo = true;
                  this.vc.setConfig('default-video',video.value);
                }
         
            }
            if(device.kind === 'audioinput') {
                let audio = {
                    text: device.label || device.id,
                    value: device.id
                  };
                this.audios.push( audio );
                if(!this.defaultAudio){
                  this.defaultAudio = true;
                  this.vc.setConfig('default-audio',audio.value);
                }
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
    
    let video = document.getElementsByClassName('me')[0];
    console.log("Vidd:",video);
    if(video) {
      video.parentNode.removeChild( video );
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
    
    let video = document.getElementsByClassName('me')[0];
    console.log("Vidd:",video);
    if(video) {
      video.parentNode.removeChild( video )
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
    this.events.subscribe( 'whiteboard', re => {
      console.log("Whiteboard::listenEvents() =>  ", re );          
      let data = re[0];
      if ( data.command == 'image' ) {
          this.changeCanvasPhoto(data.image);
      }
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
      this.data.namePhoto = file.name;
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
      this.data.urlPhoto = url;
      this.data.refPhoto = ref;
      this.postPhoto();
  }
  postPhoto() {
    this.loader = true;
    this.post
    .sets( this.data )
    .create( () => {
        this.loader = false;
        let alert = this.alertCtrl.create({
            title: 'SUCCESS',
            subTitle: 'Your post has been posted.',
            buttons: ['OK']
        });
        alert.present();
        console.log( 'onclickPost::Success' );
    }, e => {
        this.loader = false;
        console.log( 'onclickPost::Failed' + e );
    });
  }
  onClickPhoto() {
     this.vc.getRoomname().then( roomname => {
        let data :any = { room_name : roomname };
        data.command = "image";
        data.image = this.urlPhoto;
        this.vc.whiteboard( data,() => { 
          console.log("Change Whiteboard Image");
          
        } );
        this.changeCanvasPhoto(this.urlPhoto);
      });
    
  }
  changeCanvasPhoto(image) {
    this.canvasPhoto = image;
  }
}