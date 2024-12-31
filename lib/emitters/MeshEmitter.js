import React, { cloneElement, useContext, useLayoutEffect } from "react"
import * as THREE from 'three';
import { ParticleSystemContext } from "../system/ParticleSystemContext.js"
import { createDataTexture, randomizeData, shufflePositionsAndNormals } from "@/_js-helpers/FBOHelpers.ts";
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { useThree } from "@react-three/fiber";

// takes the shape of any mesh
// maybe change to just geometry?
// would be cool to incorporate vertex colors of material somehow...

// sampleMode sequencial, shuffled, random

export function MeshEmitter({
    size        = 128,
    children    = null,
    sampleMode  = 'random',
    spawnRate   = 500, 
    life        = [ 1.0, 5.0 ],
    speed       = [ 0.5, 2.0 ],
    debug       = false
}) {

    const systemCtx = useContext(ParticleSystemContext);
    const { scene } = useThree();
    
    const processedChildren = React.useMemo(() => {
        return React.Children.map(children, (child) => {
            return cloneElement(child, {
                ref: (element) => {
                    if (element) {
                        systemCtx.meshDataRef.current.mesh = element;
                    }
                },
                ...child.props
            });
        });

    }, [children]);

    const getSequentialData = (initData, length, positions) => {
        const numPositions = positions.length / 3;
        for (let i = 0; i < length; i++) {
            const sourceIndex = (i % numPositions) * 3;
            const targetIndex = i * 4;
        
            initData[targetIndex + 0] = positions[sourceIndex + 0];
            initData[targetIndex + 1] = positions[sourceIndex + 1];
            initData[targetIndex + 2] = positions[sourceIndex + 2];
            initData[targetIndex + 3] = -1;
        }
        return initData;
    }

    const getNormalsData = (initData, length, normals) => {
        const numNormals = normals.length / 3;
        for (let i = 0; i < length; i++) {
            const sourceIndex = (i % numNormals) * 3;
            const targetIndex = i * 3;
        
            initData[targetIndex + 0] = normals[sourceIndex + 0];
            initData[targetIndex + 1] = normals[sourceIndex + 1];
            initData[targetIndex + 2] = normals[sourceIndex + 2];
        }
        return initData;
    }

    const visualizeNormals = (positions, normals) => {
        const normalLines = new THREE.Group();
    
        for (let i = 0; i < positions.length; i += 3) {
            const pos = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
            const normal = new THREE.Vector3(normals[i], normals[i + 1], normals[i + 2]);

            const lineScale = 0.05;
            normal.multiplyScalar(lineScale);
    
            const normalLineGeometry = new THREE.BufferGeometry().setFromPoints([pos, pos.clone().add(normal)]);
            const normalLineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
            const normalLine = new THREE.Line(normalLineGeometry, normalLineMaterial);
    
            normalLines.add(normalLine);
        }
    
        scene.add(normalLines);
    };

    const getRandomData = (initData, length, mesh) => {
        const sampler = new MeshSurfaceSampler(mesh).build();
        const targetPos = new THREE.Vector3();
        const targetNormal = new THREE.Vector3();
        const targetCol = new THREE.Color();
        const normals = [];
        const positions = [];

        for (let i = 0; i < length; i++) {

            sampler.sample(targetPos, targetNormal, targetCol);
            normals.push(targetNormal.x, targetNormal.y, targetNormal.z);
            positions.push(targetPos.x, targetPos.y, targetPos.z);

            const step = i * 4;
            initData[step + 0] = targetPos.x;
            initData[step + 1] = targetPos.y;
            initData[step + 2] = targetPos.z;
            initData[step + 3] = -1;
        }

        if (debug) visualizeNormals(positions, normals);

        systemCtx.meshDataRef.current.normals = normals;
        return initData;
    }

    useLayoutEffect(() => {

        if (!systemCtx.meshDataRef.current.mesh) return;
        const mesh = systemCtx.meshDataRef.current.mesh;

        const positions = mesh.geometry.getAttribute('position').array;
        const normals = mesh.geometry.getAttribute('normal').array;
        const numParticles = positions.length / 3;
        const minTexSize = Math.sqrt(numParticles);

        while (minTexSize > size) size = size * 2;
        const length = size * size;
        
        let initData = new Float32Array(length * 4);
        let initNormalData = new Float32Array(length * 3);

        switch(sampleMode) {
            case 'random':
                initData = getRandomData(initData, length, mesh);
                break;
            case 'sequential':
                initData = getSequentialData(initData, length, positions);
                initNormalData = getNormalsData(initNormalData, length, normals);
                systemCtx.meshDataRef.current.normals = initNormalData;
                break;
            case 'shuffled':
                initData = getSequentialData(initData, length, positions);
                initNormalData = getNormalsData(initNormalData, length, normals);
                const { shuffledPositions, shuffledNormals } = shufflePositionsAndNormals(initData, initNormalData);
                initData = shuffledPositions;
                systemCtx.meshDataRef.current.normals = shuffledNormals;
                break;
        }

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

    }, [size]);


    return <group visible={ false }>{ processedChildren }</group>
}