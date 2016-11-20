"use strict";

this.galaxies = this.galaxies || {};

galaxies.Elephatron = function () {
    this.laserBlastPool = [];
    this.laserBlastIndex = 0;
    this.laserPelletPool = [];
    this.laserPelletIndex = 0;

    this.firingTime = 2;
    this.position = new THREE.Vector3();
    this.rx = null;
    this.ry = null;
    this.xBounceRate = null;
    this.yBounceRate = null;
    this.angularVelocity = null;

    this.getLaserBlast = this.getLaserBlast.bind(this);
    this.spawnLaserPellet = this.spawnLaserPellet.bind(this);

    this.fillPools();

    galaxies.Boss.call(this);

    this.name = "Elephatron";
};

galaxies.Elephatron.prototype = Object.create(galaxies.Boss.prototype);
galaxies.Elephatron.prototype.constructor = galaxies.Elephatron;

galaxies.Elephatron.prototype.disable = function () {
    galaxies.Boss.prototype.disable.call(this);

    this.laserBlastPool.forEach(function (blast) {
        galaxies.engine.rootObject.remove(blast.sprite);
    });

    this.laserPelletPool.forEach(function (pellet) {
        pellet.removeFromScene();
    });

    this.leftArm.disable();
    this.rightArm.disable();
    this.trunk.disable();
};

galaxies.Elephatron.prototype.enter = function () {
    galaxies.Boss.prototype.enter.call(this);

    this.targetAngle = Math.PI / 2;

    this.laserBlastPool.forEach(function (blast) {
        blast.sprite.visible = false;

        galaxies.engine.rootObject.add(blast.sprite);
    });
};

galaxies.Elephatron.prototype.fillPools = function () {
    var frames = galaxies.utils.generateSpriteFrames({x: 0, y: 0}, {x: 256, y: 256}, {x: 256, y: 2048}, 8),
        i, tex, sheet, mat, sprite;

    for (i = 0; i < 6; ++i) {
        tex = new THREE.Texture(galaxies.queue.getResult('lasercircleblast'));

        tex.needsUpdate = true;

        mat = new THREE.SpriteMaterial({
            map: tex,
            transparent: true
        });

        sheet = new galaxies.SpriteSheet(tex, frames, 30);

        sprite = new THREE.Sprite(mat);

        this.laserBlastPool.push({
            texture: tex,
            spriteSheet: sheet,
            material: mat,
            sprite: sprite,
            sound: new galaxies.audio.PositionedSound({
                source: galaxies.audio.getSound('ufoshoot'),
                position: this.rootPosition,
                baseVolume: 2.4,
                loop: false,
                start: false,
                dispose: false
            })
        });
    }

    for (i = 0; i < 10; ++i) {
        this.laserPelletPool.push(new galaxies.LaserPellet());
    }
};

galaxies.Elephatron.prototype.getLaserBlast = function (angle) {
    var blast = this.laserBlastPool[this.laserBlastIndex];

    if (++this.laserBlastIndex >= this.laserBlastPool.length) {
        this.laserBlastIndex = 0;
    }

    blast.sprite.visible = true;
    blast.material.rotation = angle + Math.PI / 2;
    blast.spriteSheet.play();

    return blast;
};

galaxies.Elephatron.prototype.initAudio = function () {
    galaxies.Boss.prototype.initAudio.call(this);

    this.roarAudio = new galaxies.audio.SimpleSound({
        source: galaxies.audio.getSound('elephatronroar'),
        loop: false,
        start: false
    });

    this.explodeAudio = new galaxies.audio.SimpleSound({
        source: galaxies.audio.getSound('satellitesplode'),
        loop: false,
        start: false
    });
};

galaxies.Elephatron.prototype.initModel = function () {
    galaxies.Boss.prototype.initModel.call(this);

    var mainObject = this.object,
        eyeGlow = galaxies.utils.makeSprite("elephatroneyeglow", true),
        body = galaxies.utils.makeSprite("elephatronbody", true),
        topTeeth = galaxies.utils.makeSprite("elephatronteeth", true),
        bottomTeeth = galaxies.utils.makeSprite("elephatronteeth", true),
        throat = galaxies.utils.makeSprite("elephatronthroat", true),
        leftLeg = new THREE.Object3D(),
        leftLegSprite = galaxies.utils.makeSprite("elephatronleg", true),
        leftLegFlame = galaxies.utils.makeSprite("elephatronlegflame", true),
        rightLeg = new THREE.Object3D(),
        rightLegSprite = galaxies.utils.makeSprite("elephatronleg", true),
        rightLegFlame = galaxies.utils.makeSprite("elephatronlegflame", true),
        leftEar = galaxies.utils.makeSprite("elephatronleftear", true),
        rightEar = galaxies.utils.makeSprite("elephatronrightear", true),
        antennaGlow = galaxies.utils.makeSprite("elephatronantennaglow", true),
        antenna = galaxies.utils.makeSprite("elephatronantenna", true);

    leftLegSprite.material.side = THREE.BackSide;
    leftLegFlame.material.side = THREE.BackSide;

    leftLegFlame.material.blending = THREE.AdditiveBlending;
    rightLegFlame.material.blending = THREE.AdditiveBlending;

    eyeGlow.scale.set(2.1, 1.03, 1);
    body.scale.set(2.87, 3.26, 1);
    topTeeth.scale.set(1.99, 0.74, 1);
    bottomTeeth.scale.copy(topTeeth.scale);
    throat.scale.set(2.07, 1.03, 1);
    rightLegSprite.scale.set(0.86, 1.4, 1);
    leftLegSprite.scale.set(-rightLegSprite.scale.x, rightLegSprite.scale.y, 1);
    rightLegFlame.scale.set(1.13, 1.43, 1);
    leftLegFlame.scale.set(-rightLegFlame.scale.x, rightLegFlame.scale.y, 1);
    leftEar.scale.set(2.43, 2.64, 1);
    rightEar.scale.set(2.43, 2.64, 1);
    antennaGlow.scale.set(0.45, 0.44, 1);
    antenna.scale.set(0.75, 0.86, 1);

    mainObject.add(eyeGlow);
    mainObject.add(body);
    mainObject.add(antennaGlow);
    mainObject.add(antenna);
    mainObject.add(topTeeth);
    mainObject.add(bottomTeeth);
    mainObject.add(throat);
    mainObject.add(leftLeg);
    mainObject.add(rightLeg);
    mainObject.add(leftEar);
    mainObject.add(rightEar);

    eyeGlow.position.set(0.02, 0.685, 0.01);

    antennaGlow.position.set(0.065, 2.05, 0);
    antenna.position.set(0.015, 2.04, -0.01);

    topTeeth.position.set(0, 0.05, -0.01);
    bottomTeeth.position.set(0, -0.56, -0.02);
    throat.position.set(0.035, -0.275, -0.03);

    leftLeg.position.set(0.71, -1.09, -0.05);
    leftLeg.add(leftLegSprite);
    leftLeg.add(leftLegFlame);
    leftLegSprite.position.set(0, -0.54, 0);
    leftLegFlame.position.set(-0.18, -1.9, -0.01);

    rightLeg.position.set(-0.64, -1.09, -0.05);
    rightLeg.add(rightLegSprite);
    rightLeg.add(rightLegFlame);
    rightLegSprite.position.set(0, -0.54, 0);
    rightLegFlame.position.set(0.18, -1.9, -0.01);

    leftEar.position.set(1.435, 0.505, -0.05);
    rightEar.position.set(-1.365, 0.505, -0.05);

    galaxies.engine.rootObject.add(mainObject);

    this.flameScale = 1.43;
    this.leftLegFlame = leftLegFlame;
    this.rightLegFlame = rightLegFlame;
    this.topTeeth = topTeeth;
    this.bottomTeeth = bottomTeeth;
    this.antennaGlow = antennaGlow;

    var colliders = galaxies.colliders;

    this.leftArm = new galaxies.ElephatronLimb(this.getLaserBlast, this.spawnLaserPellet, {
        limbTextureID: "elephatronarm",
        limbDamagedTextureID: "elephatronarmdamaged",
        limbSpriteScale: new THREE.Vector3(-1.95, 0.93, 1),
        limbSpriteOffset: new THREE.Vector3(0.855, -0.065, 0),
        damageColliders: [new colliders.SphereCollider(new THREE.Vector3(1.46, -0.03, 0), 0.425)],
        otherColliders: [new colliders.CapsuleCollider(new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(1.46, -0.03, 0), 0.3)],
        laserEmitPoint: new THREE.Vector3(1.68, -0.03, 0.05),
        minAngle: -Math.PI / 2,
        maxAngle: Math.PI / 2,
        startAngle: -Math.PI / 4
    });

    this.leftArm.object.position.set(0.9, 0.11, -0.04);

    this.rightArm = new galaxies.ElephatronLimb(this.getLaserBlast, this.spawnLaserPellet, {
        limbTextureID: "elephatronarm",
        limbDamagedTextureID: "elephatronarmdamaged",
        limbSpriteScale: new THREE.Vector3(1.95, 0.93, 1),
        limbSpriteOffset: new THREE.Vector3(-0.855, -0.065, 0),
        damageColliders: [new colliders.SphereCollider(new THREE.Vector3(-1.46, -0.03, 0), 0.425)],
        otherColliders: [new colliders.CapsuleCollider(new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(-1.46, -0.03, 0), 0.3)],
        laserEmitPoint: new THREE.Vector3(-1.68, -0.03, 0.05),
        minAngle: Math.PI / 2,
        maxAngle: 3 * Math.PI / 2,
        limbAngleOffset: Math.PI,
        startAngle: 5 * Math.PI / 4
    });

    this.rightArm.object.position.set(-0.86, 0.11, -0.04);

    this.trunk = new galaxies.ElephatronLimb(this.getLaserBlast, this.spawnLaserPellet, {
        limbTextureID: "elephatronnose",
        limbDamagedTextureID: "elephatronnosedamaged",
        shadowTextureID: "elephatronnoseshadow",
        shadowDamagedTextureID: "elephatronnosedamagedshadow",
        limbSpriteScale: new THREE.Vector3(1.06, 2.23, 1),
        limbSpriteOffset: new THREE.Vector3(0.075, -0.815, 0),
        shadowSpriteScale: new THREE.Vector3(1.11, 2.48, 1),
        shadowSpriteOffset: new THREE.Vector3(0.075, -0.815, 0),
        shadowPosition: new THREE.Vector3(-0.05, -0.195, -0.01),
        damageColliders: [new colliders.SphereCollider(new THREE.Vector3(0.305, -1.72, 0), 0.4)],
        otherColliders: [
            new colliders.CapsuleCollider(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-0.1, -0.7, 0), 0.4),
            new colliders.CapsuleCollider(new THREE.Vector3(-0.12, -0.815, 0), new THREE.Vector3(0.305, -1.72, 0), 0.3)
        ],
        laserEmitPoint: new THREE.Vector3(0.405, -1.92, 0.05),
        limbAngleOffset: 9 * Math.PI / 24,
        startAngle: -3 * Math.PI / 8
    });

    this.trunk.object.position.set(-0.04, 0.58, 0.03);

    mainObject.add(this.leftArm.object);
    mainObject.add(this.rightArm.object);
    mainObject.add(this.trunk.object);
};

galaxies.Elephatron.prototype.reset = function () {
    galaxies.Boss.prototype.reset.call(this);

    this.xVel = 0;
    this.currentAngle = Math.PI;
    this.targetAngle = null;
    this.angularVelocity = 0;
    this.maxAngularVelocity = this.baseMaxAngularVelocity;
    this.mouthOpenAmount = 0;
    this.hoverBounce = 0;
    this.xBounce = 0;
    this.yBounce = 0;
    this.timeToNextMove = 0;
    this.timeToNextFireSequence = 0;
    this.directionality = 0.5;
    this.lastDamageTime = -3;
    this.firstMove = true;

    this.leftArm.reset();
    this.rightArm.reset();
    this.trunk.reset();

    this.leftArm.shotCooldown = this.rightArm.shotCooldown = this.trunk.shotCooldown = (this.health + 1) / this.maxHealth;

    this.leftArm.invincible = true;
    this.rightArm.invincible = true;
    this.trunk.invincible = true;
};

galaxies.Elephatron.prototype.spawnLaserPellet = function (position) {
    var pellet = this.laserPelletPool[this.laserPelletIndex];

    if (++this.laserPelletIndex >= this.laserPelletPool.length) {
        this.laserPelletIndex = 0;
    }

    pellet.addToScene(position);
};

galaxies.Elephatron.prototype.update = function (delta) {
    galaxies.Boss.prototype.update.call(this, delta);

    if (this.state === "inactive") {
        return;
    }

    this.antennaGlow.material.opacity = 0.5 + Math.sin(this.age) * 0.5;

    if (this.state === "idle") {
        if (this.mouthOpenAmount > 0) {
            this.mouthOpenAmount -= delta * 2;

            if (this.mouthOpenAmount < 0) {
                this.mouthOpenAmount = 0;
            }
        }

        this.timeToNextFireSequence -= delta;

        if (this.timeToNextFireSequence <= 0) {
            this.state = "firing";

            this.roarAudio.startSound();

            this.firingTime = 2 + (1 - (this.health / this.maxHealth)) * 2;
        }
    }

    if (this.state === "idle" || this.state === "firing") {
        var angle = Math.atan2(-this.object.position.y, -this.object.position.x);

        if (this.object.position.x < 0) {
            this.rightArm.targetAngle = (this.object.position.y < 0 ? 5 : 3) * Math.PI / 4;
            this.leftArm.targetAngle = angle;
        } else {
            if (angle < 0) {
                angle += 2 * Math.PI;
            }

            this.rightArm.targetAngle = angle;
            this.leftArm.targetAngle = (this.object.position.y < 0 ? -1 : 1) * Math.PI / 4;
        }

        this.trunk.targetAngle = angle;
    }

    if (this.state === "firing") {
        if (this.mouthOpenAmount < 1) {
            this.mouthOpenAmount += delta * 2;

            if (this.mouthOpenAmount > 1) {
                this.mouthOpenAmount = 1;
            }
        } else {
            this.firingTime -= delta;

            if (this.firingTime <= 0) {
                this.timeToNextFireSequence = 3 + Math.random() * 5;

                this.state = "idle";
                this.leftArm.state = "idle";
                this.rightArm.state = "idle";
                this.trunk.state = "idle";
            } else {
                if (this.object.position.x < 0) {
                    this.leftArm.state = "firing";
                    this.rightArm.state = "idle";
                } else {
                    this.leftArm.state = "idle";
                    this.rightArm.state = "firing";
                }

                this.trunk.state = "firing";
            }
        }
    }

    var moveAmount;

    if (this.state !== "exiting") {
        var prevPos = this.position.clone();

        if (this.targetAngle !== null) {
            this.updateMovement(delta);
        } else if (this.state !== "preEntry") {
            this.hoverBounce = Math.min(this.hoverBounce + delta / 2, this.maxHoverBounce);

            this.timeToNextMove -= delta;

            // TODO: factor in limb health
            if (this.timeToNextMove <= 0) {
                moveAmount = (1 + Math.random() * 2) * Math.PI / 4;

                this.targetAngle = this.currentAngle;

                if (Math.random() < this.directionality) {
                    this.targetAngle -= moveAmount;

                    this.directionality -= 1 / (this.directionality * 10);
                } else {
                    this.targetAngle += moveAmount;

                    this.directionality += 1 / ((1 - this.directionality) * 10);
                }
            }
        }

        this.xVel = 0.9 * this.xVel + 0.1 * (prevPos.x - this.position.x) / delta;

        this.object.rotation.z = 0.05 * this.xVel / this.object.scale.x;
    }

    this.laserBlastPool.forEach(function (blast) {
        if (blast.sprite.visible) {
            blast.spriteSheet.update(delta);

            if (!blast.spriteSheet.isPlaying()) {
                blast.sprite.visible = false;
            }
        }
    });

    this.laserPelletPool.forEach(function (pellet) {
        if (pellet.state !== "inactive") {
            pellet.update(delta);
        }
    });

    this.xBounce += this.xBounceRate * delta;
    this.yBounce += this.yBounceRate * delta;

    this.object.position.copy(this.position)
        .add(new THREE.Vector3(Math.sin(this.xBounce), Math.sin(this.yBounce), 0).multiplyScalar(this.hoverBounce));

    var flameScale = this.flameScale + Math.sin(this.age * 60) / 10,
        leftFlame = this.leftLegFlame,
        rightFlame = this.rightLegFlame;

    leftFlame.scale.y = rightFlame.scale.y = flameScale;
    leftFlame.position.y = rightFlame.position.y = -1.185 - flameScale / 2;
    leftFlame.material.opacity = rightFlame.material.opacity = 0.9 + Math.sin(this.age * 3) * 0.1;

    var prevHealth = this.health;

    this.leftArm.update(delta);
    this.rightArm.update(delta);
    this.trunk.update(delta);

    var health = this.health,
        maxHealth;

    if (health === 0) {
        if (prevHealth > 0) {
            this.defeat(9000);

            this.explodeAudio.startSound();
        }
    } else if (prevHealth !== health) {
        galaxies.fx.shakeCamera(1, 1.5);

        maxHealth = this.maxHealth;

        if (this.trunk.invincible && this.leftArm.health + this.rightArm.health === 0) {
            this.trunk.invincible = false;
        }

        if (this.age - this.lastDamageTime < 3) {
            this.timeToNextMove = 0;
        }

        this.lastDamageTime = this.age;

        this.timeToNextFireSequence = 0;

        this.leftArm.shotCooldown = this.rightArm.shotCooldown = this.trunk.shotCooldown = (health + 1) / maxHealth;

        this.maxAngularVelocity = (3 - 2 * (health / maxHealth)) * this.baseMaxAngularVelocity;
    }
};

galaxies.Elephatron.prototype.updateCoordinates = function () {
    galaxies.Boss.prototype.updateCoordinates.call(this);

    var scale = Math.max(Math.min(Math.abs(this.rightEdge - this.leftEdge) / (6 * 2.87),
        Math.abs(this.topEdge - this.bottomEdge) / (5 * 3.26)), 1);

    this.object.scale.set(scale, scale, scale);

    if (this.firstMove && !this.targetPosition) {
        this.position.set(this.leftEdge - scale * 4, this.topEdge * 0.8 + this.bottomEdge * 0.2, 0);
    }

    this.baseMaxAngularVelocity = scale / 6;
    this.maxHoverBounce = scale / 4;

    this.rx = this.rightEdge * 0.6;
    this.ry = this.topEdge * 0.6;

    this.laserBlastPool.forEach(function (blast) {
        blast.sprite.scale.set(scale, scale, scale);
    });

    this.leftArm.updateCoordinates(scale);
    this.rightArm.updateCoordinates(scale);
    this.trunk.updateCoordinates(scale);
};

galaxies.Elephatron.prototype.updateExiting = function (delta) {
    galaxies.Boss.prototype.updateExiting.call(this);

    if (this.position.y > this.bottomEdge - this.object.scale.y * 4) {
        this.position.y -= delta * this.object.scale.y * 4;
        this.object.rotation.z += delta * Math.PI;
    } else {
        this.disable();
    }
};

galaxies.Elephatron.prototype.updateMovement = function (delta) {
    if (!this.angularVelocity) {
        this.angularVelocity = new THREE.Vector2(Math.sign(this.targetAngle - this.currentAngle), 0);
    }

    if (this.hoverBounce > 0) {
        this.hoverBounce = Math.max(this.hoverBounce - delta / 2, 0);
    }

    var rx = this.rx,
        maxVel = this.maxAngularVelocity;

    if (this.firstMove) {
        rx *= 2;
        maxVel *= 2;
    }

    this.angularVelocity.y = Math.min(this.angularVelocity.y + delta, maxVel);

    var angleDiff = Math.abs(this.targetAngle - this.currentAngle),
        slowingDistance = this.maxAngularVelocity;

    if (this.state === "entering" && angleDiff < 3 * Math.PI / 8) {
        this.state = "firing";

        this.roarAudio.startSound();

        this.firingTime = 2;
    }

    if (angleDiff < 0.01) {
        var halfScale = this.object.scale.x / 2;

        this.angularVelocity = null;
        this.targetAngle = null;

        if (this.firstMove) {
            this.firstMove = false;

            this.leftArm.invincible = false;
            this.rightArm.invincible = false;
        }

        this.timeToNextMove = Math.random() * 3 + 3 * this.health / this.maxHealth;

        this.flameScale = 1.43;

        this.xBounceRate = halfScale + Math.random() * halfScale;
        this.yBounceRate = halfScale + Math.random() * halfScale;

        return;
    }

    if (angleDiff < slowingDistance) {
        this.angularVelocity.y = Math.min(this.angularVelocity.y, maxVel * angleDiff / slowingDistance);
    }

    this.currentAngle += this.angularVelocity.x * this.angularVelocity.y * delta;

    this.position.set(Math.cos(this.currentAngle) * rx, Math.sin(this.currentAngle) * this.ry, 0);

    this.flameScale = 1.43 + 3 * this.angularVelocity.y / this.object.scale.x;
};

Object.defineProperties(galaxies.Elephatron.prototype, {
    health: {
        get: function () {
            return this.leftArm.health + this.rightArm.health + this.trunk.health;
        }
    },
    maxHealth: {
        get: function () {
            return this.leftArm.maxHealth + this.rightArm.maxHealth + this.trunk.maxHealth;
        }
    },
    mouthOpenAmount: {
        get: function () {
            return this._mouthOpenAmount;
        },
        set: function (value) {
            var offset = value * 0.26;

            this._mouthOpenAmount = value;

            this.topTeeth.position.y = 0.05 + offset;
            this.bottomTeeth.position.y = -0.56 - offset;
        }
    }
});
