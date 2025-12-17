import { Peer } from "https://esm.sh/peerjs@1.5.5?bundle-deps";

const peer = new Peer( 'functor001b' );

peer.on( 'open', () => {

  const conn = peer.connect( 'functor001broom' );

  conn.on( 'open', function () {
    // Receive messages
    conn.on( 'data', function ( data ) {
      console.log( 'Received', data );
    } );

    // Send messages
    conn.send( 'Hello!' );

    const video = document.querySelector( 'video' );
    const aframe = document.createElement( 'video' );
    const cv = AFRAME.scenes[0].renderer.domElement;
    const mergedCanvas = document.createElement( "canvas" );
    const context = mergedCanvas.getContext( '2d' );

    aframe.muted = true;
    aframe.autoplay = true;
    aframe.srcObject = cv.captureStream( 25 );
    aframe.play();

    mergedCanvas.width = video.videoWidth;
    mergedCanvas.height = video.videoHeight;

    setInterval( () => {
      context.drawImage( video, 0, 0, mergedCanvas.width, mergedCanvas.height );
      context.drawImage( aframe, 0, 0, mergedCanvas.width, mergedCanvas.height );
    }, 1000 / 25 );

    const st = mergedCanvas.captureStream( 25 );
    const call = peer.call( 'functor001broom', st );
  } );
} );
