/// <reference path="AsteroidRubble.ts" />
/// <reference path="IcyRubble.ts" />
/// <reference path="IceCubeRubble.ts" />
/// <reference path="RadRubble.ts" />
/// <reference path="Debris.ts" />
"use strict";

namespace galaxies {
    export interface ManagedSprite {
        texture: THREE.Texture;
        spriteSheet: galaxies.SpriteSheet;
        material: THREE.Material;
        sprite: THREE.Mesh | THREE.Object3D;
        rotation: number;
        pool?: Pool<ManagedSprite>;
    }

    const CHARACTER_FLY_SPEED = 5;
    const CHARACTER_TUMBLE_SPEED = 3;

    // TODO: Adjust these based on mobile/not?
    const DEBRIS_COUNT = 8;
    const RUBBLE_COUNT = 8;
    const PLANET_RUBBLE_COUNT = 24;

    export class FX {
        static gradientNames: string[] = [
            "spread", "clone", "golden", "heart", "star", "shield", "fire",
            "blueFire", "blood", "white", "green", "brown", "icy", "ufoFire"
        ];
        static gradients: { [key: string]: THREE.Texture };

        private static baseGlowMaterial: THREE.ShaderMaterial;

        // Common particle textures
        private static smokeTexture: THREE.Texture;
        private static sparkleTexture: THREE.Texture;
        private static starTexture: THREE.Texture;

        // Object pools
        private static activeRubble: Rubble[];
        private static debrisPool: Pool<Debris>;
        private static rubbleTypeMap: { [key: string]: (owningPool: Pool<Rubble>) => Rubble };
        private static rubbleTypes: string[];
        private static rubblePools: { [key: string]: Pool<Rubble> };

        // Particle groups
        private static particleGroups: SPE.Group[];
        private static bubbleInGroup: SPE.Group;
        private static bubblePopGroup: SPE.Group;
        private static cometGroup: SPE.Group;
        private static fireworksExplodeGroup: SPE.Group;
        private static fireworksSparkleGroup: SPE.Group;
        private static planetDustGroup: SPE.Group;
        private static planetFireGroup: SPE.Group;
        private static purpleTrailGroup: SPE.Group;
        private static rainbowJetGroup: SPE.Group;
        private static shieldGroup: SPE.Group;
        private static smokeGroup: SPE.Group;
        private static staricleNames: string[];
        private static staricleColors: { [key: string]: any };
        private static stariclesGroup: SPE.Group;
        private static staricles: { [key: string]: SPE.Emitter };

        // Sprite pools
        private static activeSprites: ManagedSprite[];
        private static collectEffectPool: Pool<ManagedSprite>;
        private static poofExplosionPool: Pool<ManagedSprite>;
        private static powerupAppearPool: Pool<ManagedSprite>;
        private static toonExplosionPool: Pool<ManagedSprite>;

        private static heartSprite: THREE.Sprite;
        private static planetExplosion: ManagedSprite;

        static AddGlowObject(baseObject: THREE.Mesh, hexColor: string | number): THREE.Mesh {
            if (!FX.baseGlowMaterial) {
                const glowShader = galaxies.shaders.materials.glowObject;

                FX.baseGlowMaterial = new THREE.ShaderMaterial({
                    uniforms: glowShader.getUniforms(),
                    vertexShader: glowShader.vertexShader,
                    fragmentShader: glowShader.fragmentShader,
                    side: THREE.BackSide,
                    blending: THREE.AdditiveBlending,
                    transparent: true
                });
            }

            const material = FX.baseGlowMaterial.clone();
            material.uniforms["glowColor"].value = new THREE.Color(hexColor);

            const glowObject = new THREE.Mesh(baseObject.geometry, material);
            glowObject.position.set(0, 0, 0);
            glowObject.scale.set(1.3, 1.3, 1.3);

            baseObject.add(glowObject);

            return glowObject;
        }

        static Cleanup(): void {
            FX.activeRubble.forEach(function(rubblePiece) {
                rubblePiece.Deactivate();
            });

            FX.activeRubble = [];

            FX.particleGroups.forEach(function(particleGroup) {
                particleGroup.emitters.forEach(function(emitter) {
                    emitter.disable();
                });
            });

            if (galaxies.passes.warpBubble) {
                FX.HideWarpBubble();
            }

            for (let i = FX.activeSprites.length - 1; i > -1; --i) {
                FX.DisableSprite(FX.activeSprites[i]);
            }
        }

        static CreateGradatedSprite(texName: string,
            spritePhysicalSize: THREE.Vector2,
            frames: number[][],
            frameRate: number = 30): ManagedSprite {
            const tex = new THREE.Texture(galaxies.queue.getResult(texName));
            const remapToGradient = galaxies.shaders.materials.remapToGradient;
            const sheet = new galaxies.SpriteSheet(tex, frames, frameRate || 30);
            const mat = new THREE.ShaderMaterial({
                uniforms: remapToGradient.getUniforms(),
                vertexShader: remapToGradient.vertexShader,
                fragmentShader: remapToGradient.fragmentShader,
                shading: THREE.FlatShading,
                depthWrite: false,
                depthTest: false,
                transparent: true,
                blending: THREE.AdditiveBlending
            });
            let sprite: any;

            tex.needsUpdate = true;

            mat.uniforms.tDiffuse.value = tex;

            sprite = new THREE.Mesh(new THREE.PlaneGeometry(spritePhysicalSize.x, spritePhysicalSize.y), mat);
            sprite.up.set(0, 0, 1);

            galaxies.engine.rootObject.add(sprite);

            return {
                texture: tex,
                spriteSheet: sheet,
                material: mat,
                sprite: sprite,
                rotation: 0
            };
        }

        static GetComet(): SPE.Emitter {
            if (!FX.cometGroup) {
                const cometSettings = {
                    type: SPE.distributions.BOX,
                    particleCount: 160,
                    duration: null as any,
                    maxAge: { value: 1.5 },
                    position: { spread: new THREE.Vector3(0.6, 0.6, 0.6) },
                    velocity: {
                        value: new THREE.Vector3(0, 0, -5),
                        spread: new THREE.Vector3(0.2, 0.2, 2)
                    },
                    color: { value: [new THREE.Color("rgb(6, 6, 20)"), new THREE.Color("rgb(255, 77, 0)")] },
                    opacity: { value: [0.8, 0.1] },
                    size: {
                        value: [6, 2],
                        spread: [4]
                    }
                };

                FX.cometGroup = new SPE.Group({
                    texture: { value: FX.starTexture },
                    blending: THREE.AdditiveBlending,
                    transparent: true,
                    alphaTest: 0,
                    depthWrite: false,
                    maxParticleCount: 1000
                });

                FX.cometGroup.addPool(1, cometSettings, true);

                FX.particleGroups.push(FX.cometGroup);

                galaxies.engine.rootObject.add(FX.cometGroup.mesh);
            }

            return FX.cometGroup.getFromPool();
        }

        static GetPurpleTrailEmitter(): SPE.Emitter {
            if (!FX.purpleTrailGroup) {
                const purpleTrailSettings = {
                    type: SPE.distributions.SPHERE,
                    particleCount: 800,
                    maxAge: { value: 0.3, spread: 0.15 },
                    position: { radius: 0.1, spread: new THREE.Vector3(0.1, 0, 0) },
                    velocity: {
                        distribution: SPE.distributions.BOX,
                        value: new THREE.Vector3(0, 0, -5),
                        spread: new THREE.Vector3(0, 0, 2)
                    },
                    color: { value: [new THREE.Color("fuchsia"), new THREE.Color("purple")] },
                    angle: { spread: Math.PI },
                    opacity: { value: [1, 1, 0.5] },
                    size: { value: [1, 0.6], spread: 0.25 }
                };

                FX.purpleTrailGroup = new SPE.Group({
                    texture: { value: FX.sparkleTexture },
                    maxParticleCount: 6400
                });

                FX.purpleTrailGroup.addPool(4, purpleTrailSettings, true);

                FX.particleGroups.push(FX.purpleTrailGroup);

                galaxies.engine.rootObject.add(FX.purpleTrailGroup.mesh);
            }

            return FX.purpleTrailGroup.getFromPool();
        }

        static GetRainbowEmitter(): SPE.Emitter {
            if (!FX.rainbowJetGroup) {
                const rainbowJetSettings = {
                    type: SPE.distributions.SPHERE,
                    particleCount: 800,
                    maxAge: { value: 0.3, spread: 0.15 },
                    position: { radius: 0.1, spread: new THREE.Vector3(0.1, 0, 0) },
                    velocity: {
                        distribution: SPE.distributions.BOX,
                        value: new THREE.Vector3(0, 0, -5),
                        spread: new THREE.Vector3(0, 0, 2)
                    },
                    color: {
                        value: [
                            new THREE.Color("red"), new THREE.Color("yellow"), new THREE.Color("green"),
                            new THREE.Color("turquoise"), new THREE.Color("blue"), new THREE.Color("indigo")
                        ]
                    },
                    angle: { spread: Math.PI },
                    opacity: { value: [1, 1, 0.5] },
                    size: { value: [1, 0.6], spread: 0.25 }
                };

                FX.rainbowJetGroup = new SPE.Group({
                    texture: { value: FX.sparkleTexture },
                    maxParticleCount: 3600
                });

                FX.rainbowJetGroup.addPool(2, rainbowJetSettings, true);

                FX.particleGroups.push(FX.rainbowJetGroup);

                galaxies.engine.rootObject.add(FX.rainbowJetGroup.mesh);
            }

            return FX.rainbowJetGroup.getFromPool();
        }

        static GetShield(): SPE.Emitter {
            if (!FX.shieldGroup) {
                const bubbleShieldSettings = {
                    type: SPE.distributions.SPHERE,
                    particleCount: 1500,
                    maxAge: { value: 0.8, spread: 0.4 },
                    position: { radius: galaxies.engine.SHIELD_RADIUS, spread: new THREE.Vector3(0.3, 0.3, 0.3) },
                    color: { value: new THREE.Color(0x0099FF) },
                    opacity: { value: [0, 1, 1, 1, 0] },
                    size: { value: 1.5, spread: 0.1 }
                };

                FX.shieldGroup = new SPE.Group({
                    texture: { value: FX.starTexture },
                    maxParticleCount: 3000
                });

                FX.shieldGroup.addPool(1, bubbleShieldSettings, true);

                FX.particleGroups.push(FX.shieldGroup);

                galaxies.engine.planet.add(FX.shieldGroup.mesh);
            }

            return FX.shieldGroup.getFromPool();
        }

        static GetSmallFlameJet(longerTail: boolean): [SPE.Group, SPE.Emitter] {
            if (!FX.smokeGroup) {
                const smokeSettings = {
                    type: SPE.distributions.SPHERE,
                    particleCount: 400,
                    maxAge: { value: 0.3, spread: 0.2 },
                    position: { radius: 0.01, spread: new THREE.Vector3(0.02, 0, 0) },
                    velocity: {
                        distribution: SPE.distributions.BOX,
                        value: new THREE.Vector3(0, 0, -4),
                        spread: new THREE.Vector3(1, 1, 4)
                    },
                    drag: { value: 0.5, spread: 0.2 },
                    color: { value: new THREE.Color("white") },
                    angle: { spread: Math.PI },
                    opacity: { value: [1, 0], spread: [0, 0.5, 0] },
                    size: { value: [1, 8], spread: [1, 3] }
                };

                FX.smokeGroup = new SPE.Group({
                    texture: { value: FX.smokeTexture },
                    maxParticleCount: 4800,
                    blending: THREE.NormalBlending
                });

                FX.smokeGroup.addPool(6, smokeSettings, true);

                FX.particleGroups.push(FX.smokeGroup);

                galaxies.engine.rootObject.add(FX.smokeGroup.mesh);

                FX.smokeGroup.mesh.position.z = 0;
            }
            const smallFlameJetGroup = new SPE.Group({
                texture: { value: FX.smokeTexture },
                maxParticleCount: 400
            });
            const smallFlameEmitter = new SPE.Emitter({
                type: SPE.distributions.SPHERE,
                particleCount: 400,
                maxAge: { value: (longerTail ? 0.3 : 0.1), spread: 0.05 },
                position: { radius: 0.05, spread: new THREE.Vector3(0.1, 0, 0) },
                velocity: {
                    distribution: SPE.distributions.BOX,
                    value: new THREE.Vector3(0, 0, -5),
                    spread: new THREE.Vector3(0, 0, 2)
                },
                acceleration: {
                    distribution: SPE.distributions.BOX,
                    value: new THREE.Vector3(0, 0, 0.4),
                    spread: new THREE.Vector3(0, 0, 0.1)
                },
                color: {
                    value: [new THREE.Color(1, 0.8, 0.2), new THREE.Color(0.7, 0.35, 0.1), new THREE.Color(0.5, 0, 0)]
                },
                angle: { spread: Math.PI },
                opacity: { value: [1, 0] },
                size: { value: [1, 0.4], spread: 0.25 }
            });

            smallFlameJetGroup.addEmitter(smallFlameEmitter);

            return [smallFlameJetGroup, FX.smokeGroup.getFromPool()];
        }

        static HideTimeDilation(): void {
            createjs.Tween.get(galaxies.passes.focus.params)
                .to({ strength: 0 }, 1000)
                .call(function() {
                    galaxies.engine.composerStack.disablePass(galaxies.passes.indexes.focus);
                    galaxies.passes.focus = null;
                });

            createjs.Tween.get(galaxies.passes.vignette.params)
                .to({ amount: 0 }, 1000)
                .call(function() {
                    galaxies.engine.composerStack.disablePass(galaxies.passes.indexes.vignette);
                    galaxies.passes.vignette = null;
                });
        }

        static HideWarpBubble(): void {
            galaxies.engine.composerStack.disablePass(galaxies.passes.indexes.warpBubble);
            galaxies.passes.warpBubble = null;
        }

        static Init() {
            FX.activeSprites = [];
            FX.gradients = {};
            FX.particleGroups = [];

            FX.gradientNames.forEach(function(name) {
                FX.gradients[name] = new THREE.Texture(galaxies.queue.getResult(name.toLowerCase() + "gradient"));
                FX.gradients[name].needsUpdate = true;
            });

            FX.InitPasses();

            FX.InitRubble();

            FX.InitStaricles();

            FX.InitTextures();
        }

        static ShakeCamera(magnitude: number, secondsDuration?: number): void {
            // Make sure camera is reset before applying shake tween
            galaxies.engine.camera.rotation.x = 0;
            galaxies.engine.camera.rotation.y = 0;

            let duration: number;

            if (typeof(secondsDuration) !== "number") {
                duration = 500;
            } else {
                duration = secondsDuration * 1000;
            }

            magnitude = 0.01 * magnitude;

            // Frequency is dependent on duration because easing function uses a normalized 0-1 value, not
            // an elapsed time value. This keeps shake the same no matter the duration.
            const freqX = duration / 17;
            const freqY = duration / 18;

            createjs.Tween.get(galaxies.engine.camera.rotation)
                .to({ x: magnitude, override: true }, duration, galaxies.utils.getShakeEase(freqX))
                .to({ x: 0 }, 0); // reset position
            createjs.Tween.get(galaxies.engine.camera.rotation)
                .to({ y: magnitude, override: true }, duration, galaxies.utils.getShakeEase(freqY))
                .to({ y: 0 }, 0); // reset position
        }

        static ShowBlueExplosion(position: THREE.Vector3): void {
            //blueExplosionGroup.triggerPoolEmitter(1, position);
            FX.ShowExplosion(position, "blueFire");
        }

        static ShowDebris(position: THREE.Vector3, velocity: THREE.Vector3): void {
            if (!FX.debrisPool) {
                FX.debrisPool = new Pool<Debris>(function(owningPool: Pool<Debris>) {
                        return new Debris(owningPool);
                    },
                    8);
            }

            //explosionGroup.triggerPoolEmitter(1, position);
            //explode(position);

            FX.ScatterRubble(FX.debrisPool.GetMany(DEBRIS_COUNT), position, velocity, 2);
        }

        static ShowExplosion(position: THREE.Vector3, style: string = "fire", scale: number = 1): void {
            if (!FX.toonExplosionPool) {
                FX.toonExplosionPool = new Pool<ManagedSprite>(FX.CreatePoolSprite,
                    1,
                    {
                        frames: galaxies.utils.generateSpriteFrames(new THREE.Vector2(0, 0),
                            new THREE.Vector2(512, 512),
                            new THREE.Vector2(4096, 4096),
                            53,
                            new THREE.Vector2(0, 0),
                            0.5),
                        name: "toonexplosion",
                        size: new THREE.Vector2(4, 4)
                    });
            }

            if (FX.gradientNames.indexOf(style) === -1) {
                style = "fire";
            }

            FX.ActivateSprite(FX.toonExplosionPool.GetOne(), position, style, scale, true, Math.PI);
        }

        static ShowFireworks(position: THREE.Vector3): void {
            if (!FX.fireworksExplodeGroup) {
                const fireworkSettings = {
                    type: SPE.distributions.SPHERE,
                    particleCount: 150,
                    duration: 0.1,
                    maxAge: {
                        value: 0.6,
                        spread: 0.2
                    },
                    position: { radius: 0.6 },
                    velocity: { value: new THREE.Vector3(12) },
                    acceleration: { value: new THREE.Vector3(-7) },
                    color: {
                        value: [
                            new THREE.Color(1.6, 0.8, 0.8), new THREE.Color(1.6, 1.6, 0.8),
                            new THREE.Color(0.8, 1.6, 0.8), new THREE.Color(0.8, 1.6, 1.6),
                            new THREE.Color(0.8, 0.8, 1.6), new THREE.Color(1.6, 0.8, 1.6)
                        ]
                    },
                    wiggle: { spread: 5 },
                    opacity: { value: [1, 1, 1, 0.1] },
                    size: { value: [2.5, 1.4] }
                };
                const sparkleSettings = {
                    type: SPE.distributions.SPHERE,
                    particleCount: 300,
                    duration: 0.8,
                    maxAge: { value: 0.1, spread: 0.1 },
                    position: { radius: 2, spread: new THREE.Vector3(2, 0, 0) },
                    color: { value: new THREE.Color("white") },
                    opacity: { value: [1, 0] },
                    size: { value: 0.8 }
                };

                FX.fireworksExplodeGroup = new SPE.Group({
                    texture: { value: FX.starTexture },
                    maxParticleCount: 500
                });
                FX.fireworksSparkleGroup = new SPE.Group({
                    texture: { value: FX.starTexture },
                    maxParticleCount: 1000
                });

                FX.fireworksExplodeGroup.addPool(1, fireworkSettings, true);
                FX.fireworksSparkleGroup.addPool(1, sparkleSettings, true);

                FX.particleGroups.push(FX.fireworksExplodeGroup);
                FX.particleGroups.push(FX.fireworksSparkleGroup);

                galaxies.engine.rootObject.add(FX.fireworksExplodeGroup.mesh);
                galaxies.engine.rootObject.add(FX.fireworksSparkleGroup.mesh);
            }

            FX.fireworksExplodeGroup.triggerPoolEmitter(1, position);

            createjs.Tween.get(FX.fireworksExplodeGroup).wait(700)
                .call(FX.fireworksSparkleGroup.triggerPoolEmitter, [1, position]);
        }

        static ShowHeartLoss(angle: number): void {
            if (!FX.heartSprite) {
                const heartTex = new THREE.Texture(galaxies.queue.getResult("flatheart"));
                heartTex.needsUpdate = true;

                const heartMat = new THREE.SpriteMaterial({
                    map: heartTex,
                    color: 0xffffff
                });

                FX.heartSprite = new THREE.Sprite(heartMat);
            }
            const startLen = galaxies.engine.PLANET_RADIUS + galaxies.engine.CHARACTER_HEIGHT * 0.6;
            const startPoint = new THREE.Vector3(-Math.sin(angle), Math.cos(angle), 0)
                .multiplyScalar(startLen);

            galaxies.engine.rootObject.add(FX.heartSprite);

            FX.heartSprite.material.opacity = 1;
            FX.heartSprite.material.rotation = angle;
            FX.heartSprite.scale.set(0.8, 0.8, 0.8);
            FX.heartSprite.position.copy(startPoint);

            startPoint.multiplyScalar((startLen + 2) / startLen);

            createjs.Tween.get(FX.heartSprite.position)
                .to({ x: startPoint.x, y: startPoint.y, z: startPoint.z }, 750);

            createjs.Tween.get(FX.heartSprite.material)
                .to({ opacity: 0 }, 750)
                .call(function() {
                    galaxies.engine.rootObject.remove(FX.heartSprite);
                });
        }

        static ShowHit(position: THREE.Vector3, type: string = "white", scale?: number): void {
            if (!FX.poofExplosionPool) {
                FX.poofExplosionPool = new Pool<ManagedSprite>(FX.CreatePoolSprite,
                    1,
                    {
                        frames: galaxies.utils.generateSpriteFrames(new THREE.Vector2(0, 0),
                            new THREE.Vector2(256, 256),
                            new THREE.Vector2(256, 8192),
                            20,
                            new THREE.Vector2(0, 0),
                            0.5),
                        name: "explosionpoof",
                        size: new THREE.Vector2(2.5, 2.5)
                    });
            }

            if (FX.gradientNames.indexOf(type) === -1) {
                type = "white";
            }

            if (typeof scale !== "number") {
                scale = type === "white" ? 0.5 : 1;
            }

            FX.ActivateSprite(FX.poofExplosionPool.GetOne(), position, type, scale, true, Math.PI);
        }

        static ShowLaserHit(position: THREE.Vector3): void {
            //laserHitGroup.triggerPoolEmitter(1, position);
            FX.ShowHit(position, "green");
        }

        static ShowPlanetExplosion(): void {
            if (!FX.planetExplosion) {
                let roughTexture = new THREE.Texture(galaxies.queue.getResult("projhitparticle"));
                roughTexture.needsUpdate = true;

                let dustSettings = {
                        type: SPE.distributions.SPHERE,
                        particleCount: 1000,
                        duration: 0.1,
                        maxAge: { value: 2 },
                        position: { radius: 0.1 },
                        velocity: {
                            value: new THREE.Vector3(12, 0, 0),
                            spread: new THREE.Vector3(10, 0, 0),
                        },
                        drag: { value: 0.5 },
                        color: {
                            value: new THREE.Color(0.500, 0.500, 0.500),
                            spread: new THREE.Vector3(0.4, 0.4, 0.4),
                        },
                        opacity: {
                            value: [0.5, 0],
                            spread: 0.8,
                        },
                        size: {
                            value: 0.6,
                            spread: 0.2,
                        },
                    },
                    fireSettings = {
                        type: SPE.distributions.SPHERE,
                        particleCount: 200,
                        duration: 0.1,
                        maxAge: { value: 1.5 },
                        position: { radius: 0.1 },
                        velocity: {
                            value: new THREE.Vector3(10, 0, 0),
                            spread: new THREE.Vector3(6, 0, 0)
                        },
                        acceleration: { value: new THREE.Vector3(0, 0, -40) },
                        color: {
                            value: [new THREE.Color(0.800, 0.400, 0.100), new THREE.Color(0.5, 0.000, 0.000)],
                            spread: [new THREE.Vector3(0.1, 0.2, 0.4)]
                        },
                        opacity: {
                            value: [0.5, 0],
                            spread: [0.8]
                        },
                        size: {
                            value: [8, 6],
                            spread: [6]
                        }
                    };

                FX.planetDustGroup = new SPE.Group({
                    texture: { value: roughTexture },
                    blending: THREE.NormalBlending,
                    transparent: true,
                    maxParticleCount: 1000
                });

                FX.planetFireGroup = new SPE.Group({
                    texture: { value: FX.starTexture },
                    blending: THREE.AdditiveBlending,
                    maxParticleCount: 200
                });

                FX.planetDustGroup.addPool(1, dustSettings, true);
                FX.planetFireGroup.addPool(1, fireSettings, true);

                FX.particleGroups.push(FX.planetDustGroup);
                FX.particleGroups.push(FX.planetFireGroup);

                galaxies.engine.rootObject.add(FX.planetDustGroup.mesh);
                galaxies.engine.rootObject.add(FX.planetFireGroup.mesh);

                let frames = galaxies.utils.generateSpriteFrames(new THREE.Vector2(0, 0),
                        new THREE.Vector2(512, 512),
                        new THREE.Vector2(2048, 4096),
                        25,
                        new THREE.Vector2(0, 0),
                        0.5),
                    texture = new THREE.Texture(galaxies.queue.getResult("planetexplosion")),
                    sheet = new galaxies.SpriteSheet(texture, frames, 30),
                    material = new THREE.SpriteMaterial({
                        map: texture,
                        rotation: 0,
                        shading: THREE.FlatShading,
                        depthTest: false,
                        depthWrite: false,
                        transparent: true,
                        blending: THREE.AdditiveBlending
                    }),
                    sprite = new THREE.Sprite(material);

                texture.needsUpdate = true;

                galaxies.engine.rootObject.add(sprite);

                sprite.scale.set(16, 16, 16);
                sprite.position.set(0, 0, galaxies.engine.PLANET_RADIUS + 5);

                FX.planetExplosion = {
                    texture: texture,
                    spriteSheet: sheet,
                    material: material,
                    sprite: sprite,
                    rotation: 0
                };
            }

            galaxies.engine.rootObject.remove(galaxies.engine.planet);

            FX.EnsureRubblePool("plain");

            let rubblePieces = FX.rubblePools["plain"].GetMany(PLANET_RUBBLE_COUNT);

            FX.ScatterRubble(rubblePieces, new THREE.Vector3(), new THREE.Vector3(), 2, 6);

            rubblePieces.forEach(function(rubblePiece) {
                rubblePiece.startScale *= 3;
            });

            FX.planetDustGroup.triggerPoolEmitter(new THREE.Vector3());
            FX.planetFireGroup.triggerPoolEmitter(new THREE.Vector3());

            FX.planetExplosion.sprite.visible = true;
            FX.planetExplosion.spriteSheet.play();

            FX.activeSprites.push(FX.planetExplosion);

            FX.TintScreen(0xFFAA00, 0.4, 250, 750);

            new galaxies.audio.PositionedSound({
                source: galaxies.audio.getSound("planetsplode"),
                position: galaxies.engine.rootObject.position,
                baseVolume: 12,
                loop: false
            });
        }

        static ShowPowerupAppear(position: THREE.Vector3, type: string): ManagedSprite {
            if (!FX.powerupAppearPool) {
                FX.powerupAppearPool = new Pool<ManagedSprite>(FX.CreatePoolSprite,
                    1,
                    {
                        frames: galaxies.utils.generateSpriteFrames(new THREE.Vector2(0, 0),
                            new THREE.Vector2(512, 512),
                            new THREE.Vector2(4096, 4096),
                            57,
                            new THREE.Vector2(0, 0),
                            0.5).reverse(),
                        name: "powerupcollecteffect",
                        size: new THREE.Vector2(2.5, 2.5)
                    });
            }

            if (FX.gradientNames.indexOf(type) === -1) {
                type = "star";
            }

            const spriteData = FX.powerupAppearPool.GetOne();

            FX.ActivateSprite(spriteData, position, type);

            return spriteData;
        }

        static ShowRubble(position: THREE.Vector3, type: string, velocity: THREE.Vector3): void {
            if (type === "debris") {
                FX.ShowDebris(position, velocity);

                return;
            }

            if (FX.rubbleTypes.indexOf(type) === -1) {
                type = "plain";
            }

            FX.EnsureRubblePool(type);

            FX.ScatterRubble(FX.rubblePools[type].GetMany(RUBBLE_COUNT), position, velocity);
        }

        static ShowShieldAppear(): void {
            if (!FX.bubbleInGroup) {
                const bubbleSettings = FX.GetBubbleSettings(true);

                FX.bubbleInGroup = new SPE.Group({
                    texture: { value: FX.starTexture },
                    maxParticleCount: 3000
                });

                FX.bubbleInGroup.addPool(1, bubbleSettings, true);

                FX.particleGroups.push(FX.bubbleInGroup);

                galaxies.engine.rootObject.add(FX.bubbleInGroup.mesh);
            }

            FX.bubbleInGroup.triggerPoolEmitter(1, new THREE.Vector3());
        }

        static ShowShieldPop(): void {
            if (!FX.bubblePopGroup) {
                const bubbleSettings = FX.GetBubbleSettings();

                FX.bubblePopGroup = new SPE.Group({
                    texture: { value: FX.starTexture },
                    maxParticleCount: 3000
                });

                FX.bubblePopGroup.addPool(1, bubbleSettings, true);

                FX.particleGroups.push(FX.bubblePopGroup);

                galaxies.engine.rootObject.add(FX.bubblePopGroup.mesh);
            }

            FX.bubblePopGroup.triggerPoolEmitter(1, new THREE.Vector3());
        }

        static ShowStaricles(position: THREE.Vector3, type?: string): void {
            if (!FX.stariclesGroup) {
                FX.stariclesGroup = new SPE.Group({
                    texture: { value: FX.starTexture },
                    maxParticleCount: FX.staricleNames.length * 100
                });

                FX.particleGroups.push(FX.stariclesGroup);

                galaxies.engine.rootObject.add(FX.stariclesGroup.mesh);

                FX.collectEffectPool = new Pool<ManagedSprite>(FX.CreatePoolSprite,
                    1,
                    {
                        frames: galaxies.utils.generateSpriteFrames(new THREE.Vector2(0, 0),
                            new THREE.Vector2(512, 512),
                            new THREE.Vector2(4096, 4096),
                            57,
                            new THREE.Vector2(0, 0),
                            0.5),
                        name: "powerupcollecteffect",
                        size: new THREE.Vector2(2.5, 2.5)
                    });
            }

            if (!type || (FX.staricleNames.indexOf(type) === -1)) {
                type = "star";
            }

            let staricleEmitter: any = null;

            if (!FX.staricles[type]) {
                staricleEmitter = new SPE.Emitter(FX.GetStaricleSettings(FX.staricleColors[type]));

                FX.staricles[type] = staricleEmitter;
                FX.stariclesGroup.addEmitter(staricleEmitter);
            } else {
                staricleEmitter = FX.staricles[type];
                staricleEmitter.enable();
            }

            staricleEmitter.position.value = staricleEmitter.position.value.copy(position);
            staricleEmitter.rotation.center = staricleEmitter.rotation.center.copy(position);
            staricleEmitter.updateFlags.rotationCenter = true;

            FX.ActivateSprite(FX.collectEffectPool.GetOne(), position, type);
        }

        static ShowTimeDilation(): void {
            galaxies.engine.composerStack.enablePass(galaxies.passes.indexes.focus);
            galaxies.passes.focus = galaxies.engine.composerStack.passItems[galaxies.passes.indexes.focus].pass;

            galaxies.engine.composerStack.enablePass(galaxies.passes.indexes.vignette);
            galaxies.passes.vignette = galaxies.engine.composerStack.passItems[galaxies.passes.indexes.vignette].pass;

            FX.UpdateFocus();

            createjs.Tween.get(galaxies.passes.focus.params)
                .set({ strength: 0 })
                .to({ strength: 0.05 }, 1000);

            createjs.Tween.get(galaxies.passes.vignette.params)
                .set({ amount: 0 })
                .to({ amount: 0.75 }, 1000);
        }

        static ShowWarpBubble(worldPosition: THREE.Vector3, worldBubbleEdge: THREE.Vector3): void {
            const passes = galaxies.passes;
            const warpInfo = passes.warpInfo;

            galaxies.engine.composerStack.enablePass(passes.indexes.warpBubble);

            passes.warpBubble = galaxies.engine.composerStack.passItems[passes.indexes.warpBubble].pass;

            passes.warpBubble.params.progression = 0.0;

            warpInfo.worldSpaceOrigin = worldPosition;
            warpInfo.worldSpaceEdge = worldBubbleEdge;

            FX.UpdateWarpBubble();
        }

        static SpinOutClone(delta: number): void {
            const cloneSprite = galaxies.engine.player.cloneSprite;

            cloneSprite.position.y = cloneSprite.position.y + CHARACTER_FLY_SPEED * delta;
            cloneSprite.rotation.z = cloneSprite.rotation.z + CHARACTER_TUMBLE_SPEED * delta;
            cloneSprite.material.rotation = cloneSprite.rotation.z;
        }

        static TintScreen(color: string | number, amount: number, msFadeInTime: number, msFadeOutTime: number): void {
            const passes = galaxies.passes;

            if (!passes.colorAdd) {
                galaxies.engine.composerStack.enablePass(passes.indexes.colorAdd);

                passes.colorAdd = galaxies.engine.composerStack.passItems[passes.indexes.colorAdd].pass;
            }

            passes.colorAdd.params.amount = 0.0;
            passes.colorAdd.params.color.set(color);

            createjs.Tween.removeTweens(passes.colorAdd.params);
            createjs.Tween.get(passes.colorAdd.params)
                .to({ amount: amount }, msFadeInTime)
                .to({ amount: 0.0 }, msFadeOutTime)
                .call(function() {
                    galaxies.engine.composerStack.disablePass(passes.indexes.colorAdd);

                    passes.colorAdd = null;
                });
        }

        static Update(delta: number): void {
            let i: number;

            for (i = FX.activeRubble.length - 1; i > -1; --i) {
                FX.activeRubble[i].Update(delta);

                if (!FX.activeRubble[i].IsActive()) {
                    FX.activeRubble.splice(i, 1);
                }
            }

            FX.particleGroups.forEach(function(particleGroup) {
                particleGroup.tick(delta);
            });

            const warpBubble = galaxies.passes.warpBubble;

            if (warpBubble) {
                warpBubble.params.progression += delta * 2;

                if (warpBubble.params.progression >= 1) {
                    FX.HideWarpBubble();
                }
            }

            const cameraRootPos = galaxies.engine.rootObject.worldToLocal(
                galaxies.engine.camera.localToWorld(new THREE.Vector3()));

            for (i = FX.activeSprites.length - 1; i > -1; --i) {
                FX.UpdateSprite(FX.activeSprites[i], cameraRootPos, delta);
            }

            if (galaxies.engine.isGameOver && (galaxies.engine.planet.parent == null)) {
                const playerSprite = galaxies.engine.player.sprite;

                playerSprite.position.y = playerSprite.position.y + CHARACTER_FLY_SPEED * delta;
                playerSprite.rotation.z = playerSprite.rotation.z + CHARACTER_TUMBLE_SPEED * delta;
                playerSprite.material.rotation = playerSprite.rotation.z;

                FX.SpinOutClone(delta);
            }
        }

        static UpdateFocus(): void {
            galaxies.passes.focus.params.center.set(galaxies.engine.canvasHalfWidth, galaxies.engine.canvasHalfHeight);
        }

        static UpdateGlowObject(glowObject: THREE.Mesh): void {
            const toCamera = glowObject.worldToLocal(galaxies.engine.camera.localToWorld(new THREE.Vector3()));
            //toCamera = glowbjects[i].worldToLocal( toCamera );
            glowObject.material.uniforms["viewVector"].value = toCamera;
        }

        static UpdateSprite(spriteData: ManagedSprite, cameraRootPos: THREE.Vector3, delta: number): void {
            const tex = spriteData.texture;

            if (spriteData.sprite.visible) {
                spriteData.spriteSheet.update(delta);

                if (spriteData.sprite instanceof THREE.Mesh) {
                    spriteData.sprite.lookAt(cameraRootPos);
                    spriteData.sprite.rotation.z = spriteData.rotation;
                }

                if (!(spriteData.material instanceof THREE.SpriteMaterial)) {
                    spriteData.material.uniforms.offsetRepeat.value.set(tex.offset.x,
                        tex.offset.y,
                        tex.repeat.x,
                        tex.repeat.y);
                }
            }

            if (!spriteData.spriteSheet.isPlaying()) {
                FX.DisableSprite(spriteData);
            }
        }

        static UpdateWarpBubble(): void {
            const passes = galaxies.passes;
            const warpBubble = passes.warpBubble;
            const warpInfo = passes.warpInfo;
            const screenSpaceCenter = galaxies.utils.getNormalizedScreenPosition(warpInfo.worldSpaceOrigin);
            const screenSpaceEdge = galaxies.utils.getNormalizedScreenPosition(warpInfo.worldSpaceEdge);
            const screenAdjust = new THREE.Vector2(galaxies.engine.canvasHalfHeight, galaxies.engine.canvasHalfWidth)
                .normalize();

            warpBubble.params.center = screenSpaceCenter;
            warpBubble.params.maxRadius =
                screenAdjust.multiplyScalar(screenSpaceEdge.sub(screenSpaceCenter).divide(screenAdjust).length());
        }

        private static ActivateSprite(spriteData: ManagedSprite,
            position: THREE.Vector3,
            gradientType: string,
            scale: number = 1,
            autoRotate: boolean = true,
            rotationOffset: number = 0) {
            spriteData.spriteSheet.play();

            spriteData.material.uniforms["tGradient"].value = FX.gradients[gradientType];

            spriteData.sprite.visible = true;
            spriteData.sprite.position.copy(position);
            spriteData.sprite.position.z += 0.1;
            spriteData.sprite.scale.set(scale, scale, scale);

            if (autoRotate) {
                spriteData.rotation = galaxies.utils.flatAngle(position) + rotationOffset;
            }

            FX.activeSprites.push(spriteData);
        }

        private static CreatePoolSprite(pool: Pool<ManagedSprite>, createCache: { [key: string]: any }): ManagedSprite {
            const spriteData = FX.CreateGradatedSprite(createCache["name"], createCache["size"], createCache["frames"]);

            spriteData.pool = pool;

            return spriteData;
        }

        private static DisableSprite(spriteData: ManagedSprite): void {
            spriteData.sprite.visible = false;

            if (spriteData.pool) {
                spriteData.pool.ReturnOne(spriteData);
            }

            const activeIndex = FX.activeSprites.indexOf(spriteData);

            if (activeIndex > -1) {
                FX.activeSprites.splice(activeIndex, 1);
            }
        }

        private static EnsureRubblePool(type: string): void {
            if (!FX.rubblePools[type]) {
                FX.rubblePools[type] = new Pool<Rubble>(FX.rubbleTypeMap[type], RUBBLE_COUNT);
            }
        }

        private static GetBubbleSettings(reversedTime: boolean = false): any {
            return {
                type: SPE.distributions.SPHERE,
                particleCount: 1000,
                direction: reversedTime ? -1 : 1,
                duration: 0.1,
                maxAge: { value: 0.8, spread: 0.3 },
                position: { radius: galaxies.engine.SHIELD_RADIUS - 0.1 },
                velocity: { value: new THREE.Vector3(2, 0, 0), spread: new THREE.Vector3(1, 0, 0) },
                rotation: { axisSpread: new THREE.Vector3(2, 2, 2), angleSpread: 2 * Math.PI },
                color: { value: new THREE.Color(0x0099FF) },
                opacity: { value: [1, 0] },
                size: { value: 1.5, spread: 0.1 }
            };
        }

        private static GetStaricleSettings(color: any): any {
            return {
                type: SPE.distributions.SPHERE,
                color: color,
                particleCount: 100,
                duration: 0.1,
                activeMultiplier: 1,
                maxAge: {
                    value: 0.8,
                    spread: 0.3
                },
                position: { radius: 0.1 },
                velocity: {
                    value: new THREE.Vector3(2, 0, 0),
                    spread: new THREE.Vector3(1, 0, 0)
                },
                rotation: { axisSpread: new THREE.Vector3(2, 2, 2), angleSpread: 2 * Math.PI },
                drag: { value: 0.5 },
                opacity: { value: [1, 0.5] },
                size: { value: 0.3, spread: 0.1 }
            };
        }

        private static InitPasses(): void {
            galaxies.passes.warpInfo = {
                worldSpaceOrigin: new THREE.Vector3(),
                worldSpaceEdge: new THREE.Vector3()
            };

            galaxies.engine.shadersPool.addShader("WarpBubblePass");
            galaxies.engine.shadersPool.addShader("ZoomBlurPass");
            galaxies.engine.shadersPool.addShader("VignettePass");
            galaxies.engine.shadersPool.addShader("ColorAddPass");

            galaxies.passes.indexes.warpBubble = galaxies.engine.composerStack.addPass("WarpBubblePass",
                false,
                { progression: 0 });

            galaxies.passes.indexes.focus = galaxies.engine.composerStack.addPass("ZoomBlurPass",
                false,
                { strength: 0 });

            galaxies.passes.indexes.vignette = galaxies.engine.composerStack.addPass("VignettePass",
                false,
                { amount: 0 });

            galaxies.passes.indexes.colorAdd = galaxies.engine.composerStack.addPass("ColorAddPass",
                false,
                { amount: 0 });
        }

        private static InitRubble(): void {
            FX.activeRubble = [];
            FX.rubblePools = {};
            FX.rubbleTypeMap = {};
            FX.rubbleTypes = [];

            FX.rubbleTypeMap["ice"] =
                function(owningPool: Pool<IceCubeRubble>) { return new IceCubeRubble(owningPool); };
            FX.rubbleTypeMap["icy"] =
                function(owningPool: Pool<IcyRubble>) { return new IcyRubble(owningPool); };
            FX.rubbleTypeMap["plain"] =
                function(owningPool: Pool<AsteroidRubble>) { return new AsteroidRubble(owningPool); };
            FX.rubbleTypeMap["rad"] =
                function(owningPool: Pool<RadRubble>) { return new RadRubble(owningPool); };

            for (let name in FX.rubbleTypeMap) {
                FX.rubbleTypes.push(name);
            }
        }

        private static InitStaricles(): void {
            FX.staricleColors = {};
            FX.staricleNames = [];
            FX.staricles = {};

            FX.staricleColors["heart"] = { value: new THREE.Color(1, 0.3, 0.3) };
            FX.staricleColors["spread"] = {
                value: [
                    new THREE.Color("white"), new THREE.Color(1, 1, 0.8), new THREE.Color(1, 0.8, 0.5),
                    new THREE.Color(1, 0.5, 0.5)
                ],
                spread: new THREE.Vector3(0.5, 0.2, 0.1)
            };
            FX.staricleColors["clone"] = {
                value: [new THREE.Color("white"), new THREE.Color(1, 0.8, 1), new THREE.Color("fuchsia")],
                spread: new THREE.Vector3(0.1, 0.1, 0.1)
            };
            FX.staricleColors["golden"] = {
                value: [new THREE.Color("white"), new THREE.Color("gold")],
                spread: new THREE.Vector3(0.2, 0.2, 2)
            };
            FX.staricleColors["star"] = { value: new THREE.Color("yellow") };
            FX.staricleColors["timeWarp"] = { value: new THREE.Color("white") };
            FX.staricleColors["shield"] = { value: new THREE.Color(0x0099FF) };

            for (let name in FX.staricleColors) {
                FX.staricleNames.push(name);
            }
        }

        private static InitTextures(): void {
            FX.smokeTexture = new THREE.Texture(galaxies.queue.getResult("smoke"));
            FX.smokeTexture.needsUpdate = true;

            FX.sparkleTexture = new THREE.Texture(galaxies.queue.getResult("sparkle"));
            FX.sparkleTexture.needsUpdate = true;

            FX.starTexture = new THREE.Texture(galaxies.queue.getResult("starparticle"));
            FX.starTexture.needsUpdate = true;
        }

        private static ScatterRubble(rubbleList: Rubble[],
            origin: THREE.Vector3,
            directedVelocity: THREE.Vector3,
            scatterScalar: number = 1,
            lifeTime?: number): void {
            rubbleList.forEach(function(rubblePiece: Rubble) {
                rubblePiece.position.copy(origin);
                rubblePiece.position.add(new THREE.Vector3(THREE.Math.randFloatSpread(0.5),
                    THREE.Math.randFloatSpread(0.5),
                    THREE.Math.randFloatSpread(0.5)));

                rubblePiece.Activate(lifeTime);

                rubblePiece.velocity.subVectors(rubblePiece.position, origin);
                rubblePiece.velocity.normalize().multiplyScalar(scatterScalar);
                rubblePiece.velocity.add(directedVelocity);

                FX.activeRubble.push(rubblePiece);
            });
        }
    }
}