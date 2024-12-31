import { memo, useContext, useLayoutEffect, useMemo, useRef } from "react"
import * as THREE from 'three';
import { ParticleSystemContext } from "../system/ParticleSystemContext"

// props
// colors - pass in array
// colormode - different ways to use colors
// shape - square, circle, softCircle, point, or could have different shapes with softness levels
// sizes - array
// sizeMode
// texture

// colorModes
// overLife
// random
// colorsplit - separate channels

export const PointParticle = memo(({ 
    shape            = 'circle', 
    color            = 'blue', 
    colorMode        = 'overLife', 
    size             = 59, 
    alphaFade        = 1
}) => {

    const systemCtx = useContext(ParticleSystemContext);

    // handle cases where a single value is given and convert to array
    const getArray = (input) => {
        if (!(input instanceof Array)) { input = [ input ] }
        if (input.length === 1) input = [ input[0], input[0] ];
        return input;
    }

    const colors = useMemo(() => {
        return getArray(color).map(c => new THREE.Color(c));
    }, [color]);

    const sizes = useMemo(() => {
        return getArray(size).map((s) => (shape === 'point' ? s * 5 : s));
    }, [size, shape]);

    const fades = useMemo(() => {
        return getArray(alphaFade);
    }, [alphaFade]);

    const prevParticleData = useRef(null);

    useLayoutEffect(() => {
        const [ minSize, maxSize ] = sizes;
        const [ fadeIn, fadeOut ] = fades;

        const newParticleData = { 
            type: 'point', 
            shape, 
            color: colors, 
            colorMode, 
            minSize, 
            maxSize, 
            fadeIn, 
            fadeOut 
        }

        if (JSON.stringify(newParticleData) !== JSON.stringify(prevParticleData.current)) {
            systemCtx.setParticleData(newParticleData);
            prevParticleData.current = newParticleData; 
        }

    }, [shape, colors, sizes, fades, colorMode]);

    return <></>
});