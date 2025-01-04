import React, { useContext, useLayoutEffect } from "react"
import * as THREE from 'three';
import { ParticleSystemContext } from "../system/ParticleSystemContext"

export function DirectionalForce({ 
    direction      = [0, 1, 0], 
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

        const directionMode = directions.length > 1 ? 'overLife' : 'constant';

        systemCtx.setDirectionalForce({ directions: directions, mode: directionMode, randomAmt, strength });
    }, []);

    return <></>
}