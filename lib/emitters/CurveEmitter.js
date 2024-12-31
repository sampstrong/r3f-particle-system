import * as THREE from 'three';
import { useContext, useLayoutEffect, useMemo, useRef } from "react";
import { ParticleSystemContext } from "../system/ParticleSystemContext.js";
import { createDataTexture } from '@/_js-helpers/FBOHelpers.ts';
import { useThree } from '@react-three/fiber';
import SmoothCurve from '@/_react-components/SmoothCurve.js';

// sample mode - sequential or random

export default function CurveEmitter({ 
    curve            = null,
    sampleMode       = 'random',
    points           = [ [ 0, 0, 0 ], [ 0, 1, 0 ] ], 
    controlOffset    = 0.1,
    isLoop           = false, 
    resolution       = 100, 
    randomOffset     = 0.1,
    debug            = false, 
    size             = 128, 
    spawnRate        = 500, 
    life             = [ 1.0, 5.0 ],
    speed            = [ 0.5, 2.0 ],
}) {

    const systemCtx = useContext(ParticleSystemContext);
    const lineRef = useRef();

    const { scene } = useThree();
    
    const sourceCurve = useMemo(() => {
        if (curve) return curve;
        points.forEach((p, i) => {
            points[i] = new THREE.Vector3(p[0], p[1], p[2]);
        });
        const sourceCurve = new SmoothCurve(scene, points, isLoop, controlOffset);
        if (debug) sourceCurve.addDebugPointsToScene(scene);
        return sourceCurve.curvePath;
    }, [debug, curve]);


    const sampledPoints = useMemo(() => sourceCurve.getPoints(resolution), [sourceCurve, resolution]);

    useLayoutEffect(() => {
        lineRef.current.geometry.setFromPoints(sampledPoints);

        let initData = [];
        const length = size * size;
        for (let i = 0; i < length; i++) {
            const samplePos = sampleMode === 'random' ? Math.random() : (i / length) // ((i / length) * 100) % 1;
            const pos = sourceCurve.getPoint(samplePos);

            const tangent = sourceCurve.getTangent(samplePos).normalize();
            let binormal = new THREE.Vector3();
            const normal = new THREE.Vector3();

            if (Math.abs(tangent.x) < 0.9) normal.set(1, 0, 0);
            else normal.set(0, 1, 0);

            binormal = tangent.clone().cross(normal);

            const angle = Math.random() * Math.PI * 2;
            const quaternion = new THREE.Quaternion().setFromAxisAngle(tangent, angle);
            const offset = binormal.applyQuaternion(quaternion);
            offset.multiplyScalar(Math.random() * randomOffset);

            pos.add(offset);

            initData.push(pos.x, pos.y, pos.z, -1);
        }
        initData = new Float32Array(initData);
        const initTex = createDataTexture(initData);

        const minLife = Array.isArray(life) ? life[0] : life;
        const maxLife = Array.isArray(life) ? life[1] : life;
        const minSpeed = Array.isArray(speed) ? speed[0] : speed;
        const maxSpeed = Array.isArray(speed) ? speed[1] : speed;

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
        systemCtx.setSourceData({ type: 'curve', ref: sourceCurve });

    }, [sourceCurve, sampleMode]);

    return (
        <group visible={ debug }>
            <line ref={ lineRef }>
                <bufferGeometry />
                <lineBasicMaterial visible={ debug } attach="material" color="red" />
            </line>
        </group>
    );
}