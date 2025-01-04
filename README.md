# r3f-particle-system

A declarative particle system for React Three Fiber. It uses an FBO Simulation to provide incremental updates to particles, allowing an intuitive API with use of forces. **Note**: This package is experimental and may introduce breaking changes in future releases.

## Installation

Install the package via npm:  
```bash
npm install r3f-particle-system
```

## Usage

The particle system consists of four main components: `ParticleSystem`, `Emitters`, `Forces`, and `Particles`. The `ParticleSystem` acts as a context wrapper and must be included for the system to function. Within it, you can use one `Emitter`, one `Particle`, and multiple `Forces` to define and manipulate the behavior of particles.

### Example
```jsx
<ParticleSystem>
  <BoxEmitter speed={[ 0.8, 1 ]} life={[ 1, 10 ]} />
  <DirectionalForce direction={[ 0, 1, 0 ]} randomAmt={ 0.1 } strength={ 2 } />
  <RotationalForce strength={ 1.5 } />
  <PointParticle 
    shape="circle" 
    color={[ "cyan", "magenta" ]} 
    size={[ 5, 25 ]} 
    alphaFade={[ 0.25, 1 ]} 
  />
</ParticleSystem>
```

---

## Components

### ParticleSystem
The core context provider that manages data across the particle system.

**Props**:
- `simulationSpace`: Determines the coordinate space for particles (`"local"` | `"world"`)  
- `normalizeForces`: When `true`, normalizes the sum of all forces (useful for maintaining predictable speeds).  

Example w/ Default Values:  
```jsx
<ParticleSystem 
  simulationSpace="local" 
  normalizeForces={ false } 
/>
```

---

## Emitters

Emitters are responsible for spawning particles. Only one emitter can be used per system.

### BoxEmitter
Spawns particles from within a box-shaped volume.  

**Props**:  
- `size`: Particle buffer size (e.g., `128` = 16,384 particles).  
- `spawnRate`: Number of particles spawned per second.  
- `life`: Particle lifespan or min and max life (`life` | `[min, max]`).  
- `speed`: Particle speed or man and max speed (`speed` | `[min, max]`).  
- `bounds`: Dimensions of the box `[x, y, z]`.  

Example w/ Default Values:  
```jsx
<BoxEmitter
  size={ 128 }            
  spawnRate={ 500 }       
  life={[ 1.0, 5.0 ]}     
  speed={[ 0.5, 2.0 ]}    
  bounds={[ 1, 1, 1 ]}  
/>
```

### CurveEmitter
Spawns particles along a curve.  

**Props**:  
- `size`: Particle buffer size (e.g., `128` = 16,384 particles).  
- `spawnRate`: Number of particles spawned per second.  
- `life`: Particle lifespan or min and max life (`life` | `[min, max]`).  
- `speed`: Particle speed or man and max speed (`speed` | `[min, max]`).  
- `points`: Array of control points defining the curve.  
- `controlOffset`: Smoothness of curve corners.  
- `curve`: Optional `THREE.Curve` instance (overrides `points`).  
- `sampleMode`: Distribution mode along the curve (`"random"` | `"sequential"`).  
- `isLoop`: Whether the curve loops.  
- `resolution`: How many points make up this curve.
- `randomOffset`: Random positional offset for particles.  
- `debug`: When true shows the curve and control points.

Example w/ Default Values:  
```jsx
<CurveEmitter 
  size={ 128 }                            
  spawnRate={ 500 }                       
  life={[ 1.0, 5.0 ]}                     
  speed={[ 0.5, 2.0 ]}                    
  points={[[ 0, 0, 0 ], [ 0, 1, 0 ]]}   
  controlOffset={ 0.1 }                   
  curve={ null }                          
  sampleMode="random"                   
  isLoop={ false }                        
  resolution={ 100 }                      
  randomOffset={ 0.1 }                    
  debug={ false }                         
/>
```

### CylinderEmitter
Spawns particles within a cylindrical volume.  

**Props**:  
- `size`: Particle buffer size (e.g., `128` = 16,384 particles).  
- `spawnRate`: Number of particles spawned per second.  
- `life`: Particle lifespan or min and max life (`life` | `[min, max]`).  
- `speed`: Particle speed or man and max speed (`speed` | `[min, max]`). 
- `innerRadius`: Inner radius of the cylinder (no particles spawn inside).  
- `outerRadius`: Outer radius of the cylinder.  
- `height`: Cylinder height.  
- `arc`: Angular section of the cylinder (in radians).  

Example w/ Default Values:  
```jsx
<CylinderEmitter 
  size={ 128 }          
  spawnRate={ 500 }     
  life={[ 1.0, 5.0 ]}   
  speed={[ 0.5, 2.0 ]}  
  innerRadius={ 0.0 },  
  outerRadius={ 1.0 },  
  height={ 0.0 },       
  arc={ Math.PI * 2 }   
/>
```

### MeshEmitter
Spawns particles from the surface of a mesh.  

**Props**:  
- `size`: Particle buffer size (e.g., `128` = 16,384 particles).  
- `spawnRate`: Number of particles spawned per second.  
- `life`: Particle lifespan or min and max life (`life` | `[min, max]`).  
- `speed`: Particle speed or man and max speed (`speed` | `[min, max]`). 
- `sampleMode`: Determines particle spawn positions (`"random"` | `"sequential"` | `"shuffled"`).  
- `debug`: If `true`, renders the input mesh for visualization.  

**Note**: The source mesh must be a child of this emitter.  

Example w/ Default Values:  
```jsx
<MeshEmitter
  size={ 128 }           
  spawnRate={ 500 }      
  life={[ 1.0, 5.0 ]}    
  speed={[ 0.5, 2.0 ]}   
  sampleMode="random", 
  debug={ false }        
>
  <mesh>
    <sphereGeometry>
    <meshBasicMaterial>
  </mesh>
</MeshEmitter>
```

### SphereEmitter
Spawns particles within a spherical volume.  

**Props**:  
- `size`: Particle buffer size (e.g., `128` = 16,384 particles).  
- `spawnRate`: Number of particles spawned per second.  
- `life`: Particle lifespan or min and max life (`life` | `[min, max]`).  
- `speed`: Particle speed or man and max speed (`speed` | `[min, max]`). 
- `radius`: Radius of the sphere.  
- `surface`: If `true`, particles conform to the sphere's surface.  

Example w/ Default Values:  
```jsx
<SphereEmitter 
  size={ 128 }        
  spawnRate={ 500 }   
  life={[ 1.0, 5.0 ]} 
  speed={[ 0.5, 2.0 ]}
  radius={ 1 },       
  surface={ false },  
/>
```

---

## Forces

Forces affect the movement and behavior of particles. Multiple forces can be applied simultaneously.

### DirectionalForce
Applies a constant directional force.  

**Props**:  
- `direction`: Force direction vector (`[x, y, z]`).  
- `randomAmt`: Random deviation from the base direction.  
- `strength`: Strength of the force.  

Example w/ Default Values:  
```jsx
<DirectionalForce
  direction={[ 0, 1, 0 ]},       
  randomAmt={ 0 },            
  strength={ 1 }                 
/>
```

### RotationalForce
Applies rotational force around a center.  

**Props**:  
- `center`: Center point of rotation.  
- `axis`: Rotation axis (`"xy"` | `"xz"` | `"yz"`).  
- `strength`: Strength of the force.  

Example w/ Default Values:  
```jsx
<RotationalForce
  axis="xyz",     
  seed="random",  
  period={ 1 },     
  strength={ 1 }    
/>
```

### NoiseForce
Applies a curl noise force to particles.

**Props**:  
- `axis`: Which axes are affected by the force (`"xyz"` | `"xy"` | `"xz"` | `"yz"`).
- `seed`: Seed position (`[x, y, z]` | `"random"`).
- `period`: The period of the noise.
- `strength`: Strength of the force.  

Example w/ Default Values:
```jsx
<NoiseForce
    axis="xyz",        
    seed="random",     
    period={ 1 },        
    strength={ 1 }       
/>
```

### CurveTangentForce
Applies a force along the tangent of a curve. Only has Eefect when using CurveEmitter.

**Props**:  
- `direction`: The direction of the force along the curve (`1` | `-1`)
- `randomAmt`: Random deviation from the base direction. 
- `strength`: Strength of the force.  

Example w/ Default Values: 
```jsx
<CurveTangentForce
  direction={ 1 },            
  randomAmt={ 0.25 },         
  strength={ 1 }              
/>
```

### NormalForce
Applies a force perpendicular to a surface. Only has effect when using the MeshEmitter.

**Props**:  
- `strength`: Strength of the rotation.  

Example w/ Default Values:  
```jsx
<NormalForce   
  strength={ 1 }    
/>
```

### PointForce
Dynamically applies a force from a point source up to an effective threshold.

**Props**:  
- `position`: The center positions of the force.
- `direction`: The direction of the force relative to the center position (`"towards"` | `"away"`).
- `axis`: Which axes are affected by the force (`"xyz"` | `"xy"` | `"xz"` | `"yz"`).
- `effectiveDist`: The extents this force affects particles around its center.
- `strength`: Strength of the rotation.  
- `returnForce`: Force particles back to their original position when outside effectiveDist.
- `returnForce`: The strength of the return force.

Example w/ Default Values:  
```jsx
<PointForce
  position={[ 0, 0, 0 ]}, 
  direction="towards",    
  axis="xyz",             
  effectiveDist={ 1 },      
  strength={ 1 },           
  returnForce={ true },     
  returnStrength={ 1 }      
/>
```

---

## Particles

### PointParticle
Defines individual particles rendered as points.  

**Props**:  
- `shape`: Particle shape (`"circle"` | `"square"` | `"softCircle"` | `"point"`).  
- `color`: Particle color (single value or array for gradients).  
- `colorMode`: Determines how colors are applied (`"overLife"` | `"random"`).  
- `size`: Particle size or range (`size` | `[min, max]`).  
- `alphaFade`: Fade-in and fade-out alpha values.  
- `depthWrite`: depthWrite value for the particles.
- `depthTest`: depthTest value for the particles.
- `blending`: blending value for the particles.

Example w/ Default Values:  
```jsx
<PointParticle
  shape="circle"                   
  color="blue"                     
  colorMode="overLife",            
  size={ 50 }                        
  alphaFade={ 1 }                    
  depthWrite={ false },              
  depthTest={ true },                
  blending={ THREE.NormalBlending }, 
/>
```

---

## Imperative API & Particle Bursts  

Refs of `ParticleSystem` can be used to expose it's imperative API. Available methods are `stop()`, `start()`, and `createBurst()`. After stopping the system, `createBurst(numParticles)` can be used to create a burst of particles at runtime.

### Example Usage:
```jsx

// create ref for particle system
const systemRef = useRef();

// pause the spawning of particles
useEffect(() => {
  systemRef.current.pause(); 
}, []);

// create burst of 2000 particles using 'onpointerdown' event
useEffect(() => {
  const burst = () => systemRef.current.createBurst(2000);
  window.addEventListener('pointerdown', burst);
  return () => window.removeEventListener('pointerdown', burst);
}, []);

return (
  <ParticleSystem ref={ systemRef }>
   ...
  </ParticleSystem>
);
``` 

---

## Roadmap

Planned features for future releases:  
- **MeshParticle Component**: Instanced meshes as particles for more advanced visuals.  
- **Color Sampling**: Allow particles to inherit colors from meshes or textures.  
- **Lighting**: Allow particles to be affected by scene lighting.
- **Scene Collisions**: Allow for particle collisions with scene using depth buffer
- **Strength over time**: Option for strength over time to give move control with forces.

---

## License

MIT License

---