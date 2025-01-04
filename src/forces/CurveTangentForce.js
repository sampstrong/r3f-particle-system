import * as THREE from 'three'
import React, { useContext, useLayoutEffect } from "react";
import { ParticleSystemContext } from "../system/ParticleSystemContext";

export function CurveTangentForce({ 
    direction = 1, 
    randomAmt = 0.25, 
    strength = 1 
}) {

    const systemCtx = useContext(ParticleSystemContext);

    useLayoutEffect(() => {
        if (systemCtx.sourceData && systemCtx.sourceData.type === 'curve') {
            systemCtx.setCurveTangentForce({ direction, randomAmt, strength });
        } else {
            console.warn('CurveTangentForce used without CurveSource. No force will be applied');
        }
    }, [systemCtx.sourceData]);

    return <></>
}