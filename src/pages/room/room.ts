import { Component } from '@angular/core';
import * as x from '../../providers/videocenter';
import { LobbyPage } from '../lobby/lobby';
import { Post } from '../../fireframe2/post';
import { Data } from '../../fireframe2/data';
import * as _ from 'lodash';
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
      let connection = x.Videocenter.connection;
      connection.sdpConstraints.mandatory = {
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: true
      };
      this.whiteboardContainer = document.getElementById('whiteboard-container');
      if ( platform.is('cordova') ) this.cordova = true;
      this.postKey = navParams.get('postKey');
      this.defaultAudio = false;
      this.defaultVideo = false;
      this.inputMessage = '';
      if ( this.listMessage[0] === void 0 ) {
        this.listMessage[0] = { messages: [] };
      }
      //First get the stored roomname
      vc.getRoomname().then( roomname => {
        console.log("vc.getRoomname()",roomname);
        //then join inside the room
        this.vc.joinRoom( roomname, (re)=> {
          console.log("I will join or create room:",re);
          this.roomTitle = re.room;
          let data :any = { room_name : re.room };
          data.command = "history";
          //get whiteboard history
          this.vc.whiteboard( data,() => { console.log("get whiteboard history")} );
          //Check if room exist in video session
          console.log("Check if room %s exist",re.room);
          connection.checkPresence(re.room, (isRoomEists, roomid) => {
              //Join if room exist
              if(isRoomEists) {
                  console.log("I Join a room");
                  connection.join(roomid);
              }
              //Create a new room
              else {
                console.log("I Open a room");
                  connection.open(roomid);
              }
          });
        });
      });
     
      // load the files
      this.loadPosts();
  
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
      // A new user's video stream arrives
      connection.onstream = (event) => this.addUserVideo( event );
      setTimeout(()=>{ this.showSettings()},1000);
  }


  /**
   * 
   * For Video and Audio function
   */
  // Adding video & audio settings
  showSettings() {
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
    let connection = x.Videocenter.connection;
    //For disconnecting the user from room
    connection.getAllParticipants().forEach((p) =>{
      console.log("p");
      
      connection.disconnectWith(p); // optional but suggested
     
    });
    //Stop the streaming of video
    connection.attachStreams.forEach((stream) =>{
        stream.stop(); // optional
    });
  }
  //Leave the room and go back to lobby
  onClickLobby() {
    let connection = x.Videocenter.connection;
    this.firstChangeVideo = false;
    this.firstChangeAudio = false;
    connection.isInitiator = false;
    this.vc.leaveRoom(()=> {
      this.unListenEvents(); // unsubscribe room events before joining to lobby
      this.navCtrl.setRoot( LobbyPage );
      connection.closeEntireSession(); // strongly recommended
    });
  }
  //Add video when there's a new stream
  addUserVideo( event ) {
    let connection = x.Videocenter.connection;
    let me: string = 'you';
    if ( connection.userid == event.userid ) me = 'me';
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
    let connection = x.Videocenter.connection;
    this.vc.setConfig('default-video',videoSourceId);
    //Check if device is already selected
    if(connection.mediaConstraints.video.optional.length && connection.attachStreams.length) {
        if(connection.mediaConstraints.video.optional[0].sourceId === videoSourceId) {
            alert('Selected video device is already selected.');
            return;
        }
    }
    if(this.firstChangeVideo) {
      connection.attachStreams.forEach((stream) =>{
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
    
    connection.mediaConstraints.video.optional = [{
        sourceId: videoSourceId
    }];
    
    let video = document.getElementsByClassName('me')[0];
    if(video) {
      video.parentNode.removeChild( video );
      connection.captureUserMedia();
    }
  }
  //Change audio device
  changeAudio( audioSourceId ) {
    let connection = x.Videocenter.connection;
    this.vc.setConfig('default-audio',audioSourceId);
     //Check if device is already selected
    if(connection.mediaConstraints.audio.optional.length && connection.attachStreams.length) {
        if(connection.mediaConstraints.audio.optional[0].sourceId === audioSourceId) {
            alert('Selected audio device is already selected.');
            return;
        }
    }

    if(this.firstChangeAudio) {
      connection.attachStreams.forEach((stream) =>{
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
    
    connection.mediaConstraints.audio.optional = [{
        sourceId: audioSourceId
    }];
    
    let video = document.getElementsByClassName('me')[0];
    if(video) {
      video.parentNode.removeChild( video )
      connection.captureUserMedia();
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
  //get list of uploaded files in firebase
  loadPosts( infinite? ) {
    this.post
      .gets( data => {
        if ( ! _.isEmpty(data) ) this.displayPosts( data );
      },
      e => {
        console.log("fetch failed: ", e);
      });
  }
  //Put it inside posts to use in view
  displayPosts( data ) {
      for( let key of Object.keys(data).reverse() ) {
        this.posts.push ( {key: key, value: data[key]} );
      }
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
      let connection = x.Videocenter.connection;
      connection.renegotiate();
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