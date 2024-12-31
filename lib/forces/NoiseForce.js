import * as THREE from 'three';
import { useContext, useLayoutEffect } from "react"
import { ParticleSystemContext } from "../system/ParticleSystemContext"

// props
// axes - XYZ, XY, XZ, YZ - will determine defines
// seed - [ 10, 20, 3 ] - array of x y z offsets from noise origin, or 'random'
// period [ X, Y, Z ] - will essentially be the noise scale along each axis, optional single value to set uniformly

// Todo
// strength over life would be nice here... could start in a specific direction then get more noisy

// would be amazing to to a 3D curl along surface tangent if we are using a mesh source


export function NoiseForce({ 
    axis = 'xyz', 
    seed = 'random', 
    period = 1.0, 
    strength = 1.0 
}) {

    const systemCtx = useContext(ParticleSystemContext);

    useLayoutEffect(() => {
        if (seed === 'random') {
            const randX = Math.random() * 1000;
            const randY = Math.random() * 1000;
            const randZ = Math.random() * 1000;
            seed = new THREE.Vector3(randX, randY, randZ);
        } else {
            seed = new THREE.Vector3(seed[0], seed[1], seed[2]);
        }
        if (!(period instanceof Array)) {
            period = new THREE.Vector3(period, period, period);
        }

        systemCtx.setNoiseForce({ axis, seed, period, strength });
    }, []);

    return <></>
}