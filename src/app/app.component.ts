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
    vc.connnect();
    vc.config('username', username => {
      if ( username ) {
        this.vc.updateUsername( username, re => {
          vc.config('roomname', roomname => {
            if( roomname && roomname != x.LobbyRoomName ){
              this.vc.joinRoom( roomname, re => {               
                this.rootPage =  RoomPage;   
              } );
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
