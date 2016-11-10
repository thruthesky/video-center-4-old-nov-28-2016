import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
import { MyApp } from './app.component';
import { EntrancePage } from '../pages/entrance/entrance';
import { LobbyPage } from '../pages/lobby/lobby';
import { RoomPage } from '../pages/room/room';
import { Videocenter } from '../providers/videocenter';
import { MycanvasDirective } from '../components/mycanvas/mycanvas';
import { AutoscrollDirective } from '../components/autoscroll/autoscroll';
import { Storage } from '@ionic/storage';
import { FireModule } from '../fireframe2/fire-module';

@NgModule({
  declarations: [
    MyApp,
    EntrancePage,
    LobbyPage,
    RoomPage,
    MycanvasDirective,
    AutoscrollDirective
  ],
  imports: [
    IonicModule.forRoot(MyApp),
    FireModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    EntrancePage,
    LobbyPage,
    RoomPage
  ],
  providers: [ Videocenter, Storage ]
})
export class AppModule {}
