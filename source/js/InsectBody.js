"use strict";

this.galaxise = this.galaxies || {};

galaxies.InsectBody = function (owningBoss) {
    this.owningBoss = owningBoss;

    this.segments = [];
    this.movementController = null;
    this.position = new THREE.Vector2();

    this.fillPools();
};

galaxies.InsectBody.prototype.constructor = galaxies.InsectBody;

Object.defineProperties(galaxies.InsectBody.prototype,
    {
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

                this.object.rotation.z = value + Math.PI / 2;
            }
        },
        mouthOpenAmount: {
            get: function () {
                return this._mouthOpenAmount;
            },
            set: function (value) {
                this._mouthOpenAmount = value;

                var scalar = value - 0.8;

                this.leftMandible.rotation.z = scalar * Math.PI / 4;
                this.rightMandible.rotation.z = scalar * -Math.PI / 4;
            }
        },
        scale: {
            get: function () {
                return this._scale;
            },
            set: function (value) {
                if (value !== this._scale) {
                    this._scale = value;

                    this.object.scale.set(value, value, value);

                    this.updateActiveSegments();
                }
            }
        }
    });

galaxies.InsectBody.prototype.checkCollisions = function () {
    var headCollider = this.damageCollider,
        segmentsActive = this.segments.map(function (segment) { return segment.enabled; }),
        probablySplit = false,
        headActive = true,
        newHead = -1,
        pointValue = 500,
        endOfSegment = -1;

    galaxies.utils.updateCollider(this.damageCollider, this.object);

    galaxies.engine.projectiles.forEach(function (projectile) {
        var projectileHit = false;

        this.segments.forEach(function (segment, index) {
            if (segment.enabled && segment.didGetHit(projectile)) {
                projectileHit = true;
                probablySplit = true;

                if (segmentsActive[index]) {
                    segmentsActive[index] = false;

                    this.hitSegment(segment);
                }
            }
        }, this);

        if (galaxies.utils.doCollidersOverlap(projectile.flatCapsule, headCollider)) {
            projectileHit = true;
            headActive = false;
        }

        if (projectileHit) {
            projectile.hit();
        }
    }, this);

    if (!headActive) {
        segmentsActive.some(function (segmentActive, index) {
            if (segmentActive) {
                newHead = index;
            }

            return segmentActive;
        });

        if (newHead !== -1) {
            var referenceSegment = this.segments[newHead],
                firstBodySegment = newHead + 1;

            segmentsActive[newHead] = false;

            this.setHeadDataFromSegment(referenceSegment.object.position, referenceSegment.angle);

            this.segments = this.segments.slice(firstBodySegment, this.segments.length)
                .concat(this.segments.slice(0, firstBodySegment));
            segmentsActive = segmentsActive.slice(firstBodySegment, segmentsActive.length)
                .concat(segmentsActive.slice(0, firstBodySegment));

            this.moveOffScreen();
        } else {
            this.disable();

            if (this.owningBoss.activeBodies().length === 0) {
                pointValue = 8000;

                this.owningBoss.disable();
            }
        }

        this.hitSegmentFX(this.object, this.object.position, pointValue);
    }

    if (probablySplit || !headActive) {
        segmentsActive.some(function (segmentActive, index) {
            if (segmentActive) {
                endOfSegment = index;
            }

            return !segmentActive;
        });

        if (probablySplit) {
            var newSegments = [],
                currentSegment = null,
                numSegments = segmentsActive.length;

            for (var i = endOfSegment + 1; i < numSegments; ++i) {
                if (segmentsActive[i]) {
                    if (currentSegment === null) {
                        currentSegment = [];
                    }

                    var activeSegment = this.segments[i];

                    currentSegment.push({
                        position: activeSegment.object.position,
                        angle: activeSegment.angle
                    });
                } else if (currentSegment !== null) {
                    newSegments.push(currentSegment);
                    currentSegment = null;
                }
            }

            if (currentSegment != null) {
                newSegments.push(currentSegment);
            }

            if (newSegments.length > 0) {
                this.owningBoss.addBodies(newSegments);
            }
        }

        this.activeSegments = endOfSegment;
    }
};

galaxies.InsectBody.prototype.disable = function () {
    this.state = "inactive";
    this.object.visible = false;

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

galaxies.InsectBody.prototype.enter = function () {
    if (this.state === "preEntry") {
        this.state = "entering";
        this.object.visible = true;
    }

    this.movementController.addPath([{ x: -0.1, y: 0.8 }, { x: 0.5, y: 0.8 }, { x: 1, y: 1 }, { x: 1.35, y: 1.35 }]);

    this.segments.forEach(function (segment, index) {
        segment.enabled = index <= this.activeSegments;
    }, this);

    this.laserBlastPool.forEach(function (blast) {
        blast.sprite.visible = false;

        galaxies.engine.rootObject.add(blast.sprite);
    });
};

galaxies.InsectBody.prototype.fillPools = function () {
    var frames = galaxies.utils.generateSpriteFrames({ x: 0, y: 0 },
        { x: 256, y: 256 },
        { x: 256, y: 2048 },
        8,
        { x: 0, y: 0 },
        0.5),
        i,
        tex,
        mat,
        sheet,
        sprite;

    this.laserBlastPool = [];
    this.laserBlastIndex = 0;

    for (i = 0; i < 3; ++i) {
        tex = new THREE.Texture(galaxies.queue.getResult("lasercircleblast"));

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
                source: galaxies.audio.getSound("ufoshoot"),
                position: new THREE.Vector3(),
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

galaxies.InsectBody.prototype.fireLaserPellet = function (position, angle) {
    var pellet = this.laserPelletPool[this.laserPelletIndex],
        direction = null;

    if (++this.laserPelletIndex >= this.laserPelletPool.length) {
        this.laserPelletIndex = 0;
    }

    if (typeof angle === "number") {
        direction = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
    }

    pellet.addToScene(position, direction);
};

galaxies.InsectBody.prototype.setHeadDataFromSegment = function (position, angle) {
    this.position.copy(position)
        .sub((new THREE.Vector3(Math.cos(angle), Math.sin(angle))
            .multiplyScalar(this.scale * 0.45)));
    this.headAngle = angle;
};

galaxies.InsectBody.prototype.hitSegment = function (segment) {
    var segmentCenter = segment.object.position.clone();

    segmentCenter.x -= Math.cos(segment.angle) * segment.scale;
    segmentCenter.y -= Math.sin(segment.angle) * segment.scale;

    this.hitSegmentFX(segment.object, segmentCenter, 500);
};

galaxies.InsectBody.prototype.hitSegmentFX = function (segmentObject, position, pointValue) {
    galaxies.FX.ShakeCamera(0.7, 1);
    galaxies.engine.showCombo(pointValue, 1, segmentObject);
    galaxies.FX.ShowExplosion(position, "green", this.scale * (pointValue > 1000 ? 3 : 2));
    galaxies.FX.TintScreen(0x00FF00, 0.3, 200, 500);

    this.splatAudio.startSound();
};

galaxies.InsectBody.prototype.initAudio = function () {
    this.splatAudio = new galaxies.audio.SimpleSound({
        source: galaxies.audio.getSound("squishsplat"),
        loop: false,
        start: false
    });
};

galaxies.InsectBody.prototype.initModel = function () {
    this.object = new THREE.Object3D();

    this.head = galaxies.utils.makeSprite("insecticlydeface");

    this.head.scale.set(1.58, 1.27, 1);

    this.damageCollider = new galaxies.colliders.SphereCollider(new THREE.Vector3(), 0.7);

    this.object.add(this.head);

    for (var i = 0; i < galaxies.Insecticlyde.MAX_SEGMENTS; ++i) {
        var segment = new galaxies.InsectSegment();

        this.segments.push(segment);

        segment.angle = 0;

        galaxies.engine.rootObject.add(segment.object);

        segment.object.position.set(-0.45 - i * 0.9, 0, (i + 1) * -0.01);
    }

    var leftMandibleSprite = galaxies.utils.makeSprite("insecticlydemandible"),
        rightMandibleSprite = galaxies.utils.makeSprite("insecticlydemandible");

    this.leftMandible = new THREE.Object3D();
    this.rightMandible = new THREE.Object3D();

    leftMandibleSprite.scale.set(-0.29, 0.73, 1);
    rightMandibleSprite.scale.set(0.29, 0.73, 1);

    leftMandibleSprite.material.side = THREE.BackSide;

    leftMandibleSprite.position.set(-0.095, -0.195, 0);
    rightMandibleSprite.position.set(0.095, -0.195, 0);

    this.leftMandible.add(leftMandibleSprite);
    this.rightMandible.add(rightMandibleSprite);

    this.leftMandible.position.set(0.48, -0.32, -0.01);
    this.rightMandible.position.set(-0.48, -0.32, -0.01);

    this.object.add(this.leftMandible);
    this.object.add(this.rightMandible);

    this.owningBoss.object.add(this.object);
};

galaxies.InsectBody.prototype.moveOffScreen = function () {
    this.movementController.reset();

    var facingVector = new THREE.Vector3(Math.cos(this.headAngle), Math.sin(this.headAngle), 0),
        planetCenter = this.movementController.convertPointToWorld(galaxies.engine.planetScreenPoint),
        scale = this.scale * 4,
        path = [
            this.position,
            facingVector.clone().multiplyScalar(scale).add(this.position)
        ],
        facingPlanet = planetCenter.clone().sub(path[1]);

    facingPlanet.z = 0;

    if (facingVector.dot(facingPlanet) > 0) {
        var crossValue = facingVector.clone().cross(facingPlanet),
            newDirection;

        if (crossValue.z < 0) {
            newDirection = new THREE.Vector3(-facingVector.y, facingVector.x, 0);
        } else {
            newDirection = new THREE.Vector3(facingVector.y, -facingVector.x, 0);
        }

        newDirection.multiplyScalar(scale);

        path.push(path[1].clone().add(newDirection));
    }

    var lastPos = path[path.length - 1],
        tangent = lastPos.clone().sub(planetCenter).normalize(),
        targetX = (tangent.x < 0) ? this.leftEdge : this.rightEdge,
        targetY = (tangent.y < 0) ? this.bottomEdge : this.topEdge,
        distanceToEdge = Math.min((targetX - lastPos.x) / tangent.x, (targetY - lastPos.y) / tangent.y);
    
    path.push(lastPos.clone().add(tangent.multiplyScalar(distanceToEdge + scale * 2)));

    path = path.map(this.movementController.convertPointToNormalized, this.movementController);

    this.movementController.addPath(path);
};

galaxies.InsectBody.prototype.onPathEnd = function () {
    if (this.state === "entering") {
        this.state = "moving";
    }

    this.owningBoss.addRandomPattern();
};

galaxies.InsectBody.prototype.reset = function (segmentTransforms) {
    this.segments.forEach(function (segment) {
        segment.reset();
    });

    this.age = 0;

    this.headAngle = 0;
    this.mouthOpenAmount = 0.5;
    this.timeToNextShot = 0;

    if (segmentTransforms) {
        this.state = "moving";
        this.object.visible = true;

        segmentTransforms.forEach(function (transform, index) {
            if (index === 0) {
                this.setHeadDataFromSegment(transform.position, transform.angle);
            } else {
                var segment = this.segments[index - 1];

                segment.object.position.copy(transform.position);
                segment.angle = transform.angle;
            }
        }, this);

        this._activeSegments = segmentTransforms.length - 2;
        this.updateActiveSegments(false, true);

        this.moveOffScreen();
    } else {
        this.state = "preEntry";
        this.object.visible = false;

        this.position.x = this.leftEdge - this.scale * 2;
        this.position.y = this.topEdge - this.scale * 2;

        if (this.movementController) {
            this.movementController.reset();
            this.movementController.speed = this.scale * 5;
        }

        this.activeSegments = galaxies.Insecticlyde.MAX_SEGMENTS;
    }

    //this.updateSegments(0, true);
};

galaxies.InsectBody.prototype.triggerLaserBlast = function (position) {
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

galaxies.InsectBody.prototype.update = function (delta) {
    if (this.state === "inactive") {
        return;
    }

    this.updateMovement(delta);

    if ((this.state !== "preEntry") && (this.state !== "entering")) {
        var firing = false,
            angleDiff;

        if (this.position.x > this.leftEdge &&
            this.position.x < this.rightEdge &&
            this.position.y > this.bottomEdge &&
            this.position.y < this.topEdge) {
            angleDiff = Math.atan2(this.position.y, this.position.x) - this.headAngle;

            while (angleDiff > Math.PI) {
                angleDiff -= 2 * Math.PI;
            }

            while (angleDiff < -Math.PI) {
                angleDiff += 2 * Math.PI;
            }

            firing = Math.abs(angleDiff) > (5 * Math.PI / 6);
        }

        if (firing) {
            this.timeToNextShot -= delta;

            if (this.timeToNextShot <= 0) {
                this.timeToNextShot = 0.25;

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
        pellet.update(delta);
    });

    if (this.state !== "preEntry") {
        this.checkCollisions();
    }
};

galaxies.InsectBody.prototype.updateActiveSegments = function (isResize, force) {
    var outerScale = this.scale;

    if (this.state === "inactive") {
        return;
    }

    this.segments.forEach(function (segment, index) {
        if (index > this.activeSegments) {
            segment.enabled = false;
        } else {
            segment.enabled = true;

            if (force) {
                segment.scale = outerScale;
            } else if (isResize) {
                segment.scale *= outerScale / segment.targetScale;
            }

            segment.targetScale = outerScale;
        }
    }, this);
};

galaxies.InsectBody.prototype.updateCoordinates = function (top, bottom, left, right, newScale, speed) {
    this.topEdge = top;
    this.leftEdge = left;
    this.bottomEdge = bottom;
    this.rightEdge = right;

    this._scale = newScale;

    this.object.scale.set(newScale, newScale, newScale);

    if (this.movementController) {
        this.movementController.updateCoordinates(this.topEdge, this.bottomEdge, this.leftEdge, this.rightEdge, speed);
    } else {
        this.movementController = new galaxies.BossMover(this.onPathEnd.bind(this),
            this.topEdge,
            this.bottomEdge,
            this.leftEdge,
            this.rightEdge,
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

galaxies.InsectBody.prototype.updateMovement = function (delta, skipAngleUpdate, reorient) {
    if (this.state === "preEntry") {
        return;
    }

    this.movementController.update(delta);

    var pos = this.movementController.getCurrentPosition(),
        angle = this.movementController.getCurrentFacingAngle();

    if (pos) {
        this.position = pos;

        if (skipAngleUpdate || reorient) {
            this.headAngle = angle;
        } else {
            this.headAngle += galaxies.utils.normalizeAngle(angle - this.headAngle);
        }
    }

    this.updateSegments(delta, skipAngleUpdate || !pos, reorient);
};

galaxies.InsectBody.prototype.updateSegments = function (delta, skipAngleUpdate, reorient) {
    delta = delta || 0;
    reorient = reorient || false;

    var mad = galaxies.Insecticlyde.MAX_ANGLE_DIFF,
        prevSegment;

    this.object.position.x = this.position.x;
    this.object.position.y = this.position.y;

    this.segments.some(function (segment, index) {
        if (!segment.enabled) {
            return true;
        }

        var so = segment.object,
            pos = so.position.clone(),
            startFrom,
            angle,
            scalar,
            lookAngle;

        if (index === 0) {
            startFrom = this.object.position;
            angle = this.headAngle;
            scalar = 0.45 * this.scale;
        } else {
            startFrom = prevSegment.object.position;
            angle = prevSegment.angle;
            scalar = 0.9 * prevSegment.scale;
        }

        so.position.x = startFrom.x - Math.cos(angle) * scalar;
        so.position.y = startFrom.y - Math.sin(angle) * scalar;

        if (reorient) {
            segment.angle = this.headAngle;
        } else if (!skipAngleUpdate) {
            pos.sub(so.position).multiplyScalar(-1);

            lookAngle = Math.atan2(pos.y, pos.x);

            var angleDiff = galaxies.utils.normalizeAngle(lookAngle - segment.angle);

            segment.angle = Math.max(Math.min(0.1 * (segment.angle + angleDiff) + 0.9 * segment.angle, angle + mad), angle - mad);
        }

        segment.update(delta);

        prevSegment = segment;
    }, this);
};