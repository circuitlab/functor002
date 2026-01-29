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
    this.size = 0;      // 入力サイズ (128)
    this.outSize = 0;   // 出力サイズ (256)
  }

  init( canvasElement, renderer, gpuCompute, variable, size ) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext( '2d' );
    this.renderer = renderer;
    this.gpuCompute = gpuCompute;
    this.variable = variable;
    this.size = size;

    // データ拡張: 1パーティクルあたり 2x2 ピクセルを使用するため倍のサイズにする
    this.outSize = this.size * 2;

    this.canvas.width = this.outSize;
    this.canvas.height = this.outSize;

    // GPUからの読み出しバッファ (サイズは元の128x128)
    this.pixelBuffer = new Float32Array( this.size * this.size * 4 );

    // Canvas に出力するための ImageData (サイズは拡張後の256x256)
    this.imageData = this.ctx.createImageData( this.outSize, this.outSize );

    this.isInitialized = true;
  }

  update() {
    if ( !this.isInitialized ) return;

    const renderTarget = this.gpuCompute.getCurrentRenderTarget( this.variable );

    // 1. GPU からピクセルデータを読み出す (128x128)
    this.renderer.readRenderTargetPixels(
      renderTarget,
      0, 0, this.size, this.size,
      this.pixelBuffer
    );

    const data = this.imageData.data;
    const width = this.outSize; // 256

    // 2. データを変換して書き込み
    // i は pixelBuffer (128x128) のインデックス
    for ( let i = 0; i < this.pixelBuffer.length; i += 4 ) {
      // --- 座標の正規化 (-400~400 -> 0.0~1.0) ---
      // 範囲外の値が来ても破綻しないよう clamp するのが安全ですが、
      // 既存ロジックを尊重しそのまま計算します。
      const rawX = ( this.pixelBuffer[i + 0] / 800 ) + 0.5;
      const rawY = ( this.pixelBuffer[i + 1] / 800 ) + 0.5;
      const rawZ = ( this.pixelBuffer[i + 2] / 800 ) + 0.5;

      // --- Coarse (上位): 0-255の整数 ---
      // Math.floor で整数部を取得
      const cX = Math.floor( rawX * 255 );
      const cY = Math.floor( rawY * 255 );
      const cZ = Math.floor( rawZ * 255 );

      // --- Fine (下位/残差): 切り捨てられた端数を 0-255 に引き伸ばす ---
      // ( 元の値 * 255 ) - 整数部 = 小数部
      // 小数部 * 255 = Fine値
      const fX = Math.floor( ( ( rawX * 255 ) - cX ) * 255 );
      const fY = Math.floor( ( ( rawY * 255 ) - cY ) * 255 );
      const fZ = Math.floor( ( ( rawZ * 255 ) - cZ ) * 255 );

      // --- 2x2 ピクセルブロックへの書き込み ---
      // 元のグリッド上のインデックス
      const pIndex = i / 4;
      // 拡張されたグリッド上の左上の座標 (bx, by)
      const bx = ( pIndex % this.size ) * 2;
      const by = Math.floor( pIndex / this.size ) * 2;

      // 書き込みヘルパー (RGBA)
      // 左列: Coarse, 右列: Fine
      // 上段: データ, 下段: コピー (圧縮ノイズ耐性用)

      // [左上] Coarse
      let idx = ( by * width + bx ) * 4;
      data[idx + 0] = cX; data[idx + 1] = cY; data[idx + 2] = cZ; data[idx + 3] = 255;

      // [左下] Coarse Copy
      idx = ( ( by + 1 ) * width + bx ) * 4;
      data[idx + 0] = cX; data[idx + 1] = cY; data[idx + 2] = cZ; data[idx + 3] = 255;

      // [右上] Fine
      idx = ( by * width + ( bx + 1 ) ) * 4;
      data[idx + 0] = fX; data[idx + 1] = fY; data[idx + 2] = fZ; data[idx + 3] = 255;

      // [右下] Fine Copy
      idx = ( ( by + 1 ) * width + ( bx + 1 ) ) * 4;
      data[idx + 0] = fX; data[idx + 1] = fY; data[idx + 2] = fZ; data[idx + 3] = 255;
    }

    // 3. Canvas に書き込み
    this.ctx.putImageData( this.imageData, 0, 0 );
  }
}