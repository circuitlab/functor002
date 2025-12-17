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
  } );
} );
