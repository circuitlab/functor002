import { Peer } from "https://esm.sh/peerjs@1.5.5?bundle-deps";

const RemoteVideo = document.getElementById( 'remote_video' );
const peer = new Peer( 'functor001broom' );

peer.on( 'connection', ( conn ) => {
  conn.on( 'open', function () {
    // Receive messages
    conn.on( 'data', function ( data ) {
      console.log( 'Received', data );
    } );

    // Send messages
    conn.send( 'Hello!' );
  } );
} );

peer.on( 'call', function ( call ) {
  call.answer();
  call.on( 'stream', function ( stream ) {
    RemoteVideo.srcObject = stream;
  } );
} );
