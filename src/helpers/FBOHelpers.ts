import * as THREE from 'three';

/**
 * Reads pixel data from a given render target
 * @param renderTarget the render target to read
 * @param renderer the renderer to use
 * @param size the size of the render target texture
 * @returns a pixel buffer array filled with data from the target
 */
export const readPixelBuffer = (
    renderTarget: THREE.WebGLRenderTarget, 
    renderer: THREE.WebGLRenderer, 
    size: number) => {

    const length = size * size;
    const pixelBuffer = new Float32Array(length * 4);
    renderer.readRenderTargetPixels(
        renderTarget,
        0,
        0,
        size,
        size,
        pixelBuffer
    );
    return pixelBuffer;
}

/**
 * Creates an array of random positional data randomly within the bounds of a cube.
 * @param size the size of the fbo
 * @param xLength the size of the cube on the x axis
 * @param yLength the size of the cube on the y axis
 * @param zLength the size of the cube on the z axis
 * @returns an array with starting positions that can be used to create a data texture
 */
export const createBoxPositions = (
    size: number = 128, 
    xLength: number = 1, 
    yLength: number = 0, 
    zLength: number = 1): Float32Array => {

    const initData = [];
    const length = size * size;
    for (let i = 0; i < length; i++) {

        const x = (Math.random() * 2 - 1) * xLength;
        const y = (Math.random() * 2 - 1) * yLength;
        const z = (Math.random() * 2 - 1) * zLength;
        const w = -1;

        initData.push(x, y, z, w);
    }
    return new Float32Array(initData);
}

/**
 * Creates an array of random positional data randomly within the bounds of a cylinder
 * @param size the size of the fbo
 * @param innerRadius the inner radius inside which no positions will be placed
 * @param outerRadius the outer radius outside which no positions will be placed
 * @param height the height of the cylinder
 * @param arc the angle range within which positions will be placed
 * @returns an array with starting positions that can be used to create a data texture
 */
export const createCylinderPositions = (
    size: number = 128, 
    innerRadius: number = 0, 
    outerRadius: number = 1, 
    height: number = 0, 
    arc: number = Math.PI * 2): Float32Array => {

    const initData = [];
    const length = size * size;
    for (let i = 0; i < length; i++) {

        let radius = innerRadius + (outerRadius - innerRadius) * Math.random();
        const angle = arc * Math.random();
        const x = Math.sin(angle) * radius;
        const y = height;
        const z = Math.cos(angle) * radius;
        const w = -1;

        initData.push(x, y, z, w);
    }
    return new Float32Array(initData);
}

/**
 * Creates an array of random positional data randomly on the surface or within the bounds of a sphere
 * @param size the size of the fbo
 * @param radius the radius of the sphere
 * @param conformToSurface whether to assign positions within the volume or on the surface
 * @returns an array with starting positions that can be used to create a data texture
 */
export const createSpherePositions = (
    size: number = 128,
    radius: number = 1,
    conformToSurface: boolean = true): Float32Array => {

    const initData = [];
    const length = size * size;
    for (let i = 0; i < length; i++) {
        
        let x = Math.random() * 2 - 1;
        let y = Math.random() * 2 - 1;
        let z = Math.random() * 2 - 1;

        let vec = new THREE.Vector3(x, y, z).normalize().multiplyScalar(radius);
        if (!conformToSurface) vec = vec.clone().multiplyScalar(Math.random());

        x = vec.x;
        y = vec.y;
        z = vec.z;
        const w = -1;

        initData.push(x, y, z, w);
    }
    return new Float32Array(initData);

}

/**
 * Creates an array of random positional data on a grid that matches the layout of an fbo.
 * @param size the size of the fbo
 * @param gridScale the scale of the entire grid (higher scale = more space between points)
 * @returns an array with starting positions that can be used to create a data texture
 */
export const createDebugPositions = (
    size: number = 128, 
    gridScale: number = 5.0) => {

    const length = size * size;
    const data = new Float32Array(length * 4);
    for (let i = 0; i < length; i++) {
        let step = i * 4;
        data[step + 0] = ((i % size) / size) * gridScale;
        data[step + 1] = 0;
        data[step + 2] = (i / size / size) * gridScale;
        data[step + 3] = -1;
    }
    return data;
}

/**
 * Assigns input data to a texture, the length of the data should be a multiple of two
 * @param data the data to populate the texture with
 * @returns a data texture with the input data
 */
export const createDataTexture = (data: Float32Array, format: THREE.WebGL2PixelFormat = THREE.RGBAFormat) => {
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
}


/**
 * Shuffles buffer data via the Fisher-Yates shuffle algorithm, but keeps each 
 * group together while doing so. 
 * @param array the buffer data array to shuffle
 * @param dataSize the size of each entry in the data. i.e. a Vector3 would be 3
 * @returns a shuffled array
 */
export const randomizeData = (array: Float32Array, dataSize: number) => {

    if (array.length % dataSize !== 0) {
      throw new Error(`Array length must be a multiple of ${dataSize}.`);
    }
  
    const numGroups = array.length / dataSize;
  
    const groups = [];
    for (let i = 0; i < numGroups; i++) {
      const group = [];
      for (let j = 0; j < dataSize; j++) {
        group.push(array[i * dataSize + j]);
      }
      groups.push(group);
    }
  
    for (let i = groups.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [groups[i], groups[j]] = [groups[j], groups[i]];
    }
  
    const shuffledArray = new Float32Array(array.length);
    groups.forEach((group, index) => {
      shuffledArray.set(group, index * dataSize);
    });
  
    return shuffledArray;
}

/**
 * Shuffles positions and normals buffer data while keeping the indices aligned.
 * @param positions the positions buffer data array to shuffle (4 components per position)
 * @param normals the normals buffer data array to shuffle (3 components per normal)
 * @returns an object containing shuffled positions and normals arrays
 */
export const shufflePositionsAndNormals = (positions: Float32Array, normals: Float32Array) => {
    const positionSize = 4; // 4 components for position (x, y, z, w)
    const normalSize = 3; // 3 components for normal (x, y, z)
    const dataSize = positionSize + normalSize; // Total size of each group

    if (positions.length / positionSize !== normals.length / normalSize) {
        throw new Error('Positions and normals arrays must have the same number of groups.');
    }

    const numGroups = positions.length / positionSize;
    const combined = new Float32Array(numGroups * dataSize);

    // Combine positions and normals into a single array
    for (let i = 0; i < numGroups; i++) {
        combined.set(positions.subarray(i * positionSize, i * positionSize + positionSize), i * dataSize);
        combined.set(normals.subarray(i * normalSize, i * normalSize + normalSize), i * dataSize + positionSize);
    }

    // Shuffle the combined array
    const shuffledCombined = randomizeData(combined, dataSize);

    // Separate the shuffled data back into positions and normals
    const shuffledPositions = new Float32Array(positions.length);
    const shuffledNormals = new Float32Array(normals.length);

    for (let i = 0; i < numGroups; i++) {
        shuffledPositions.set(shuffledCombined.subarray(i * dataSize, i * dataSize + positionSize), i * positionSize);
        shuffledNormals.set(shuffledCombined.subarray(i * dataSize + positionSize, i * dataSize + dataSize), i * normalSize);
    }

    return { shuffledPositions, shuffledNormals };
}