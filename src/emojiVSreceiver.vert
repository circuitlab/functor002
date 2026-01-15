attribute float aBirdIndex;
uniform sampler2D textureVideo;
uniform float uWidth;
varying float vBirdIndex;

void main() {
    // パーティクルのインスタンスIDからUV座標を計算
    // 修正: インスタンスIDを正方形のサイズに従ってUV座標に変換
    float instanceIndex = float(gl_InstanceID);
    float u = mod(instanceIndex, uWidth) / uWidth;
    float v = floor(instanceIndex / uWidth) / uWidth;
    vec2 uv = vec2(u, v);
    
    // 映像テクスチャからRGB値を取得
    vec4 videoColor = texture2D(textureVideo, uv);
    
    // RGB値を座標に変換 (0.0〜1.0 -> -400〜400)
    vec3 pos = vec3(
        (videoColor.r - 0.5) * 800.0, // R成分からX座標
        (videoColor.g - 0.5) * 800.0, // G成分からY座標
        (videoColor.b - 0.5) * 800.0 // B成分からZ座標
    );
    
    vBirdIndex = aBirdIndex;
    vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;

    // 1. カメラからの距離を計算
    // modelViewPosition.z はビュー座標系での深度を表す（負の値）
    float distance = -modelViewPosition.z;

    // 2. 基本サイズを距離で割ることで、遠くのものほど小さくする
    // 値は、どのくらい小さくするかを調整する係数
    gl_PointSize = 6000.0 / distance;
}
