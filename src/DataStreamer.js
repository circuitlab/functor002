// src/DataStreamer.js

export class ParticleEncoder {
  constructor( particleCountW, particleCountH ) {
    this.width = particleCountW;
    this.height = particleCountH;
    this.totalParticles = this.width * this.height;

    this.BLOCK_SIZE = 4;
    this.STREAM_W = 1920;
    this.STREAM_H = 1080;
    this.LOGICAL_W = 480;

    this.LOGICAL_H = Math.ceil( ( this.totalParticles * 3 ) / this.LOGICAL_W );

    this.sourceCanvas = document.createElement( 'canvas' );
    this.sourceCanvas.width = this.LOGICAL_W;
    this.sourceCanvas.height = this.LOGICAL_H * 2;
    this.sourceCtx = this.sourceCanvas.getContext( '2d', { alpha: false } );
    this.imageData = this.sourceCtx.createImageData( this.LOGICAL_W, this.LOGICAL_H * 2 );
    this.buf = this.imageData.data;

    this.streamCanvas = document.createElement( 'canvas' );
    this.streamCanvas.width = this.STREAM_W;
    this.streamCanvas.height = this.STREAM_H;
    this.streamCtx = this.streamCanvas.getContext( '2d', { alpha: false } );
    this.streamCtx.imageSmoothingEnabled = false;

    this.streamCanvas.style.position = 'fixed';
    this.streamCanvas.style.bottom = '10px';
    this.streamCanvas.style.right = '10px';
    this.streamCanvas.style.width = '320px';
    this.streamCanvas.style.border = '1px solid cyan';
    this.streamCanvas.style.zIndex = '9999';
    document.body.appendChild( this.streamCanvas );
  }

  update( positions, bounds, stride = 3 ) {
    const min = -bounds / 2;
    const max = bounds / 2;
    const range = max - min;

    for ( let i = 0; i < this.totalParticles; i++ ) {
      const pid = i * stride;

      for ( let j = 0; j < 3; j++ ) {
        const val = positions[pid + j];
        let n = ( val - min ) / range;
        n = n < 0 ? 0 : ( n > 1 ? 1 : n );

        const vHigh = Math.floor( n * 255 );
        const remainder = ( n * 255 ) - vHigh;
        const vLow = Math.floor( remainder * 255 );

        const dataIndex = i * 3 + j;
        const col = dataIndex % this.LOGICAL_W;
        const row = ( dataIndex / this.LOGICAL_W ) | 0;

        this._writeToBuf( col, row, vHigh );
        this._writeToBuf( col, row + this.LOGICAL_H, vLow );
      }
    }

    this.sourceCtx.putImageData( this.imageData, 0, 0 );

    this.streamCtx.fillStyle = 'black';
    this.streamCtx.fillRect( 0, 0, this.STREAM_W, this.STREAM_H );

    this.streamCtx.drawImage(
      this.sourceCanvas,
      0, 0, this.LOGICAL_W, this.LOGICAL_H,
      0, 0, this.LOGICAL_W * this.BLOCK_SIZE, this.LOGICAL_H * this.BLOCK_SIZE
    );

    this.streamCtx.drawImage(
      this.sourceCanvas,
      0, this.LOGICAL_H, this.LOGICAL_W, this.LOGICAL_H,
      0, 540, this.LOGICAL_W * this.BLOCK_SIZE, this.LOGICAL_H * this.BLOCK_SIZE
    );
  }

  _writeToBuf( col, row, val ) {
    const pIdx = ( row * this.LOGICAL_W + col ) * 4;
    this.buf[pIdx + 0] = val;
    this.buf[pIdx + 1] = val;
    this.buf[pIdx + 2] = val;
    this.buf[pIdx + 3] = 255;
  }

  getStream( fps = 30 ) {
    return this.streamCanvas.captureStream( fps );
  }
}