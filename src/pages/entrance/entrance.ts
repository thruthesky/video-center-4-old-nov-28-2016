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
      let connection = x.Videocenter.connection;
      //////////////////////
      // For Testing purpose only delete later
      connection.openOrJoin( "Testing" );
      //////////////////////
      
      connection.onstream = (event) => {
        let video = event.mediaElement;
        let videos= document.getElementById('video-container');
        videos.appendChild( video );
        this.oldvideo = video;
        };
      setTimeout(()=>{this.settings = true; this.showSettings()},600);
  }
  showSettings() {
    let connection = x.Videocenter.connection;
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
  getDefaultAudio(){
    this.vc.config('default-audio',(value)=>{
      console.log("Default-audio",value);
      this.selectedAudio = value;
      this.changeAudio(value);
    });
  }
  getDefaultVideo(){
    this.vc.config('default-video',(value)=>{
      this.selectedVideo = value;
      this.changeVideo(value);
    });
  }
  changeVideo( videoSourceId ) {
    let connection = x.Videocenter.connection;
    this.vc.setConfig('default-video',videoSourceId);
    
    if(connection.mediaConstraints.video.optional.length && connection.attachStreams.length) {
        if(connection.mediaConstraints.video.optional[0].sourceId === videoSourceId) {
            // alert('Selected video device is already selected.');
            console.log('Selected video device is already selected.');
            return;
        }
    }
    connection.attachStreams.forEach(function(stream) {
        stream.getVideoTracks().forEach(function(track) {
            stream.removeTrack(track);
            if(track.stop) {
                track.stop();
            }
        });
    });
    connection.mediaConstraints.video.optional = [{
        sourceId: videoSourceId
    }];
    
    let videos= document.getElementById('video-container');
    if(this.oldvideo){
      videos.removeChild( this.oldvideo );
      connection.captureUserMedia();
    }  
  }
  
  changeAudio( audioSourceId ) {
    let connection = x.Videocenter.connection;
    this.vc.setConfig('default-audio',audioSourceId);
    if(connection.mediaConstraints.audio.optional.length && connection.attachStreams.length) {
        if(connection.mediaConstraints.audio.optional[0].sourceId === audioSourceId) {
            alert('Selected audio device is already selected.');
            console.log('Selected audio device is already selected.');
            return;
        }
    }
    connection.attachStreams.forEach(function(stream) {
        stream.getAudioTracks().forEach(function(track) {
            stream.removeTrack(track);
            if(track.stop) {
                track.stop();
            }
        });
    });
    connection.mediaConstraints.audio.optional = [{
        sourceId: audioSourceId
    }];
    
    let videos= document.getElementById('video-container');
    if(this.oldvideo){
      videos.removeChild( this.oldvideo );
      connection.captureUserMedia();
    }  
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
