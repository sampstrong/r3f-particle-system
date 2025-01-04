import * as THREE from 'three';
import React, { useContext, useLayoutEffect } from "react"
import { ParticleSystemContext } from "../system/ParticleSystemContext"

export function NoiseForce({ 
    axis = 'xyz', 
    seed = 'random', 
    period = 1.0, 
    strength = 1.0 
}) {

    const systemCtx = useContext(ParticleSystemContext);

    useLayoutEffect(() => {
        if (seed === 'random') {
            const randX = Math.random() * 1000;
            const randY = Math.random() * 1000;
            const randZ = Math.random() * 1000;
            seed = new THREE.Vector3(randX, randY, randZ);
        } else {
            seed = new THREE.Vector3(seed[0], seed[1], seed[2]);
        }
        if (!(period instanceof Array)) {
            period = new THREE.Vector3(period, period, period);
        }

        systemCtx.setNoiseForce({ axis, seed, period, strength });
    }, []);

    return <></>
}