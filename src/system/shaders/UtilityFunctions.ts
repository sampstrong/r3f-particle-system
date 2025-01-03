import { float, vec3 } from "./ShaderTypes"

/**
 * clamps a value between 0 and 1
 * @param value the value to clamp
 * @returns the clamped value
 */
export const saturate = (value: float): float | string => {
    return /* glsl */ `
        float saturate(float value){
            return clamp(value, 0.0, 1.0);
        }
    `
}

/**
 * remaps a value from one range to another
 * @param value the value to remap
 * @param min1 the lower bounds of the first range
 * @param max1 the upper bounds of the first range
 * @param min2 the lower bounds of the second range
 * @param max2 the upper bounds of the second range
 * @returns the remapped value
 */
export const remap = ( value: float, min1: float, max1: float, min2: float, max2: float): float | string => {
    return /* glsl */ `
        float remap(float value, float min1, float max1, float min2, float max2) {
            return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
        }
    `
}

/**
 * checks length of vector to ensure it's not 0 before normalizing, which 
 * can result in NaN values on some GPUs
 * @param vector the vector to normalize
 * @returns a normalized vector ot vec3(0.0) if vector length is 0
 */
export const safeNormalize = (vector: vec3) => {
    return /* glsl */ `
        vec3 safeNormalize(vec3 v) {
            float len = length(v);
            return (len > 0.0) ? normalize(v) : vec3(0.0);
        }
    `
}

export const UtilityFunctions = {
    saturate: saturate,
    remap: remap,
    safeNormalize: safeNormalize
}