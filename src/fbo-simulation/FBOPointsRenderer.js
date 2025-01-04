import React, { forwardRef, useContext, useEffect, useMemo, useRef } from "react";
import { FBOChildType } from "./FBOSimulation";
import { FBOSimulationContext } from "./FBOSimulationContext";

export const FBOPointsRenderer = forwardRef((props, ref) => {

    const fboSimCtx = useContext(FBOSimulationContext);
    const pointsRef = useRef();

    useEffect(() => {
        if (!ref) ref = pointsRef;        
        if (ref && typeof ref === 'function') {
            ref(pointsRef.current);
        } else if (ref && typeof ref === 'object') {
            ref.current = pointsRef.current;
        }
        fboSimCtx.setPointsRenderer(ref.current);
    }, []);

    const uvPositions = useMemo(() => {

        if (!fboSimCtx.size) return null;
        const size = fboSimCtx.size;

        const length = size * size;
        const uvPositions = new Float32Array(length * 3);
        for (let i = 0; i < length; i++) {
            let step = i * 3;
            uvPositions[step + 0] = (i % size) / size;
            uvPositions[step + 1] = i / size / size;
        }
        return uvPositions;

    }, [fboSimCtx.size]);

    return (
        <>
        <points frustumCulled={ false } ref={ pointsRef }>
            <shaderMaterial { ...props } />
            <bufferGeometry>
            { uvPositions && 
                <bufferAttribute
                    attach="attributes-position"
                    count={uvPositions.length / 3}
                    array={uvPositions}
                    itemSize={3}
                /> }
            </bufferGeometry> 
        </points> 
        </>
    );
});