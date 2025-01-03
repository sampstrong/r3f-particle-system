// layout along fbo grid so we can easily see the particles based on index/fbo layout

import React, { useContext, useLayoutEffect } from "react"
import { ParticleSystemContext } from "../system/ParticleSystemContext.js"
import { createDataTexture, createDebugPositions } from "../helpers/FBOHelpers";

export function DebugEmitter({
    size        = 128,
    spawnRate   = 500, 
    life        = [ 1.0, 5.0 ],
    speed       = [ 0.5, 2.0 ],
    gridScale   = 5
}) {

    const systemCtx = useContext(ParticleSystemContext);

    useLayoutEffect(() => {
        const initData = createDebugPositions(size, gridScale);
        const initTex = createDataTexture(initData);

        const minLife = Array.isArray(life) ? life[0] : life;
        const maxLife = Array.isArray(life) ? life[1] : life;
        const minSpeed = Array.isArray(speed) ? speed[0] : speed;
        const maxSpeed = Array.isArray(speed) ? speed[1] : speed;

        const length = size * size;
        const respawnData = [ ...initData ];
        for (let i = 0; i < length; i++) {

            let step = i * 4;
            const lifeRange = maxLife - minLife;
            const randomLife = Math.random() * lifeRange;
            respawnData[step + 3] = Math.sign(lifeRange) > 0 ? minLife + randomLife : maxLife;
        }
        const respawnTex = createDataTexture(new Float32Array(respawnData));

        systemCtx.setSourceTexture(initTex);
        systemCtx.setRespawnTexture(respawnTex);
        systemCtx.setSpawnSettings({ size, spawnRate, minLife, maxLife, minSpeed, maxSpeed });

    }, []);

    return <></>
}