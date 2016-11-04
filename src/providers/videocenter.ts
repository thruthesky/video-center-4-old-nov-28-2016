/// <reference path="../d.ts/rmc3.d.ts" />
import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { Md5 } from 'ts-md5/dist/md5';
import { Events } from 'ionic-angular';

export const LobbyRoomName: string = 'Lobby';
export interface USER {
    name: string;
    room: string;
    socket: string
    type: string;
}
export interface MESSAGE {
    message: string;
    name: string;
    room: string;
}
export interface Mouse {
    click: boolean;
    move: boolean;
    pos: { x:number | string, y:number | string };
    pos_prev: { x: number | string, y: number | string };
}
export let mouse: Mouse = {
        click: false,
        move: false,
        pos: { x:0, y: 0},
        pos_prev: { x: 0, y: 0 }
}

import { Storage } from '@ionic/storage';
@Injectable()
export class Videocenter {
    // socketUrl: string = "http://localhost:9001/";
    socketUrl: string = "http://dev.withcenter.com:9001/";
    static socket:any = false;
    static connection;
  constructor(
    private storage: Storage,
    private events: Events
   ) {
    console.log('Hello Videocenter Provider');
  }
  get socket() {
    return this.getSocket();
  }
  /**
   * Connects to the server.
   */
  connnect() {
      console.log("Videocenter::connect()");
    Videocenter.connection = new RTCMultiConnection();
    Videocenter.connection.socketURL = this.socketUrl;
    this.listen();
  }
  /**
   * Gets the socket.
   */
  getSocket() {
        if ( Videocenter.socket === false ) {
            Videocenter.socket = Videocenter.connection.getSocket();
        }
        return Videocenter.socket;
  }
  listen() {
    let socket = this.socket;
    //console.log("Videocenter::listen()", socket);
    socket.on('update-username', re => {
      this.events.publish( 'update-username', re );
    });
    socket.on('join-room', re => {
      console.log("socket.on('join-room') : ", re);
      this.events.publish( 'join-room', re );
    });
    socket.on('leave-room', re => {
      console.log("socket.on('leave-room') : ", re);
      this.events.publish( 'leave-room', re );
    });
    socket.on('chatMessage', re => {
      this.events.publish( 'chatMessage', re );
    });
    socket.on('whiteboard', re => {
      this.events.publish( 'whiteboard', re );
    });
    socket.on('log-out', re => {
      this.events.publish( 'log-out', re );
    });
    socket.on('disconnect', re => {
      this.events.publish( 'disconnect', re );
    });
  }
  /**
   * Returns Promise for roomname.
   */
  get roomname() {
    return this.storage.get('roomname');
  }
  /**
   * Returns Promise for username
   * @code
   *    vc.username.then( x => this.username = x );
   * @endcode
   */
  get username() {
    return this.storage.get('username');
  }
  getUsername() {
    return this.username;
  }
  getRoomname() {
    return this.roomname;
  }
  /**
   * 
   * 
   */
  emit( protocol: string, data?: any, callback?: boolean | any ) {
    
    
    // @todo clearify why we need if....
    if ( callback ) this.socket.emit( protocol, data, callback );
    else this.socket.emit( protocol, data );
  }
  
  
  setConfig( key:string, value:string ) {
    this.storage.set( key, value );
  }
  config( key: string, callback ) {
    this.storage .get( key )
      .then( re => callback( re ) );  
  }
  
  
  // ------------------ Server Communication --------------------
  
  /**
   * Update username
   */
  updateUsername( username: string, callback: (user:USER) => void ) {
    this.emit( 'update-username', username, ( user: USER ) => {
      this.setConfig('username', username );
      callback( user );
    } );
  }
  createRoom( roomname: string, callback) {
    this.emit( 'create-room', roomname, re => {
      this.setConfig('roomname', roomname);
      callback( re );
    });
  }

  /**
   * Joins into a room and remember its name.
   * @use this.roomname.then( roomanme => ... ) to get room name
   */
  joinRoom( roomname: string, callback ) {
    this.emit('join-room', roomname, re => {
      this.setConfig('roomname', roomname);
      callback( re );
    });
  }
  leaveRoom( callback ) {
    this.emit('leave-room', callback );
  }
  logout( callback ) {
    this.setConfig('username', '');
    this.emit('log-out', callback );
  }
  userList( roomname: string, callback : any ) : void {
    this.emit('user-list', roomname, callback);
  }    
  sendMessage( inputMessage: string, callback : any ) : void {
    this.emit('chat-message', inputMessage, callback);
  }
  // WhiteBoard
  whiteboard( data, callback : any ) : void {
    this.emit('whiteboard', data, callback);
  }
    /**
     * @edited give proper signature. 2016-09-02 JaeHo Song.
     */
    /*
    updateUsername( username: string, callback: (user:de.User) => void ) {
        Server.emit( 'update-username', username, (user: de.User) => {
            callback( user );
        } );
    }
    */
    
    
    md5( str: string ) : string {
      let md = new Md5();
      md.appendStr( str );
      return <string> md.end();
    }
}