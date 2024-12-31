import { float, mat2, mat3, mat4, vec3 } from "./ShaderTypes"

/**
 * get a 2D rotation matrix from a given angle
 * @param angle the angle you want to rotate
 * @returns a matrix you can multiply a 2D position by to rotate
 */
export const rotate2D = (angle: float): mat2 | string => {
    return /* glsl */ `
        mat2 rotate2D(float angle) {
            return mat2(cos(angle),-sin(angle),
                        sin(angle),cos(angle));
        }
    `
}

/**
 * get a 3D rotation matrix from a given axis and angle
 * @param axis the axis you want to rotate on
 * @param angle the angle you want to rotate
 * @returns a matrix you can multiply a 3D position by to rotate
 */
export const rotate3D = (axis: vec3, angle: float): mat3 | string => {
    return /* glsl */ `
        mat3 rotate3D(vec3 axis, float angle) {
            return mat3(
                cos(angle) + axis.x * axis.x * (1.0 - cos(angle)),
                axis.x * axis.y * (1.0 - cos(angle)) - axis.z * sin(angle),
                axis.x * axis.z * (1.0 - cos(angle)) + axis.y * sin(angle),
        
                axis.y * axis.x * (1.0 - cos(angle)) + axis.z * sin(angle),
                cos(angle) + axis.y * axis.y * (1.0 - cos(angle)),
                axis.y * axis.z * (1.0 - cos(angle)) - axis.x * sin(angle),
        
                axis.z * axis.x * (1.0 - cos(angle)) - axis.y * sin(angle),
                axis.z * axis.y * (1.0 - cos(angle)) + axis.x * sin(angle),
                cos(angle) + axis.z * axis.z * (1.0 - cos(angle))
            );
        }
    `
}

/**
 * creates a scaling matrix with a given sclae factor
 * @param scaleFactor the factor to scale by
 * @returns a matrix that can be used to scale by the scale factor
 */
export const scale3D = (scaleFactor: float): mat4 | string => {
    return /* glsl */ `
        mat4 scale3D(float scaleFactor) {
            return mat4(scaleFactor, 0.0, 0.0, 0.0,
                        0.0, scaleFactor, 0.0, 0.0,
                        0.0, 0.0, scaleFactor, 0.0,
                        0.0, 0.0, 0.0, 1.0);
        }
    `
}

export const TransformFunctions = {
    rotate2D: rotate2D,
    rotate3D: rotate3D,
    scale3D: scale3D
}