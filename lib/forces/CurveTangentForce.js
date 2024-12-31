import * as THREE from 'three'
import { useContext, useLayoutEffect } from "react";
import { ParticleSystemContext } from "../system/ParticleSystemContext";

// direction 1 or -1
// randomization from 0 to 1 - random deviation from tangent per particle

export default function CurveTangentForce({ 
    direction = 1, 
    randomAmt = 0.25, 
    strength = 1 }) {

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