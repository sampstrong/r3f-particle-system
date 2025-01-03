import { NoiseFunctions } from "./NoiseFunctions";
import { TextureFunctions } from "./TextureFunctions";
import { TransformFunctions } from "./TransformFunctions";
import { UtilityFunctions } from "./UtilityFunctions";

export const simulationShader = {
    vertex: /* glsl */ `
        varying vec2 vUv;
        void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            vUv = uv;
        }
    `,
    fragment: /* glsl */ `

        #include <common>


        // ----------- VARYINGS / UNIFORMS ---------------

        varying vec2 vUv;

        uniform float uTime;
        uniform sampler2D uFBO;
        uniform sampler2D uSpawnTex;
        uniform sampler2D uRandValuesTex;
        uniform sampler2D uPerParticleVelocityTex;
        uniform float uDelta;

        // potentially merge these into a struct
        uniform int uCount;
        uniform int uSpawnIdx;
        uniform int uPrevSpawnIdx;
        uniform mat4 uModelMatrix;

        // ------------------------------------------------

        // ------------------- STRUCTS --------------------

        struct SpawnSettings {
            float minSpeed;
            float maxSpeed;
        };

        uniform SpawnSettings uSpawnSettings;
        
        #ifdef NUM_DIRECTIONAL_FORCES

            struct DirectionalForce {
                vec3 directions[NUM_DIRECTIONAL_FORCES];
                float randomAmt;
                float strength;
            };

            uniform DirectionalForce uDirectionalForce;
        #endif

        struct NoiseForce {
            vec3 seed;
            vec3 period;
            float strength;
        };

        uniform NoiseForce uNoiseForce;

        struct RotationalForce {
            float strength;
            vec3 center;
        };

        uniform RotationalForce uRotationalForce;

        struct PointForce {
            vec3 position;
            float direction;
            float effectiveDist;
            float strength;
        };

        uniform PointForce uPointForce;

        struct ReturnForce {
            float strength;
        };

        uniform ReturnForce uReturnForce;

        struct CurveTangentForce {
            float strength;
        };

        uniform CurveTangentForce uCurveTangentForce;

        struct NormalForce {
            float strength;
        };

        uniform NormalForce uNormalForce;

        // ------------------------------------------------

        // ------------------ UTILITIES -------------------

        ${TextureFunctions.getFboIndex()}
        ${UtilityFunctions.safeNormalize()}
        ${TransformFunctions.rotate3D()}

        #ifdef CURL_3D
            ${NoiseFunctions.perlinNoise3D()}
            ${NoiseFunctions.curl3D()}
        #endif
        #ifdef CURL_2D
            ${NoiseFunctions.perlinNoise2D()}
            ${NoiseFunctions.curl2D()}
        #endif

        vec3 randomizeDirection(vec3 inputDir, float randomAmt, vec4 signedRandValues) {
            float randAngle = PI * signedRandValues.w * randomAmt;
            vec3 randVec = signedRandValues.xyz;
            vec3 randAxis = cross(normalize(randVec), normalize(inputDir));
            return normalize(rotate3D(randAxis, randAngle) * inputDir);
        }

        float toSignedVlaue(float value) {
            return value * 2.0 - 1.0;
        }

        float getRandFloatInRange(float minValue, float maxValue, float randValue) {
            return minValue + (maxValue - minValue) * randValue;
        }

        // ------------------------------------------------


        void main() {

            ivec2 texCoord = ivec2(gl_FragCoord.xy);
            int currentIdx = getFboIndex(uFBO, texCoord);

            // sample fbos
            vec4 spawnPos = texelFetch(uSpawnTex, texCoord, 0);
            vec4 perParticleVelocityTex = texelFetch(uPerParticleVelocityTex, texCoord, 0);
            vec4 randValuesTex = texelFetch(uRandValuesTex, texCoord, 0);
            vec4 fbo = texelFetch(uFBO, texCoord, 0);
            vec3 pos = fbo.xyz;
            float timeAlive = fbo.w;
            float maxLife = spawnPos.w;
            float speed = getRandFloatInRange(uSpawnSettings.minSpeed, uSpawnSettings.maxSpeed, randValuesTex.x);

            vec4 randValuesSigned = vec4(
                toSignedVlaue(randValuesTex.x),
                toSignedVlaue(randValuesTex.y),
                toSignedVlaue(randValuesTex.z),
                toSignedVlaue(randValuesTex.w)
            );

            bool inRange = false;
            if (uSpawnIdx > uPrevSpawnIdx) {
                inRange = currentIdx > uPrevSpawnIdx && currentIdx <= uSpawnIdx;
            } else if (uSpawnIdx < uPrevSpawnIdx) {
                inRange = (currentIdx > uPrevSpawnIdx && currentIdx < uCount) || 
                          (currentIdx >= 0 && currentIdx <= uSpawnIdx);
            }

            if (timeAlive < 0.0 && inRange) {
                #ifdef USE_LOCAL_SPACE
                    pos = spawnPos.xyz;
                #endif
                #ifdef USE_WORLD_SPACE
                    pos = (uModelMatrix * vec4(spawnPos.xyz, 1.0)).xyz;
                #endif

                timeAlive = 0.0;
            }

            if (timeAlive >= 0.0) {
                timeAlive += uDelta;

                // -------------------- FORCES --------------------
                vec3 dir = vec3(0.0);

                #ifdef USE_DIRECTIONAL_FORCE_OVERLIFE

                    float increment = maxLife / float(NUM_DIRECTIONAL_FORCES);
                    float threshStart = 0.0;
                    float threshEnd = increment;

                    // not sure this is 100% right, but seems to be more or less working
                    for (int i = 1; i < NUM_DIRECTIONAL_FORCES; i++) {
                        dir = mix(
                            uDirectionalForce.directions[i - 1], 
                            uDirectionalForce.directions[i], 
                            smoothstep(threshStart, threshEnd, timeAlive)
                        ) * uDirectionalForce.strength;

                        threshStart += increment;
                        threshEnd += increment;
                    }
                #endif

                
                #ifdef USE_DIRECTIONAL_FORCE_CONSTANT
                    dir = uDirectionalForce.directions[0];
                    dir = randomizeDirection(dir, uDirectionalForce.randomAmt, randValuesSigned) * uDirectionalForce.strength;
                #endif


                // still need per particle tex for tangent forces, but can use exat tangent values and add randomness inside shader
                #ifdef USE_CURVE_TANGENT_FORCE
                    dir += perParticleVelocityTex.xyz * uCurveTangentForce.strength;
                #endif
                #ifdef USE_NORMAL_FORCE
                    dir += perParticleVelocityTex.xyz * uNormalForce.strength;
                #endif

                #ifdef USE_NOISE_FORCE_XYZ
                    dir += curl3D((pos + uNoiseForce.seed) * uNoiseForce.period) * uNoiseForce.strength;
                #endif
                #ifdef USE_NOISE_FORCE_XY
                    dir.xy += curl2D((pos.xy + uNoiseForce.seed.xy) * uNoiseForce.period.xy) * uNoiseForce.strength;
                #endif
                #ifdef USE_NOISE_FORCE_XZ
                    dir.xz += curl2D((pos.xz + uNoiseForce.seed.xz) * uNoiseForce.period.xz) * uNoiseForce.strength;
                #endif
                #ifdef USE_NOISE_FORCE_YZ
                    dir.yz += curl2D((pos.yz + uNoiseForce.seed.yz) * uNoiseForce.period.yz) * uNoiseForce.strength;
                #endif

                #ifdef USE_ROTATIONAL_FORCE_XY
                    vec2 toPoint = normalize(pos.xy - uRotationalForce.center.xy);
                    vec2 tangent = vec2(toPoint.y, -toPoint.x);
                    dir.xy += tangent * uRotationalForce.strength;
                #endif
                #ifdef USE_ROTATIONAL_FORCE_XZ
                    vec2 toPoint = normalize(pos.xz - uRotationalForce.center.xz);
                    vec2 tangent = vec2(toPoint.y, -toPoint.x);
                    dir.xz += tangent * uRotationalForce.strength;
                #endif
                #ifdef USE_ROTATIONAL_FORCE_YZ
                    vec2 toPoint = normalize(pos.yz - uRotationalForce.center.yz);
                    vec2 tangent = vec2(toPoint.y, -toPoint.x);
                    dir.yz += tangent * uRotationalForce.strength;
                #endif

                #ifdef USE_POINT_FORCE_XYZ 
                    vec3 pointForceVec = uPointForce.position - pos;
                    if (length(pointForceVec) > 0.01) {
                        vec3 pointForceDir = normalize(pointForceVec);
                        float effectiveness = 1.0 - step(uPointForce.effectiveDist, length(pointForceVec));
                        dir.xyz += pointForceVec * uPointForce.strength * uPointForce.direction * effectiveness;
                    }
                #endif
                #ifdef USE_POINT_FORCE_XY
                    vec2 pointForceVec = uPointForce.position.xy - pos.xy;
                    vec2 pointForceDir = normalize(pointForceVec);
                    float effectiveness = 1.0 - step(uPointForce.effectiveDist, length(pointForceVec));
                    dir.xy += pointForceDir * uPointForce.strength * uPointForce.direction * effectiveness;
                #endif
                #ifdef USE_POINT_FORCE_XZ
                    vec2 pointForceVec = uPointForce.position.xz - pos.xz;
                    vec2 pointForceDir = normalize(pointForceVec);
                    dir.xz += pointForceVec * uPointForce.strength * uPointForce.direction;
                #endif
                #ifdef USE_POINT_FORCE_YZ
                    vec2 pointForceVec = uPointForce.position.yz - pos.yz;
                    vec2 pointForceDir = normalize(pointForceVec);
                    dir.yz += pointForceVec * uPointForce.strength * uPointForce.direction;
                #endif

                #ifdef USE_RETURN_FORCE
                    float eps = 0.01;
                    if (length(dir) < eps) {
                        vec3 returnVec = spawnPos.xyz - pos;
                        if (length(returnVec) > eps) dir += normalize(returnVec) * uReturnForce.strength;
                    }
                #endif

                // ------------------------------------------------

                #ifdef NORMALIZE_FORCES
                    dir = safeNormalize(dir);
                #endif

                pos += dir * uDelta * speed;

                if (timeAlive >= maxLife) {
                    #ifdef USE_LOCAL_SPACE
                        pos = spawnPos.xyz;
                    #endif
                    #ifdef USE_WORLD_SPACE
                        pos = (uModelMatrix * vec4(spawnPos.xyz, 1.0)).xyz;
                    #endif

                    timeAlive = -1.0;
                }

            } 

            gl_FragColor = vec4(pos, timeAlive);
        }
    `
}