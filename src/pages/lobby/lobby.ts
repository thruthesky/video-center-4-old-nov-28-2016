import { Component } from '@angular/core';
import { NavController, Events } from 'ionic-angular';
import * as x from '../../providers/videocenter';
import { RoomPage } from '../room/room';
import { AlertController } from 'ionic-angular';
import { EntrancePage } from '../entrance/entrance';

export interface ROOMS {
  ( room_id: string ) : {
    name: string;
    users: Array< x.USER >;
  }
}

export interface MESSAGELIST {
    messages: Array< x.MESSAGE >
}

@Component({
  selector: 'page-lobby',
  templateUrl: 'lobby.html',
})
export class LobbyPage {
  rooms: ROOMS = <ROOMS> {};
  title: string;
  inputMessage: string;
  listMessage: MESSAGELIST = <MESSAGELIST> {}; 
  constructor(
    public navCtrl: NavController,
    private vc: x.Videocenter,
    public alertCtrl: AlertController,
    private events: Events ) {
    this.inputMessage = '';
    if ( this.listMessage[0] === void 0 ) {
      this.listMessage[0] = { messages: [] };
    }
    vc.joinRoom( x.LobbyRoomName, re => { 
      vc.getUsername().then( username => this.title = username );
      console.log('LobbyPage::constructor() joinRoom callback:', re);
      
      vc.userList( '', re => {
        console.log('LobbyPage::constructor() vc.userList callback(): ', re);
        this.showRoomList( re );
      })
    });    
    this.listenEvents();  
  }
  onClickUpdateUsername() {
    this.getUsername( username => this.updateUsername( username ) );
  }
  onClickCreateRoom() {
    this.getRoomname( x => this.createRoom( x ) );
  }
  onClickJoinRoom( roomname ) {
    this.joinRoom( roomname );
  }

  onClickLogout() {
    this.vc.logout(()=> {
      this.navCtrl.setRoot( EntrancePage );
    });    
  }
  updateUsername( username: string ) {
    console.log(username);
    if ( username ) {
      this.vc.updateUsername( username, re => {
        this.title = re.name;
      } );
    }
    else {     
      let alert = this.alertCtrl.create({
      title: 'Form Error!',
        subTitle: 'Your username input is empty!',
        buttons: ['OK']
      });
      alert.present();
    }
  }
  onJoinRoom( roomname ) {
    if( roomname != x.LobbyRoomName ) {    
      this.vc.setConfig('roomname', roomname);
      this.joinRoom( roomname );
    }
    else {
      let alert = this.alertCtrl.create({
      title: 'Error!',
        subTitle: 'You cant join the Lobby!',
        buttons: ['OK']
      });
      alert.present();
    }
    
  }  
  onSendMessage(message: string) {
    if(message != ""){
      this.vc.sendMessage(message, ()=> {
        this.inputMessage = '';             
      });
         
    }
  }
  
  showRoomList( users: { (key: string) : Array<x.USER> } ) {
    console.log( 'LobbyPage::showRoomList() users: ', users );
    for ( let socket_id in users ) {
      let user: x.USER = users[socket_id];
      if(!user.room) continue;
      let room_id = <string> this.vc.md5( user.room );   
      if ( this.rooms[ room_id ] === void 0 ) this.rooms[ room_id ] = { name: user.room, users: [] };
      let usr = this.rooms[ room_id ].users; 
      for(let i in usr) { 
          if( usr[i].socket === user.socket) {
            this.rooms[ room_id ].users.splice(i, 1);
          }        
        }  
      this.rooms[ room_id ].users.push( user );    
    }
  }
  addUserList( re ) {  
    let user: x.USER = re[0];       
    let room_id = this.vc.md5( user.room );
    if ( this.rooms[ room_id ] === void 0 ) this.rooms[ room_id ] = { name: user.room, users: [] };      
    this.rooms[ room_id ].users.push( user );
  }
  updateUserOnUserList( re ) {  
    let user: x.USER = re[0];   
    let room_id = this.vc.md5( user.room );   
    if ( this.rooms[ room_id ] === void 0 ) this.rooms[ room_id ] = { name: user.room, users: [] };   
    let users = this.rooms[ room_id ].users;        
    for(let i in users) { 
      if( users[i].socket === user.socket) {
        this.rooms[ room_id ].users[i] = user;
        break;
      }          
    }    
  }
  
  removeUserList( re ) {  
    let user: x.USER = re[0];
    for ( let room_id in this.rooms ) {
      let users = this.rooms[ room_id ].users;      
      if ( users.length ) {
        for( let i in users ) {
          if ( users[i].socket == user.socket ) {
              users.splice( i, 1 );
          }
        }
      }
    }  
  }
  get roomIds () {
    return Object.keys( this.rooms );
  }    
  listenEvents() {
    this.events.subscribe( 'update-username', re => {
      console.log("LobbyPage::listenEvents() => One user updated his name: ", re );   
      this.updateUserOnUserList(re);
    });    
    this.events.subscribe( 'join-room', re => {
      console.log("LobbyPage::listenEvents() => someone joins the room: ", re );        
      this.removeUserList(re);// Remove User
      this.addUserList(re);// Add User
      this.joinMessage( re );       
        
    });
    this.events.subscribe( 'leave-room', room => {
      console.log("LobbyPage::listenEvents() => someone leaves the room: ", room );  
      let room_id = this.vc.md5( room[0] );    
      delete this.rooms[ room_id ];      
    });
    this.events.subscribe( 'log-out', re => {
      console.log("LobbyPage::listenEvents() => someone logout the room: ", re );
      this.removeUserList(re);    
    });
    this.events.subscribe( 'disconnect', re => {
      console.log("LobbyPage::listenEvents() => someone disconnect the room: ", re );
      this.removeUserList(re);
      this.disconnectMessage( re );     
    });
    
    this.events.subscribe( 'chatMessage', re => {
      console.log("LobbyPage::listenEvents() => One user receive message: ", re );
      let message = re[0];
      this.addMessage( message );             
    });
  }
  /**
   * Gets username from user keyboard input.
   */
  getUsername( callback ) {
    
    let prompt = this.alertCtrl.create({
      title: 'Update Username',
      message: "Enter a username to update your username",
      inputs: [
        {
          name: 'username',
          placeholder: 'Update Username'
        },
      ],
      buttons: [        
        {
          text: 'Cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Update',
          handler: data => {
            console.log('Update Username clicked');
            callback( data.username );
          }
        }        
      ]
    });
    prompt.present();
  }

  /**
   * Create a chat room
   */
  getRoomname( callback ) {
    let prompt = this.alertCtrl.create({
      title: 'Create Room',
      message: "Enter a roomname to create a new room",
      inputs: [
        {
          name: 'roomname',
          placeholder: 'Create Room'
        },
      ],
      buttons: [        
        {
          text: 'Cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Create',
          handler: data => {
            console.log('Create Room clicked',data);
            callback ( data.roomname );
          }
        }        
      ]
    });
    prompt.present();
  }
  joinMessage( re ){
    let message = { name: re[0].name, message: ' joins into ' + re[0].room };
    this.addMessage( message ); 
  }
  disconnectMessage( re ){
    if( re[0].room ){
      let message = { name: re[0].name, message: ' disconnect into ' + re[0].room };
      this.addMessage( message );
    } 
  }
   
  addMessage( message ) {     
    this.listMessage[0].messages.push( message );
    setTimeout(()=>{ this.events.publish( 'scroll-to-bottom' ); }, 100); 
  }
  joinRoom( roomname ) {  
    this.vc.joinRoom( roomname, re => {
      console.log( 'joinRoom(): ', re);
      this.navCtrl.setRoot( RoomPage );   
    } );
  }

  createRoom( roomname ) {
    this.vc.createRoom( roomname, (re) => {
      this.joinRoom( roomname );
    });
  }

}
