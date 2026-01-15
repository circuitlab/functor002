const Peer = window.Peer;

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
  console.log( "peer on connection", new Date() );

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
  console.log( "peer on call", new Date() );

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

  call.on( 'close', () => {
    console.log( "call on close", new Date() );
  } );

  call.on( 'error', ( e ) => {
    console.log( "call on close", new Date(), e );
  } );
} );

peer.on( 'peer on disconnected', () => {
  console.log( "peer on disconnected", new Date() );

  peer.reconnect();
} );

peer.on( 'peer on close', () => {
  console.log( "peer on close", new Date() );
} );

peer.on( 'peer on error', ( e ) => {
  console.log( "error", new Date(), e );
} );
