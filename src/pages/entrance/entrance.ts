import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { LobbyPage } from '../lobby/lobby';
import { AlertController } from 'ionic-angular';
import * as x from '../../providers/videocenter';
@Component({
  selector: 'page-entrance',
  templateUrl: 'entrance.html'
})
export class EntrancePage {
  username: string;
  error: string;
  settings:boolean;
  oldvideo:any;
  selectedAudio:string;
  defaultAudio:boolean;
  selectedVideo:string;
  defaultVideo:boolean;
  audios = [];
  videos = [];
  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    private vc: x.Videocenter ) {
      this.settings = true;
  }
  
  onClickSignin() {
    if ( this.username ) {
      this.vc.updateUsername( this.username, re => {
        this.navCtrl.setRoot( LobbyPage );
      } );
    }
    else {
      // this.showErrorInputUsername();
      let alert = this.alertCtrl.create({
      title: 'Form Error!',
        subTitle: 'Your username input is empty!',
        buttons: ['OK']
      });
      alert.present();
    }
  }
  showErrorInputUsername() {
    this.error = "Username is empty";
  }
}
