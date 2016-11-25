import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from 'ionic-native';
import { EntrancePage } from '../pages/entrance/entrance';
import { LobbyPage } from '../pages/lobby/lobby';
import { RoomPage } from '../pages/room/room';
import * as x from '../providers/videocenter';


@Component({
  template: `<ion-nav [root]="rootPage"></ion-nav>`
})
export class MyApp {
  rootPage;

  constructor(platform: Platform, private vc: x.Videocenter ) {
    vc.connect();
    vc.config('username', username => {
    /**
     * @desc Check if there's a username
     * and check if there is also a roomname
     */
      if ( username ) {
        this.vc.updateUsername( username, re => {
          vc.config('roomname', roomname => {
            console.log("App component my room:",roomname);
            if( roomname && roomname != x.LobbyRoomName ){
                this.rootPage =  RoomPage;   
            }
            else {             
                this.rootPage = LobbyPage;              
            }
          });
        });
      }
      else this.rootPage = EntrancePage;
    } );

    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
    });
  }
}
