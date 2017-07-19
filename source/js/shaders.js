"use strict";

this.galaxies = this.galaxies || {};

galaxies.shaders = {
    postProcess: {
        colorAdd: {
            getUniforms: function() {
                return {
                    "tInput": { type: "t", value: null },
                    "color": { type: "c", value: new THREE.Color("black") },
                    "amount": { type: "f", value: 0.5 }
                };
            },
            vertexShader: [
                "varying vec2 vUv;",
                "void main() {",
                "  vUv = uv;",
                "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
                "}"
            ].join("\n"),
            fragmentShader: [
                "uniform sampler2D tInput;",
                "uniform vec3 color;",
                "uniform float amount;",
                "varying vec2 vUv;",
                "void main() {",
                "  vec4 srcColor = texture2D(tInput, vUv);",
                "  gl_FragColor = vec4(color * amount + srcColor.rgb, srcColor.a);",
                "}"
            ].join("\n")
        },
        warpBubble: {
            getUniforms: function() {
                return {
                    "tInput": { type: "t", value: null },
                    "center": { type: "v2", value: new THREE.Vector2(0.5, 0.6) },
                    "maxRadius": { type: "v2", value: new THREE.Vector2(0.09, 0.16) },
                    "warpFactor": { type: "f", value: 2.0 },
                    "progression": { type: "f", value: 0.0 }
                };
            },
            vertexShader: [
                "varying vec2 vUv;",
                "void main() {",
                "  vUv = uv;",
                "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
                "}"
            ].join("\n"),
            fragmentShader: [
                "uniform vec2 center;",
                "uniform vec2 maxRadius;",
                "uniform float warpFactor;",
                "uniform float progression;",
                "uniform float lifeSpan;",
                "uniform sampler2D tInput;",
                "varying vec2 vUv;",
                "void main() {",
                "  float invProgression = 1.0 - progression;",
                "  vec2 diff = vUv - center;",
                "  vec2 normDiff = normalize(diff / maxRadius);",
                "  vec2 outer = normDiff * maxRadius * progression;",
                "  float dist = length(diff);",
                "  float outerEdge = length(outer);",
                "  if (dist > outerEdge) {",
                "    gl_FragColor = texture2D(tInput, vUv);",
                "    return;",
                "  }",
                "  float uvWarp = 1.0 - clamp(pow(dist / outerEdge, warpFactor) * invProgression * 2.0, 0.0, 1.0);",
                "  vec2 wUv = center + diff * uvWarp;",
                "  gl_FragColor = texture2D(tInput, wUv);",
                "}"
            ].join("\n")
        }
    },
    materials: {
        glowObject: {
            getUniforms: function() {
                return {
                    "c": { type: "f", value: 0.1 },
                    "p": { type: "f", value: 2.5 },
                    glowColor: { type: "c", value: new THREE.Color(0x00ff00) },
                    viewVector: { type: "v3", value: new THREE.Vector3() }
                };
            },
            vertexShader: [
                "uniform vec3 viewVector;",
                "uniform float c;",
                "uniform float p;",
                "varying float intensity;",
                "void main() ",
                "{",
                "  vec3 vNormal = normalize( normalMatrix * normal );",
                "	 vec3 vNormel = normalize( normalMatrix * viewVector );",
                "  intensity = pow( c - dot(vNormal, vNormel), p );",
                "  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
                "}"
            ].join("\n"),
            fragmentShader: [
                "uniform vec3 glowColor;",
                "varying float intensity;",
                "void main() ",
                "{",
                "	vec3 glow = glowColor * intensity;",
                "    gl_FragColor = vec4( glow, 1.0 );",
                "}"
            ].join("\n")
        },
        remapToGradient: {
            getUniforms: function() {
                return {
                    "tDiffuse": { type: "t", value: null },
                    "offsetRepeat": { type: "v4", value: new THREE.Vector4(0, 0, 1, 1) },
                    "tGradient": { type: "t", value: null },
                    "opacity": { type: "f", value: 1 }
                };
            },
            vertexShader: [
                "uniform vec4 offsetRepeat;",
                "varying vec2 vUv;",
                "void main() {",
                "  vUv = uv * offsetRepeat.zw + offsetRepeat.xy;",
                "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
                "}"
            ].join("\n"),
            fragmentShader: [
                "uniform sampler2D tDiffuse;",
                "uniform sampler2D tGradient;",
                "uniform float opacity;",
                "varying vec2 vUv;",
                "void main() {",
                "  vec4 srcColor = texture2D(tDiffuse, vUv);",
                "  float scalar = 0.21 * srcColor.r + 0.72 * srcColor.g + 0.07 * srcColor.b;",
                "  gl_FragColor = vec4(texture2D(tGradient, vec2(scalar, scalar)).rgb, srcColor.a * opacity);",
                "}"
            ].join("\n")
        },
        shield: {
            getUniforms: function() {
                return {
                    "color": { type: "c", value: new THREE.Color(0x0099FF) },
                    "opacity": { type: "f", value: 1 }
                };
            },
            vertexShader: [
                "varying float angleSin;",
                "void main() {",
                "  vec4 worldPosition = modelMatrix * vec4(position, 1.0);",
                "  vec3 worldNormal = normalize(mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * normal);",
                "  vec3 I = normalize(cameraPosition - worldPosition.xyz);",
                "  angleSin = 1.0 - abs(dot(worldNormal, I));",
                "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
                "}"
            ].join("\n"),
            fragmentShader: [
                "uniform vec3 color;",
                "uniform float opacity;",
                "varying float angleSin;",
                "void main() {",
                "  gl_FragColor = vec4(color, angleSin * opacity);",
                "}"
            ].join("\n")
        }
    }
};