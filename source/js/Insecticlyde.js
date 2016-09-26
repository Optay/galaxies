"use strict";

this.galaxies = this.galaxies || {};

galaxies.Insecticlyde = function () {
    this.maxSegments = 10;
    this.maxAngleDiff = Math.PI / 3;
    this.taperCount = 3;

    this.segments = [];
    this.movementController = null;
    this.position = new THREE.Vector2();

    this.patterns = [
        [{x: 0.6, y: 1.5}, {x: 0.5, y: 1}, {x: 0.6, y: 0.5}, {x: 0.5, y: 0}, {x: 0.75, y: -0.8}],
        [{x: 0.25, y: -0.8}, {x: 0.25, y: 0}, {x: 0.25, y: 0.5}, {x: 0.5, y: 0.9}, {x: 0.75, y: 0.5}, {x: 0.9, y: 0}, {x: 1, y: -0.8}],
        [{x: 1.8, y: -0.8}, {x: 0.9, y: 0.1}, {x: 0.4, y: 0.4}, {x: 0.1, y: 0.9}, {x: -0.8, y: 1.8}]
    ];
    this.patternIndex = 0;

    this.fillPools();

    galaxies.Boss.call(this);

    this.name = "Insecticlyde";
};

galaxies.Insecticlyde.prototype = Object.create(galaxies.Boss.prototype);
galaxies.Insecticlyde.prototype.constructor = galaxies.Insecticlyde;

Object.defineProperties(galaxies.Insecticlyde.prototype, {
    activeSegments: {
        get: function () {
            return this._activeSegments;
        },
        set: function (value) {
            if (value !== this._activeSegments) {
                this._activeSegments = value;

                this.updateActiveSegments();
            }
        }
    },
    headAngle: {
        get: function () {
            return this._headAngle;
        },
        set: function (value) {
            this._headAngle = value;

            this.head.rotation.z = value + Math.PI / 2;
        }
    },
    scale: {
        get: function () {
            return this._scale;
        },
        set: function (value) {
            this._scale = value;

            this.object.scale.set(value, value, value);

            this.updateActiveSegments();
        }
    }
});

galaxies.Insecticlyde.prototype.checkCollisions = function () {
    var hitLast = false,
        destroyedHead = false,
        headCollider;

    galaxies.utils.updateCollider(this.damageCollider, this.object);

    headCollider = this.damageCollider;

    galaxies.engine.projectiles.forEach(function (projectile) {
        var projectileHit = false;

        this.segments.some(function (segment, index) {
            if (segment.enabled && segment.didGetHit(projectile)) {
                projectileHit = true;

                if (index === this.activeSegments - 1) {
                    hitLast = true;
                }
            }

            return !segment.enabled;
        }, this);

        if (galaxies.utils.doCollidersOverlap(projectile.flatCapsule, headCollider)) {
            projectileHit = true;

            if (!destroyedHead && this.activeSegments === 0) {
                destroyedHead = true;

                this.state = "inactive";
                this.object.visible = false;

                galaxies.engine.showCombo(8000, 1, this.object);
                galaxies.fx.explode(this.object.position, "green", this.scale * 3);
                galaxies.fx.tintScreen(0x00FF00, 0.3, 200, 500);
            }
        }

        if (projectileHit) {
            projectile.hit();
        }
    }, this);

    if (hitLast) {
        var lastSegment = this.segments[this.activeSegments - 1],
            segmentCenter = lastSegment.object.position.clone();

        segmentCenter.x -= Math.cos(lastSegment.angle) * lastSegment.scale;
        segmentCenter.y -= Math.sin(lastSegment.angle) * lastSegment.scale;

        galaxies.engine.showCombo(500, 1, lastSegment.object);
        galaxies.fx.explode(segmentCenter, "green", this.scale);

        --this.activeSegments;
    }
};

galaxies.Insecticlyde.prototype.disable = function () {
    galaxies.Boss.prototype.disable.call(this);

    this.segments.forEach(function (segment) {
        segment.object.visible = false;
    });

    this.laserBlastPool.forEach(function (blast) {
        galaxies.engine.rootObject.remove(blast.sprite);
    });

    this.laserPelletPool.forEach(function (pellet) {
        pellet.removeFromScene();
    });
};

galaxies.Insecticlyde.prototype.enter = function () {
    galaxies.Boss.prototype.enter.call(this);

    this.movementController.addPoints([{x: -0.1, y: 0.8}, {x: 0.5, y: 0.8}, {x: 1, y: 1}, {x: 1, y: 1.5}]);

    this.laserBlastPool.forEach(function (blast) {
        blast.sprite.visible = false;

        galaxies.engine.rootObject.add(blast.sprite);
    });
};

galaxies.Insecticlyde.prototype.fillPools = function () {
    var frames = galaxies.utils.generateSpriteFrames({x: 0, y: 0}, {x: 256, y: 256}, {x: 256, y: 2048}, 8),
        i, tex, mat, sheet, sprite;

    this.laserBlastPool = [];
    this.laserBlastIndex = 0;

    for (i = 0; i < 3; ++i) {
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

    this.laserPelletPool = [];
    this.laserPelletIndex = 0;

    for (i = 0; i < 15; ++i) {
        this.laserPelletPool.push(new galaxies.LaserPellet());
    }
};

galaxies.Insecticlyde.prototype.fireLaserPellet = function (position, angle) {
    var pellet = this.laserPelletPool[this.laserPelletIndex],
        direction;

    if (++this.laserPelletIndex >= this.laserPelletPool.length) {
        this.laserPelletIndex = 0;
    }

    if (typeof angle === "number") {
        direction = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
    }

    pellet.addToScene(position, direction);
};

galaxies.Insecticlyde.prototype.initModel = function () {
    galaxies.Boss.prototype.initModel.call(this);

    this.head = galaxies.utils.makeSprite("insecticlydeface", true);

    this.head.scale.set(1.58, 1.27, 1);

    this.damageCollider = new galaxies.colliders.SphereCollider(new THREE.Vector3(), 0.7);

    this.object.add(this.head);

    for (var i = 0; i < this.maxSegments; ++i) {
        var segment = new galaxies.InsectSegment();

        this.segments.push(segment);

        segment.angle = 0;

        galaxies.engine.rootObject.add(segment.object);

        segment.object.position.set(-0.45 - i * 0.9, 0, (i + 1) * -0.01);
    }

    galaxies.engine.rootObject.add(this.object);
};

galaxies.Insecticlyde.prototype.reset = function () {
    galaxies.Boss.prototype.reset.call(this);

    this.segments.forEach(function (segment) {
        segment.reset();
    });

    this.object.visible = true;

    this.headAngle = 0;
    this.activeSegments = this.maxSegments;
    this.timeToNextShot = 0;

    this.position.x = this.leftEdge - this.scale * 2;
    this.position.y = this.topEdge - this.scale * 2;

    if (this.movementController) {
        this.movementController.reset();
    }

    this.updateSegments(0, true);
};

galaxies.Insecticlyde.prototype.triggerLaserBlast = function (position) {
    var blast = this.laserBlastPool[this.laserBlastIndex];

    if (++this.laserBlastIndex >= this.laserBlastPool.length) {
        this.laserBlastIndex = 0;
    }

    blast.sprite.visible = true;
    blast.material.rotation = this.headAngle + Math.PI / 2;
    blast.spriteSheet.play();
    blast.sprite.position.copy(position);
    blast.sprite.position.z += 0.1;

    blast.sound.updatePosition(blast.sprite.position);
    blast.sound.startSound();
};

galaxies.Insecticlyde.prototype.update = function (delta) {
    this.updateMovement(delta);

    // TODO: movements
    if (this.state !== "preEntry" && this.movementController.numPoints < 3) {
        if (this.state === "entering") {
            this.state = "moving";
        }

        this.movementController.addPoints(this.patterns[this.patternIndex]);

        if (++this.patternIndex >= this.patterns.length) {
            this.patternIndex = 0;
        }
    }

    if ((this.state !== "preEntry") && (this.state !== "entering")) {
        var firing = false;

        if (this.position.x > this.leftEdge && this.position.x < this.rightEdge &&
            this.position.y > this.bottomEdge && this.position.y < this.topEdge) {
            firing = Math.abs(Math.atan2(this.position.y, this.position.x) - this.headAngle) > (5 * Math.PI / 6);
        }

        if (firing) {
            this.timeToNextShot -= delta;

            if (this.timeToNextShot <= 0) {
                this.timeToNextShot = 0.125;

                var position = this.object.position.clone()
                    .add(new THREE.Vector3(Math.cos(this.headAngle), Math.sin(this.headAngle), 0)
                        .multiplyScalar(this.scale * 0.5));

                this.fireLaserPellet(position, this.headAngle);

                this.triggerLaserBlast(position);
            }
        }
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

    this.checkCollisions();
};

galaxies.Insecticlyde.prototype.updateActiveSegments = function (isResize, force) {
    var taperAt = this.activeSegments - this.taperCount,
        taperPlusOne = this.taperCount + 1,
        outerScale = this.scale;

    this.segments.forEach(function (segment, index) {
        if (index >= this.activeSegments) {
            segment.enabled = false;
        } else {
            segment.enabled = true;

            var targetScale;

            if (index >= taperAt) {
                targetScale = (0.25 + 0.75 * (1 - (index - taperAt + 1) / taperPlusOne)) * outerScale;
            } else {
                targetScale = outerScale;
            }

            if (force) {
                segment.scale = targetScale;
            } else if (isResize) {
                segment.scale *= targetScale / segment.targetScale;
            }

            segment.targetScale = targetScale;
        }
    }, this);
};

galaxies.Insecticlyde.prototype.updateCoordinates = function () {
    galaxies.Boss.prototype.updateCoordinates.call(this);

    var newScale = Math.min(Math.abs(this.topEdge - this.bottomEdge), Math.abs(this.rightEdge - this.leftEdge)) / 16;

    this._scale = newScale;

    this.object.scale.set(newScale, newScale, newScale);

    var speed = newScale * 5;

    if (this.movementController) {
        this.movementController.updateCoordinates(this.topEdge, this.bottomEdge, this.leftEdge, this.rightEdge, speed);
    } else {
        this.movementController = new galaxies.BossMover(this.topEdge, this.bottomEdge, this.leftEdge, this.rightEdge,
            speed);
    }

    this.updateActiveSegments(true, (this.state === "preEntry") || (this.state === "entering"));

    this.updateMovement(0, true);

    if (this.state === "preEntry") {
        this.position.x = this.leftEdge - newScale * 2;
        this.position.y = this.topEdge - newScale * 2;

        this.updateSegments(0, true);
    }

    this.laserBlastPool.forEach(function (blast) {
        blast.sprite.scale.set(newScale, newScale, newScale);
    });
};

galaxies.Insecticlyde.prototype.updateMovement = function (delta, skipAngleUpdate) {
    if (this.state === "preEntry") {
        return;
    }

    var dataChanged = this.movementController.update(delta);

    var pos = this.movementController.getCurrentPosition(),
        angle = this.movementController.getCurrentFacingAngle();

    if (pos) {
        this.position = pos;
        this.headAngle = angle;
    }

    this.updateSegments(delta, skipAngleUpdate || !dataChanged);
};

galaxies.Insecticlyde.prototype.updateSegments = function (delta, skipAngleUpdate) {
    delta = delta || 0;

    var mad = this.maxAngleDiff,
        prevSegment;

    this.object.position.x = this.position.x;
    this.object.position.y = this.position.y;

    this.segments.forEach(function (segment, index) {
        var so = segment.object,
            startFrom, angle, scalar, pos, lookAngle;

        if (index === 0) {
            startFrom = this.object.position;
            angle = this.headAngle;
            scalar = 0.45 * this.scale;
        } else {
            startFrom = prevSegment.object.position;
            angle = prevSegment.angle;
            scalar = 0.9 * prevSegment.scale;
        }

        pos = so.position.clone();

        so.position.x = startFrom.x - Math.cos(angle) * scalar;
        so.position.y = startFrom.y - Math.sin(angle) * scalar;

        if (!skipAngleUpdate) {
            pos.sub(so.position).multiplyScalar(-1);

            lookAngle = Math.atan2(pos.y, pos.x);

            var angleDiff = lookAngle - segment.angle;

            if (angleDiff > Math.PI) {
                lookAngle -= 2 * Math.PI;
            } else if (angleDiff < -Math.PI) {
                lookAngle += 2 * Math.PI;
            }

            segment.angle = Math.max(Math.min(0.1 * lookAngle + 0.9 * segment.angle, angle + mad), angle - mad);
        }

        segment.update(delta);

        prevSegment = segment;
    }, this);
};
