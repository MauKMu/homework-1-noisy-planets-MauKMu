#version 300 es

// This is a fragment shader. If you've opened this file first, please
// open and read lambert.vert.glsl before reading on.
// Unlike the vertex shader, the fragment shader actually does compute
// the shading of geometry. For every pixel in your program's output
// screen, the fragment shader is run for every bit of geometry that
// particular pixel overlaps. By implicitly interpolating the position
// data passed into the fragment shader by the vertex shader, the fragment shader
// can compute what color to apply to its pixel based on things like vertex
// position, light position, and vertex color.
precision highp float;

uniform vec4 u_Color; // The color with which to render this instance of geometry.

uniform float u_Time;
uniform float u_Speed;

uniform vec3 u_EyePos;

// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
vec3 random3(vec3 c) {
    float j = 4096.0*sin(dot(c, vec3(17.0, 59.4, 15.0)));
    vec3 r;
    r.z = fract(512.0*j);
    j *= .125;
    r.x = fract(512.0*j);
    j *= .125;
    r.y = fract(512.0*j);
    return r;
}

struct worleyResult {
    vec3 closest0;
    float closestDist0;
    vec3 closest1;
    float closestDist1;
    vec3 normClosest0;
    vec3 normClosest1;
    vec3 normal;
};

const float WORLEY_BIG_FLOAT = 1.0e10;
const float WORLEY_EPSILON = 0.001;

worleyResult getWorley(vec3 pt, float gridSize, float timeFactor) {
    vec3 gridOrigin;
    if (gridSize >= 1.0) {
        gridOrigin.x = pt.x > 0.0 ? 0.0 : -gridSize;
        gridOrigin.y = pt.y > 0.0 ? 0.0 : -gridSize;
        gridOrigin.z = pt.z > 0.0 ? 0.0 : -gridSize;
    }
    else {
        gridOrigin = pt - mod(pt, gridSize);
    }
    worleyResult result;
    result.closest0 = vec3(0.0);
    result.closest1 = vec3(0.0);
    result.closestDist0 = WORLEY_BIG_FLOAT;
    result.closestDist1 = WORLEY_BIG_FLOAT;
    for (float i = -gridSize; i < gridSize + WORLEY_EPSILON; i += gridSize) {
        for (float j = -gridSize; j < gridSize + WORLEY_EPSILON; j += gridSize) {
            for (float k = -gridSize; k < gridSize + WORLEY_EPSILON; k += gridSize) {
                vec3 gridPt = gridOrigin + vec3(i, j, k);
                // compute random point
                //vec3 randPt = gridPt + (random3(gridPt) * 0.5 + vec3(cos(u_Time * 0.0001), sin(u_Time * 0.0001), sin(u_Time * 0.0002)) * 0.25 + 0.25) * gridSize;
                vec3 randPt;
                if (timeFactor < 0.0) {
                    randPt = gridPt + random3(gridPt) * gridSize;
                }
                else {
                    randPt = gridPt + (random3(gridPt) * 0.5 + vec3(cos(u_Time * 0.0001), sin(u_Time * 0.0001), sin(u_Time * 0.0002)) * 0.25 + 0.25) * gridSize;
                }
                // find distance
                float dist = distance(randPt, pt);
                // store if closest
                if (dist < result.closestDist0) {
                    // check if closest0 is already set
                    // if it is, store it in closest1 (and distance too)
                    // we don't want to overwrite and lose them
                    if (result.closestDist0 < WORLEY_BIG_FLOAT) {
                        result.closestDist1 = result.closestDist0;
                        result.closest1 = result.closest0;
                    }
                    result.closestDist0 = dist;
                    result.closest0 = randPt;
                }
                else if (dist < result.closestDist1) {
                    result.closestDist1 = dist;
                    result.closest1 = randPt;
                }
            }
        }
    }

    result.normClosest0 = normalize(result.closest0);
    result.normClosest1 = normalize(result.closest1);

    return result;
}


/* Buildings -- with Worley */
const float streetRadius = 0.12;

vec3 getBldgDisp(vec3 pt, inout worleyResult worley) {
    vec3 bldgDir = worley.normClosest0;
    // compute distance from border
    // 1 - 0 makes it point in the direction we want for normal
    vec3 diff = worley.normClosest1 - worley.normClosest0;
    vec3 borderNormal = normalize(diff);
    vec3 toClosest = pt - worley.normClosest0;
    float distFromClosest = abs(dot(toClosest, borderNormal));
    float distToBorder = 0.5 * length(diff) - distFromClosest;
    float dist = distToBorder;// distance(pt, bldgDir);
    float projLen = dot(bldgDir, pt);
    // determines whether we are "on" the building
    float s = (dist > streetRadius ? 1.0 : 0.0);
    worley.normal = abs(dist - streetRadius) < (0.05 * streetRadius) ? borderNormal : bldgDir;
    // (bldgHeight - projLen) + bldgHeight
    float bldgHeight = random3(worley.closest0).x * 0.35 + 0.65;
    s *= (2.0 * bldgHeight - projLen);
    return s * bldgDir;
}

const float lavaRadius = 0.01;

const vec3 LAVA_ORANGE = vec3(255.0, 110.0, 0.0) / 255.0;
const vec3 LAVA_BRIGHT_ORANGE = vec3(255.0, 142.0, 56.0) / 255.0;

const vec3 LAVA_RED = vec3(209.0, 24.0, 0.0) / 255.0;
const vec3 LAVA_BRIGHT_RED = vec3(255.0, 26.0, 56.0) / 255.0;

vec3 getLavaColor(vec3 pt, worleyResult worley) {
    vec3 bldgDir = worley.normClosest0;
    // compute distance from border
    // 1 - 0 makes it point in the direction we want for normal
    vec3 diff = worley.normClosest1 - worley.normClosest0;
    vec3 borderNormal = normalize(diff);
    vec3 toClosest = pt - worley.normClosest0;
    float distFromClosest = abs(dot(toClosest, borderNormal));
    float distToBorder = 0.5 * length(diff) - distFromClosest;
    float dist = distToBorder;// distance(pt, bldgDir);
    float projLen = dot(bldgDir, pt);
    // determines whether we are "on" the building
    //float s = (dist > lavaRadius ? 1.0 : 0.0);
    float s = smoothstep(0.0, 30.0 * lavaRadius, dist - lavaRadius);
    vec3 faceColor = mix(LAVA_ORANGE, LAVA_BRIGHT_ORANGE, cos(u_Time * 0.001) * 0.5 + 0.5);
    vec3 edgeColor = mix(LAVA_BRIGHT_RED, LAVA_RED, cos(u_Time * 0.001) * 0.5 + 0.5);

    return mix(edgeColor, faceColor, s);
}

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec3 fs_Pos;
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
flat in float fs_Shininess;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

void main()
{
        out_Col = fs_Col;
        //return;
        // Material base color (before shading)
        // IQ's iridescent palette...
        vec3 bias = abs(fs_Nor.xyz);
        vec3 scale = vec3(1.0) - bias;
        vec3 freq = vec3(1.5, 0.5, 1.1);
        vec3 phase = vec3(0.0, 0.5, 0.33);
        float t = u_Speed * u_Time * 0.0001;
        vec3 iridescent = bias + scale * cos(freq * t + phase);
        // With alternating between the color and its RGB->GBR shifted version
        float tShift = smoothstep(0.0, 1.0, (sin(u_Time * 0.000314) * 0.5 + 0.5));
        vec4 baseColor = vec4(iridescent, 1.0);
        vec4 altColor = baseColor.yzxw;
        vec4 diffuseColor = mix(baseColor, altColor, tShift);
        diffuseColor.xyz = vec3(0.89);
        diffuseColor.xyz = fs_Col.xyz;

        // Calculate the diffuse term for Lambert shading
        float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
        // Avoid negative lighting values
        diffuseTerm = (fs_Shininess <= 5.0 ? 1.0 : clamp(diffuseTerm, 0.0, 1.0)) * 0.7;
        worleyResult worley = getWorley(fs_Pos, 0.65, 1.0);
        diffuseColor.xyz = fs_Shininess <= 5.0 ? getLavaColor(fs_Pos, worley) : diffuseColor.xyz;


        float ambientTerm = 0.3;

        vec3 halfVec = normalize(fs_LightVec.xyz + normalize(u_EyePos - fs_Pos));
        float specularTerm = pow(max(0.0, dot(halfVec, fs_Nor.xyz)), fs_Shininess);
        specularTerm = fs_Shininess > 5.5 ? 0.0 : (0.0, 0.5, specularTerm);

        float lightIntensity = diffuseTerm + ambientTerm;   //Add a small float value to the color multiplier
                                                            //to simulate ambient lighting. This ensures that faces that are not
                                                            //lit by our point light are not completely black.

        // Compute final shaded color
        out_Col = vec4(diffuseColor.rgb * lightIntensity, diffuseColor.a);
        out_Col.xyz += vec3(specularTerm);
}
