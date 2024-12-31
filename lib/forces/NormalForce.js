import { useContext, useLayoutEffect } from "react"
import { ParticleSystemContext } from "../system/ParticleSystemContext.js"

export function NormalForce({ strength = 1 }) {

    const systemCtx = useContext(ParticleSystemContext);

    useLayoutEffect(() => {
        if (!systemCtx.meshDataRef.current.mesh) {
            console.warn('The NormalForce component requires a MeshSource component with a valid child mesh to work.');
            return;
        } else {
            const normals = [...systemCtx.meshDataRef.current.normals];
            systemCtx.setNormalForce({ normals, strength });
        }
    }, [strength]);

    return <></>
}