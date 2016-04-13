"use strict";

this.galaxies = this.galaxies || {};

galaxies.shaders = {
    postProcess: {
        warpBubble: {
            uniforms: {
                "tDiffuse":    { type: "t",  value: null },
                "center":      { type: "v2", value: new THREE.Vector2(0.5, 0.6) },
                "maxRadius":   { type: "v2", value: new THREE.Vector2(0.09, 0.16) },
                "warpFactor":  { type: "f",  value: 0.2 },
                "progression": { type: "f",  value: 0.0 }
            },
            vertexShader: [
                "varying vec2 vUv;",

                "void main () {",
                "  vUv = uv;",
                "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
                "}"
            ].join('\n'),
            fragmentShader: [
                "uniform vec2 center;",
                "uniform vec2 maxRadius;",
                "uniform float warpFactor;",
                "uniform float progression;",
                "uniform float lifeSpan;",

                "uniform sampler2D tDiffuse;",

                "varying vec2 vUv;",

                "void main() {",
                "  float invProgression = 1.0 - progression;",

                "  vec2 diff = vUv - center;",
                "  vec2 normDiff = normalize(diff / maxRadius);",
                "  vec2 outer = normDiff * maxRadius * progression;",
                "  float dist = length(diff);",
                "  float outerEdge = length(outer);",

                "  if (dist > outerEdge) {",
                "    gl_FragColor = texture2D(tDiffuse, vUv);",
                "    return;",
                "  }",

                "  float uvWarp = 1.0 - clamp(pow(dist / outerEdge, 2.0) * invProgression * 2.0, 0.0, 1.0);",

                "  vec2 wUv = center + diff * uvWarp;",

                "  gl_FragColor = texture2D(tDiffuse, wUv);",
                "}"
            ].join('\n')
        }
    }
};
