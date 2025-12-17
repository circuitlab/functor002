import { Peer } from "https://esm.sh/peerjs@1.5.5?bundle-deps";

const peer = new Peer( 'functor001broom' );

peer.on( 'connection', ( conn ) => {
  console.log( "on connection" );
  conn.on( 'open', function () {
    // Receive messages
    conn.on( 'data', function ( data ) {
      console.log( 'Received', data );
    } );

    // Send messages
    conn.send( 'Hello!' );
  } );
} );