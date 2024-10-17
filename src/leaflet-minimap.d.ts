import * as L from 'leaflet';

declare module 'leaflet' {
  namespace Control {
    class MiniMap extends Control {
      constructor(layer: Layer, options?: any);
    }
  }
}
