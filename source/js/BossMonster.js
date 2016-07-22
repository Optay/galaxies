"use strict";

this.galaxies = this.galaxies || {};

galaxies.BossMonster = function () {
    this.maxXVel = 0.5;
    this.roarTime = 5;
    this.cinematicAsteroids = [];

    this.initModel();

    this.roarAudio = new galaxies.audio.SimpleSound({
        source: galaxies.audio.getSound('monsterroar'),
        loop: false,
        start: false
    });

    this.ouchAudio = new galaxies.audio.SimpleSound({
        source: galaxies.audio.getSound('monsterouch'),
        loop: false,
        start: false,
        baseVolume: 3
    });

    this.reset();
};

galaxies.BossMonster.prototype = {
    closeEyes: function () {
        this.invincible = true;

        this.eyes.forEach(function (eye) {
            if (eye.eyeball.visible) {
                eye.eyelid.visible = true;
            }
        });
    },

    disable: function () {
        this.state = "inactive";
        this.object.visible = false;
    },

    enter: function () {
        if (this.state === "preEntry") {
            this.state = "entering";
            this.object.visible = true;
            this.updateCoordinates();
        }
    },

    hitEye: function (eye) {
        var scale = eye.hitThreshold * 1.5;

        eye.eyeball.visible = false;

        this.detachedEyeball.visible = true;

        galaxies.fx.explode(eye.rootPosition.clone().add(new THREE.Vector3(0, 0, 0.02)), "blood", 1.5);

        this.detachedEyeball.position.copy(eye.rootPosition);
        this.detachedEyeball.position.z += 0.01;
        this.detachedEyeball.scale.set(scale, scale, scale);

        this.eyeVel.set(-eye.hitThreshold * 9.7, eye.hitThreshold * 8.4, 0);

        if (eye.rootPosition.x > this.object.position.x) {
            this.detachedEyeball.scale.x = -this.detachedEyeball.scale.x;
            this.eyeVel.x = -this.eyeVel.x;
        }

        this.ouchAudio.startSound();

        this.closeEyes();

        this.timeToNextRoar = 1;

        if (--this.livesLeft <= 0) {
            this.state = "exiting";
        }
    },

    initModel: function () {
        var mainObject = new THREE.Object3D(),
            topObject = new THREE.Object3D(),
            bottomSprite = galaxies.utils.makeSprite('bossbottom', true),
            middleSprite = galaxies.utils.makeSprite('bossmiddle', true),
            topSprite = galaxies.utils.makeSprite('bosstop', true),
            eyeSprites = [
                galaxies.utils.makeSprite('bosseye1', true),
                galaxies.utils.makeSprite('bosseye2', true),
                galaxies.utils.makeSprite('bosseye3', true),
                galaxies.utils.makeSprite('bosseye4', true)
            ],
            eyelidSprites = [
                galaxies.utils.makeSprite('bosseyelid1', true),
                galaxies.utils.makeSprite('bosseyelid2', true),
                galaxies.utils.makeSprite('bosseyelid3', true),
                galaxies.utils.makeSprite('bosseyelid4', true)
            ],
            detachedEyeball = galaxies.utils.makeSprite('bosseyeball', true);

        bottomSprite.scale.set(3.44, 2.09, 1);
        middleSprite.scale.set(2.19, 3.92, 1);
        topSprite.scale.set(2.77, 1.82, 1);

        eyeSprites[0].scale.set(0.55, 0.64, 1);
        eyeSprites[1].scale.set(0.21, 0.17, 1);
        eyeSprites[2].scale.set(0.21, 0.17, 1);
        eyeSprites[3].scale.set(0.61, 0.57, 1);

        eyelidSprites[0].scale.set(0.57, 0.67, 1);
        eyelidSprites[1].scale.set(0.21, 0.18, 1);
        eyelidSprites[2].scale.set(0.23, 0.18, 1);
        eyelidSprites[3].scale.set(0.60, 0.65, 1);

        topObject.add(middleSprite);
        topObject.add(topSprite);

        eyeSprites.forEach(function (eye) {
            topObject.add(eye);
        });

        eyelidSprites.forEach(function (eyelid) {
            topObject.add(eyelid);
        });

        middleSprite.position.set(0, -1.69, -0.02);
        bottomSprite.position.set(0, 0.225, -0.01);
        topObject.position.set(0, 1.27, 0);

        eyeSprites[0].position.set(-1.16, 0.26, 0.01);
        eyeSprites[1].position.set(-0.41, 0.635, 0.01);
        eyeSprites[2].position.set(0.47, 0.595, 0.01);
        eyeSprites[3].position.set(1.09, 0.335, 0.01);

        eyelidSprites[0].position.set(-1.17, 0.275, 0.02);
        eyelidSprites[1].position.set(-0.41, 0.63, 0.02);
        eyelidSprites[2].position.set(0.47, 0.59, 0.02);
        eyelidSprites[3].position.set(1.085, 0.295, 0.02);

        mainObject.add(bottomSprite);
        mainObject.add(topObject);

        this.object = mainObject;
        this.bottomSprite = bottomSprite;
        this.topObject = topObject;

        detachedEyeball.scale.set(0.96, 0.91);
        detachedEyeball.material.side = THREE.DoubleSide;

        this.detachedEyeball = new THREE.Object3D();
        this.detachedEyeball.add(detachedEyeball);
        this.detachedEyeball.visible = false;

        galaxies.engine.rootObject.add(this.detachedEyeball);

        this.eyes = [];

        for (var i = 0; i < 4; ++i) {
            this.eyes.push({
                eyeball: eyeSprites[i],
                eyelid: eyelidSprites[i],
                hitThreshold: 0,
                rootPosition: null
            });
        }
    },

    openEyes: function () {
        this.invincible = false;

        this.eyes.forEach(function (eye) {
            eye.eyelid.visible = false;
        });
    },

    reset: function () {
        this.state = "preEntry";
        this.object.visible = false;

        this.eyes.forEach(function (eye) {
            eye.eyeball.visible = true;
        });

        this.openEyes();
        
        this.invincible = true;
        this.livesLeft = this.eyes.length;

        this.timeToNextRoar = 0.5;
        this.mouthOpenAmount = 0;
        this.roarTimer = 0;

        this._xPosition = 0.5;
        this._yPosition = 1;

        this.timeToNextMove = 0.6;
        this.targetXPos = 0.5;
        this.xVel = 0;

        this.eyeVel = new THREE.Vector3();

        this.asteroidTimer = 0;

        this.updateCoordinates();
    },

    update: function (delta) {
        if (this.state === "entering") {
            this.updateEntering(delta);
        }

        if (this.state === "exiting") {
            this.updateExiting(delta);
        }

        if (this.state === "roar") {
            this.updateRoar(delta);
        }

        if (this.state === "idle") {
            this.updateIdle(delta);
        }

        if (this.state !== "preEntry" && this.state !== "entering" && this.state !== "exiting") {
            this.updateMovement(delta);

            this.updateCollisions(delta);

            this.updateCinematicAsteroids(delta);
        }

        if (this.detachedEyeball.visible) {
            this.updateDetachedEye(delta);
        }
    },

    updateCinematicAsteroids: function (delta) {
        var basePosition = this.object.position,
            yScale = this.object.scale.y;

        this.cinematicAsteroids = this.cinematicAsteroids.filter(function (data) {
            var asteroid = data.asteroid,
                conePoint;

            data.progress += delta;

            conePoint = basePosition.clone();

            conePoint.y += yScale * (1 + Math.min(data.progress * 2.5, 1.5));

            conePoint = galaxies.utils.projectToCone(conePoint);

            if (data.progress >= 1 || asteroid.state !== "cinematic") {
                if (asteroid.state === "cinematic") {
                   asteroid.state = "falling";
                }

                asteroid.angle = Math.atan2(conePoint.y, conePoint.x);
                asteroid.radius = galaxies.utils.flatLength(conePoint);
                asteroid.updatePosition();

                asteroid.object.scale.copy(data.targetScale);

                asteroid.velocityRadial = -asteroid.maxVelocityRadial * 0.9;
                asteroid.velocityTangential = (Math.random() - 0.5) * 5;

                return false;
            }

            asteroid.object.position.copy(conePoint);
            asteroid.object.scale.copy(data.targetScale.clone().multiplyScalar(data.progress));

            return true;
        });
    },

    updateCollisions: function (delta) {
        var camPos = galaxies.engine.camera.position,
            objScale = this.object.scale,
            topPos = this.object.position.clone().add(this.topObject.position.clone().multiply(objScale));

        this.eyes.forEach(function (eye) {
            var eyeball = eye.eyeball;

            if (eyeball.visible) {
                eye.rootPosition = topPos.clone().add(eyeball.position.clone().multiply(objScale));
            }
        });

        galaxies.engine.projectiles.forEach(function (proj) {
            if (proj.alreadyCollidedWith.indexOf(this) > -1) {
                return;
            }

            var projectedPrevCenter = proj.lastPos.clone(),
                projectedCenter = proj.object.position.clone(),
                projectedEdge = projectedCenter.clone().add(
                    projectedCenter.clone().normalize().multiplyScalar(proj.hitThreshold)),
                diff = projectedCenter.clone().sub(camPos),
                diff2 = projectedPrevCenter.clone().sub(camPos),
                diff3 = projectedEdge.clone().sub(camPos),
                projLine,
                scaledHitThresholdSq;

            projectedCenter.sub(diff.multiplyScalar(projectedCenter.z / diff.z));
            projectedPrevCenter.sub(diff2.multiplyScalar(projectedPrevCenter.z / diff2.z));
            projectedEdge.sub(diff3.multiplyScalar(projectedEdge.z / diff3.z));

            projLine = projectedCenter.clone().sub(projectedPrevCenter);

            scaledHitThresholdSq = projectedCenter.distanceToSquared(projectedEdge);

            this.eyes.forEach(function (eye) {
                if (eye.eyeball.visible) {
                    var eyeLine = eye.rootPosition.clone().sub(projectedPrevCenter),
                        scalar, checkPoint;

                    eyeLine.projectOnVector(projLine);

                    scalar = eyeLine.clone().divide(projLine);
                    scalar = Math.min(Math.max(scalar.x || scalar.y || scalar.z, 0), 1);

                    checkPoint = projectedPrevCenter.clone().add(projLine.clone().multiplyScalar(scalar));

                    if (galaxies.utils.flatLengthSqr(checkPoint.sub(eye.rootPosition)) <=
                        scaledHitThresholdSq + eye.hitThreshold * eye.hitThreshold) {
                        proj.alreadyCollidedWith.push(this);
                        proj.hit();

                        if (!this.invincible) {
                            this.hitEye(eye);
                        }
                    }
                }
            }, this);
        }, this);
    },

    updateCoordinates: function () {
        var cornerPos = new THREE.Vector3(-1, -1, -1),
            camPos = galaxies.engine.camera.position.clone();

        cornerPos.unproject(galaxies.engine.camera);

        cornerPos = galaxies.engine.rootObject.worldToLocal(cornerPos);

        cornerPos.sub(camPos).normalize();

        cornerPos.multiplyScalar(-camPos.z / cornerPos.z).add(camPos);

        this.leftEdge = cornerPos.x;
        this.rightEdge = -cornerPos.x;
        this.bottomEdge = cornerPos.y;

        var scale = Math.max((this.rightEdge - this.leftEdge) / 22, 1);

        this.eyes.forEach(function (eye) {
            var trueSize = eye.eyeball.scale.clone().multiplyScalar(scale);

            eye.hitThreshold = Math.max(trueSize.x, trueSize.y, scale / 3);
        });

        this.object.scale.set(scale, scale, scale);

        this.updateSpriteX(this.xPosition);
        this.updateSpriteY(this.yPosition);
    },

    updateDetachedEye: function (delta) {
        var prevPos = this.detachedEyeball.position.clone(),
            diff;

        this.detachedEyeball.position.add(this.eyeVel.clone().multiplyScalar(delta));

        diff = this.detachedEyeball.position.clone().sub(prevPos);

        this.eyeVel.y -= this.object.scale.y * 22 * delta;

        this.detachedEyeball.rotation.z = Math.atan2(diff.y, diff.x);

        if (this.eyeVel.x < 0) {
            this.detachedEyeball.rotation.z += 3 * Math.PI / 4;
        } else {
            this.detachedEyeball.rotation.z += Math.PI / 4;
        }

        if (this.detachedEyeball.position.y + this.detachedEyeball.scale.y < this.bottomEdge) {
            this.detachedEyeball.visible = false;
        }
    },

    updateEntering: function (delta) {
        if (this.yPosition > 0) {
            this.yPosition = Math.max(this.yPosition - delta, 0);
        }

        if (this.yPosition <= 0) {
            this.invincible = false;

            this.state = "idle";
        }
    },

    updateExiting: function (delta) {
        if (this.yPosition < 1) {
            this.yPosition = Math.min(this.yPosition + delta, 1);
        } else {
            this.disable();
        }
    },

    updateIdle: function (delta) {
        this.timeToNextRoar -= delta;

        if (galaxies.engine.isGameOver) {
            this.state = "exiting";

            return;
        }

        if (this.timeToNextRoar <= 0) {
            this.closeEyes();

            this.roarAudio.startSound();

            this.state = "roar";
            this.roarTimer = 0;
            this.asteroidTimer = 0;
        }
    },

    updateMovement: function (delta) {
        var distToTarget = this.targetXPos - this.xPosition,
            absDistToTarget = Math.abs(distToTarget);

        if (absDistToTarget > 0.001) {
            var pt = absDistToTarget / 0.2,
                absVel;

            this.xVel += Math.sign(distToTarget) * this.maxXVel * delta;

            absVel = Math.abs(this.xVel);

            if (absVel > this.maxXVel) {
                this.xVel = Math.sign(this.xVel) * this.maxXVel;

                absVel = Math.abs(this.xVel);
            }

            if (pt < 1) {
                this.xVel = Math.sign(distToTarget) * Math.min(absVel, (2 * pt - pt * pt) * this.maxXVel);
            }

            this.xPosition += this.xVel * delta;
        } else {
            this.timeToNextMove -= delta;

            if (this.timeToNextMove <= 0) {
                this.timeToNextMove = 2 * Math.random() * 3;

                var direction = Math.sign(0.5 - this.xPosition) || (Math.random() - 0.5);

                this.targetXPos = Math.min(Math.max(this.xPosition + direction * (0.3 + Math.random() * 0.7), 0), 1);
            }
        }
    },

    updateRoar: function (delta) {
        this.roarTimer += delta;

        if (this.roarTimer > this.roarTime) {
            this.mouthOpenAmount = this.roarTime + 1 - this.roarTimer;

            if (this.mouthOpenAmount <= 0) {
                this.mouthOpenAmount = 0;

                this.openEyes();

                this.state = "idle";

                this.timeToNextRoar = 2 + Math.random() * 3;
            }
        } else if (this.roarTimer > 1) {
            if (this.mouthOpenAmount !== 1) {
                this.mouthOpenAmount = 1;
            }

            this.asteroidTimer -= delta;

            if (this.asteroidTimer <= 0 && this.roarTime - this.roarTimer > 1) {
                this.asteroidTimer += 1.2;

                var asteroid = galaxies.engine.addObstacle("asteroid");

                asteroid.state = "cinematic";

                this.cinematicAsteroids.push({
                    progress: 0,
                    asteroid: asteroid,
                    targetScale: asteroid.object.scale.clone()
                });
            }
        } else {
            this.mouthOpenAmount = this.roarTimer;
        }

        this.topObject.position.x = Math.sin(this.roarTimer * 70) * 0.04 * this.mouthOpenAmount;
    },

    updateSpriteX: function (value) {
        var halfWidth = (this.object.scale.x * this.bottomSprite.scale.x) / 2;

        this.object.position.x = (1 - value) * (this.leftEdge + halfWidth) + value * (this.rightEdge - halfWidth);
    },

    updateSpriteY: function (value) {
        this.object.position.y = this.bottomEdge - value * this.object.scale.y * 3.5;
    }
};

Object.defineProperties(galaxies.BossMonster.prototype, {
    xPosition: {
        get: function () {
            return this._xPosition;
        },
        set: function (value) {
            this._xPosition = value;

            this.updateSpriteX(value);
        }
    },
    yPosition: {
        get: function () {
            return this._yPosition;
        },
        set: function (value) {
            this._yPosition = value;

            this.updateSpriteY(value);
        }
    },
    mouthOpenAmount: {
        get: function () {
            return this._mouthOpenAmount;
        },
        set: function (value) {
            this._mouthOpenAmount = value;

            this.topObject.position.y = 1.27 + value * 2.73;
        }
    }
});
