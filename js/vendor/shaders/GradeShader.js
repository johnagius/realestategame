/* SKYLINE-12 final grade pass: vignette + S-curve + shadow lift toward the era's
   fog hue + film grain, and manual sRGB output (the composer chain works in
   linear space; raw ShaderMaterials get no automatic output encoding in r128).
   Registered on THREE like the vendored r128 example shaders. */
THREE.GradeShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'vignette': { value: 0.34 },
    'liftColor': { value: new THREE.Color(0x1c2240) },   // era fog hue, set from _paintSky
    'liftAmount': { value: 0.4 },
    'curve': { value: 0.16 },
    'grainAmount': { value: 0.022 },
    'time': { value: 0.0 }
  },
  vertexShader: [
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = uv;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
    '}'
  ].join('\n'),
  fragmentShader: [
    'uniform sampler2D tDiffuse;',
    'uniform float vignette;',
    'uniform vec3 liftColor;',
    'uniform float liftAmount;',
    'uniform float curve;',
    'uniform float grainAmount;',
    'uniform float time;',
    'varying vec2 vUv;',
    '',
    'float rand( vec2 co ) {',
    '  return fract( sin( dot( co.xy, vec2( 12.9898, 78.233 ) ) + time ) * 43758.5453 );',
    '}',
    '',
    'void main() {',
    '  vec4 texel = texture2D( tDiffuse, vUv );',
    '  vec3 c = texel.rgb;',
    // gentle S-curve around mid grey
    '  vec3 curved = c * c * ( 3.0 - 2.0 * c );',
    '  c = mix( c, curved, curve );',
    // lift shadows toward the era fog hue (keeps blacks from going dead)
    '  float luma = dot( c, vec3( 0.2126, 0.7152, 0.0722 ) );',
    '  float shadowK = ( 1.0 - smoothstep( 0.0, 0.55, luma ) );',
    '  c += liftColor * shadowK * shadowK * liftAmount * 0.25;',
    // vignette
    '  float d = distance( vUv, vec2( 0.5 ) );',
    '  c *= 1.0 - vignette * smoothstep( 0.32, 0.82, d );',
    // grain
    '  c += ( rand( vUv * vec2( 1920.0, 1080.0 ) ) - 0.5 ) * grainAmount;',
    // exact sRGB output encoding (matches the renderer's non-composer path)
    '  vec3 lo = 12.92 * c;',
    '  vec3 hi = 1.055 * pow( max( c, 0.0 ), vec3( 1.0 / 2.4 ) ) - 0.055;',
    '  c = mix( lo, hi, step( vec3( 0.0031308 ), c ) );',
    '  gl_FragColor = vec4( c, texel.a );',
    '}'
  ].join('\n')
};
