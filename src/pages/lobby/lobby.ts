import { Component } from '@angular/core';
import { NavController, Events } from 'ionic-angular';
import * as x from '../../providers/videocenter';
import { RoomPage } from '../room/room';
import { AlertController } from 'ionic-angular';
import { EntrancePage } from '../entrance/entrance';
/**
*@desc Interface use for rooms Object
*@prop room_id, name, users
*@type string, object, string, Array< x.USER > 
*/
export interface ROOMS {
  ( room_id: string ) : {
    name: string;
    users: Array< x.USER >;
  }
}
/**
*@desc Interface use for listMessage Object
*@prop messages
*@type Array< x.MESSAGE > 
*/
export interface MESSAGELIST {
    messages: Array< x.MESSAGE >
}

@Component({
  selector: 'page-lobby',
  templateUrl: 'lobby.html',
})
/**
*---------------------------------------------------
*@desc This class will hold functions for LobbyPage
*@prop rooms, title, inputMessage, listMessage
*---------------------------------------------------
*/
export class LobbyPage {
  rooms: ROOMS = <ROOMS> {};
  title: string;
  inputMessage: string;
  listMessage: MESSAGELIST = <MESSAGELIST> {};
  constructor(
    public alertCtrl: AlertController,
    public navCtrl: NavController,
    private events: Events,
    private vc: x.Videocenter) {
    this.inputMessage = '';
    if ( this.listMessage[0] === void 0 ) this.listMessage[0] = { messages: [] };
    this.joinLobby();
    this.listenEvents();
  }
  /**
  *@desc This method will join the lobby
  */
  joinLobby() {
    this.vc.joinRoom( x.LobbyRoomName, re => {
      this.vc.getUsername().then( username => this.title = username );
      this.getUserList();
    });
  }
  /**
  *@desc This method will get all the room list and user list
  *and pass it to showRoomList
  */
  getUserList() {
      this.vc.userList( '', re => {
      try {
        this.showRoomList( re );
      }
      catch ( e ) {
        alert('user list error');
      }
    });
  }
  /**
  *@desc This method first run the getUsername then it will pass it
  *to updateUsername method
  */
  onClickUpdateUsername() {
    this.getUsername( username => this.updateUsername( username ) );
  }
  /**
  *@desc This method first run the getRoomname then it will pass it
  *to createRoom method
  */
  onClickCreateRoom() {
    this.getRoomname( x => this.createRoom( x ) );
  }
  /**
  *@desc This method will pass the roomname to joinRoom method
  *param roomname
  */
  onClickJoinRoom( roomname ) {
    this.joinRoom( roomname );
  }
  /**
  *@desc This method will set the root to entrance page 
  *after you logout on the server
  */
  onClickLogout() {
    this.vc.logout(()=> {
      this.navCtrl.setRoot( EntrancePage );
    });    
  }
  /**
  *@desc This method is the callback of getUsername to successfully update
  *the username if the user input is not empty
  *@param username 
  */
  updateUsername( username: string ) {
    if ( username ) {
      this.vc.updateUsername( username, re => { this.title = re.name;} );
    }
    else {     
      let alert = this.alertCtrl.create({ title: 'Form Error!',
      subTitle: 'Your username input is empty!', buttons: ['OK'] });
      alert.present();
    }
  }
  /**
  *@desc This method is is use to successfully
  * create a room if the user input is not empty
  *@param roomname 
  */
  onJoinRoom( roomname ) {
    if( roomname != x.LobbyRoomName ) {    
      this.vc.setConfig('roomname', roomname);
      this.joinRoom( roomname );
    }
    else {
      let alert = this.alertCtrl.create({ title: 'Error!',
      subTitle: 'You can\'t join the Lobby!', buttons: ['OK'] });
      alert.present();
    }
  }
  /**
  *@desc This method will send the message to the server
  *after that it will empty the message input box
  *@param message 
  */  
  onSendMessage(message: string) {
    if(message != "") this.vc.sendMessage(message, ()=> { 
      this.inputMessage = ''; 
    });
  }
  /**
  *@desc This method will loop through all the users and
  *and display it
  *@param re
  */
  showRoomList( users: { (key: string) : Array<x.USER> } ) {
    for ( let socket_id in users ) {
      let user: x.USER = users[socket_id];
      if(!user.room) continue;
      let room_id = <string> this.vc.md5( user.room );   
      if ( this.rooms[ room_id ] === void 0 ) this.initRoomOnRoomList( user );
      let myuser = this.rooms[ room_id ].users; 
      this.userSpliceList(user, myuser );  
      this.rooms[ room_id ].users.push( user );    
    }
  }
  /**
  *@desc This method will add user in roomlist
  *@param re
  */
  addUserList( re ) {
    let user: x.USER = re[0];       
    let room_id = this.vc.md5( user.room );
    if ( this.rooms[ room_id ] === void 0 ) this.initRoomOnRoomList( user );      
    this.rooms[ room_id ].users.push( user );
  }
  /**
  *@desc This method will find a match on the given paramter 
  *and update it
  *@param re
  */
  updateUserOnUserList( re ) {  
    let user: x.USER = re[0];   
    let room_id = this.vc.md5( user.room );   
    if ( this.rooms[ room_id ] === void 0 ) this.initRoomOnRoomList( user );
    let users = this.rooms[ room_id ].users;        
    for(let i in users) { 
      if( users[i].socket === user.socket) {
        this.rooms[ room_id ].users[i] = user;
        break;
      }          
    }    
  }
  /**
  *@desc This method will initialize rooms
  *if it's not yet initialized
  *@param user
  */
  initRoomOnRoomList( user ) {
    let room_id = this.vc.md5( user.room );   
    this.rooms[ room_id ] = { name: user.room, users: [] };   
  }
  /**
  *@desc This method will run the userSpliceList
  *@param re
  */
  removeUserList( re ) {  
    let user: x.USER = re[0];
    for ( let room_id in this.rooms ) {
      let users = this.rooms[ room_id ].users;      
      this.userSpliceList(user, users );
    }  
  }
  /**
  *@desc This method will find a match on the given paramter 
  *and splice it
  *@param user, users
  */
  userSpliceList( user, users ) {
    if ( users.length ) {
      for( let i in users ) {
        if ( users[i].socket == user.socket ) {
            users.splice( i, 1 );
        }
      }
    }
  }
  /**
  *@desc This method is use in the view to list all the roomids
  *@example *ngFor = " let id of roomIds "
  */
  get roomIds () {
    return Object.keys( this.rooms );
  }    
  
  /**
  *@desc This method will get the username input by using AlertController
  *and will pass it to updateUsername method 
  *@param callback
  */
  getUsername( callback ) {
    
    let prompt = this.alertCtrl.create({title: 'Update Username',
      message: "Enter a username to update your username",
      inputs: [{ name: 'username', placeholder: 'Update Username'},],
      buttons: [{text: 'Cancel', handler: data => {}},
      {text: 'Update', handler: data => { callback( data.username );
    }}]});
    prompt.present();
  }

  /**
  *@desc This method will get the roomname input by using AlertController
  *and will pass it to createRoom method 
  *@param callback
  */
  getRoomname( callback ) {
    let prompt = this.alertCtrl.create({title: 'Create Room',
      message: "Enter a roomname to create a new room",
      inputs: [{ name: 'roomname', placeholder: 'Create Room' },],
      buttons: [{ text: 'Cancel', handler: data => { }},
      { text: 'Create', handler: data => { callback ( data.roomname ); 
    }}]});
    prompt.present();
  }
  /**
   *@desc This method will create a join message variable that
   *will be pass in addMessage
   *@param data 
   */  
  joinMessage( data ){
    let message = { name: data[0].name, message: ' joins into ' + data[0].room };
    this.addMessage( message ); 
  }
  /**
   *@desc This method will create a disconnect message variable that
   *will be pass in addMessage
   *@param data 
   */ 
  disconnectMessage( data ){
    if( data[0].room ){
      let message = { name: data[0].name, message: ' disconnect into ' + data[0].room };
      this.addMessage( message );
    } 
  }
  /**
   *@desc Add to listMessage to be displayed in the view
   *@param message 
   */  
  addMessage( message ) {     
    this.listMessage[0].messages.push( message );
    setTimeout(()=>{ this.events.publish( 'scroll-to-bottom' ); }, 100); 
  }
  joinRoom( roomname ) {  
    this.vc.setConfig('roomname', roomname)
    .then( () => {
      this.unListenEvents(); 
      this.navCtrl.setRoot( RoomPage );  
    });
  }
  /**
  *@desc This method will createroom in the server then 
  *invoke the joinRoom callback
  *@param roomname
  */
  createRoom( roomname ) {
    this.vc.createRoom( roomname, ( room ) => {
      this.joinRoom( room );
    });
  }
  /**
  *-------------------------------------
  *@desc Ionic Subscribe and Unsubscribe
  *-------------------------------------
  */
  
  /**
   *@desc This method subscribes to events
   */
  listenEvents() {
    console.log("listenEvents");
    this.listenEventUpdateUsername(); 
    this.listenEventJoinRoom(); 
    this.listenEventLeaveRoom(); 
    this.listenEventChatMessage(); 
    this.listenEventLogout(); 
    this.listenEventDisconnect(); 
  }
  /**
   * @desc event listener for UpdateUsername
   */
  listenEventUpdateUsername() {
    this.events.subscribe( 'update-username', re => {
      this.updateUserOnUserList(re);
    }); 
  }
  /**
   * @desc event listener for JoinRoom
   */
  listenEventJoinRoom() {
    this.events.subscribe( 'join-room', re => {
      this.removeUserList(re);
      this.addUserList(re);
      this.joinMessage( re );       
    });
  }
  /**
   * @desc event listener for LeaveRoom
   */
  listenEventLeaveRoom() {
    this.events.subscribe( 'leave-room', room => {
      let room_id = this.vc.md5( room[0] );    
      delete this.rooms[ room_id ];      
    });
  }
  /**
   * @desc event listener for ChatMessage
   */
  listenEventChatMessage() {
    this.events.subscribe( 'chatMessage', re => {
      let message = re[0];
      this.addMessage( message );             
    });
  }
  /**
   * @desc event listener for logout
   */
  listenEventLogout() {
    this.events.subscribe( 'log-out', re => {
      this.removeUserList(re);    
    });
  }
  /**
   * @desc event listener for disconnect
   */
  listenEventDisconnect() {
    this.events.subscribe( 'disconnect', re => {
      this.removeUserList(re);
      this.disconnectMessage( re );     
    });
  }
  /**
   *@desc This method unsubscribes to events
   */
  unListenEvents() {
    console.log("unListenEvents()");
    this.events.unsubscribe('update-username', null );
    this.events.unsubscribe('join-room', null );
    this.events.unsubscribe('leave-room', null );
    this.events.unsubscribe('log-out', null );
    this.events.unsubscribe('disconnect', null );
    this.events.unsubscribe('chatMessage', null );
  }
}