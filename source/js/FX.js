/// <reference path="Pool.ts"/>
/// <reference path="Rubble.ts"/>
/// <reference path="AsteroidRubble.ts"/>
/// <reference path="IcyRubble.ts"/>
/// <reference path="IceCubeRubble.ts"/>
/// <reference path="RadRubble.ts"/>
/// <reference path="Debris.ts"/>
"use strict";
var galaxies;
(function (galaxies) {
    var CHARACTER_FLY_SPEED = 5;
    var CHARACTER_TUMBLE_SPEED = 3;
    // TODO: Adjust these based on mobile/not?
    var DEBRIS_COUNT = 8;
    var RUBBLE_COUNT = 8;
    var PLANET_RUBBLE_COUNT = 24;
    var FX = (function () {
        function FX() {
        }
        FX.AddGlowObject = function (baseObject, hexColor) {
            if (!FX.baseGlowMaterial) {
                var glowShader = galaxies.shaders.materials.glowObject;
                FX.baseGlowMaterial = new THREE.ShaderMaterial({
                    uniforms: glowShader.getUniforms(),
                    vertexShader: glowShader.vertexShader,
                    fragmentShader: glowShader.fragmentShader,
                    side: THREE.BackSide,
                    blending: THREE.AdditiveBlending,
                    transparent: true
                });
            }
            var material = FX.baseGlowMaterial.clone();
            material.uniforms['glowColor'].value = new THREE.Color(hexColor);
            var glowObject = new THREE.Mesh(baseObject.geometry, material);
            glowObject.position.set(0, 0, 0);
            glowObject.scale.set(1.3, 1.3, 1.3);
            baseObject.add(glowObject);
            return glowObject;
        };
        FX.Cleanup = function () {
            FX.activeRubble.forEach(function (rubblePiece) {
                rubblePiece.Deactivate();
            });
            FX.activeRubble = [];
            FX.particleGroups.forEach(function (particleGroup) {
                // TODO
            });
            if (galaxies.passes.warpBubble) {
                FX.HideWarpBubble();
            }
            for (var i = FX.activeSprites.length - 1; i > -1; --i) {
                FX.DisableSprite(FX.activeSprites[i]);
            }
        };
        FX.CreateGradatedSprite = function (texName, spritePhysicalSize, frames, frameRate) {
            if (frameRate === void 0) { frameRate = 30; }
            var tex = new THREE.Texture(galaxies.queue.getResult(texName)), remapToGradient = galaxies.shaders.materials.remapToGradient, sheet = new galaxies.SpriteSheet(tex, frames, frameRate || 30), mat = new THREE.ShaderMaterial({
                uniforms: remapToGradient.getUniforms(),
                vertexShader: remapToGradient.vertexShader,
                fragmentShader: remapToGradient.fragmentShader,
                shading: THREE.FlatShading,
                depthWrite: false,
                depthTest: false,
                transparent: true,
                blending: THREE.AdditiveBlending
            }), sprite;
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
        };
        FX.GetComet = function () {
            if (!FX.cometGroup) {
                var cometSettings = {
                    type: SPE.distributions.BOX,
                    particleCount: 160,
                    duration: null,
                    maxAge: { value: 1.5 },
                    position: { spread: new THREE.Vector3(0.6, 0.6, 0.6) },
                    velocity: { value: new THREE.Vector3(0, 0, -5),
                        spread: new THREE.Vector3(0.2, 0.2, 2) },
                    color: { value: [new THREE.Color("rgb(6, 6, 20)"), new THREE.Color("rgb(255, 77, 0)")] },
                    opacity: { value: [0.8, 0.1] },
                    size: { value: [6, 2],
                        spread: [4] }
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
        };
        FX.GetPurpleTrailEmitter = function () {
            if (!FX.purpleTrailGroup) {
                var purpleTrailSettings = {
                    type: SPE.distributions.SPHERE,
                    particleCount: 800,
                    maxAge: { value: 0.3, spread: 0.15 },
                    position: { radius: 0.1, spread: new THREE.Vector3(0.1, 0, 0) },
                    velocity: { distribution: SPE.distributions.BOX, value: new THREE.Vector3(0, 0, -5), spread: new THREE.Vector3(0, 0, 2) },
                    color: { value: [new THREE.Color('fuchsia'), new THREE.Color('purple')] },
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
        };
        FX.GetRainbowEmitter = function () {
            if (!FX.rainbowJetGroup) {
                var rainbowJetSettings = {
                    type: SPE.distributions.SPHERE,
                    particleCount: 800,
                    maxAge: { value: 0.3, spread: 0.15 },
                    position: { radius: 0.1, spread: new THREE.Vector3(0.1, 0, 0) },
                    velocity: { distribution: SPE.distributions.BOX, value: new THREE.Vector3(0, 0, -5), spread: new THREE.Vector3(0, 0, 2) },
                    color: { value: [new THREE.Color('red'), new THREE.Color('yellow'), new THREE.Color('green'), new THREE.Color('turquoise'), new THREE.Color('blue'), new THREE.Color('indigo')] },
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
        };
        FX.GetShield = function () {
            if (!FX.shieldGroup) {
                var bubbleShieldSettings = {
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
        };
        FX.GetSmallFlameJet = function (longerTail) {
            if (!FX.smokeGroup) {
                var smokeSettings = {
                    type: SPE.distributions.SPHERE,
                    particleCount: 400,
                    maxAge: { value: 0.3, spread: 0.2 },
                    position: { radius: 0.01, spread: new THREE.Vector3(0.02, 0, 0) },
                    velocity: { distribution: SPE.distributions.BOX, value: new THREE.Vector3(0, 0, -4), spread: new THREE.Vector3(1, 1, 4) },
                    drag: { value: 0.5, spread: 0.2 },
                    color: { value: new THREE.Color('white') },
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
            var smallFlameJetGroup = new SPE.Group({
                texture: { value: FX.smokeTexture },
                maxParticleCount: 400
            }), smallFlameEmitter = new SPE.Emitter({
                type: SPE.distributions.SPHERE,
                particleCount: 400,
                maxAge: { value: (longerTail ? 0.3 : 0.1), spread: 0.05 },
                position: { radius: 0.05, spread: new THREE.Vector3(0.1, 0, 0) },
                velocity: { distribution: SPE.distributions.BOX, value: new THREE.Vector3(0, 0, -5), spread: new THREE.Vector3(0, 0, 2) },
                acceleration: { distribution: SPE.distributions.BOX, value: new THREE.Vector3(0, 0, 0.4), spread: new THREE.Vector3(0, 0, 0.1) },
                color: { value: [new THREE.Color(1, 0.8, 0.2), new THREE.Color(0.7, 0.35, 0.1), new THREE.Color(0.5, 0, 0)] },
                angle: { spread: Math.PI },
                opacity: { value: [1, 0] },
                size: { value: [1, 0.4], spread: 0.25 }
            });
            smallFlameJetGroup.addEmitter(smallFlameEmitter);
            return [smallFlameJetGroup, FX.smokeGroup.getFromPool()];
        };
        FX.HideTimeDilation = function () {
            createjs.Tween.get(galaxies.passes.focus.params)
                .to({ strength: 0 }, 1000)
                .call(function () {
                galaxies.engine.composerStack.disablePass(galaxies.passes.indexes.focus);
                galaxies.passes.focus = null;
            });
            createjs.Tween.get(galaxies.passes.vignette.params)
                .to({ amount: 0 }, 1000)
                .call(function () {
                galaxies.engine.composerStack.disablePass(galaxies.passes.indexes.vignette);
                galaxies.passes.vignette = null;
            });
        };
        FX.HideWarpBubble = function () {
            galaxies.engine.composerStack.disablePass(galaxies.passes.indexes.warpBubble);
            galaxies.passes.warpBubble = null;
        };
        FX.Init = function () {
            FX.activeSprites = [];
            FX.gradients = {};
            FX.particleGroups = [];
            FX.gradientNames.forEach(function (name) {
                FX.gradients[name] = new THREE.Texture(galaxies.queue.getResult(name.toLowerCase() + "gradient"));
                FX.gradients[name].needsUpdate = true;
            });
            FX.InitPasses();
            FX.InitRubble();
            FX.InitStaricles();
            FX.InitTextures();
        };
        FX.ShakeCamera = function (magnitude, secondsDuration) {
            // Make sure camera is reset before applying shake tween
            galaxies.engine.camera.rotation.x = 0;
            galaxies.engine.camera.rotation.y = 0;
            var duration;
            if (typeof (secondsDuration) !== 'number') {
                duration = 500;
            }
            else {
                duration = secondsDuration * 1000;
            }
            magnitude = 0.01 * magnitude;
            // Frequency is dependent on duration because easing function uses a normalized 0-1 value, not
            // an elapsed time value. This keeps shake the same no matter the duration.
            var freqX = duration / 17;
            var freqY = duration / 18;
            createjs.Tween.get(galaxies.engine.camera.rotation)
                .to({ x: magnitude, override: true }, duration, galaxies.utils.getShakeEase(freqX))
                .to({ x: 0 }, 0); // reset position
            createjs.Tween.get(galaxies.engine.camera.rotation)
                .to({ y: magnitude, override: true }, duration, galaxies.utils.getShakeEase(freqY))
                .to({ y: 0 }, 0); // reset position
        };
        FX.ShowBlueExplosion = function (position) {
            //blueExplosionGroup.triggerPoolEmitter(1, position);
            FX.ShowExplosion(position, "blueFire");
        };
        FX.ShowDebris = function (position, velocity) {
            if (!FX.debrisPool) {
                FX.debrisPool = new galaxies.Pool(function (owningPool) {
                    return new galaxies.Debris(owningPool);
                }, 8);
            }
            //explosionGroup.triggerPoolEmitter(1, position);
            //explode(position);
            FX.ScatterRubble(FX.debrisPool.GetMany(DEBRIS_COUNT), position, velocity, 2);
        };
        FX.ShowExplosion = function (position, style, scale) {
            if (style === void 0) { style = "fire"; }
            if (scale === void 0) { scale = 1; }
            if (!FX.toonExplosionPool) {
                FX.toonExplosionPool = new galaxies.Pool(FX.CreatePoolSprite, 1, {
                    frames: galaxies.utils.generateSpriteFrames(new THREE.Vector2(0, 0), new THREE.Vector2(512, 512), new THREE.Vector2(4096, 4096), 53, new THREE.Vector2(0, 0), 0.5),
                    name: "toonexplosion",
                    size: new THREE.Vector2(4, 4)
                });
            }
            if (FX.gradientNames.indexOf(style) === -1) {
                style = "fire";
            }
            FX.ActivateSprite(FX.toonExplosionPool.GetOne(), position, style, scale, true, Math.PI);
        };
        FX.ShowFireworks = function (position) {
            if (!FX.fireworksExplodeGroup) {
                var fireworkSettings = {
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
                    color: { value: [new THREE.Color(1.6, 0.8, 0.8), new THREE.Color(1.6, 1.6, 0.8), new THREE.Color(0.8, 1.6, 0.8), new THREE.Color(0.8, 1.6, 1.6), new THREE.Color(0.8, 0.8, 1.6), new THREE.Color(1.6, 0.8, 1.6)] },
                    wiggle: { spread: 5 },
                    opacity: { value: [1, 1, 1, 0.1] },
                    size: { value: [2.5, 1.4] }
                }, sparkleSettings = {
                    type: SPE.distributions.SPHERE,
                    particleCount: 300,
                    duration: 0.8,
                    maxAge: { value: 0.1, spread: 0.1 },
                    position: { radius: 2, spread: new THREE.Vector3(2, 0, 0) },
                    color: { value: new THREE.Color('white') },
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
            setTimeout(function () {
                FX.fireworksSparkleGroup.triggerPoolEmitter(1, position);
            }, 700);
        };
        FX.ShowHeartLoss = function (angle) {
            if (!FX.heartSprite) {
                var heartTex = new THREE.Texture(galaxies.queue.getResult('flatheart'));
                heartTex.needsUpdate = true;
                var heartMat = new THREE.SpriteMaterial({
                    map: heartTex,
                    color: 0xffffff
                });
                FX.heartSprite = new THREE.Sprite(heartMat);
            }
            var startLen = galaxies.engine.PLANET_RADIUS + galaxies.engine.CHARACTER_HEIGHT * 0.6, startPoint = new THREE.Vector3(-Math.sin(angle), Math.cos(angle), 0)
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
                .call(function () {
                galaxies.engine.rootObject.remove(FX.heartSprite);
            });
        };
        FX.ShowHit = function (position, type, scale) {
            if (type === void 0) { type = "white"; }
            if (!FX.poofExplosionPool) {
                FX.poofExplosionPool = new galaxies.Pool(FX.CreatePoolSprite, 1, {
                    frames: galaxies.utils.generateSpriteFrames(new THREE.Vector2(0, 0), new THREE.Vector2(256, 256), new THREE.Vector2(256, 8192), 20, new THREE.Vector2(0, 0), 0.5),
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
        };
        FX.ShowLaserHit = function (position) {
            //laserHitGroup.triggerPoolEmitter(1, position);
            FX.ShowHit(position, "green");
        };
        FX.ShowPlanetExplosion = function () {
            if (!FX.planetExplosion) {
                var roughTexture = new THREE.Texture(galaxies.queue.getResult('projhitparticle'));
                roughTexture.needsUpdate = true;
                var dustSettings = {
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
                }, fireSettings = {
                    type: SPE.distributions.SPHERE,
                    particleCount: 200,
                    duration: 0.1,
                    maxAge: { value: 1.5 },
                    position: { radius: 0.1 },
                    velocity: { value: new THREE.Vector3(10, 0, 0),
                        spread: new THREE.Vector3(6, 0, 0) },
                    acceleration: { value: new THREE.Vector3(0, 0, -40) },
                    color: { value: [new THREE.Color(0.800, 0.400, 0.100), new THREE.Color(0.5, 0.000, 0.000)],
                        spread: [new THREE.Vector3(0.1, 0.2, 0.4)] },
                    opacity: { value: [0.5, 0],
                        spread: [0.8] },
                    size: { value: [8, 6],
                        spread: [6] }
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
                var frames_1 = galaxies.utils.generateSpriteFrames(new THREE.Vector2(0, 0), new THREE.Vector2(512, 512), new THREE.Vector2(2048, 4096), 25, new THREE.Vector2(0, 0), 0.5), texture = new THREE.Texture(galaxies.queue.getResult("planetexplosion")), sheet = new galaxies.SpriteSheet(texture, frames_1, 30), material = new THREE.SpriteMaterial({
                    map: texture,
                    rotation: 0,
                    shading: THREE.FlatShading,
                    depthTest: false,
                    depthWrite: false,
                    transparent: true,
                    blending: THREE.AdditiveBlending
                }), sprite = new THREE.Sprite(material);
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
            var rubblePieces = FX.rubblePools["plain"].GetMany(PLANET_RUBBLE_COUNT);
            FX.ScatterRubble(rubblePieces, new THREE.Vector3(), new THREE.Vector3(), 2, 6);
            rubblePieces.forEach(function (rubblePiece) {
                rubblePiece.startScale *= 3;
            });
            FX.planetDustGroup.triggerPoolEmitter(new THREE.Vector3());
            FX.planetFireGroup.triggerPoolEmitter(new THREE.Vector3());
            FX.planetExplosion.sprite.visible = true;
            FX.planetExplosion.spriteSheet.play();
            FX.activeSprites.push(FX.planetExplosion);
            FX.TintScreen(0xFFAA00, 0.4, 250, 750);
            new galaxies.audio.PositionedSound({
                source: galaxies.audio.getSound('planetsplode'),
                position: galaxies.engine.rootObject.position,
                baseVolume: 12,
                loop: false
            });
        };
        FX.ShowPowerupAppear = function (position, type) {
            if (!FX.powerupAppearPool) {
                FX.powerupAppearPool = new galaxies.Pool(FX.CreatePoolSprite, 1, {
                    frames: galaxies.utils.generateSpriteFrames(new THREE.Vector2(0, 0), new THREE.Vector2(512, 512), new THREE.Vector2(4096, 4096), 57, new THREE.Vector2(0, 0), 0.5).reverse(),
                    name: "powerupcollecteffect",
                    size: new THREE.Vector2(2.5, 2.5)
                });
            }
            if (FX.gradientNames.indexOf(type) === -1) {
                type = "star";
            }
            var spriteData = FX.powerupAppearPool.GetOne();
            FX.ActivateSprite(spriteData, position, type);
            return spriteData;
        };
        FX.ShowRubble = function (position, type, velocity) {
            if (type === "debris") {
                FX.ShowDebris(position, velocity);
                return;
            }
            if (FX.rubbleTypes.indexOf(type) === -1) {
                type = "plain";
            }
            FX.EnsureRubblePool(type);
            FX.ScatterRubble(FX.rubblePools[type].GetMany(RUBBLE_COUNT), position, velocity);
        };
        FX.ShowShieldAppear = function () {
            if (!FX.bubbleInGroup) {
                var bubbleSettings = FX.GetBubbleSettings(true);
                FX.bubbleInGroup = new SPE.Group({
                    texture: { value: FX.starTexture },
                    maxParticleCount: 3000
                });
                FX.bubbleInGroup.addPool(1, bubbleSettings, true);
                FX.particleGroups.push(FX.bubbleInGroup);
                galaxies.engine.rootObject.add(FX.bubbleInGroup.mesh);
            }
            FX.bubbleInGroup.triggerPoolEmitter(1, new THREE.Vector3());
        };
        FX.ShowShieldPop = function () {
            if (!FX.bubblePopGroup) {
                var bubbleSettings = FX.GetBubbleSettings();
                FX.bubblePopGroup = new SPE.Group({
                    texture: { value: FX.starTexture },
                    maxParticleCount: 3000
                });
                FX.bubblePopGroup.addPool(1, bubbleSettings, true);
                FX.particleGroups.push(FX.bubblePopGroup);
                galaxies.engine.rootObject.add(FX.bubblePopGroup.mesh);
            }
            FX.bubblePopGroup.triggerPoolEmitter(1, new THREE.Vector3());
        };
        FX.ShowStaricles = function (position, type) {
            if (!FX.stariclesGroup) {
                FX.stariclesGroup = new SPE.Group({
                    texture: { value: FX.starTexture },
                    maxParticleCount: FX.staricleNames.length * 100
                });
                FX.particleGroups.push(FX.stariclesGroup);
                galaxies.engine.rootObject.add(FX.stariclesGroup.mesh);
                FX.collectEffectPool = new galaxies.Pool(FX.CreatePoolSprite, 1, {
                    frames: galaxies.utils.generateSpriteFrames(new THREE.Vector2(0, 0), new THREE.Vector2(512, 512), new THREE.Vector2(4096, 4096), 57, new THREE.Vector2(0, 0), 0.5),
                    name: 'powerupcollecteffect',
                    size: new THREE.Vector2(2.5, 2.5)
                });
            }
            if (!type || (FX.staricleNames.indexOf(type) === -1)) {
                type = 'star';
            }
            var staricleEmitter = null;
            if (!FX.staricles[type]) {
                staricleEmitter = new SPE.Emitter(FX.GetStaricleSettings(FX.staricleColors[type]));
                FX.staricles[type] = staricleEmitter;
                FX.stariclesGroup.addEmitter(staricleEmitter);
            }
            else {
                staricleEmitter = FX.staricles[type];
                staricleEmitter.enable();
            }
            staricleEmitter.position.value = staricleEmitter.position.value.copy(position);
            staricleEmitter.rotation.center = staricleEmitter.rotation.center.copy(position);
            staricleEmitter.updateFlags.rotationCenter = true;
            FX.ActivateSprite(FX.collectEffectPool.GetOne(), position, type);
        };
        FX.ShowTimeDilation = function () {
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
        };
        FX.ShowWarpBubble = function (worldPosition, worldBubbleEdge) {
            var passes = galaxies.passes, warpInfo = passes.warpInfo;
            galaxies.engine.composerStack.enablePass(passes.indexes.warpBubble);
            passes.warpBubble = galaxies.engine.composerStack.passItems[passes.indexes.warpBubble].pass;
            passes.warpBubble.params.progression = 0.0;
            warpInfo.worldSpaceOrigin = worldPosition;
            warpInfo.worldSpaceEdge = worldBubbleEdge;
            FX.UpdateWarpBubble();
        };
        FX.SpinOutClone = function (delta) {
            var cloneSprite = galaxies.engine.player.cloneSprite;
            cloneSprite.position.y = cloneSprite.position.y + CHARACTER_FLY_SPEED * delta;
            cloneSprite.rotation.z = cloneSprite.rotation.z + CHARACTER_TUMBLE_SPEED * delta;
            cloneSprite.material.rotation = cloneSprite.rotation.z;
        };
        FX.TintScreen = function (color, amount, msFadeInTime, msFadeOutTime) {
            var passes = galaxies.passes;
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
                .call(function () {
                galaxies.engine.composerStack.disablePass(passes.indexes.colorAdd);
                passes.colorAdd = null;
            });
        };
        FX.Update = function (delta) {
            var i;
            for (i = FX.activeRubble.length - 1; i > -1; --i) {
                FX.activeRubble[i].Update(delta);
                if (!FX.activeRubble[i].IsActive()) {
                    FX.activeRubble.splice(i, 1);
                }
            }
            FX.particleGroups.forEach(function (particleGroup) {
                particleGroup.tick(delta);
            });
            var warpBubble = galaxies.passes.warpBubble;
            if (warpBubble) {
                warpBubble.params.progression += delta * 2;
                if (warpBubble.params.progression >= 1) {
                    FX.HideWarpBubble();
                }
            }
            var cameraRootPos = galaxies.engine.rootObject.worldToLocal(galaxies.engine.camera.localToWorld(new THREE.Vector3()));
            for (i = FX.activeSprites.length - 1; i > -1; --i) {
                FX.UpdateSprite(FX.activeSprites[i], cameraRootPos, delta);
            }
            if (galaxies.engine.isGameOver && (galaxies.engine.planet == null)) {
                var playerSprite = galaxies.engine.player.sprite;
                playerSprite.position.y = playerSprite.position.y + CHARACTER_FLY_SPEED * delta;
                playerSprite.rotation.z = playerSprite.rotation.z + CHARACTER_TUMBLE_SPEED * delta;
                playerSprite.material.rotation = playerSprite.rotation.z;
                FX.SpinOutClone(delta);
            }
        };
        FX.UpdateFocus = function () {
            galaxies.passes.focus.params.center.set(galaxies.engine.canvasHalfWidth, galaxies.engine.canvasHalfHeight);
        };
        FX.UpdateGlowObject = function (glowObject) {
            var toCamera = glowObject.worldToLocal(galaxies.engine.camera.localToWorld(new THREE.Vector3()));
            //toCamera = glowbjects[i].worldToLocal( toCamera );
            glowObject.material.uniforms['viewVector'].value = toCamera;
        };
        FX.UpdateSprite = function (spriteData, cameraRootPos, delta) {
            var tex = spriteData.texture;
            if (spriteData.sprite.visible) {
                spriteData.spriteSheet.update(delta);
                if (spriteData.sprite instanceof THREE.Mesh) {
                    spriteData.sprite.lookAt(cameraRootPos);
                    spriteData.sprite.rotation.z = spriteData.rotation;
                }
                spriteData.material.uniforms.offsetRepeat.value.set(tex.offset.x, tex.offset.y, tex.repeat.x, tex.repeat.y);
            }
            if (!spriteData.spriteSheet.isPlaying()) {
                FX.DisableSprite(spriteData);
            }
        };
        FX.UpdateWarpBubble = function () {
            var passes = galaxies.passes, warpBubble = passes.warpBubble, warpInfo = passes.warpInfo, screenSpaceCenter = galaxies.utils.getNormalizedScreenPosition(warpInfo.worldSpaceOrigin), screenSpaceEdge = galaxies.utils.getNormalizedScreenPosition(warpInfo.worldSpaceEdge), screenAdjust = new THREE.Vector2(galaxies.engine.canvasHalfHeight, galaxies.engine.canvasHalfWidth).normalize();
            warpBubble.params.center = screenSpaceCenter;
            warpBubble.params.maxRadius = screenAdjust.multiplyScalar(screenSpaceEdge.sub(screenSpaceCenter).divide(screenAdjust).length());
        };
        FX.ActivateSprite = function (spriteData, position, gradientType, scale, autoRotate, rotationOffset) {
            if (scale === void 0) { scale = 1; }
            if (autoRotate === void 0) { autoRotate = true; }
            if (rotationOffset === void 0) { rotationOffset = 0; }
            spriteData.spriteSheet.play();
            spriteData.material.uniforms['tGradient'].value = FX.gradients[gradientType];
            spriteData.sprite.visible = true;
            spriteData.sprite.position.copy(position);
            spriteData.sprite.position.z += 0.1;
            spriteData.sprite.scale.set(scale, scale, scale);
            if (autoRotate) {
                spriteData.rotation = galaxies.utils.flatAngle(position) + rotationOffset;
            }
            FX.activeSprites.push(spriteData);
        };
        FX.CreatePoolSprite = function (pool, createCache) {
            var spriteData = FX.CreateGradatedSprite(createCache["name"], createCache["size"], createCache["frames"]);
            spriteData.pool = pool;
            return spriteData;
        };
        FX.DisableSprite = function (spriteData) {
            spriteData.sprite.visible = false;
            if (spriteData.pool) {
                spriteData.pool.ReturnOne(spriteData);
            }
            var activeIndex = FX.activeSprites.indexOf(spriteData);
            if (activeIndex > -1) {
                FX.activeSprites.splice(activeIndex, 1);
            }
        };
        FX.EnsureRubblePool = function (type) {
            if (!FX.rubblePools[type]) {
                FX.rubblePools[type] = new galaxies.Pool(FX.rubbleTypeMap[type], RUBBLE_COUNT);
            }
        };
        FX.GetBubbleSettings = function (reversedTime) {
            if (reversedTime === void 0) { reversedTime = false; }
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
        };
        FX.GetStaricleSettings = function (color) {
            return {
                type: SPE.distributions.SPHERE,
                color: color,
                particleCount: 100,
                duration: 0.1,
                activeMultiplier: 1,
                maxAge: { value: 0.8,
                    spread: 0.3 },
                position: { radius: 0.1 },
                velocity: { value: new THREE.Vector3(2, 0, 0),
                    spread: new THREE.Vector3(1, 0, 0) },
                rotation: { axisSpread: new THREE.Vector3(2, 2, 2), angleSpread: 2 * Math.PI },
                drag: { value: 0.5 },
                opacity: { value: [1, 0.5] },
                size: { value: 0.3, spread: 0.1 }
            };
        };
        FX.InitPasses = function () {
            galaxies.passes.warpInfo = {
                worldSpaceOrigin: new THREE.Vector3(),
                worldSpaceEdge: new THREE.Vector3()
            };
            galaxies.engine.shadersPool.addShader("WarpBubblePass");
            galaxies.engine.shadersPool.addShader("ZoomBlurPass");
            galaxies.engine.shadersPool.addShader("VignettePass");
            galaxies.engine.shadersPool.addShader("ColorAddPass");
            galaxies.passes.indexes.warpBubble = galaxies.engine.composerStack.addPass("WarpBubblePass", false, { progression: 0 });
            galaxies.passes.indexes.focus = galaxies.engine.composerStack.addPass("ZoomBlurPass", false, { strength: 0 });
            galaxies.passes.indexes.vignette = galaxies.engine.composerStack.addPass("VignettePass", false, { amount: 0 });
            galaxies.passes.indexes.colorAdd = galaxies.engine.composerStack.addPass("ColorAddPass", false, { amount: 0 });
        };
        FX.InitRubble = function () {
            FX.activeRubble = [];
            FX.rubblePools = {};
            FX.rubbleTypeMap = {};
            FX.rubbleTypes = [];
            FX.rubbleTypeMap['ice'] =
                function (owningPool) { return new galaxies.IceCubeRubble(owningPool); };
            FX.rubbleTypeMap['icy'] =
                function (owningPool) { return new galaxies.IcyRubble(owningPool); };
            FX.rubbleTypeMap['plain'] =
                function (owningPool) { return new galaxies.AsteroidRubble(owningPool); };
            FX.rubbleTypeMap['rad'] =
                function (owningPool) { return new galaxies.RadRubble(owningPool); };
            for (var name_1 in FX.rubbleTypeMap) {
                FX.rubbleTypes.push(name_1);
            }
        };
        FX.InitStaricles = function () {
            FX.staricleColors = {};
            FX.staricleNames = [];
            FX.staricles = {};
            FX.staricleColors['heart'] = { value: new THREE.Color(1, 0.3, 0.3) };
            FX.staricleColors['spread'] = { value: [new THREE.Color('white'), new THREE.Color(1, 1, 0.8), new THREE.Color(1, 0.8, 0.5), new THREE.Color(1, 0.5, 0.5)], spread: new THREE.Vector3(0.5, 0.2, 0.1) };
            FX.staricleColors['clone'] = { value: [new THREE.Color('white'), new THREE.Color(1, 0.8, 1), new THREE.Color('fuchsia')], spread: new THREE.Vector3(0.1, 0.1, 0.1) };
            FX.staricleColors['golden'] = { value: [new THREE.Color('white'), new THREE.Color('gold')], spread: new THREE.Vector3(0.2, 0.2, 2) };
            FX.staricleColors['star'] = { value: new THREE.Color('yellow') };
            FX.staricleColors['timeWarp'] = { value: new THREE.Color('white') };
            FX.staricleColors['shield'] = { value: new THREE.Color(0x0099FF) };
            for (var name_2 in FX.staricleColors) {
                FX.staricleNames.push(name_2);
            }
        };
        FX.InitTextures = function () {
            FX.smokeTexture = new THREE.Texture(galaxies.queue.getResult('smoke'));
            FX.smokeTexture.needsUpdate = true;
            FX.sparkleTexture = new THREE.Texture(galaxies.queue.getResult('sparkle'));
            FX.sparkleTexture.needsUpdate = true;
            FX.starTexture = new THREE.Texture(galaxies.queue.getResult('starparticle'));
            FX.starTexture.needsUpdate = true;
        };
        FX.ScatterRubble = function (rubbleList, origin, directedVelocity, scatterScalar, lifeTime) {
            if (scatterScalar === void 0) { scatterScalar = 1; }
            rubbleList.forEach(function (rubblePiece) {
                rubblePiece.position.copy(origin);
                rubblePiece.position.add(new THREE.Vector3(THREE.Math.randFloatSpread(0.5), THREE.Math.randFloatSpread(0.5), THREE.Math.randFloatSpread(0.5)));
                rubblePiece.Activate(lifeTime);
                rubblePiece.velocity.subVectors(rubblePiece.position, origin);
                rubblePiece.velocity.normalize().multiplyScalar(scatterScalar);
                rubblePiece.velocity.add(directedVelocity);
                FX.activeRubble.push(rubblePiece);
            });
        };
        FX.gradientNames = ["spread", "clone", "golden", "heart", "star", "shield", "fire",
            "blueFire", "blood", "white", "green", "brown", "icy", "ufoFire"];
        return FX;
    }());
    galaxies.FX = FX;
})(galaxies || (galaxies = {}));
