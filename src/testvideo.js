
AFRAME.registerComponent( "functor-videotest", {
  init() {
    console.log( "hi i am the videotest" );

    window.addEventListener( 'arjs-video-loaded', ( event ) => {

      this.videoFromArjs = document.getElementById( "videoFromArjs" );
      this.videoFromAframe = document.getElementById( "videoFromAframe" );
      this.videoMerged = document.getElementById( "videoMerged" );

      this.arjsSource = document.getElementById( 'arjs-video' );
      this.aframeDom = this.el.sceneEl.renderer.domElement;
      this.aframeSource = document.getElementById( 'aframe-video' );

      this.arjsCanvas = document.createElement( "canvas" );
      this.arjsCanvasContext = this.arjsCanvas.getContext( '2d', { willReadFrequently: true } );
      this.aframeCanvas = document.createElement( "canvas" );
      this.aframeCanvasContext = this.aframeCanvas.getContext( '2d', { willReadFrequently: true } );
      this.mergedCanvas = document.createElement( "canvas" );
      this.mergedCanvasContext = this.mergedCanvas.getContext( '2d', { willReadFrequently: true } );

      this.arjsCanvas.width = 100;//arjsSource.videoWidth;
      this.arjsCanvas.height = 100;//arjsSource.videoWidth;
      this.aframeCanvas.width = 100;//aframeSource.width;
      this.aframeCanvas.height = 100;//aframeSource.height;
      this.mergedCanvas.width = 100;//arjsSource.videoWidth;
      this.mergedCanvas.height = 100;//arjsSource.videoHeight;

      this.videoFromArjs.srcObject = this.arjsCanvas.captureStream( 25 );
      this.videoFromAframe.srcObject = this.aframeCanvas.captureStream( 25 );
      this.videoMerged.srcObject = this.mergedCanvas.captureStream( 25 );
      this.aframeSource.srcObject = this.aframeDom.captureStream( 25 );

      this.rendererHacked = false;
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
          self.aframeCanvasContext.drawImage( this.domElement, 0, 0, 100, 100 );
          self.mergedCanvasContext.drawImage( self.arjsSource, 0, 0, 100, 100 );
          self.mergedCanvasContext.drawImage( this.domElement, 0, 0, 100, 100 );
        }
      };

      this.rendererHacked = true;
    }

    if ( this.ready ) {
      this.arjsCanvasContext.drawImage( this.arjsSource, 0, 0, 100, 100 );
    }
  }
} );