// emojiVSreceiver.vert

attribute float aBirdIndex;

uniform sampler2D textureVideo;
uniform float uWidth;
uniform float uAtlasWidth;
uniform float uMin;   
uniform float uRange;

varying float vBirdIndex;
varying vec3 vDebugColor;

// --- Configuration (match with Sender) ---
const float BLOCK_SIZE = 4.0;
const float STREAM_W = 1280.0; // Physical texture width
const float STREAM_H = 720.0;

// Wrap width to 318.0
const float LOGICAL_W = 318.0; 

vec2 getUV(float dataIndex) {
    // Loop within 0〜317
    float col = mod(dataIndex, LOGICAL_W);
    float row = floor(dataIndex / LOGICAL_W);

    // Pixel position calculation
    // col * 4 + 2.0
    float px = col * BLOCK_SIZE + (BLOCK_SIZE * 0.5);
    float py = row * BLOCK_SIZE + (BLOCK_SIZE * 0.5);

    // Normalize by physical size (1280)
    // The rightmost 8px (318~320) are not read, so it's safe
    return vec2(
        px / STREAM_W,
        1.0 - (py / STREAM_H) 
    );
}

void main() {
    float id = aBirdIndex; 

    // Emoji type
    float totalEmojis = uAtlasWidth * uAtlasWidth; 
    if (totalEmojis < 1.0) totalEmojis = 1.0;
    vBirdIndex = mod(id, totalEmojis);

    // Data reading
    float idxX = id * 3.0;
    float idxY = id * 3.0 + 1.0;
    float idxZ = id * 3.0 + 2.0;

    float rawX = texture2D(textureVideo, getUV(idxX)).r;
    float rawY = texture2D(textureVideo, getUV(idxY)).r;
    float rawZ = texture2D(textureVideo, getUV(idxZ)).r;

    // Debug (can be commented out if no issues)
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