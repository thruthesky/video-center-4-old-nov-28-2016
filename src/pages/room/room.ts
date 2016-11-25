import { Component } from '@angular/core';
import * as x from '../../providers/videocenter';
import { Post } from '../../fireframe2/post';
import { Data } from '../../fireframe2/data';
//import * as _ from 'lodash';
import { Platform, NavController, NavParams, AlertController, ActionSheetController, Events } from 'ionic-angular';
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
  roomTitle: string;
  inputMessage: string;
  listMessage: MESSAGELIST = <MESSAGELIST> {};
  settings:boolean = true;
  chatDisplay:boolean = true;
  documentDisplay:boolean = true;
  whiteboardContainer:any;
  defaultCanvasSize:string = '340px';
  optionDrawMode:any;
  optionDrawSize:any;
  optionDrawColor:any;
  selectDrawSize:any;
  selectDrawColor:any;
  video_url:any;
  audios:any = [];
  videos:any = [];
  selectedAudio:any;
  defaultAudio:any;
  selectedVideo:any;
  defaultVideo:any;
  data : PostEdit = <PostEdit> {};
  postKey: string;
  urlPhoto: string = "x-assets/1.png";
  position:number = 0;
  progress = null;
  file_progress = null;
  loader: boolean = false;
  cordova: boolean = false;
  posts = [];
  noMorePost: boolean = false;
  connectingToServer:string = 'Connecting to server...'
  canvasPhoto: string = "x-assets/1.png";
  streamId:string = '';
  userId:string = '';
  firstChangeVideo:boolean = false;
  firstChangeAudio:boolean = false;

  private connection = null;
  constructor(
    public navCtrl: NavController, 
    private vc: x.Videocenter,
    private events: Events,
    private post: Post,
    private platform: Platform,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
    private file: Data,
    private navParams: NavParams) {

      
      this.init();
      this.joinRoom();
      /*
      setTimeout(()=>{
        console.log('renegotiate:');
        this.connection.renegotiate();
      }, 1000);
      */
      this.connection.onstream = (event) => this.addUserVideo( event ); // A new user's video stream arrives
      setTimeout(()=>{ this.showSettings()},1000);
  }

  init() {
      this.connection = x.Videocenter.connection;
      this.connection.sdpConstraints.mandatory = {
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: true
      };
      this.defaultAudio = false;
      this.defaultVideo = false;
      this.inputMessage = '';
      this.whiteboardContainer = document.getElementById('whiteboard-container');
      if ( this.platform.is('cordova') ) this.cordova = true;
      if ( this.listMessage[0] === void 0 ) {
        this.listMessage[0] = { messages: [] };
      }
  }

  joinRoom() {
      //First get the stored roomname
      this.vc.getRoomname().then( roomname => {
        console.log("vc.getRoomname()",roomname);
        //then join inside the room
        this.vc.joinRoom( roomname, (re)=> {
          console.log("I will join or create room:",re);
          this.roomTitle = re.room;
          let data :any = { room_name : re.room };
          data.command = "history";

          //get whiteboard history
          this.vc.whiteboard( data,() => { console.log("get whiteboard history")} );

          //let username = this.vc.getUsername();
          //console.log('username: ' + username);
          // user username instead of re.room
          this.connection.openOrJoin(re.room, (roomExist) => {
            if(roomExist) {
              console.log("I Join the Room");
            } else {
              console.log("I Open the Room");
            }
            this.connection.socket.on(this.connection.socketCustomEvent, message => {
              //alert(message);
              // this.connection.renegotiate( message );
            });
            let msg = this.connection.userid;
            console.log('msg: ', msg);
            this.connection.socket.emit(this.connection.socketCustomEvent, msg);
          });
        });
      });
  }

  /**
   * 
   * For Video and Audio function
   */
  // Adding video & audio settings
  showSettings() {
 
    /**
     * @todo Open camera first and change camera...
     */
    this.connection.DetectRTC.load(() => {
        this.connection.DetectRTC.MediaDevices.forEach((device) => {
      
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
                if( this.connection.mediaConstraints.audio.optional.length && this.connection.mediaConstraints.audio.optional[0].sourceId === device.id) {
                    console.log(device.id);
                }
            }
        });
        this.getDefaultAudio();
        this.getDefaultVideo();
    });
  }
  //Get default audio from storage
  getDefaultAudio(){
    this.vc.config('default-audio',(value)=>{
      this.selectedAudio = value;
    });
  }
  //Get default video from storage
  getDefaultVideo(){
    this.vc.config('default-video',(value)=>{
      this.selectedVideo = value;
    });
  }
  
  //Remove video stream
  removeVideoStream( data ) {
    let video = document.getElementById(data.streamId);
    console.log("remover video",video);
    if(!video) return;
    video.parentNode.removeChild(video);
  }
  
  /**
   * 
   * For Whiteboard Functionality
   */
  //clear canvas
  onClickClear() {
    this.events.publish( 'click-clear-canvas' );
  } 
  //For draw mode whiteboard
  drawMode() {
    this.optionDrawMode = "l";
  } 
  //For erase mode whiteboard
  eraseMode() {
    this.optionDrawMode = "e";
  }
  //Set Canvas Size
  setCanvasSize(h, w) {
     let mycanvas= document.getElementById('mycanvas');
     mycanvas.setAttribute('height', h);
     mycanvas.setAttribute('width', w);
  }

  /**
   * 
   * Ionic Function
   */
  
  //To show settings with action sheet
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
  removeStream() {
    //For disconnecting the user from room
    this.connection.getAllParticipants().forEach((p) =>{
      console.log("p");
      
      this.connection.disconnectWith(p); // optional but suggested
     
    });
    //Stop the streaming of video
    this.connection.attachStreams.forEach((stream) =>{
        stream.stop(); // optional
    });
  }
  //Leave the room and go back to lobby
  onClickLobby() {
    this.vc.setConfig('roomname', x.LobbyRoomName );
    location.reload();
    /*
    this.firstChangeVideo = false;
    this.firstChangeAudio = false;
    this.connection.isInitiator = false;
    this.vc.leaveRoom(()=> {
      this.unListenEvents(); // unsubscribe room events before joining to lobby
      this.navCtrl.setRoot( LobbyPage );
      this.connection.closeEntireSession(); // strongly recommended
    });
    */
  }
  //Add video when there's a new stream
  addUserVideo( event ) {
    let me: string = 'you';
    if ( this.connection.userid == event.userid ) me = 'me';
    let video = event.mediaElement;
    video.setAttribute('class', me);
    let videos= document.getElementById('video-container');
    if ( me == 'me' ) {
      videos.insertBefore(video, videos.firstChild);
      this.streamId = event.streamid;
      this.userId = event.userId;
    }
    else {
      videos.appendChild( video );
    }
  }

  //Change video device
  changeVideo( videoSourceId ) {
    this.vc.setConfig('default-video',videoSourceId);
    //Check if device is already selected
    if(this.connection.mediaConstraints.video.optional.length && this.connection.attachStreams.length) {
        if(this.connection.mediaConstraints.video.optional[0].sourceId === videoSourceId) {
            alert('Selected video device is already selected.');
            return;
        }
    }
    if(this.firstChangeVideo) {
      this.connection.attachStreams.forEach((stream) =>{
        stream.getVideoTracks().forEach((track) =>{
          stream.removeTrack(track);
          if(track.stop) {
              track.stop();
          }
        });
      });
     }
    else {
      this.firstChangeVideo = true;
    }
    
    this.connection.mediaConstraints.video.optional = [{
        sourceId: videoSourceId
    }];
    
    let video = document.getElementsByClassName('me')[0];
    if(video) {
      video.parentNode.removeChild( video );
      this.connection.captureUserMedia();
    }
  }
  //Change audio device
  changeAudio( audioSourceId ) {
    this.vc.setConfig('default-audio',audioSourceId);
     //Check if device is already selected
    if(this.connection.mediaConstraints.audio.optional.length && this.connection.attachStreams.length) {
        if(this.connection.mediaConstraints.audio.optional[0].sourceId === audioSourceId) {
            alert('Selected audio device is already selected.');
            return;
        }
    }

    if(this.firstChangeAudio) {
      this.connection.attachStreams.forEach((stream) =>{
        stream.getAudioTracks().forEach((track) =>{
          stream.removeTrack(track);
          if(track.stop) {
              track.stop();
          }
        });
      });
    }
    else {
      this.firstChangeAudio = true;
    }
    
    this.connection.mediaConstraints.audio.optional = [{
        sourceId: audioSourceId
    }];
    
    let video = document.getElementsByClassName('me')[0];
    if(video) {
      video.parentNode.removeChild( video )
      this.connection.captureUserMedia();
    }
    
  }
  //On sending a new message
  onSendMessage(message: string) {
    if(message != ""){
      this.vc.sendMessage(message, ()=> {
        this.inputMessage = '';             
      });
    }
  }
  //Change the canvas image after clicking the preview image inside document
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
  
  //Change document preview image
  onChangePhotoDisplay(url){
    this.urlPhoto = url;
  }
  //after file upload get the data to be posted
  onFileUploaded( url, ref ) {
      this.file_progress = false;
      this.urlPhoto = url;
      this.data.urlPhoto = url;
      this.data.refPhoto = ref;
      this.postPhoto();
  }
  //post the data in firebase
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
  /**
   * 
   * Ionic Life Cycle
   * 
   */
  //Called after first Ngonchanges
  ngOnInit() {
    this.setCanvasSize(this.defaultCanvasSize,this.defaultCanvasSize);
  }

  ionViewDidLoad() {
    console.log("RoomPage::ionViewDidLoad()");
      //subscribe to events
      this.listenEvents();
  }


  /**
   * 
   * Ionic Subscribe and Unsubscribe
   * 
   */
  
  //Subscribe events
  listenEvents() {
    console.log('listenEvents()');
    this.events.subscribe( 'join-room', re => {
      console.log("RoomPage::listenEvents() => someone joins the room: ", re );          
      let message = { name: re[0].name, message: ' joins into ' + re[0].room };
      this.addMessage( message );
    });    
    this.events.subscribe( 'chatMessage', re => {
      console.log("RoomPage::listenEvents() => One user receive message: ", re ); 
      let message = re[0];
      this.addMessage( message );         
    });
    this.events.subscribe( 'whiteboard', re => {
      let data = re[0];
      console.log("RoomPage::listenEvents() =>Whiteboard: ", data );
      if ( data.command == 'image' ) {
          this.changeCanvasPhoto(data.image);
      }
    });
    this.events.subscribe( 'room-cast', re => {
      let data = re[0];
      console.log("RoomPage::listenEvents() => Someone roomcast inside the room: ", data );
    });
    this.events.subscribe( 'disconnect', re => {
      console.log("RoomPage::listenEvents() => someone disconnect the room: ", re );
      let message = { name: re[0].name, message: ' disconnect into ' + re[0].room };
      this.addMessage( message );
      location.reload();
    });  
  }
  //Unsubscribe events
  unListenEvents() {
    console.log("unListenEvents()");
    this.events.unsubscribe('join-room', null );
    this.events.unsubscribe('chatMessage', null );
    this.events.unsubscribe('whiteboard', null );
    this.events.unsubscribe('room-cast', null );
    this.events.unsubscribe('disconnect', null );

  }
  /**
   * Event Functionality
   * 
   */
  //Add to listMessage to be displayed in the view  
  addMessage( message ) {
    this.listMessage[0].messages.push( message )
    setTimeout(()=>{ this.events.publish( 'scroll-to-bottom' ); }, 100);
  }
  //Change canvas image
  changeCanvasPhoto(image) {
    this.canvasPhoto = image;
  }
}