import * as L from 'leaflet';

// declare module 'leaflet' {
//   namespace Control {
//     class Fullscreen extends Control {
//       constructor(options?: any);
//     }
//   }
// }

declare module 'leaflet' {
  namespace control {
    function fullscreen(options?: any): Control;
  }
}



