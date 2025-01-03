import { ShapingFunctions } from "./ShapingFunctions";

export const pointsShader = {
    vertex: /* glsl */ `

        attribute float aRandPointSize;
        attribute vec3 aRandColor;
        attribute vec3 aNormal;

        uniform sampler2D uFBO;
        uniform sampler2D uSpawnTex;
        uniform sampler2D uRandomPerParticleTex;

        varying float vAlive;
        varying float vMaxLife;
        varying vec3 vRandColor;
        varying vec3 vNormal;

        void main() {
            vec4 randPerParticleTex = texture2D(uRandomPerParticleTex, position.xy);
            vec4 spawnTex = texture2D(uSpawnTex, position.xy);
            vec4 fbo = texture2D(uFBO, position.xy);
            vec3 pos = fbo.xyz;


            #ifdef USE_LOCAL_SPACE
                vec4 viewPos = modelViewMatrix * vec4(pos, 1.0);
            #endif
            #ifdef USE_WORLD_SPACE
                vec4 viewPos = viewMatrix * vec4(pos, 1.0);
            #endif
            
            gl_Position = projectionMatrix * viewPos;


            float size = max(5.0, randPerParticleTex.a * 100.0);
            

            gl_PointSize = aRandPointSize;
            gl_PointSize *= (1.0 / -viewPos.z);

            vAlive = fbo.w;
            vMaxLife = spawnTex.w;
            vRandColor = aRandColor;
            vNormal = aNormal;

            // gl_PointSize = 5.0; // debugging
        }
    `,
    fragment: /* glsl */ `
        varying float vAlive;
        varying float vMaxLife;
        varying vec3 vRandColor;
        varying vec3 vNormal;

        uniform vec3 uColors[NUM_COLORS];
        uniform float uFadeIn;
        uniform float uFadeOut;

        ${ShapingFunctions.stepAA()}

        void main() {

            gl_FragColor = vec4(1.0);
            
            float alive = step(0.0, vAlive);

            float currentLife = clamp(vAlive, 0.0, vMaxLife);
            float alphaOverLife = smoothstep(0.0, uFadeIn, currentLife) - 
                                  smoothstep(vMaxLife - uFadeOut, vMaxLife, currentLife);
            gl_FragColor.a *= alphaOverLife;
            gl_FragColor.a *= alive;

            vec3 col;

            #ifdef USE_COLOR_OVER_LIFE
                float increment = vMaxLife / float(NUM_COLORS);
                float threshStart = 0.0;
                float threshEnd = increment;

                for (int i = 1; i < NUM_COLORS; i++) {
                    col = mix(uColors[i - 1], uColors[i], smoothstep(threshStart, threshEnd, vAlive));
                    threshStart += increment;
                    threshEnd += increment;
                }
            #endif
            #ifdef USE_COLOR_RANDOM
                col = vRandColor;
            #endif

            gl_FragColor.rgb *= col;

            float mask;
            #ifdef USE_SQUARE
                mask = 1.0;
            #else
                mask = distance(vec2(0.5), gl_PointCoord.xy);
            #endif

            #ifdef USE_CIRCLE
                mask = 1.0 - stepAA(0.5, mask);
            #endif
            #ifdef USE_SOFT_CIRCLE
                mask = smoothstep(0.5, 0.1, mask);
            #endif
            #ifdef USE_POINT
                mask = 1.0 - mask;
                mask = pow(mask, 10.0);
            #endif
            
            gl_FragColor.a *= mask;

            // gl_FragColor = vec4(1.0); // debugging
            // gl_FragColor.rgb = vNormal;
        }
    `
}