"use strict";

this.galaxies = this.galaxies || {};

galaxies.Insecticlyde = function () {
    this.maxSegments = 10;
    this.maxAngleDiff = Math.PI / 3;
    this.taperCount = 3;
    this.maxVelocity = 0.4;

    this.segments = [];

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
    },
    xPosition: {
        get: function () {
            return this._xPosition;
        },
        set: function (value) {
            this._xPosition = value;

            this.object.position.x = (1 - value) * this.leftEdge + value * this.rightEdge;
        }
    },
    yPosition: {
        get: function () {
            return this._yPosition;
        },
        set: function (value) {
            this._yPosition = value;

            this.object.position.y = (1 - value) * this.bottomEdge + value * this.topEdge;
        }
    }
});

galaxies.Insecticlyde.prototype.checkCollisions = function () {
    var hitLast = false;

    galaxies.engine.projectiles.forEach(function (projectile) {
        var projectileHit = false;

        this.segments.forEach(function (segment, index) {
            if (segment.enabled && segment.didGetHit(projectile)) {
                projectileHit = true;

                if (index === this.activeSegments - 1) {
                    hitLast = true;
                }
            }
        }, this);

        if (projectileHit) {
            projectile.hit();
        }
    }, this);

    if (hitLast) {
        --this.activeSegments;
    }
};

galaxies.Insecticlyde.prototype.disable = function () {
    galaxies.Boss.prototype.disable.call(this);

    this.segments.forEach(function (segment) {
        segment.object.visible = false;
    });
};

galaxies.Insecticlyde.prototype.enter = function () {
    galaxies.Boss.prototype.enter.call(this);

    this.targetPositions = [{x: 0.5, y: 0.8}];
};

galaxies.Insecticlyde.prototype.initModel = function () {
    galaxies.Boss.prototype.initModel.call(this);

    this.head = galaxies.utils.makeSprite("insecticlydeface", true);

    this.head.scale.set(1.58, 1.27, 1);

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

    this.yPosition = 0.8;
    this.xPosition = -0.1;

    this.targetPositions = [];
    this.velocity = 0;

    this.updateSegments(0, true);
};

galaxies.Insecticlyde.prototype.update = function (delta) {
    this.updateMovement(delta);

    if (this.targetPositions.length === 0) {
        if (this.state === "entering") {
            this.state = "moving";

            this.targetPositions.push({x: 0.712, y: 0.712});
            this.targetPositions.push({x: 0.8, y: 0.5});
        }
    }

    this.checkCollisions();
};

galaxies.Insecticlyde.prototype.updateActiveSegments = function (isResize, force) {
    var taperAt = this.maxSegments - this.taperCount,
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

    var newScale = Math.min(Math.abs(this.topEdge - this.bottomEdge), Math.abs(this.rightEdge - this.leftEdge)) / 12;

    this._scale = newScale;

    this.object.scale.set(newScale, newScale, newScale);

    this.updateActiveSegments(true, (this.state === "preEntry") || (this.state === "entering"));
    this.updateSegments(0, true);
};

galaxies.Insecticlyde.prototype.updateMovement = function (delta) {
    if (this.targetPositions.length === 0) {
        this.updateSegments(delta, true);

        return;
    }

    var targetPos = this.targetPositions[0],
        posDiff = {x: targetPos.x - this.xPosition, y: targetPos.y - this.yPosition},
        desiredFacingAngle = Math.atan2(posDiff.y, posDiff.x),
        angleDiff = desiredFacingAngle - this.headAngle,
        absDiff = Math.abs(angleDiff),
        distToDestSq = (posDiff.x * posDiff.x) + (posDiff.y * posDiff.y);

    if (absDiff > 0.001) {
        var rotateBy = delta * Math.PI;

        if (rotateBy > absDiff) {
            this.headAngle = desiredFacingAngle;
        } else {
            this.headAngle += Math.sign(angleDiff) * rotateBy;
        }

        if (absDiff > Math.PI / 3) {
            this.velocity *= 0.8;
        }
    }

    this.velocity = Math.min(this.velocity + delta / 2, this.maxVelocity);

    var moveAmt = this.velocity * delta;

    if (distToDestSq <= moveAmt * moveAmt) {
        this.targetPositions.shift();
    }

    this.xPosition += Math.cos(this.headAngle) * moveAmt;
    this.yPosition += Math.sin(this.headAngle) * moveAmt;

    this.updateSegments(delta);
};

galaxies.Insecticlyde.prototype.updateSegments = function (delta, skipAngleUpdate) {
    delta = delta || 0;

    var mad = this.maxAngleDiff,
        prevSegment;

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

            // TODO: normalize look angle

            segment.angle = 0.1 * lookAngle + 0.9 * segment.angle;//Math.max(Math.min(0.1 * lookAngle + 0.9 * segment.angle, angle + mad), angle - mad);
        }

        segment.update(delta);

        prevSegment = segment;
    }, this);
};
