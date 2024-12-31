import { float, vec3 } from "./ShaderTypes";

export const all = () => {
    return (
        stepAA() +
        gradient5() +
        smoothstepExp() +
        pulseInOut() +
        pulseInOutExp() + 
        getTriangleEdge()
    );
}

/**
 * @param thresh value where step happens
 * @param value ramp of values used as input for the step
 * @returns stepped float value
 */
export const stepAA = (thresh?: float, value?: float): float | any => {
    return /* glsl */ `
        float stepAA(float thresh, float value) {
            float fw = fwidth(value);
            return smoothstep(thresh - fw, thresh + fw, value);
        }

        vec3 stepAA(vec3 thresh, vec3 value) {
            vec3 fw = fwidth(value);
            return smoothstep(thresh - fw, thresh + fw, value);
        }
    `
}


/**
 * 5 color gradient across a given value ramp
 * @param ramp input value that gradient will span across
 * @param c1 color 1
 * @param c2 color 2
 * @param c3 color 3
 * @param c4 color 4
 * @param c5 color 5
 * @returns vec3 color gradient
 */
export const gradient5 = (ramp?: float, c1?: vec3, c2?: vec3, c3?: vec3, c4?: vec3, c5?: vec3): vec3 | any => {
    return /* glsl */ `
        vec3 gradient5(float ramp, vec3 c1, vec3 c2, vec3 c3, vec3 c4, vec3 c5) {
            vec3 gradient = vec3(0.0);
    
            float step1 = 1.0 - smoothstep(0.1, 0.3, ramp);
            float step2 = smoothstep(0.1, 0.3, ramp) - smoothstep(0.3, 0.5, ramp);
            float step3 = smoothstep(0.3, 0.5, ramp) - smoothstep(0.5, 0.7, ramp);
            float step4 = smoothstep(0.5, 0.7, ramp) - smoothstep(0.7, 0.9, ramp);
            float step5 = smoothstep(0.7, 0.9, ramp);
                
            gradient += c1 * step1;
            gradient += c2 * step2;
            gradient += c3 * step3;
            gradient += c4 * step4;
            gradient += c5 * step5;
    
            return gradient;
        }
    `
}

/**
 * smoothstep function with exposnential curve
 * @param edge0 starting edge of step
 * @param edge1 ending edge of step
 * @param x the value to step across
 * @param power the power of the exponential curve
 * @returns a shaped float value
 */
export const smoothstepExp = (edge0?: float, edge1?: float, x?: float, power?: float): float | any => {
    return /* glsl */ `
        float smoothstepExp(float edge0, float edge1, float x, float power) {
            float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
            t = pow(t, power); 
            return t * t * (3.0 - 2.0 * t);
        }
    `
}

/**
 * creates a linear pulse shape with custom attack, width, and decay
 * @param edge position of the pulse relative to x
 * @param x the ramp of values the pulse will run across
 * @param attack the steepness of the front slope of the pulse
 * @param decay the falloff of the pulse
 * @param width the space between the attack and decay
 * @returns strength value
 */
export const pulseInOut = (edge?: float, x?: float, attack?: float, decay?: float, width?: float): float | any => { 
    return /* glsl */ `
        float pulseInOut(float edge, float x, float attack, float decay, float width) {
            return smoothstep(edge - decay, edge, x) -
                   smoothstep(edge + width, edge + width + attack, x);
        }
    `
}

/**
 * creates an exponential pulse  shape with custom attack, width, and decay
 * 
 * DEPENDENCIES: {@link smoothstepExp}
 * 
 * @param edge position of the pulse relative to x
 * @param x the ramp of values the pulse will run across
 * @param attack the steepness of the front slope of the pulse
 * @param attackExp the exponent value of the attack
 * @param decay the falloff of the pulse
 * @param decayExp the exposnent value of the decay
 * @param width the space between the attack and decay
 * @returns 
 */
export const pulseInOutExp = (edge?: float, x?: float, attack?: float, attackExp?: float, decay?: float, decayExp?: float, width?: float): float | any => {
    return /* glsl */ `
        float pulseInOutExp(float edge, float x, float attack, float attackExp, float decay, float decayExp, float width) {
            return smoothstepExp(edge - decay, edge, x, decayExp) -
                   smoothstepExp(edge + width, edge + width + attack, x, attackExp);
        }
    `
}

/**
 * creates wireframe edges at the edge of each triangle in the mesh
 * 
 * @param barycentricCoords the barycentric coords of the fragment
 * @param lineWidth the desired width of the edge line
 * @returns the value of the triangle edge
 */
export const getTriangleEdge = (barycentricCoords?: vec3, lineWidth?: float): float | any => {
    return /* glsl */ `
        float getTriangleEdge(vec3 barycentricCoords, float lineWidth) {
            vec3 d = fwidth(barycentricCoords);
            vec3 f = stepAA(d * lineWidth, barycentricCoords);
            return min(min(f.x, f.y), f.z);
        }
    `
}

export const ShapingFunctions = {
    all: all,
    stepAA: stepAA,
    gradient5: gradient5,
    smoothstepExp: smoothstepExp,
    pulseInOut: pulseInOut,
    pulseInOutExp: pulseInOutExp,
    getTriangleEdge: getTriangleEdge
}