import { float, vec2, vec3, vec4 } from "./ShaderTypes"

export const simplexNoise2D = (P?: vec2): float | any => {
    return /* glsl */ `
        vec4 permute(vec4 x) {return mod(((x*34.0)+1.0)*x, 289.0);}
        vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
        float simplexNoise2D(vec2 P){
            vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
            vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
            Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
            vec4 ix = Pi.xzxz;
            vec4 iy = Pi.yyww;
            vec4 fx = Pf.xzxz;
            vec4 fy = Pf.yyww;
            vec4 i = permute(permute(ix) + iy);
            vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
            vec4 gy = abs(gx) - 0.5;
            vec4 tx = floor(gx + 0.5);
            gx = gx - tx;
            vec2 g00 = vec2(gx.x,gy.x);
            vec2 g10 = vec2(gx.y,gy.y);
            vec2 g01 = vec2(gx.z,gy.z);
            vec2 g11 = vec2(gx.w,gy.w);
            vec4 norm = 1.79284291400159 - 0.85373472095314 * 
            vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
            g00 *= norm.x;
            g01 *= norm.y;
            g10 *= norm.z;
            g11 *= norm.w;
            float n00 = dot(g00, vec2(fx.x, fy.x));
            float n10 = dot(g10, vec2(fx.y, fy.y));
            float n01 = dot(g01, vec2(fx.z, fy.z));
            float n11 = dot(g11, vec2(fx.w, fy.w));
            vec2 fade_xy = fade(Pf.xy);
            vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
            float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
            return 2.3 * n_xy;
        }

    `
}

export const perlinNoise2D = (P?: vec2): float | any => {
    return /* glsl */ `

        vec4 permute2D(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec2 fade2D(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

        float perlinNoise2D(vec2 P){
            vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
            vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
            Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
            vec4 ix = Pi.xzxz;
            vec4 iy = Pi.yyww;
            vec4 fx = Pf.xzxz;
            vec4 fy = Pf.yyww;
            vec4 i = permute2D(permute2D(ix) + iy);
            vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
            vec4 gy = abs(gx) - 0.5;
            vec4 tx = floor(gx + 0.5);
            gx = gx - tx;
            vec2 g00 = vec2(gx.x,gy.x);
            vec2 g10 = vec2(gx.y,gy.y);
            vec2 g01 = vec2(gx.z,gy.z);
            vec2 g11 = vec2(gx.w,gy.w);
            vec4 norm = 1.79284291400159 - 0.85373472095314 * 
            vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
            g00 *= norm.x;
            g01 *= norm.y;
            g10 *= norm.z;
            g11 *= norm.w;
            float n00 = dot(g00, vec2(fx.x, fy.x));
            float n10 = dot(g10, vec2(fx.y, fy.y));
            float n01 = dot(g01, vec2(fx.z, fy.z));
            float n11 = dot(g11, vec2(fx.w, fy.w));
            vec2 fade_xy = fade2D(Pf.xy);
            vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
            float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
            return 2.3 * n_xy;
        }
    `
}

export const perlinNoise3D = (P?: vec3): float | any => {
    return /* glsl */ `
        vec4 permute3D(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
        vec3 fade3D(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
        
        float perlinNoise3D(vec3 P){
            vec3 Pi0 = floor(P); // Integer part for indexing
            vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
            Pi0 = mod(Pi0, 289.0);
            Pi1 = mod(Pi1, 289.0);
            vec3 Pf0 = fract(P); // Fractional part for interpolation
            vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
            vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
            vec4 iy = vec4(Pi0.yy, Pi1.yy);
            vec4 iz0 = Pi0.zzzz;
            vec4 iz1 = Pi1.zzzz;
            
            vec4 ixy = permute3D(permute3D(ix) + iy);
            vec4 ixy0 = permute3D(ixy + iz0);
            vec4 ixy1 = permute3D(ixy + iz1);
            
            vec4 gx0 = ixy0 / 7.0;
            vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
            gx0 = fract(gx0);
            vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
            vec4 sz0 = step(gz0, vec4(0.0));
            gx0 -= sz0 * (step(0.0, gx0) - 0.5);
            gy0 -= sz0 * (step(0.0, gy0) - 0.5);
            
            vec4 gx1 = ixy1 / 7.0;
            vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
            gx1 = fract(gx1);
            vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
            vec4 sz1 = step(gz1, vec4(0.0));
            gx1 -= sz1 * (step(0.0, gx1) - 0.5);
            gy1 -= sz1 * (step(0.0, gy1) - 0.5);
            
            vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
            vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
            vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
            vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
            vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
            vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
            vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
            vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
            
            vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
            g000 *= norm0.x;
            g010 *= norm0.y;
            g100 *= norm0.z;
            g110 *= norm0.w;
            vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
            g001 *= norm1.x;
            g011 *= norm1.y;
            g101 *= norm1.z;
            g111 *= norm1.w;
            
            float n000 = dot(g000, Pf0);
            float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
            float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
            float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
            float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
            float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
            float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
            float n111 = dot(g111, Pf1);
            
            vec3 fade_xyz = fade3D(Pf0);
            vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
            vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
            float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
            return 2.2 * n_xyz;
        }
    `
}

export const basicNoise = (P?: vec2): float | any => {
    return /* glsl */ `
        vec2 hash( vec2 p ) {
            p = vec2( dot(p,vec2(127.1,311.7)),
                    dot(p,vec2(269.5,183.3)) );

            return -1.0 + 2.0*fract(sin(p)*43758.5453123);
        }

        float basicNoise( in vec2 p ) {
            vec2 i = floor( p );
            vec2 f = fract( p );
            vec2 u = f*f*(3.0-2.0*f);
            return mix( mix( dot( hash( i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ), 
                             dot( hash( i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                        mix( dot( hash( i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ), 
                             dot( hash( i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
        }

    `
}

export const voronoi = (x?: vec2, w?: float, iTime?: float): vec4 | any => {
    return /* glsl */ `

        float hash1( float n ) { return fract(sin(n)*43758.5453); }
        vec2  hash2( vec2  p ) { p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) ); return fract(sin(p)*43758.5453); }

        // The parameter w controls the smoothness
        vec4 voronoi( in vec2 x, float w, float iTime ) {
            vec2 n = floor( x );
            vec2 f = fract( x );

            vec4 m = vec4( 8.0, 0.0, 0.0, 0.0 );
            for( int j=-2; j<=2; j++ )
            for( int i=-2; i<=2; i++ )
            {
                vec2 g = vec2( float(i),float(j) );
                vec2 o = hash2( n + g );
                
                // animate
                o = 0.5 + 0.5*sin( iTime + 6.2831*o );

                // distance to cell		
                float d = length(g - f + o);
                
                // cell color
                vec3 col = 0.5 + 0.5*sin( hash1(dot(n+g,vec2(7.0,113.0)))*2.5 + 3.5 + vec3(2.0,3.0,0.0));
                // in linear space
                col = col*col;
                
                // do the smooth min for colors and distances		
                float h = smoothstep( -1.0, 1.0, (m.x-d)/w );
                m.x   = mix( m.x,     d, h ) - h*(1.0-h)*w/(1.0+3.0*w); // distance
                m.yzw = mix( m.yzw, col, h ) - h*(1.0-h)*w/(1.0+3.0*w); // color
            }
            
            return m;
        }
    `
}

/**
 * DEPENDENCIES: {@link perlinNoise2D}
 * @returns 
 */
export const curl2D = (pos?: vec2): vec2 | any => {
    return /* glsl */ `
        vec2 curl2D(vec2 pos) {
            float eps = 0.0001;
                
            //Find rate of change in X direction
            float x1 = perlinNoise2D(vec2(pos.x + eps, pos.y));
            float x2 = perlinNoise2D(vec2(pos.x - eps, pos.y)); 
            
            //Average to find approximate derivative
            float x = (x1 - x2)/(2.0 * eps);
            
            //Find rate of change in Y direction
            float y1 = perlinNoise2D(vec2(pos.x, pos.y + eps)); 
            float y2 = perlinNoise2D(vec2(pos.x, pos.y - eps)); 
            
            //Average to find approximate derivative
            float y = (y1 - y2)/(2.0 * eps);
            
            //Curl
            return vec2(y, -x);
        }
    `
}

/**
 * DEPENDENCIES: {@link perlinNoise3D}
 * @param pos 
 * @returns 
 */
export const curl3D = (pos?: vec3): vec3 | any => {
    return /* glsl */ `
        vec3 curl3D(vec3 pos) {
            float eps = 0.001;
        
            // Partial derivatives of F sampled from the noise function
            float dFz_dy = (perlinNoise3D(pos + vec3(0.0, eps, 0.0)) - perlinNoise3D(pos - vec3(0.0, eps, 0.0))) / (2.0 * eps); // ∂Fz/∂y
            float dFy_dz = (perlinNoise3D(pos + vec3(0.0, 0.0, eps)) - perlinNoise3D(pos - vec3(0.0, 0.0, eps))) / (2.0 * eps); // ∂Fy/∂z
            float dFx_dz = (perlinNoise3D(pos + vec3(eps, 0.0, 0.0)) - perlinNoise3D(pos - vec3(eps, 0.0, 0.0))) / (2.0 * eps); // ∂Fx/∂z
            float dFz_dx = (perlinNoise3D(pos + vec3(0.0, 0.0, eps)) - perlinNoise3D(pos - vec3(0.0, 0.0, eps))) / (2.0 * eps); // ∂Fz/∂x
            float dFy_dx = (perlinNoise3D(pos + vec3(eps, 0.0, 0.0)) - perlinNoise3D(pos - vec3(eps, 0.0, 0.0))) / (2.0 * eps); // ∂Fy/∂x
            float dFx_dy = (perlinNoise3D(pos + vec3(0.0, eps, 0.0)) - perlinNoise3D(pos - vec3(0.0, eps, 0.0))) / (2.0 * eps); // ∂Fx/∂y
        
            // Calculate curl components
            float curl_x = dFz_dy - dFy_dz;
            float curl_y = dFx_dz - dFz_dx;
            float curl_z = dFy_dx - dFx_dy;
        
            return vec3(curl_x, curl_y, curl_z);
        }
    `
}

/**
 * DEPENDENCIES: {@link perlinNoise3D}
 * @param pos 
 * @param normal 
 * @returns 
 */
export const curlAlongNormals = (pos: vec3, normal: vec3): vec3 | any => {
    return /* glsl */ `
    vec3 curlAlongNormals(vec3 pos, vec3 normal) {
        float eps = 0.001;
    
        // Partial derivatives of the noise function p
        float dp_dy = (perlinNoise3D(pos + vec3(0.0, eps, 0.0)) - perlinNoise3D(pos - vec3(0.0, eps, 0.0))) / (2.0 * eps); // ∂p/∂y
        float dp_dz = (perlinNoise3D(pos + vec3(0.0, 0.0, eps)) - perlinNoise3D(pos - vec3(0.0, 0.0, eps))) / (2.0 * eps); // ∂p/∂z
        float dp_dx = (perlinNoise3D(pos + vec3(eps, 0.0, 0.0)) - perlinNoise3D(pos - vec3(eps, 0.0, 0.0))) / (2.0 * eps); // ∂p/∂x
    
        // Calculate curl components using the provided formula
        float curl_x = normal.z * dp_dy - normal.y * dp_dz;
        float curl_y = normal.x * dp_dz - normal.z * dp_dx;
        float curl_z = normal.y * dp_dx - normal.x * dp_dy;
    
        return vec3(curl_x, curl_y, curl_z);
    }
    `
}

export const NoiseFunctions = {
    simplexNoise2D,
    perlinNoise2D,
    perlinNoise3D,
    basicNoise,
    voronoi,
    curl2D,
    curl3D,
    curlAlongNormals
}