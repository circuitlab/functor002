export class TextureVisualizer {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.renderer = null;
    this.gpuCompute = null;
    this.variable = null;
    this.isInitialized = false;
    this.pixelBuffer = null;
    this.imageData = null;
    this.size = 0;
  }

  // size を明示的に受け取るように修正
  init( canvasElement, renderer, gpuCompute, variable, size ) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext( '2d' );
    this.renderer = renderer;
    this.gpuCompute = gpuCompute;
    this.variable = variable;
    this.size = size;

    this.canvas.width = this.size;
    this.canvas.height = this.size;

    // GPGPU は通常 FloatType なので Float32Array を使用
    this.pixelBuffer = new Float32Array( this.size * this.size * 4 );

    // Canvas に出力するための ImageData
    this.imageData = this.ctx.createImageData( this.size, this.size );

    this.isInitialized = true;
  }

  // 外部(landscape.js)から毎フレーム呼ばれる
  update() {
    if ( !this.isInitialized ) return;

    const renderTarget = this.gpuCompute.getCurrentRenderTarget( this.variable );

    // 1. GPU からピクセルデータを読み出す
    this.renderer.readRenderTargetPixels(
      renderTarget,
      0, 0, this.size, this.size,
      this.pixelBuffer
    );

    // 2. Float データの可視化処理
    const data = this.imageData.data;
    for ( let i = 0; i < this.pixelBuffer.length; i += 4 ) {
      // 座標 BOUNDS (800) に基づき正規化 (-400~400 -> 0~255)
      data[i + 0] = ( ( this.pixelBuffer[i + 0] / 800 ) + 0.5 ) * 255; // R
      data[i + 1] = ( ( this.pixelBuffer[i + 1] / 800 ) + 0.5 ) * 255; // G
      data[i + 2] = ( ( this.pixelBuffer[i + 2] / 800 ) + 0.5 ) * 255; // B
      data[i + 3] = 255; // Alpha
    }

    // 3. Canvas に書き込み
    this.ctx.putImageData( this.imageData, 0, 0 );
  }
}