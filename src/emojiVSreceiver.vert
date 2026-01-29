attribute float aBirdIndex;
uniform sampler2D textureVideo;
uniform float uWidth; // これは 128.0 のまま
varying float vBirdIndex;

void main() {
    // 128x128 のグリッドインデックス
    float instanceIndex = float(gl_InstanceID);
    
    // 128x128 グリッド上での XY 座標 (0 〜 127)
    float gridX = mod(instanceIndex, uWidth);
    float gridY = floor(instanceIndex / uWidth);

    // テクスチャサイズは 256x256 (uWidth * 2)
    // 1パーティクルにつき 2x2 ブロックが割り当てられている
    // Coarse (粗) は 左側 (2*gridX, 2*gridY)
    // Fine   (精) は 右側 (2*gridX + 1, 2*gridY)
    
    // UV座標の計算: ピクセルの中心を正確に狙うために +0.5 をしてテクスチャサイズ(256.0)で割る
    float texSize = uWidth * 2.0;
    
    // 左上のピクセル (Coarse) のUV
    vec2 uvCoarse = vec2(
        (gridX * 2.0 + 0.5) / texSize,
        (gridY * 2.0 + 0.5) / texSize
    );

    // 右上のピクセル (Fine) のUV
    vec2 uvFine = vec2(
        (gridX * 2.0 + 1.5) / texSize, // +1.5 で右のピクセルへ
        (gridY * 2.0 + 0.5) / texSize
    );

    // --- テクスチャからデータを取得 ---
    vec4 colorCoarse = texture2D(textureVideo, uvCoarse);
    vec4 colorFine   = texture2D(textureVideo, uvFine);

    // --- 座標復元 ---
    // RGB値は 0.0〜1.0 で取得される
    // 復元式: 値 = Coarse + (Fine / 255.0)
    // Coarseが 0.0〜1.0 なので、Fine/255.0 を足して精度を高める
    
    vec3 normalizedPos = vec3(
        colorCoarse.r + (colorFine.r / 255.0),
        colorCoarse.g + (colorFine.g / 255.0),
        colorCoarse.b + (colorFine.b / 255.0)
    );

    // --- 座標変換 (-400 〜 400) ---
    // 元の正規化式: (val / 800) + 0.5 = normalized
    // 逆変換: (normalized - 0.5) * 800 = val
    
    vec3 pos = vec3(
        (normalizedPos.r - 0.5) * 800.0,
        (normalizedPos.g - 0.5) * 800.0,
        (normalizedPos.b - 0.5) * 800.0
    );

    vBirdIndex = aBirdIndex;
    vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;

    // カメラからの距離計算
    float distance = -modelViewPosition.z;
    gl_PointSize = 6000.0 / distance;
}