import { Peer } from "https://esm.sh/peerjs@1.5.5?bundle-deps";

const RemoteVideo = document.getElementById( 'remote_video' );
const peer = new Peer(
  'functor001broom', {
  config: {
    'iceServers': [
      { urls: 'stun:stun.l.google.com:19302' },
    ]
  }
} );

peer.on( 'connection', ( conn ) => {
  conn.on( 'open', () => {
    // Receive messages
    conn.on( 'data', ( data ) => {
      console.log( 'Received', data );
    } );

    // Send messages
    conn.send( 'Hello!' );
  } );
} );

peer.on( 'call', ( call ) => {
  const cv = AFRAME.scenes[0].renderer.domElement;
  const answerStream = cv.captureStream( 25 );

  call.answer( answerStream );
  console.log( answerStream );

  call.on( 'stream', ( stream ) => {
    RemoteVideo.srcObject = stream;
    console.log( "stream on", stream );
  }, ( err ) => {
    console.log( "call error", err );
  } );
} );
