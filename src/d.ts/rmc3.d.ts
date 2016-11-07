declare module "RTCMultiConnection" {
    export = RTCMultiConnection;
}
declare var RTCMultiConnection: RTCMultiConnection;
interface RTCMultiConnection {
    new():void;
    enumerateDevices( func: any ): any;
}