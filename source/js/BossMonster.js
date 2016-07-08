"use strict";

this.galaxies = this.galaxies || {};

galaxies.BossMonster = function () {
    this.maxXVel = 0.5;

    this.initModel();

    this.reset();
};

galaxies.BossMonster.prototype = {
    beginRoar: function () {
        this.closeEyes();

        this.state = "roarBegin";
        this.mouthOpenAmount = 0;
    },

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

    initModel: function () {
        var mainObject = new THREE.Object3D(),
            topObject = new THREE.Object3D(),
            bottomSprite = galaxies.utils.makeSprite('bossbottom', true),
            middleSprite = galaxies.utils.makeSprite('bossmiddle', true),
            topSprite = galaxies.utils.makeSprite('bosstop', true),
            eye1Sprite = galaxies.utils.makeSprite('bosseye1', true),
            eye2Sprite = galaxies.utils.makeSprite('bosseye2', true),
            eye3Sprite = galaxies.utils.makeSprite('bosseye3', true),
            eye4Sprite = galaxies.utils.makeSprite('bosseye4', true),
            eyelid1Sprite = galaxies.utils.makeSprite('bosseyelid1', true),
            eyelid2Sprite = galaxies.utils.makeSprite('bosseyelid2', true),
            eyelid3Sprite = galaxies.utils.makeSprite('bosseyelid3', true),
            eyelid4Sprite = galaxies.utils.makeSprite('bosseyelid4', true);

        bottomSprite.scale.set(3.44, 2.09, 1);
        middleSprite.scale.set(2.19, 3.92, 1);
        topSprite.scale.set(2.77, 1.82, 1);

        eye1Sprite.scale.set(0.55, 0.64, 1);
        eye2Sprite.scale.set(0.21, 0.17, 1);
        eye3Sprite.scale.set(0.21, 0.17, 1);
        eye4Sprite.scale.set(0.61, 0.57, 1);

        eyelid1Sprite.scale.set(0.57, 0.67, 1);
        eyelid2Sprite.scale.set(0.21, 0.18, 1);
        eyelid3Sprite.scale.set(0.23, 0.18, 1);
        eyelid4Sprite.scale.set(0.60, 0.65, 1);

        topObject.add(middleSprite);
        topObject.add(topSprite);

        topObject.add(eye1Sprite);
        topObject.add(eye2Sprite);
        topObject.add(eye3Sprite);
        topObject.add(eye4Sprite);

        topObject.add(eyelid1Sprite);
        topObject.add(eyelid2Sprite);
        topObject.add(eyelid3Sprite);
        topObject.add(eyelid4Sprite);

        middleSprite.position.set(0, -1.69, -0.02);
        bottomSprite.position.set(0, 0.225, -0.01);
        topObject.position.set(0, 1.27, 0);

        eye1Sprite.position.set(-1.16, 0.26, 0.01);
        eye2Sprite.position.set(-0.41, 0.635, 0.01);
        eye3Sprite.position.set(0.47, 0.595, 0.01);
        eye4Sprite.position.set(1.09, 0.335, 0.01);

        eyelid1Sprite.position.set(-1.17, 0.275, 0.02);
        eyelid2Sprite.position.set(-0.41, 0.63, 0.02);
        eyelid3Sprite.position.set(0.47, 0.59, 0.02);
        eyelid4Sprite.position.set(1.085, 0.295, 0.02);

        mainObject.add(bottomSprite);
        mainObject.add(topObject);

        this.object = mainObject;
        this.bottomSprite = bottomSprite;
        this.topObject = topObject;

        this.eyes = [{
            eyeball: eye1Sprite,
            eyelid: eyelid1Sprite
        }, {
            eyeball: eye2Sprite,
            eyelid: eyelid2Sprite
        }, {
            eyeball: eye3Sprite,
            eyelid: eyelid3Sprite
        }, {
            eyeball: eye4Sprite,
            eyelid: eyelid4Sprite
        }];
    },

    openEyes: function () {
        this.invincible = false;

        this.eyes.forEach(function (eye) {
            eye.eyelid.visible = false;
        });
    },

    reset: function () {
        this.state = "entering";
        this.object.visible = true;

        this.eyes.forEach(function (eye) {
            eye.eyeball.visible = true;
        });

        this.openEyes();

        this.invincible = true;

        this.timeToNextRoar = 0.5;
        this.mouthOpenAmount = 0;
        this.roarTimer = 0;
        this.roarTime = 4;

        this.object.scale.set(2, 2, 2);

        this._xPosition = 0.5;
        this._yPosition = 1;

        this.timeToNextMove = 1.6;
        this.targetXPos = 0.5;
        this.xVel = 0;

        this.updateCoordinates();
    },

    update: function (delta) {
        if (this.state === "entering") {
            if (this.yPosition > 0) {
                this.yPosition = Math.max(this.yPosition - delta, 0);
            }

            if (this.yPosition <= 0) {
                this.invincible = false;

                this.state = "idle";
            }
        }

        if (this.state === "exiting") {
            if (this.yPosition < 1) {
                this.yPosition = Math.min(this.yPosition + delta, 1);
            }

            if (this.yPosition >= 1) {
                this.disable();
            }
        }

        if (this.state === "roar") {
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

                // TODO: Spawn asteroids
            } else {
                this.mouthOpenAmount = this.roarTimer;
            }

            this.topObject.position.x = Math.sin(this.roarTimer * 70) * 0.04 * this.mouthOpenAmount;
        }

        if (this.state === "idle") {
            this.timeToNextRoar -= delta;

            if (this.timeToNextRoar <= 0) {
                this.closeEyes();

                this.state = "roar";
                this.roarTimer = 0;
            }
        }

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

                this.targetXPos = Math.min(Math.max(this.xPosition +
                    (Math.sign(0.5 - this.xPosition) || 1) * (0.3 + Math.random() * 0.7), 0), 1);
            }
        }
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

        this.updateSpriteX(this.xPosition);
        this.updateSpriteY(this.yPosition);
    },

    updateSpriteX: function (value) {
        var halfWidth = (this.object.scale.x * this.bottomSprite.scale.x) / 2;

        this.object.position.x = (1 - value) * (this.leftEdge + halfWidth) + value * (this.rightEdge - halfWidth);
    },

    updateSpriteY: function (value) {
        this.object.position.y = this.bottomEdge - value * 6;
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
