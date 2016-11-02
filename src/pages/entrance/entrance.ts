import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { LobbyPage } from '../lobby/lobby';
import { AlertController } from 'ionic-angular';
import { Videocenter } from '../../providers/videocenter';
@Component({
  selector: 'page-entrance',
  templateUrl: 'entrance.html'
})
export class EntrancePage {
  username: string;
  error: string;
  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    private vc: Videocenter ) {
      //
  }
  ionViewDidLoad() {
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
