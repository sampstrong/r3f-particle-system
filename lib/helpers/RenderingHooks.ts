import React from "react";
import * as THREE from 'three';

interface IFrameBufferOptions {
    width: number,
    height: number
    type: THREE.TextureDataType,
    minFilter: THREE.MinificationTextureFilter,
    magFilter: THREE.MagnificationTextureFilter,
    pingPong: boolean
}

/**
 * Creates a ping pong buffer with the given scene, camera, and renderer
 * @param scene the scene to be rendered
 * @param camera the camera to be used in rendering the scene
 * @param renderer thre renderer to be used in rendeing the scene
 * @param options size, type, minFilter, magFilter. See {@link IFrameBufferOptions}
 * @returns an object with a render callback and the resulting fbo
 */
export const useFrameBuffer = (
    scene: THREE.Scene, 
    camera: THREE.Camera, 
    renderer: THREE.WebGLRenderer, 
    options: IFrameBufferOptions = { 
        width: innerWidth * Math.min(devicePixelRatio, 2), 
        height: innerHeight * Math.min(devicePixelRatio, 2), 
        type: THREE.UnsignedByteType, 
        minFilter: THREE.LinearFilter, 
        magFilter: THREE.LinearFilter,
        pingPong: true 
    }) => {

    // create ping pong buffer
    const targets = React.useMemo(() => {

        const target = new THREE.WebGLRenderTarget(options.width, options.height, {
            minFilter: options.minFilter,
            magFilter: options.magFilter,
            type: options.type,
        });

        return [ target, target.clone() ]

    }, [options.width, options.height])

    const targetIndex = React.useRef(0);

    // render callback
    const render = React.useCallback(() => {
        
        renderer.setRenderTarget(targets[targetIndex.current]);
        renderer.clear(true, true, true);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);

        const currentTarget = targets[targetIndex.current];
        if (options.pingPong) targetIndex.current = 1 - targetIndex.current;

        return currentTarget;

    }, [options.width, options.height, options.pingPong, scene, camera, renderer]);

    // cleanup
    React.useEffect(() => {
        return () => {
            targets[0].dispose();
            targets[1].dispose();
        }
    }, [options.width, options.height]);

    return { render: render, fbo: options.pingPong ? targets : targets[0] }
}


export const useDepthBuffer = ( 
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera ) => {

    // create depth darget
    const depthTarget = React.useMemo(() => {

        const depthTarget = new THREE.WebGLRenderTarget(
            window.innerWidth * Math.min(window.devicePixelRatio, 2),
            window.innerHeight * Math.min(window.devicePixelRatio, 2),
        );
        
        depthTarget.texture.minFilter = THREE.NearestFilter;
        depthTarget.texture.magFilter = THREE.NearestFilter;
        depthTarget.texture.generateMipmaps = false;
        
        depthTarget.depthBuffer = true;
        depthTarget.depthTexture = new THREE.DepthTexture(innerWidth, innerHeight);
        depthTarget.depthTexture.type = THREE.UnsignedShortType;
        depthTarget.depthTexture.format = THREE.DepthFormat;
        depthTarget.depthTexture.needsUpdate = true;

        return depthTarget;
    }, []);

    // render to depth target
    const render = React.useCallback(() => {
        
        renderer.setRenderTarget(depthTarget);
        renderer.clearColor();
        renderer.clearDepth();
        renderer.clear();
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);

        return depthTarget;

    }, []);

    // cleanup
    React.useEffect(() => {
        return () => depthTarget.dispose();
    }, [])

    return { 
        render: render,
        depthTarget: depthTarget 
    }
}

/**
 * Assigns input data to a texture, the length of the data should be a multiple of two
 * @param data the data to populate the texture with
 * @returns a data texture with the input data
 */
export const useDataTexture = (data: Float32Array, format: THREE.WebGL2PixelFormat = THREE.RGBAFormat) => {

    const dataTexture = React.useMemo(() => {

        if (!data) return null;

        const size = Math.sqrt(data.length / 4);
        const dataTexture = new THREE.DataTexture( 
            data, 
            size, 
            size, 
            format, 
            THREE.FloatType 
        );
        dataTexture.minFilter = THREE.NearestFilter;
        dataTexture.magFilter = THREE.NearestFilter;
        dataTexture.needsUpdate = true;
    
        return dataTexture;
    }, [data, format]);

    return dataTexture;
}



