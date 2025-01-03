import * as THREE from 'three';
import React, { forwardRef } from "react";
import { useFrame } from "@react-three/fiber";

import { FBOSimulationShader } from "../fbo-simulation/FBOSimulationShader";
import { FBOSimulation } from "../fbo-simulation/FBOSimulation";
import { FBOPointsRenderer } from "../fbo-simulation/FBOPointsRenderer";

import { createDataTexture } from "../helpers/FBOHelpers";
import { simulationShader } from "./shaders/simulationShader";
import { pointsShader } from "./shaders/pointsShader";
import { ParticleSystemContext, ParticleSystemContextProvider } from "./ParticleSystemContext";
import { useAppStatus } from '../helpers/appStatus';



// system wrapper so we can access context
export const ParticleSystem = forwardRef((props, ref) => {
    return (
        <ParticleSystemContextProvider>
            <SystemManager ref={ ref } { ...props } />
        </ParticleSystemContextProvider>
    )
});


// need better way to pass source data in...
const SystemManager = forwardRef(({ 
    simulationSpace = 'local', 
    normalizeForces = false, 
    depthWrite = false,
    depthTest = true,
    blending = THREE.NormalBlending,
    children 
}, ref) => {

    const systemCtx = React.useContext(ParticleSystemContext);
    const simShaderRef = React.useRef();
    const pointsRef = React.useRef();
    const spawnIdx = React.useRef(0);
    const prevSpawnIdx = React.useRef(0);

    //#region ------ UTILITY FUNCTIONS ------

    const getRandFloat = (min, max) => {
        return min + (max - min) * Math.random();
    }

    //#endregion
    
    //#region ------ INIT DATA FROM CONTEXT ------
    
    const [ systemActive, setSystemActive ] = React.useState(true);
    const [ systemInitialized, setSystemInitialized ] = React.useState(false);

    // initialize system when source texture is available 
    React.useEffect(() => {
        if (!systemCtx.spawnSettings) return;
        setSystemInitialized(true);
    }, [systemCtx.spawnSettings]);
    
    // store total particle count
    const count = React.useMemo(() => {
        if (!systemInitialized) return;
        return Math.pow(systemCtx.spawnSettings.size, 2);
    }, [systemCtx.spawnSettings, systemInitialized]);

    //#endregion

    //#region ----- PER PARTICLE DATA ------

    const randValuesTex = React.useMemo(() => {

        if (!systemInitialized) return;
        const { size } = systemCtx.spawnSettings;
            
        const data = [];
        const length = size * size;

        for (let i = 0; i < length; i++) {
            data.push(Math.random(), Math.random(), Math.random(), Math.random());
        }  
        
        return createDataTexture(new Float32Array(data));

    }, [systemCtx.spawnSettings, systemInitialized]);

    const perParticleVelocityTex = React.useMemo(() => {

        if (!systemInitialized) return;
        const { size, minSpeed, maxSpeed } = systemCtx.spawnSettings;

        let dir = new THREE.Vector3();

        const data = [];
        const length = size * size;

        for (let i = 0; i < length; i++) {

            dir.set(0, 0, 0);

            if (systemCtx.curveTangentForce) {

                const { strength, direction, randomAmt } = systemCtx.curveTangentForce;

                const samplePos = ((i / length) * 100) % 1;
                const curve = systemCtx.sourceData.ref;
                const tangent = curve.getTangent(samplePos)
                    .normalize()
                    .multiplyScalar(strength)
                    .multiplyScalar(direction);

                const randVec = new THREE.Vector3(
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1
                ).normalize();

                const crossVec = randVec.clone().cross(tangent).normalize();
                const angle = Math.random() * Math.PI * randomAmt;
                const quat = new THREE.Quaternion().setFromAxisAngle(crossVec, angle);
                tangent.applyQuaternion(quat);

                dir.add(tangent);
            } else if (systemCtx.normalForce) {
                const step = i * 3;
                dir.set(
                    systemCtx.normalForce.normals[step + 0], 
                    systemCtx.normalForce.normals[step + 1], 
                    systemCtx.normalForce.normals[step + 2]
                );
            }

            // a - rand speed
            const randSpeed = getRandFloat(minSpeed, maxSpeed);
            data.push(dir.x, dir.y, dir.z, randSpeed);
        }

        return createDataTexture(new Float32Array(data));

    }, [systemInitialized, 
        systemCtx.spawnSettings, 
        systemCtx.directionalForce, 
        systemCtx.curveTangentForce, 
        systemCtx.normalForce, 
        systemCtx.sourceData]);


    // per particle points shader data
    // random point size setup - can just use regular vertex buffer
    React.useEffect(() => {

        if (!systemInitialized) return;
        const { size } = systemCtx.spawnSettings;
        const length = size * size;

        // random size per particle data
        const randSizeData = [];
        for (let i = 0; i < length; i++) {
            const minS = systemCtx.particleData.minSize, maxS = systemCtx.particleData.maxSize;
            const randScale = getRandFloat(minS, maxS);
            randSizeData.push(randScale);
        }
        const randSizes = new Float32Array(randSizeData);

        const pointsGeo = pointsRef.current.geometry;
        pointsGeo.setAttribute('aRandPointSize', new THREE.BufferAttribute(randSizes, 1));

        // random color per particle data
        const randColorData = [];
        const colors = systemCtx.particleData.color;
        for (let i = 0; i < length; i++) {
            const randIndex = Math.floor(Math.random() * colors.length);
            const color = colors[randIndex];
            randColorData.push(color.r, color.g, color.b);
        }
        const randColors = new Float32Array(randColorData);
        pointsGeo.setAttribute('aRandColor', new THREE.BufferAttribute(randColors, 3));

        if (!systemCtx.normalForce) return;
        const normals = new Float32Array(systemCtx.normalForce.normals);
        pointsGeo.setAttribute('aNormal', new THREE.BufferAttribute(normals, 3));

    }, [systemInitialized, systemCtx.particleData, systemCtx.spawnSettings, systemCtx.normalForce]);

    //#endregion

    //#region ------ DEFINES ------

    const simulationDefines = React.useMemo(() => {

        if (!systemInitialized) return;

        const defines = {}

        switch (simulationSpace) {
            case 'local':
                defines.USE_LOCAL_SPACE = '';
                break;
            case 'world':
                defines.USE_WORLD_SPACE = '';
                break;
        }
        if (normalizeForces) {
            defines.NORMALIZE_FORCES = '';
        }

        if (systemCtx.directionalForce) {
            defines.NUM_DIRECTIONAL_FORCES = systemCtx.directionalForce.directions.length;
            switch (systemCtx.directionalForce.mode) {
                case 'overLife':
                    defines.USE_DIRECTIONAL_FORCE_OVERLIFE = '';
                    break;
                default:
                    defines.USE_DIRECTIONAL_FORCE_CONSTANT = '';
                    break;
            }
        }
        if (systemCtx.noiseForce) {
            switch (systemCtx.noiseForce.axis) {
                case 'xyz':
                    defines.USE_NOISE_FORCE_XYZ = '';
                    defines.CURL_3D = '';
                    break;
                case 'xy':
                    defines.USE_NOISE_FORCE_XY = '';
                    defines.CURL_2D = '';
                    break;
                case 'xz':
                    defines.USE_NOISE_FORCE_XZ = '';
                    defines.CURL_2D = '';
                    break;
                case 'yz':
                    defines.USE_NOISE_FORCE_YZ = '';
                    defines.CURL_2D = '';
                    break;
            }
        }
        if (systemCtx.rotationalForce) {
            switch (systemCtx.rotationalForce.axis) {
                case 'xy':
                    defines.USE_ROTATIONAL_FORCE_XY = '';
                    break;
                case 'xz':
                    defines.USE_ROTATIONAL_FORCE_XZ = '';
                    break;
                case 'yz':
                    defines.USE_ROTATIONAL_FORCE_YZ = '';
                    break;
            }
        }
        if (systemCtx.pointForce) {
            switch (systemCtx.pointForce.axis) {
                case 'xyz':
                    defines.USE_POINT_FORCE_XYZ = '';
                    break;
                case 'xy':
                    defines.USE_POINT_FORCE_XY = '';
                    break;
                case 'xz':
                    defines.USE_POINT_FORCE_XZ = '';
                    break;
                case 'yz':
                    defines.USE_POINT_FORCE_YZ = '';
                    break;
            }
            if (systemCtx.pointForce.returnForce) {
                defines.USE_RETURN_FORCE = '';
            }
        }
        if (systemCtx.curveTangentForce) {
            defines.USE_CURVE_TANGENT_FORCE = '';
        }
        if (systemCtx.normalForce) {
            defines.USE_NORMAL_FORCE = '';
        }
        
        return defines;

    }, [systemInitialized, 
        simulationSpace,
        normalizeForces,
        systemCtx.directionalForce, 
        systemCtx.noiseForce, 
        systemCtx.rotationalForce, 
        systemCtx.pointForce, 
        systemCtx.curveTangentForce,
        systemCtx.normalForce]);

    const pointsDefines = React.useMemo(() => {
        if (!systemInitialized) return;

        const defines = {}

        switch (simulationSpace) {
            case 'local':
                defines.USE_LOCAL_SPACE = '';
                break;
            case 'world':
                defines.USE_WORLD_SPACE = '';
                break;
        }

        if (systemCtx.particleData) {

            defines.NUM_COLORS = systemCtx.particleData.color.length;

            switch (systemCtx.particleData.colorMode) {
                case 'overLife': 
                    defines.USE_COLOR_OVER_LIFE = '';
                    break;
                case 'random':
                    defines.USE_COLOR_RANDOM = '';
                    break;
            }

            switch (systemCtx.particleData.shape) {
                case 'circle':
                    defines.USE_CIRCLE = '';
                    break;
                case 'softCircle':
                    defines.USE_SOFT_CIRCLE = '';
                    break;
                case 'point':
                    defines.USE_POINT = '';
                    break;
                case 'square':
                    defines.USE_SQUARE = '';
                    break;
            }
        }

        return defines;

    }, [systemInitialized, simulationSpace, systemCtx.particleData]);

    //#endregion

    //#region ------ UNIFORMS ------

    const simulationUniforms = React.useMemo(() => {

        if (!systemInitialized) return;

        const uniforms = {
            uTime: { value: 0 },
            uFBO: { value: systemCtx.sourceTexture },
            uSpawnTex: { value: systemCtx.respawnTexture },
            uRandValuesTex: { value: randValuesTex },
            uPerParticleVelocityTex: { value: perParticleVelocityTex },
            uDelta: { value: 0 },
            uCount: { value: count },
            uSpawnIdx: { value: spawnIdx },
            uPrevSpawnIdx: { value: prevSpawnIdx },
            uSpawnSettings: { value: { 
                minSpeed: systemCtx.spawnSettings.minSpeed, 
                maxSpeed: systemCtx.spawnSettings.maxSpeed 
            } },
            uModelMatrix: { value: new THREE.Matrix4().identity() }
        }

        if (systemCtx.directionalForce) {
            uniforms.uDirectionalForce = { value: {
                directions: systemCtx.directionalForce.directions,
                randomAmt: systemCtx.directionalForce.randomAmt,
                strength: systemCtx.directionalForce.strength
            } }
        }
        if (systemCtx.noiseForce) {
            uniforms.uNoiseForce = { value: { 
                seed: systemCtx.noiseForce.seed, 
                period: systemCtx.noiseForce.period,
                strength: systemCtx.noiseForce.strength
            } }
        }
        if (systemCtx.rotationalForce) {
            uniforms.uRotationalForce = { value: {
                strength: systemCtx.rotationalForce.strength,
                center: systemCtx.rotationalForce.center
            } }
        }
        if (systemCtx.pointForce) {
            uniforms.uPointForce = { value: {
                position: systemCtx.pointForce.position,
                direction: systemCtx.pointForce.direction === 'towards' ? 1 : -1,
                effectiveDist: systemCtx.pointForce.effectiveDist,
                strength: systemCtx.pointForce.strength
            } }
            if (systemCtx.pointForce.returnForce) {
                uniforms.uReturnForce = {
                    strength: systemCtx.pointForce.returnStrength
                }
            }
        }
        if (systemCtx.curveTangentForce) {
            uniforms.uCurveTangentForce = { value: {
                strength: systemCtx.curveTangentForce.strength
            } }
        }
        if (systemCtx.normalForce) {   
            uniforms.uNormalForce = { value: {
                strength: systemCtx.normalForce.strength
            } }
        }

        return uniforms;

    }, [systemInitialized, 
        perParticleVelocityTex,
        systemCtx.spawnSettings,
        systemCtx.directionalForce, 
        systemCtx.noiseForce, 
        systemCtx.sourceTexture, 
        systemCtx.respawnTexture, 
        systemCtx.rotationalForce,
        systemCtx.pointForce,
        systemCtx.curveTangentForce,
        systemCtx.normalForce]);

    const pointsUniforms = React.useMemo(() => ({
        uFBO: { value: systemCtx.sourceTexture },
        uSpawnTex: { value: systemCtx.respawnTexture },
        uColors: { value: systemCtx.particleData.color },
        uFadeIn: { value: systemCtx.particleData.fadeIn },
        uFadeOut: { value: systemCtx.particleData.fadeOut }
    }), [systemCtx.sourceTexture, systemCtx.respawnTexture, systemCtx.particleData]);


    // listen to uniform value changes and update shaders
    React.useEffect(() => {

        if (!systemInitialized) return;

        // simulation shader
        if (systemCtx.directionalForce) {
            simShaderRef.current.uniforms.uDirectionalForce.value = {
                directions: systemCtx.directionalForce.directions,
                randomAmt: systemCtx.directionalForce.randomAmt,
                strength: systemCtx.directionalForce.strength
            }
        }
        if (systemCtx.noiseForce) {
            simShaderRef.current.uniforms.uNoiseForce.value = {
                seed: systemCtx.noiseForce.seed, 
                period: systemCtx.noiseForce.period,
                strength: systemCtx.noiseForce.strength
            }
        }
        if (systemCtx.rotationalForce) {
            simShaderRef.current.uniforms.uRotationalForce.value = {
                strength: systemCtx.rotationalForce.strength,
                center: systemCtx.rotationalForce.center
            }
        }
        if (systemCtx.pointForce) {
            simShaderRef.current.uniforms.uPointForce.value = {
                position: systemCtx.pointForce.position,
                direction: systemCtx.pointForce.direction === 'towards' ? 1 : -1,
                effectiveDist: systemCtx.pointForce.effectiveDist,
                strength: systemCtx.pointForce.strength
            }
            if (systemCtx.pointForce.returnForce) {
                simShaderRef.current.uniforms.uReturnForce.value = {
                    strength: systemCtx.pointForce.returnStrength
                }
            }
        }

        //points shader
        if (systemCtx.particleData) {
            pointsRef.current.material.uniforms.uColors.value = systemCtx.particleData.color;
        }

    }, [systemInitialized,
        systemCtx.directionalForce, 
        systemCtx.noiseForce, 
        systemCtx.rotationalForce, 
        systemCtx.pointForce, 
        systemCtx.particleData,
        systemCtx.returnForce]);


    //#endregion

    //#region ------ IMPERATIVE API ------

    const start = () => {
        setSystemActive(true);
    }

    const pause = () => {
        setSystemActive(false);
    }

    const createBurst = (burstSize) => {

        prevSpawnIdx.current = spawnIdx.current;
        spawnIdx.current = (spawnIdx.current + burstSize) % count;

        simShaderRef.current.uniforms.uSpawnIdx.value = spawnIdx.current;
        simShaderRef.current.uniforms.uPrevSpawnIdx.value = prevSpawnIdx.current;

        setTimeout(() => {
            prevSpawnIdx.current = spawnIdx.current;
            simShaderRef.current.uniforms.uSpawnIdx.value = spawnIdx.current;
            simShaderRef.current.uniforms.uPrevSpawnIdx.value = prevSpawnIdx.current;
        }, 100);
    }

    React.useImperativeHandle(ref, () => ({ start, pause, createBurst }));

    //#endregion

    //#region ------ UPDATE LOOP ------

    const { appActive } = useAppStatus();
    const activeTimeRef = React.useRef(0);

    useFrame(({ clock }, delta) => {

        if (!appActive) return; 
        if (!systemActive) return;
        if (!systemInitialized) return;
        if (!simShaderRef.current) return;
        if (!prevSpawnIdx.current) prevSpawnIdx.current = spawnIdx.current;

        if (delta > 1) return;
        activeTimeRef.current += delta;

        const { spawnRate } = systemCtx.spawnSettings;
        const particlesToSpawn = Math.floor(spawnRate * delta);
        spawnIdx.current = (spawnIdx.current + particlesToSpawn) % count;

        simShaderRef.current.uniforms.uTime.value = activeTimeRef.current;
        simShaderRef.current.uniforms.uSpawnIdx.value = spawnIdx.current;
        simShaderRef.current.uniforms.uPrevSpawnIdx.value = prevSpawnIdx.current;
        simShaderRef.current.uniforms.uModelMatrix.value = pointsRef.current.matrixWorld;

        prevSpawnIdx.current = spawnIdx.current;
    });

    //#endregion
    

    return (
        <group>
            { children }
            { systemInitialized && 
            <FBOSimulation size={ systemCtx.spawnSettings.size } debug={ false }>
                <FBOSimulationShader 
                    ref={ simShaderRef }
                    uniformKey="uFBO" 
                    defines={ simulationDefines }
                    uniforms={ simulationUniforms }
                    vertexShader={ simulationShader.vertex }
                    fragmentShader={ simulationShader.fragment }
                />
                <FBOPointsRenderer 
                    ref={ pointsRef }
                    defines={ pointsDefines }
                    uniforms={ pointsUniforms }
                    vertexShader={ pointsShader.vertex }
                    fragmentShader={ pointsShader.fragment }
                    depthTest={ depthTest }
                    depthWrite={ depthWrite }
                    blending={ blending }
                    transparent
                />
            </FBOSimulation> }
        </group>
    );
});
