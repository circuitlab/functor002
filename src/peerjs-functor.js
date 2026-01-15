import './bootstrap.js';

AFRAME.registerComponent( "functor-webrtc-sender", {
  init() {
    this.rendererHacked = false;
    this.ready = false;

    window.addEventListener( 'arjs-video-loaded', () => {
      this.video = document.getElementById( 'arjs-video' );
      this.mergedCanvas = document.createElement( "canvas", { willReadFrequently: true } );
      this.context = this.mergedCanvas.getContext( '2d' );

      this.mergedCanvas.width = 65 * 2; //this.video.videoWidth;
      this.mergedCanvas.height = 135 * 2; //this.video.videoHeight;

      console.log( "canvas size", this.mergedCanvas.width, this.mergedCanvas.height, this.video.videoWidth, this.video.videoHeight );

      this.stream = this.mergedCanvas.captureStream( 25 );

      const videoelement = document.getElementById( "videoMerged" );

      videoelement.srcObject = this.stream;

      const peer = new Peer(
        'functor001b', {
        config: {
          'iceServers': [
            { urls: 'stun:stun.l.google.com:19302' },
          ]
        }
      } );

      peer.on( 'open', () => {
        const conn = peer.connect( 'functor001broom' );

        conn.on( 'open', () => {
          // Receive messages
          conn.on( 'data', ( data ) => {
            console.log( 'Received', data );
          } );

          // Send messages
          conn.send( 'Hello!' );

          const call = peer.call( 'functor001broom', this.stream );

          call.on( "stream", ( answer ) => {
            console.log( "on stream", answer );
          } );
        } );
      } );

      this.ready = true;
    } );
  },
  tick() {
    const renderer = this.el.sceneEl.renderer;

    if ( renderer && !this.rendererHacked ) {
      const originalRender = renderer.render;
      const self = this;

      renderer.render = function ( scene, camera ) {
        originalRender.call( this, scene, camera );

        if ( self.ready ) {
          const targetWidth = self.mergedCanvas.width;
          const targetHeight = self.mergedCanvas.height;
          const ratio = targetWidth / targetHeight;

          const sourceVideoWidth = self.video.videoWidth * ratio;
          const sourceVideoStartX = ( self.video.videoWidth - sourceVideoWidth ) / 2;

          const sourceDomWidth = this.domElement.width * ratio;
          const sourceDomStartX = ( this.domElement.width - sourceDomWidth ) / 2;

          self.context.drawImage( self.video, sourceVideoStartX, 0, sourceVideoWidth, self.video.videoHeight, 0, 0, self.mergedCanvas.width, self.mergedCanvas.height );
          self.context.drawImage( this.domElement, sourceDomStartX, 0, sourceDomWidth, this.domElement.height, 0, 0, self.mergedCanvas.width, self.mergedCanvas.height );
        }
      };

      this.rendererHacked = true;
    }
  }
} );
