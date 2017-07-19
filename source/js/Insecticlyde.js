"use strict";

this.galaxies = this.galaxies || {};

galaxies.Insecticlyde = function () {
    this.bodies = [];

    for (var i = 0; i < 3; ++i) {
        this.bodies.push(new galaxies.InsectBody(this));
    }

    galaxies.Boss.call(this);

    this.name = "Insecticlyde";
    this.bodyScale = 0;
    this.bodySpeed = 0;
};

galaxies.Insecticlyde.prototype = Object.create(galaxies.Boss.prototype);
galaxies.Insecticlyde.prototype.constructor = galaxies.Insecticlyde;

galaxies.Insecticlyde.MAX_SEGMENTS = 10;
galaxies.Insecticlyde.MAX_ANGLE_DIFF = Math.PI / 3;
galaxies.Insecticlyde.DIVISIONS_PER_LOOP = 8;
galaxies.Insecticlyde.DIVISIONS_PER_RADIAN = galaxies.Insecticlyde.DIVISIONS_PER_LOOP / (Math.PI * 2);

galaxies.Insecticlyde.prototype.activeBodies = function () {
    return this.bodies.filter(function (body) { return body.state !== "inactive" });
};

galaxies.Insecticlyde.prototype.addBodies = function (sections) {
    sections.forEach(function (section) {
        this.nextAvailableBody().reset(section);
    }, this);
};

galaxies.Insecticlyde.prototype.addRandomPattern = function () {
    var readyToAdd = this.bodies.every(function (body) {
        return body.state === "inactive" || !body.movementController.active;
    });

    if (readyToAdd) {
        var enterAngle = Math.random() * Math.PI *2,
            exitAngle = Math.random() * Math.PI * 2,
            enterVector = new THREE.Vector3(Math.cos(enterAngle), Math.sin(enterAngle), 0),
            exitVector = new THREE.Vector3(Math.cos(exitAngle), Math.sin(exitAngle), 0),
            angleDiff = galaxies.utils.normalizeAngle(exitAngle - enterAngle),
            planetPosition = new THREE.Vector3(this.rightEdge - this.leftEdge, this.topEdge - this.bottomEdge, 1)
                .multiply(new THREE.Vector3(galaxies.engine.planetScreenPoint.x, galaxies.engine.planetScreenPoint.y, 0))
                .add(new THREE.Vector3(this.leftEdge, this.bottomEdge, 0)),
            basePath = [],
            startPoint = planetPosition.clone().add(enterVector.clone()
                .multiplyScalar(this.distanceToEdge(planetPosition, enterVector) + this.bodyScale * 2)),
            endPoint = planetPosition.clone().add(exitVector.clone()
                .multiplyScalar(this.distanceToEdge(planetPosition, exitVector) + this.bodyScale * (galaxies.Insecticlyde.MAX_SEGMENTS + 1))),
            angleIsSmall = Math.abs(angleDiff) < (Math.PI / 2);

        basePath.push(startPoint);

        var intermmediatePointCount,
            angleIncrement,
            angle = enterAngle,
            circleEnter,
            circleExit,
            i;

        if (angleIsSmall || (Math.random() > 0.75)) {
            var rotationDirection = angleIsSmall ? (-Math.sign(angleDiff)) : ((Math.random() > 0.5) ? 1 : -1);

            angleDiff = exitAngle - enterAngle;

            if (Math.sign(angleDiff) !== rotationDirection) {
                if (rotationDirection === -1) {
                    while (angleDiff > 0) {
                        angleDiff -= Math.PI * 2;
                    }

                    // angleDiff -= Math.PI * 2;
                } else {
                    while (angleDiff < 0) {
                        angleDiff += Math.PI * 2;
                    }

                    // angleDiff += Math.PI * 2;
                }
            }

            circleEnter = planetPosition.clone().add(enterVector.clone().multiplyScalar(this.planetOrbitRadius));
            circleExit = planetPosition.clone().add(exitVector.clone().multiplyScalar(this.planetOrbitRadius));
        } else {
            var intersections = galaxies.utils.getSegmentCircleIntersections(planetPosition, this.planetOrbitRadius, startPoint, endPoint);

            if (intersections.length === 2) {
                if (intersections[0].distanceToSquared(startPoint) < intersections[1].distanceToSquared(startPoint)) {
                    circleEnter = intersections[0];
                    circleExit = intersections[1];
                } else {
                    circleEnter = intersections[1];
                    circleExit = intersections[0];
                }
            } else {
                basePath.push(startPoint.clone().multiplyScalar(0.75).add(endPoint.clone().multiplyScalar(0.25)));
                basePath.push(startPoint.clone().add(endPoint).multiplyScalar(0.5));
                basePath.push(startPoint.clone().multiplyScalar(0.25).add(endPoint.clone().multiplyScalar(0.75)));
            }
        }

        if (circleEnter) {
            intermmediatePointCount = Math.max(1, Math.ceil(Math.abs(angleDiff * galaxies.Insecticlyde.DIVISIONS_PER_RADIAN) - 2));
            angleIncrement = angleDiff / (intermmediatePointCount + 1);

            basePath.push(startPoint.clone().add(circleEnter).multiplyScalar(0.5));

            basePath.push(startPoint.clone().multiplyScalar(0.2).add(circleEnter.clone().multiplyScalar(0.8)));

            basePath.push(circleEnter);

            for (i = 0; i < intermmediatePointCount; ++i) {
                angle += angleIncrement;

                basePath.push(planetPosition.clone().add(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0).multiplyScalar(this.planetOrbitRadius)));
            }

            basePath.push(circleExit);

            basePath.push(endPoint.clone().multiplyScalar(0.2).add(circleExit.clone().multiplyScalar(0.8)));

            basePath.push(endPoint.clone().add(circleExit).multiplyScalar(0.5));
        }

        basePath.push(endPoint);

        var activeSections = this.activeBodies(),
            numActive = activeSections.length;

        activeSections.forEach(function (section, index) {
            if (index === 0) {
                section.movementController.addPath(basePath.map(this.convertToPathPoint, this));
            } else {
                var rotation = Math.PI * 2 * index / numActive;

                section.movementController.addPath(basePath.map(function (point) {
                    var localPoint = point.clone().sub(galaxies.engine.planetScreenPoint),
                        cr = Math.cos(rotation),
                        sr = Math.sin(rotation);

                    localPoint.set(localPoint.x * cr - localPoint.y * sr, localPoint.x * sr + localPoint.y * cr);

                    return this.convertToPathPoint(localPoint.add(galaxies.engine.planetScreenPoint));
                }, this));
            }

            section.updateMovement(0, true, true);
        }, this);
    }
};

galaxies.Insecticlyde.prototype.convertToPathPoint = function (point) {
    return new THREE.Vector2((point.x - this.leftEdge) / (this.rightEdge - this.leftEdge),
        (point.y - this.bottomEdge) / (this.topEdge - this.bottomEdge));
};

galaxies.Insecticlyde.prototype.disable = function () {
    galaxies.Boss.prototype.disable.call(this);

    this.bodies.forEach(function (body) {
        body.disable();
    });
};

galaxies.Insecticlyde.prototype.distanceToEdge = function (startPoint, direction) {
    var targetX = (direction.x < 0) ? this.leftEdge : this.rightEdge,
        targetY = (direction.y < 0) ? this.bottomEdge : this.topEdge,
        smallValue = 0.00000001;

    return Math.min((targetX - startPoint.x) / (direction.x || smallValue), (targetY - startPoint.y) / (direction.y || smallValue));
};

galaxies.Insecticlyde.prototype.enter = function () {
    galaxies.Boss.prototype.enter.call(this);

    this.bodies[0].enter();
};

galaxies.Insecticlyde.prototype.initModel = function () {
    galaxies.Boss.prototype.initModel.call(this);

    galaxies.engine.rootObject.add(this.object);

    this.bodies.forEach(function (body) {
        body.initModel();
    });
};

galaxies.Insecticlyde.prototype.initAudio = function () {
    galaxies.Boss.prototype.initAudio.call(this);

    this.bodies.forEach(function (body) {
        body.initAudio();
    });
};

galaxies.Insecticlyde.prototype.nextAvailableBody = function () {
    var numBodies = this.bodies.length;

    for (var i = 0; i < numBodies; ++i) {
        if (this.bodies[i].state === "inactive") {
            return this.bodies[i];
        }
    }

    var newBody = new galaxies.InsectBody(this);

    newBody.updateCoordinates(this.topEdge, this.bottomEdge, this.leftEdge, this.rightEdge, this.bodyScale, this.bodySpeed);

    this.bodies.push(newBody);

    return newBody;
};

galaxies.Insecticlyde.prototype.reset = function () {
    galaxies.Boss.prototype.reset.call(this);

    this.bodies.forEach(function (body, index) {
        body.reset();

        if (index !== 0) {
            body.disable();
        } else {
            body.object.visible = true;
        }
    });

    this.lastUsedPattern = -1;
};

galaxies.Insecticlyde.prototype.update = function (delta) {
    galaxies.Boss.prototype.update.call(this, delta);

    if (this.state === "inactive") {
        return;
    }

    this.bodies.forEach(function (body) {
        body.update(delta);
    });
};

galaxies.Insecticlyde.prototype.updateCoordinates = function () {
    galaxies.Boss.prototype.updateCoordinates.call(this);

    this.bodyScale = Math.min(Math.abs(this.topEdge - this.bottomEdge), Math.abs(this.rightEdge - this.leftEdge)) / 16;
    this.bodySpeed = this.bodyScale * 5;
    this.planetOrbitRadius = this.bodyScale * 4;

    this.bodies.forEach(function (body) {
        body.updateCoordinates(this.topEdge, this.bottomEdge, this.leftEdge, this.rightEdge, this.bodyScale, this.bodySpeed);
    }, this);
};
