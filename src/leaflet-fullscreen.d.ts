import * as L from 'leaflet';

declare module 'leaflet' {
  namespace Control {
    // function fullscreen(options?: any): Control;
    class Fullscreen extends Control {
      constructor(options?: any);
    }
  }
}

// declare module 'leaflet-fullscreen' {
//   import 'leaflet';

//   interface FullscreenControlOptions {
//     position?: string;
//     title?: string;
//     titleCancel?: string;
//     content?: string;
//     contentCancel?: string;
//     forceSeparateButton?: boolean;
//   }

//   export class Control {
//     constructor(options?: FullscreenControlOptions);
//   }
// }


