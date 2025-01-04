import * as THREE from 'three';
import React, { useContext, useLayoutEffect, useRef } from "react"
import { ParticleSystemContext } from "../system/ParticleSystemContext"

export function PointForce({ 
    position = [ 0, 0, 0 ], 
    direction = 'towards', 
    axis = 'xyz', 
    effectiveDist = 1, 
    strength = 1,
    returnForce = true,
    returnStrength = 1 
}) {

    const systemCtx = useContext(ParticleSystemContext);
    const positionRef = useRef(new THREE.Vector3());

    useLayoutEffect(() => {
        position = positionRef.current.set(position[0], position[1], position[2]);
        systemCtx.setPointForce({ position, direction, axis, effectiveDist, strength, returnForce, returnStrength });
    }, [position, direction, axis, effectiveDist, strength]);

    return <></>
}