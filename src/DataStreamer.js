// src/DataStreamer.js

export class ParticleEncoder {
  constructor( particleCountW, particleCountH ) {
    this.width = particleCountW;
    this.height = particleCountH;
    this.totalParticles = this.width * this.height;

    // --- Configuration ---
    this.BLOCK_SIZE = 4;
    this.STREAM_W = 1280; // Physical video width
    this.STREAM_H = 720;

    // [Correction Point]
    // 1280 / 4 = 320 but 320 is not divisible by 3.
    // Use the largest number divisible by 3: "318"
    // The remaining 2 blocks (8px) will be right margin.
    this.LOGICAL_W = 318;

    // Calculate required rows
    this.LOGICAL_H = Math.ceil( ( this.totalParticles * 3 ) / this.LOGICAL_W );

    // Data generation (318 x H)
    this.sourceCanvas = document.createElement( 'canvas' );
    this.sourceCanvas.width = this.LOGICAL_W;
    this.sourceCanvas.height = this.LOGICAL_H;
    this.sourceCtx = this.sourceCanvas.getContext( '2d', { alpha: false } );
    this.imageData = this.sourceCtx.createImageData( this.LOGICAL_W, this.LOGICAL_H );
    this.buf = this.imageData.data;

    // For transmission (1280 x 720)
    this.streamCanvas = document.createElement( 'canvas' );
    this.streamCanvas.width = this.STREAM_W;
    this.streamCanvas.height = this.STREAM_H;
    this.streamCtx = this.streamCanvas.getContext( '2d', { alpha: false } );
    this.streamCtx.imageSmoothingEnabled = false;

    // Debug display (for verification)
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
        const v8 = ( n * 255 ) | 0;

        // Write position: wrap around within 0 to 317 range
        const dataIndex = i * 3 + j;
        const col = dataIndex % this.LOGICAL_W;
        const row = ( dataIndex / this.LOGICAL_W ) | 0;

        const pIdx = ( row * this.LOGICAL_W + col ) * 4;
        this.buf[pIdx + 0] = v8;
        this.buf[pIdx + 1] = v8;
        this.buf[pIdx + 2] = v8;
        this.buf[pIdx + 3] = 255;
      }
    }

    this.sourceCtx.putImageData( this.imageData, 0, 0 );

    // When drawing source (318 width) to stream (1280 width),
    // draw only 318 * 4 = 1272px, leaving the rightmost 8px untouched (remain black)
    this.streamCtx.drawImage(
      this.sourceCanvas,
      0, 0, this.LOGICAL_W, this.LOGICAL_H,
      0, 0, this.LOGICAL_W * this.BLOCK_SIZE, this.LOGICAL_H * this.BLOCK_SIZE
    );
  }

  getStream( fps = 30 ) {
    return this.streamCanvas.captureStream( fps );
  }
}