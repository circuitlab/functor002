attribute float aBirdIndex;

uniform sampler2D textureVideo;
uniform float uWidth;
uniform float uAtlasWidth;
uniform float uMin;   
uniform float uRange;
varying float vBirdIndex;
varying vec3 vDebugColor;

const float BLOCK_SIZE = 4.0;
const float STREAM_W = 1920.0; 
const float STREAM_H = 1080.0;
const float LOGICAL_W = 480.0; 
const float SECOND_LAYER_Y_OFFSET = 540.0;

float getInterpolatedValue(float dataIndex) {
    float col = mod(dataIndex, LOGICAL_W);
    float row = floor(dataIndex / LOGICAL_W);

    float px = col * BLOCK_SIZE + (BLOCK_SIZE * 0.5);
    float py = row * BLOCK_SIZE + (BLOCK_SIZE * 0.5);

    vec2 uvHigh = vec2(px / STREAM_W, py / STREAM_H);
    float highRaw = texture2D(textureVideo, uvHigh).r;

    vec2 uvLow = vec2(px / STREAM_W, (py + SECOND_LAYER_Y_OFFSET) / STREAM_H);
    float lowRaw = texture2D(textureVideo, uvLow).r;

    float high = floor(highRaw * 255.0 + 0.5);
    float low = floor(lowRaw * 255.0 + 0.5);

    return (high / 255.0) + ((low / 255.0) * (0.9 / 255.0));
}

void main() {
    float id = aBirdIndex;
    float totalEmojis = uAtlasWidth * uAtlasWidth; 
    if (totalEmojis < 1.0) totalEmojis = 1.0;
    vBirdIndex = mod(id, totalEmojis);

    float rawX = getInterpolatedValue(id * 3.0);
    float rawY = getInterpolatedValue(id * 3.0 + 1.0);
    float rawZ = getInterpolatedValue(id * 3.0 + 2.0);

    vDebugColor = vec3(rawX, rawY, rawZ);

    vec3 pos;
    pos.x = rawX * uRange + uMin;
    pos.y = rawY * uRange + uMin;
    pos.z = rawZ * uRange + uMin;

    vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;
    
    float distance = -modelViewPosition.z;
    gl_PointSize = 6000.0 / max(distance, 10.0);
}