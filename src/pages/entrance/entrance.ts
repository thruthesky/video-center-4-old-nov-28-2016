import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { LobbyPage } from '../lobby/lobby';
import { AlertController } from 'ionic-angular';
import * as x from '../../providers/videocenter';
@Component({
  selector: 'page-entrance',
  templateUrl: 'entrance.html'
})
/**
*-----------------------------------------------------
*@desc This class will hold functions for EntrancePage
*@method onClickSignin()
*-----------------------------------------------------
*/
export class EntrancePage {
  username: string; 
  error: string;
  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    private vc: x.Videocenter ) {
  }
  /**
  *@desc This function will check if the username is valid
  *and if it's valid it will go to LobbyPage
  */
  onClickSignin() {
    if ( this.username ) {
      this.vc.updateUsername( this.username, re => {
        this.navCtrl.setRoot( LobbyPage );
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
}
