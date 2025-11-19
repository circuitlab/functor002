import { Pigeon } from "./Pigeon.js";

AFRAME.registerComponent( "pigeon-receiver", {
  init() {
    this.pigeon = new Pigeon( "wss://vmb207.circuitlab.team:3001/pigeon/", 'functor' );

    document.addEventListener( "ipad", ( e ) => {
      console.log( e.detail );

      const quaternion = new THREE.Quaternion( e.detail.x, e.detail.y, e.detail.z, e.detail.w );

      this.el.object3D.setRotationFromQuaternion( quaternion );
    } );
  },
  tick() {
  }
} );