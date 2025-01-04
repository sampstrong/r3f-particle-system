import * as THREE from 'three';
import React, { useContext, useLayoutEffect } from "react"
import { ParticleSystemContext } from "../system/ParticleSystemContext.js"

export function RotationalForce({ 
    center = [ 0, 0, 0 ], 
    axis = 'xz', 
    strength = 1.0 
}) {

    const systemCtx = useContext(ParticleSystemContext);

    useLayoutEffect(() => {
        center = new THREE.Vector3(center[0], center[1], center[2]);
        systemCtx.setRotationalForce({ center, axis, strength });
    }, []);

    return <></>
}