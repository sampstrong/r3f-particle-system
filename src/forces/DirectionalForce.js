import React, { useContext, useLayoutEffect } from "react"
import * as THREE from 'three';
import { ParticleSystemContext } from "../system/ParticleSystemContext"

// props
// directions - array
// directionMode - randomInterpolated, randomExact, overlife, deviation
// strength

// directions = [ [0, 1, 1], [0, 0, 1] ] - nested arrays for simplification
// should probably have a maximum number allowed

// would be great to be able to lerp between different types of forces over time...
// directional to radial for example
// best way to do this is probably to keep separate components and have strength over time values for each

// also would be good to have a direction mode where you can choose a single direction along with a diviation 
// from that direction that is allowed and will happen randomly per particle

export function DirectionalForce({ 
    direction      = [ [0, 1, 0], [0, 0, 1] ], 
    directionMode   = 'random', 
    randomAmt       = 0,
    strength        = 1 
}) {

    const systemCtx = useContext(ParticleSystemContext);

    useLayoutEffect(() => {

        let directions = [];

        // handle nested arrays for direction
        if (Array.isArray(direction[0])) {
            direction.forEach(d => {
                directions.push(new THREE.Vector3(d[0], d[1], d[2]));
            });
        } else {
            directions.push(new THREE.Vector3(direction[0], direction[1], direction[2]));
        }

        systemCtx.setDirectionalForce({ directions: directions, mode: directionMode, randomAmt, strength });
    }, []);

    return <></>
}