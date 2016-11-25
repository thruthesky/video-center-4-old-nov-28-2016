import { Component } from '@angular/core';
import * as x from '../../providers/videocenter';
import { Post } from '../../fireframe2/post';
import { Data } from '../../fireframe2/data';
import { Platform, NavController, NavParams, AlertController, ActionSheetController, Events } from 'ionic-angular';
/**
*@desc Interface use for listMessage Object 
*@prop messages
*@type Array< x.MESSAGE > 
*/
export interface MESSAGELIST {
    messages: Array< x.MESSAGE >
}
/**
*@desc Interface use for fileData Object 
*@prop key, namePhoto, urrlPhoto, refPhoto
*@type string, string, string, string
*/
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
/**
*@desc This class will hold functions for RoomPage
*/
export class RoomPage {
  roomTitle: string;
  inputMessage: string;
  listMessage: MESSAGELIST = <MESSAGELIST> {};
  settings:boolean = true;
  chatDisplay:boolean = true;
  documentDisplay:boolean = true;
  whiteboardContainer:any;
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
  fileData : PostEdit = <PostEdit> {};
  postKey: string;
  urlPhoto: string = "x-assets/1.png";
  position:number = 0;
  progress = null;
  file_progress = null;
  loader: boolean = false;
  cordova: boolean = false;
  posts = [];
  noMorePost: boolean = false;
  canvasPhoto: string = "x-assets/1.png";
  firstChangeVideo:boolean = false;
  firstChangeAudio:boolean = false;
  private connection = null;
  /**
  *@desc This constructor is the start after insantiating this class
  */
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
      this.connection.onstream = (event) => this.addUserVideo( event ); 
      setTimeout(()=>{ this.showSettings()},1000);
  }
  /**
  *@desc This method will initialize 
  *the some of the properties of RoomPage
  */
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
  /**
  *@desc This method will get roomname then join the roomname
  *it will also run getWhiteboardHistory and openOrJoinSession
  */
  joinRoom() {
    this.vc.getRoomname().then( roomname => {
      this.vc.joinRoom( roomname, (re)=> {
        this.roomTitle = re.room;
        this.getWhiteboardHistory( re.room )
        this.openOrJoinSession( re.room );
      });
    });
  }
  /**
  *@desc This method will get the whiteboard history of the room
  *@param roomName 
  */
  getWhiteboardHistory( roomName ) {
    let data :any = { room_name : roomName };
    data.command = "history";
    this.vc.whiteboard( data,() => { console.log("get whiteboard history")} );
  }
  /**
  *@desc This method will open or join a session to have a video conference
  *@param roomName
  */
  openOrJoinSession( roomName ) {
    this.connection.openOrJoin( roomName, (roomExist) => {
      if(roomExist)console.log("I Join the Room");
      else console.log("I Open the Room");
      this.connection.socket.on(this.connection.socketCustomEvent, message => { } );
      let msg = this.connection.userid;
      this.connection.socket.emit(this.connection.socketCustomEvent, msg);
    });
  }
  /**
  *@desc This method will add device for video select and audio select
  */
  showSettings() {
    this.connection.DetectRTC.load(() => {
      this.connection.DetectRTC.MediaDevices.forEach((device) => {
        this.addVideoOption( device );
        this.addAudioOption( device );
      });
      this.getDefaultAudio();
      this.getDefaultVideo();
    });
  }
  /**
  *@desc This method will add video options on video select
  *@param device 
  */
  addVideoOption( device ) {
    if(device.kind.indexOf('video') !== -1) {
      let video = {
        text: device.label || device.id,
        value: device.id
      };
      this.videos.push( video );
      if(!this.defaultVideo) {
        this.defaultVideo = true;
        this.vc.setConfig('default-video',video.value);
      }
    }
  }
  /**
  *@desc This method will add audio options on audio select
  *@param device
  */
  addAudioOption ( device ) {
    if(device.kind === 'audioinput') {
      let audio = {
          text: device.label || device.id,
          value: device.id
        };
      this.audios.push( audio );
      if(!this.defaultAudio) {
        this.defaultAudio = true;
        this.vc.setConfig('default-audio',audio.value);
      }
    }
  }
  /**
  *@desc This method will get the selected audio from storage
  */
  getDefaultAudio(){
    this.vc.config('default-audio',(value)=>{
      this.selectedAudio = value;
    });
  }
  /**
  *@desc This method will get the selected video from storage
  */
  getDefaultVideo(){
    this.vc.config('default-video',(value)=>{
      this.selectedVideo = value;
    });
  }
  /**
   * @desc Group for Whiteboard Functionality
   */

  /**
   *@desc This method clear the canvas
   */
  onClickClear() {
    this.events.publish( 'click-clear-canvas' );
  } 
  /**
   *@desc This method will change the optionDrawMode to l - line
   */
  drawMode() {
    this.optionDrawMode = "l";
  } 
  /**
   *@desc This method will change the optionDrawMode to e - erase
   */
  eraseMode() {
    this.optionDrawMode = "e";
  }
  /**
   *@desc This method will set the canvas size
   *@param height
   *@param width
   */
  setCanvasSize( height, width ) {
     let mycanvas= document.getElementById('mycanvas');
     mycanvas.setAttribute('height', height);
     mycanvas.setAttribute('width', width);
  }

  /**
   *@desc Group of Ionic Methods
   */
  
  /**
   *@desc This method will show Miscellaneous with actionsheet
   */
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
  
  /**
   *@desc This method will Leave the room and go back to lobby
   */
  onClickLobby() {
    let random = this.vc.getRandomInt(0,500);
    setTimeout( ()=> { this.vc.setConfig('roomname', x.LobbyRoomName ); }, random);
    location.reload();
  }
  /**
   *@desc This method will add video when there's a new stream
   */
  addUserVideo( event ) {
    let me: string = 'you';
    let video = event.mediaElement;
    let videos= document.getElementById('video-container');
    if ( this.connection.userid == event.userid ) me = 'me';
    video.setAttribute('class', me);
    if ( me == 'me' ) videos.insertBefore(video, videos.firstChild);
    else videos.appendChild( video );
  }

  /**
  *@desc This method will change video device
  *@param videoSourceId
  */
  changeVideo( videoSourceId ) {
    this.vc.setConfig('default-video',videoSourceId);
    if(this.videoSelectedAlready( videoSourceId )) return;
    this.removeVideoTrackAndStream();
    this.connection.mediaConstraints.video.optional = [{
        sourceId: videoSourceId
    }];
    let video = document.getElementsByClassName('me')[0];
    if(video) {
      video.parentNode.removeChild( video );
      this.connection.captureUserMedia();
    }
  }
  /**
  *@desc This method will check if video is already selected
  *@param videoSourceId
  *@return result 
  */
  videoSelectedAlready( videoSourceId ) {
    let result = 0;
    if(this.connection.mediaConstraints.video.optional.length && this.connection.attachStreams.length) {
      if(this.connection.mediaConstraints.video.optional[0].sourceId === videoSourceId) {
          alert('Selected video device is already selected.');
          result = 1;
      }
    }
    return result;
  }
  /**
  *@desc This method will remove the track and stream of video
  */
  removeVideoTrackAndStream() {
    if(this.firstChangeVideo) {
      this.connection.attachStreams.forEach((stream) =>{
        stream.getVideoTracks().forEach((track) =>{
          stream.removeTrack(track);
          if(track.stop)track.stop();
        });
      });
     }
    else {
      this.firstChangeVideo = true;
    }
  }
  /**
  *@desc This method will change audio device
  *@param audioSourceId
  */
  changeAudio( audioSourceId ) {
    this.vc.setConfig('default-audio',audioSourceId);
    if(this.audioSelectedAlready( audioSourceId )) return;
    this.removeAudioTrackAndStream();
    
    this.connection.mediaConstraints.audio.optional = [{
        sourceId: audioSourceId
    }];
    
    let video = document.getElementsByClassName('me')[0];
    if(video) {
      video.parentNode.removeChild( video )
      this.connection.captureUserMedia();
    }
    
  }
  /**
  *@desc This method will check if audio is already selected
  *@param audioSourceId
  *@return result 
  */
  audioSelectedAlready( audioSourceId ) {
    let result = 0;
    if(this.connection.mediaConstraints.audio.optional.length && this.connection.attachStreams.length) {
      if(this.connection.mediaConstraints.audio.optional[0].sourceId === audioSourceId) {
          alert('Selected audio device is already selected.');
          result = 1;
      }
    }
    return result;
  }
  /**
  *@desc This method will remove the track and stream of audio
  */
  removeAudioTrackAndStream() {
    if(this.firstChangeAudio) {
      this.connection.attachStreams.forEach((stream) =>{
        stream.getAudioTracks().forEach((track) =>{
          stream.removeTrack(track);
          if(track.stop)track.stop();
        });
      });
    }
    else {
      this.firstChangeAudio = true;
    }
  }
  /**
  *@desc This method will send the new message 
  *to the server
  *@param message
  */
  onSendMessage(message: string) {
    if(message != ""){
      this.vc.sendMessage(message, ()=> {
        this.inputMessage = '';             
      });
    }
  }
  /**
   *@desc This method will Change the canvas image after clicking the preview image inside document
   */
  onClickPhoto() {
    this.vc.getRoomname().then( roomname => {
      let data :any = { room_name : roomname };
      data.command = "image";
      data.image = this.urlPhoto;
      this.vc.whiteboard( data,() => { this.changeCanvasPhoto(this.urlPhoto); } );
    });
  }
  /**
   *@desc This method will File Upload
   */
  onChangeFile(event) {
      let file = event.target.files[0];
      if ( file === void 0 ) return;
      this.file_progress = true;
      let ref = 'videocenter/' +  file.name;
      this.fileData.namePhoto = file.name;
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
  /**
   *@desc This method will Change document preview image
   */
  onChangePhotoDisplay(url){
    this.urlPhoto = url;
  }
  /**
   *@desc This method will set the data to post
   */
  onFileUploaded( url, ref ) {
      this.file_progress = false;
      this.urlPhoto = url;
      this.fileData.urlPhoto = url;
      this.fileData.refPhoto = ref;
      this.postPhoto();
  }
  /**
   *@desc This method will post the file data to firebase
   */
  postPhoto() {
    this.loader = true;
    this.post
    .sets( this.fileData )
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
   *@desc Ionic Life Cycle
   */
  ngOnInit() {
    this.setCanvasSize('340px', '340px');
  }

  ionViewDidLoad() {
    console.log("RoomPage::ionViewDidLoad()");
      this.listenEvents();
  }


  /**
   *@desc Ionic Subscribe and Unsubscribe
   */
  
  /**
   *@desc This method subscribes to events
   */
  listenEvents() {
    console.log('listenEvents()');
    this.listenEventJoinRoom();
    this.listenEventChatMessage();
    this.listenEventWhiteboard();
    this.listenEventRoomCast();
    this.listenEventDisconnect(); 
  }
  /**
   * @desc Group of event method
   */

  /**
   * @desc event listener for Join Room
   */
  listenEventJoinRoom() {
    this.events.subscribe( 'join-room', re => {
      console.log("RoomPage::listenEvents() => someone joins the room: ", re );          
      let message = { name: re[0].name, message: ' joins into ' + re[0].room };
      this.addMessage( message );
    });  
  }
  /**
   * @desc event listener for Chat Message
   */
  listenEventChatMessage() {
    this.events.subscribe( 'chatMessage', re => {
      console.log("RoomPage::listenEvents() => One user receive message: ", re ); 
      let message = re[0];
      this.addMessage( message );         
    });
  }
  /**
   * @desc event listener for Whiteboard
   */
  listenEventWhiteboard() {
    this.events.subscribe( 'whiteboard', re => {
      let data = re[0];
      console.log("RoomPage::listenEvents() =>Whiteboard: ", data );
      if ( data.command == 'image' ) {
          this.changeCanvasPhoto(data.image);
      }
    });
  }
  /**
   * @desc event listener for RoomCast
   */
  listenEventRoomCast() {
    this.events.subscribe( 'room-cast', re => {
      let data = re[0];
      console.log("RoomPage::listenEvents() => Someone roomcast inside the room: ", data );
    });
  }
  /**
   * @desc event listener for disconnect
   */
  listenEventDisconnect() {
    this.events.subscribe( 'disconnect', re => {
      console.log("RoomPage::listenEvents() => someone disconnect the room: ", re );
      let message = { name: re[0].name, message: ' disconnect into ' + re[0].room };
      this.addMessage( message );
      location.reload();
    }); 
  }
  /**
   *@desc This method unsubscribes to events
   */
  unListenEvents() {
    console.log("unListenEvents()");
    this.events.unsubscribe('join-room', null );
    this.events.unsubscribe('chatMessage', null );
    this.events.unsubscribe('whiteboard', null );
    this.events.unsubscribe('room-cast', null );
    this.events.unsubscribe('disconnect', null );

  }
  /**
   *@desc Event Functionality
   */
  
  /**
   *@desc Add to listMessage to be displayed in the view 
   */
  addMessage( message ) {
    this.listMessage[0].messages.push( message )
    setTimeout(()=>{ this.events.publish( 'scroll-to-bottom' ); }, 100);
  }

  /**
   *@desc //Change canvas image
   */
  changeCanvasPhoto(image) {
    this.canvasPhoto = image;
  }
}