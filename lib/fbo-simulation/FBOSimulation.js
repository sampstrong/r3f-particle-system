import * as THREE from 'three';
import { createPortal, useFrame, useThree, dispose } from "@react-three/fiber";
import React, { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useFrameBuffer } from "@/lib/helpers/RenderingHooks";
import { readPixelBuffer } from "@/lib/helpers/FBOHelpers";
import { FBOSimulationContext, FBOSimulationContextProvider } from "./FBOSimulationContext";
import { useAppStatus } from '@/lib/helpers/appStatus.js';

// should probably just use typescript and do real type checking
export const FBOChildType = {
    Shader: 0,
    Points: 1,
    InstancedMesh: 2
}

const FBOSimulation = forwardRef((props, ref) => {
    return (
        <FBOSimulationContextProvider>
            <SimulationManager ref={ ref } { ...props } />
        </FBOSimulationContextProvider>
    );
});
export default FBOSimulation;

const SimulationManager = forwardRef(({ children, size = 128, renderer = null, render = true, debug = false }, ref) => {
    
    const fboSimCtx = useContext(FBOSimulationContext);

    const [ initialized, setInitialized ] = useState(false);
    const fboRef = useRef(null);

    //#region ------ INITIALIZATION ------

    useEffect(() => {
        fboSimCtx.setSize(size);
    }, [size]);

    useEffect(() => {
        if (!fboSimCtx.pointsRenderer || !fboSimCtx.simulationShader) return;
        setInitialized(true);
    }, [fboSimCtx.pointsRenderer, fboSimCtx.simulationShader]);

    //#endregion

    //#region ------ SIMULATION CONFIG ------

    const camera = React.useMemo(() => {
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1);
        camera.position.z = 1;
        return camera;
    }, []);

    const scene = React.useMemo(() => {
        const scene = new THREE.Scene();
        scene.add(camera);
        return scene;
    }, []);

    //#endregion

    //#region ------ RENDER LOOP ------

    const { gl } = useThree();

    const frameBuffer = useFrameBuffer(
        scene, 
        camera, 
        renderer || gl, 
        { 
            width: size, 
            height: size, 
            type: THREE.FloatType,
            minFilter: THREE.NearestFilter, 
            magFilter: THREE.NearestFilter,
            pingPong: true 
        }
    );

    const { appActive } = useAppStatus();

    useFrame(({ clock }, delta) => {

        if (!appActive) return;
        if (!render) return;
        if (!initialized) return;
        if (delta > 1) return;

        const target = frameBuffer.render();
        const fboPass = fboSimCtx.simulationShader;

        fboPass.shader.uniforms[fboPass.key].value = target.texture;
        fboPass.shader.uniforms.uDelta.value = delta;
        fboSimCtx.pointsRenderer.material.uniforms[fboPass.key].value = target.texture;

        fboRef.current = target;

        if (!debug) return;
        const pixelBuffer = readPixelBuffer(target, renderer || gl, size);
        console.log(pixelBuffer);
    });

    //#endregion

    //#region ------ IMPERATIVE API ------

    const getFBO = () => fboRef.current;
    const getFBOArray = () => readPixelBuffer(fboRef.current, renderer || gl, size);

    useImperativeHandle(ref, () => ({
        getFBO,
        getFBOArray
    }));

    //#endregion

    // cleanup
    useEffect(() => {
        return () => {
            if (camera) dispose(camera);
            if (scene) dispose(scene);
        }
    }, []);

    return <>
        { children }
        { initialized && <>
            {createPortal(  
                <mesh>
                    { fboSimCtx.simulationShader.node }
                    <planeGeometry args={[ 2, 2 ]} />
                </mesh>,
                scene
            )}
        </> }
    </>;
});
