"use strict";

this.galaxies = this.galaxies || {};

galaxies.ElephatronLimb = function (getLaserBlast, spawnLaserPellet, props) {
    props = props || {};

    this.baseProps = props;

    this.minAngle = null;
    this.maxAngle = null;
    this.maxHealth = 4;
    this.shotCooldown = 0.5;
    this.object = new THREE.Object3D();
    this.limb = new THREE.Object3D();
    this.flip = true;
    this.shadow = null;
    this.maxAngularVelocity = Math.PI / 2;
    this.slowingDistance = Math.PI / 8;
    this.startAngle = -Math.PI / 2;
    this.limbAngleOffset = 0;
    this.laserEmitPoint = new THREE.Vector3();
    this.damageColliders = [];
    this.otherColliders = [];

    for (var k in props) {
        if (props.hasOwnProperty(k) && this.hasOwnProperty(k)) {
            this[k] = props[k];
        }
    }

    this.getLaserBlast = getLaserBlast;
    this.spawnLaserPellet = spawnLaserPellet;

    this.initModel();

    this.reset();
};

galaxies.ElephatronLimb.prototype = {};

Object.defineProperties(galaxies.ElephatronLimb.prototype, {
    angle: {
        get: function () {
            return this._angle;
        },
        set: function (value) {
            value = this.confineAngle(value);

            this._angle = value;

            var direction = this.flip ? -Math.sign(Math.sin(value)) : 1,
                adjustedAngle = value + this.limbAngleOffset * direction;

            this.limb.rotation.z = adjustedAngle;
            this.limb.scale.y = direction;

            if (this.shadow) {
                this.shadow.rotation.z = adjustedAngle;
                this.shadow.scale.y = direction;
            }
        }
    },
    targetAngle: {
        get: function () {
            return this._targetAngle;
        },
        set: function (value) {
            if (typeof value !== "number") {
                this._targetAngle = value;

                return;
            }

            value = this.confineAngle(value);

            if (this.minAngle === null || this.maxAngle === null) {
                var diff = value - this.angle;

                if (Math.abs(diff) > Math.PI) {
                    value -= Math.sign(diff) * 2 * Math.PI;
                }
            }

            this._targetAngle = value;
        }
    }
});

galaxies.ElephatronLimb.prototype.checkCollisions = function () {
    if (galaxies.engine.projectiles.length === 0) {
        return;
    }

    var doCollidersOverlap = galaxies.utils.doCollidersOverlap;

    this.damageColliders.forEach(this.updateCollider, this);
    this.otherColliders.forEach(this.updateCollider, this);

    galaxies.engine.projectiles.forEach(function (proj) {
        var didHit = this.damageColliders.some(function (collider) {
            return doCollidersOverlap(proj.flatCapsule, collider);
        });

        if (didHit) {
            --this.health;
        } else {
            didHit = this.otherColliders.some(function (collider) {
                return doCollidersOverlap(proj.flatCapsule, collider);
            });
        }

        if (didHit) {
            proj.hit();
        }
    }, this);

    if (this.health <= 0) {
        this.health = 0;

        this.limbSprite.material.map = this.limbDamagedTexture;

        if (this.shadow) {
            this.shadowSprite.material.map = this.shadowDamagedTexture;
        }
    }
};

galaxies.ElephatronLimb.prototype.confineAngle = function (angle) {
    if (this.minAngle === null || this.maxAngle === null) {
        return angle;
    }

    var tau = 2 * Math.PI,
        adjustedAngle;

    if (angle < this.minAngle) {
        adjustedAngle = angle + tau;

        if (adjustedAngle < this.maxAngle) {
            angle = adjustedAngle;
        }
    } else if (angle > this.maxAngle) {
        adjustedAngle = angle - tau;

        if (adjustedAngle > this.minAngle) {
            angle = adjustedAngle;
        }
    }

    return Math.min(Math.max(angle, this.minAngle), this.maxAngle);
};

galaxies.ElephatronLimb.prototype.fireLaser = function () {
    var spawnPoint = this.limb.localToWorld(this.laserEmitPoint.clone()),
        blast = this.getLaserBlast(this.angle);

    spawnPoint = galaxies.engine.rootObject.worldToLocal(spawnPoint);

    spawnPoint.z += 0.05;

    blast.sprite.position.copy(spawnPoint);

    this.spawnLaserPellet(spawnPoint);
};

galaxies.ElephatronLimb.prototype.initModel = function () {
    var props = this.baseProps,
        getTexture = function (textureID) {
            var tex = new THREE.Texture(galaxies.queue.getResult(textureID));

            tex.needsUpdate = true;

            return tex;
        },
        createSprite = function (texture, scale, offset) {
            var spriteObject = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
                    new THREE.MeshBasicMaterial({map: texture, transparent: true, side: THREE.DoubleSide}));

            if (scale) {
                spriteObject.scale.copy(scale);
            }

            if (offset) {
                spriteObject.position.copy(offset);
            }

            return spriteObject;
        };

    this.limbTexture = getTexture(props.limbTextureID);
    this.limbDamagedTexture = getTexture(props.limbDamagedTextureID);
    this.limbSprite = createSprite(this.limbTexture, props.limbSpriteScale, props.limbSpriteOffset);

    this.limb.add(this.limbSprite);

    if (props.shadowTextureID) {
        this.shadowTexture = getTexture(props.shadowTextureID);
        this.shadowDamagedTexture = getTexture(props.shadowDamagedTextureID);
        this.shadowSprite = createSprite(this.shadowTexture, props.shadowSpriteScale, props.shadowSpriteOffset);

        this.shadow = new THREE.Object3D();

        this.shadow.add(this.shadowSprite);

        if (props.shadowPosition) {
            this.shadow.position.copy(props.shadowPosition);
        }

        this.object.add(this.shadow);
    }

    this.object.add(this.limb);
};

galaxies.ElephatronLimb.prototype.reset = function () {
    this.targetAngle = null;
    this.health = this.maxHealth;
    this.angularVelocity = 0;
    this.angle = this.startAngle;
    this.remainingShotCooldown = Math.random() * this.shotCooldown;

    this.state = "idle";

    this.limbSprite.material.map = this.limbTexture;

    if (this.shadow) {
        this.shadowSprite.material.map = this.shadowTexture;
    }
};

galaxies.ElephatronLimb.prototype.update = function (delta) {
    if (this.health === 0) {
        return;
    }

    if (this.state === "firing") {
        if (this.remainingShotCooldown > 0) {
            this.remainingShotCooldown -= delta;
        }

        if (this.remainingShotCooldown <= 0 &&
            (this.targetAngle === null || Math.abs(this.targetAngle - this.angle) < 0.1)) {
            this.remainingShotCooldown = this.shotCooldown * 0.95 + Math.random() * this.shotCooldown * 0.1;

            this.fireLaser();
        }
    }

    if (this.targetAngle !== null) {
        this.updateRotation(delta);
    }

    this.checkCollisions();
};

galaxies.ElephatronLimb.prototype.updateCollider = function (collider) {
    galaxies.utils.updateCollider(collider, this.limb);
};

galaxies.ElephatronLimb.prototype.updateRotation = function (delta) {
    var difference = this.targetAngle - this.angle,
        absDifference = Math.abs(difference),
        direction = Math.sign(difference),
        absVel, velDir;

    if (absDifference < 0.01) {
        this.angularVelocity = 0;
        this.targetAngle = null;

        if (this.minAngle === null || this.maxAngle === null) {
            this.angle = this.angle % (2 * Math.PI);
        }

        return;
    }

    this.angularVelocity += direction * delta;

    velDir = Math.sign(this.angularVelocity);
    absVel = Math.abs(this.angularVelocity);

    if (absVel > this.maxAngularVelocity) {
        this.angularVelocity = this.maxAngularVelocity * velDir;
    }

    if (absDifference < this.slowingDistance) {
        var percentage = absDifference / this.slowingDistance;

        this.angularVelocity = direction * Math.sqrt(percentage) * this.maxAngularVelocity;
    }

    /*if (absVel * delta >= absDifference) {
        this.angle = this.targetAngle;

        return;
    }*/

    this.angle += this.angularVelocity * delta;
};
