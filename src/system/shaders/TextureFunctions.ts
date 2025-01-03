import { float, int, ivec2, sampler2D, samplerCube, vec2, vec3, vec4 } from "./ShaderTypes"

/**
 * samples a normal map and remaps values from 0 -> 1 to -1 -> 1
 * @param normalMap the normal map to be sampled
 * @param uv the coordinates used to sample the normal map
 * @returns rgb color values from normal map
 */
export const sampleNormalMap = (normalMap: sampler2D, uv: vec2): vec3 | string => {
    return /* glsl */ `
        vec3 sampleNormalMap(sampler2D normalMap, vec2 uv) {
            return texture2D(normalMap, uv).xyz * 2.0 - 1.0;
        }
    `
}

/**
 * Gets an index for the current texel on an fbo texture
 * @param fboTex the fbo texture
 * @param texCoord the texel coordinates - usually ivec2(gl_FragCoord.xy)
 * @returns the index of the current texel
 */
export const getFboIndex = (fboTex: sampler2D, texCoord: ivec2): int | string => {
    return /* glsl */`
        int getFboIndex(sampler2D fboTex, ivec2 texCoord) {
            return texCoord.y * textureSize(fboTex, 0).x + texCoord.x;
        }
    `
}

/**
 * samples environment map reflections in world space
 * @param envMap the environment map cube texture
 * @param eyeVec the vector from the fragment pos towards the camera
 * @param normal the surface normal
 * @returns a vec3 with colors of the reflected cube map
 */
export const reflectEnvMap = (envMap: samplerCube, eyeVec: vec3, normal: vec3): vec3 | string => {
    return /* glsl */ `
        vec3 reflectEnvMap(samplerCube envMap, vec3 eyeVec, vec3 normal) {
            vec3 reflectVec = reflect(eyeVec, normal);
            return textureCube(envMap, vec3(reflectVec.x, -reflectVec.y, reflectVec.z)).rgb;
        }
    `
}

/**
 * samples refracted environment map
 * @param envMap the environment map cube texture
 * @param viewVec the vector from the camera towards the fragment
 * @param normal the surface normal
 * @param refractionIndex the index of refraction (1.33 for water, higher for denser materials)
 * @returns the refracted env map texture
 */
export const refractEnvMap = (envMap?: samplerCube, viewVec?: vec3, normal?: vec3, refractionIndex?: float): vec3 | string => {
    return /* glsl */ `
        vec3 refractEnvMap(samplerCube envMap, vec3 viewVec, vec3 normal, float refractionIndex) {
            vec3 refractVec = refract(viewVec, normal, 1.0 / refractionIndex);
            return textureCube(envMap, refractVec).rgb;
        }
    `
}

/**
 * samples refracted texture
 * @param envMap the environment map cube texture
 * @param screenUv the screen space UV coords
 * @param viewVec the vector from the camera towards the fragment
 * @param normal the surface normal
 * @param refractionIndex the index of refraction (1.33 for water, higher for denser materials)
 * @returns the refracted texture
 */
export const refractTexture = (envMap?: samplerCube, screenUv?: vec2, viewVec?: vec3, normal?: vec3, refractionIndex?: float): vec3 | string => {
    return /* glsl */ `
        vec3 refractTexture(samplerCube envMap, vec2 screenUv, vec3 viewVec, vec3 normal, float refractionIndex) {
            vec3 refractVec = refract(viewVec, normal, 1.0 / refractionIndex);
            return texture2D(envMap, screenUv + refractVec.xy);
        }
    `
}


/**
 * offsets UVs in the -z direction in tangent space to create a parallax effect
 * @param uv regular tangent space uv coordinates
 * @param tangentSpaceViewDir the view direction in tangent space
 * @param offsetScale how far the new UV will be offset
 * @returns new UV values with z offset
 */
export const parallaxOffsetUV = (uv: vec2, tangentSpaceViewDir: vec3, offsetScale: float): vec2 | string => {
    return /* glsl */ `
        vec2 parallaxOffsetUV(vec2 uv, vec3 tangentSpaceViewDir, float offsetScale) {
            vec2 uvOffset = tangentSpaceViewDir.xy / tangentSpaceViewDir.z;
            uvOffset *= offsetScale;
            return uv - uvOffset;
        }
    `
}

/**
 * Use a lookup table texture to easily adjust color values. Ensure the LUT texture 
 * has min and mag filters set to THREE.LinearFilter for best results
 * @param originalColor the input color value
 * @param lutTexture the look up table texture
 * @returns recolored values based on the provided lookup table
 */
export const lookupTable = (originalColor: vec4, lutTexture: sampler2D): vec4 | any => {
    return /* glsl */ `
        vec4 lookupTable(vec4 originalColor, sampler2D lutTexture) {
            #ifndef LUT_NO_CLAMP
            originalColor = clamp(originalColor, 0.0, 1.0);
            #endif
        
            highp float blueColor = originalColor.b * 63.0;
        
            highp vec2 quad1;
            quad1.y = floor(floor(blueColor) / 8.0);
            quad1.x = floor(blueColor) - (quad1.y * 8.0);
        
            highp vec2 quad2;
            quad2.y = floor(ceil(blueColor) / 8.0);
            quad2.x = ceil(blueColor) - (quad2.y * 8.0);
        
            highp vec2 texPos1;
            texPos1.x = (quad1.x * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * originalColor.r);
            texPos1.y = (quad1.y * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * originalColor.g);
        
            #ifdef LUT_FLIP_Y
                texPos1.y = 1.0-texPos1.y;
            #endif
        
            highp vec2 texPos2;
            texPos2.x = (quad2.x * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * originalColor.r);
            texPos2.y = (quad2.y * 0.125) + 0.5/512.0 + ((0.125 - 1.0/512.0) * originalColor.g);
        
            #ifdef LUT_FLIP_Y
                texPos2.y = 1.0-texPos2.y;
            #endif
        
            highp vec4 newColor1 = texture2D(lutTexture, texPos1);
            highp vec4 newColor2 = texture2D(lutTexture, texPos2);
        
            highp vec4 newColor = mix(newColor1, newColor2, fract(blueColor));
            return newColor;
        }
    `
}

export const blur5 = (image?: sampler2D, uv?: vec2, resolution?: vec2, direction?: vec2): vec4 | any => {
    return /* glsl */ `
        vec4 blur5(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
            vec4 color = vec4(0.0);
            vec2 off1 = vec2(1.3333333333333333) * direction;
            color += texture2D(image, uv) * 0.29411764705882354;
            color += texture2D(image, uv + (off1 / resolution)) * 0.35294117647058826;
            color += texture2D(image, uv - (off1 / resolution)) * 0.35294117647058826;
            return color; 
        }
    `
}

export const blur9 = (image?: sampler2D, uv?: vec2, resolution?: vec2, direction?: vec2): vec4 | any => {
    return /* glsl */ `
        vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
            vec4 color = vec4(0.0);
            vec2 off1 = vec2(1.3846153846) * direction;
            vec2 off2 = vec2(3.2307692308) * direction;
            color += texture2D(image, uv) * 0.2270270270;
            color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;
            color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;
            color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;
            color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;
            return color;
        }
    `
}

export const blur13 = (image?: sampler2D, uv?: vec2, resolution?: vec2, direction?: vec2): vec4 | any => {
    return /* glsl */ `
        vec4 blur13(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
            vec4 color = vec4(0.0);
            vec2 off1 = vec2(1.411764705882353) * direction;
            vec2 off2 = vec2(3.2941176470588234) * direction;
            vec2 off3 = vec2(5.176470588235294) * direction;
            color += texture2D(image, uv) * 0.1964825501511404;
            color += texture2D(image, uv + (off1 / resolution)) * 0.2969069646728344;
            color += texture2D(image, uv - (off1 / resolution)) * 0.2969069646728344;
            color += texture2D(image, uv + (off2 / resolution)) * 0.09447039785044732;
            color += texture2D(image, uv - (off2 / resolution)) * 0.09447039785044732;
            color += texture2D(image, uv + (off3 / resolution)) * 0.010381362401148057;
            color += texture2D(image, uv - (off3 / resolution)) * 0.010381362401148057;
            return color;
        }
    `
}

export const uvToPolar = () => {
    return /* glsl */ `
        vec2 uvToPolar(vec2 uv) {
            vec2 centeredUV = uv - 0.5;
            float r = length(centeredUV);
            float theta = atan(centeredUV.y, centeredUV.x);
            const float PI = 3.1415926535897932384626433832795;
            theta = (theta + PI) / (2.0 * PI);
            return vec2(r, theta);
        }
    `
}

export const TextureFunctions = {
    sampleNormalMap: sampleNormalMap,
    getFboIndex: getFboIndex,
    reflectEnvMap: reflectEnvMap,
    refractEnvMap: refractEnvMap,
    refractTexture: refractTexture,
    parallaxOffsetUV: parallaxOffsetUV,
    lookupTable: lookupTable,
    blur5: blur5,
    blur9: blur9,
    blur13: blur13
}