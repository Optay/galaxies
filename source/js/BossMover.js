"use strict";

this.galaxies = this.galaxies || {};

galaxies.BossMover = function (pathEndCallback, topEdge, bottomEdge, leftEdge, rightEdge, speed) {
    this.pathEndCallback = pathEndCallback;

    this.reset();

    this.updateCoordinates(topEdge, bottomEdge, leftEdge, rightEdge, speed);
};

galaxies.BossMover.prototype = {
    addPath: function (points) {
        this.paths.push(points);

        if (!this.currentPath) {
            this.pathProgress = 0;

            this.convertCurrentPath();
        }
    },
    convertCurrentPath: function () {
        if (this.paths.length === 0) {
            return;
        }

        this.currentPath = new THREE.CatmullRomCurve3(this.paths[0].map(this.convertPointToWorld, this));
    },
    convertPointToNormalized: function (point) {
        return new THREE.Vector2(point.x, point.y)
            .sub(new THREE.Vector2(this.startX, this.startY))
            .divide(new THREE.Vector2(this.scaleX, this.scaleY));
    },
    convertPointToWorld: function (point) {
        return new THREE.Vector3(this.scaleX, this.scaleY, 1)
            .multiply(new THREE.Vector3(point.x, point.y, point.z || 0))
            .add(new THREE.Vector3(this.startX, this.startY, 0));
    },
    getCurrentFacingAngle: function () {
        if (!this.currentPath) {
            return null;
        }

        var tangent = this.currentPath.getTangent(this.pathProgress);

        return Math.atan2(tangent.y, tangent.x);
    },
    getCurrentPosition: function () {
        if (!this.currentPath) {
            return null;
        }

        return this.currentPath.getPoint(this.pathProgress);
    },
    moveToNextPath: function () {
        this.pathProgress = 0;

        this.paths.shift();

        if (this.paths.length === 0) {
            this.currentPath = null;

            return;
        }

        this.convertCurrentPath();
    },
    reset: function () {
        this.currentPath = null;
        this.paths = [];
        this.pathProgress = 0;
        this.currentRate = 0;
    },
    update: function (delta) {
        if (!this.currentPath) {
            return;
        }

        var distanceToTravel = this.speed * delta,
            smallChange = 0.001,
            distanceOverChange = this.currentPath.getPoint(this.pathProgress + smallChange)
                .sub(this.currentPath.getPoint(this.pathProgress)).length(),
            calculatedSpeed = smallChange * distanceToTravel / distanceOverChange;

        this.currentRate = (this.pathProgress === 0) ? calculatedSpeed : (this.currentRate * 0.4 + calculatedSpeed * 0.6);

        this.pathProgress += this.currentRate;

        if (this.pathProgress >= 1) {
            this.moveToNextPath();

            if (this.pathEndCallback) {
                this.pathEndCallback();
            }
        }
    },
    updateCoordinates: function (topEdge, bottomEdge, leftEdge, rightEdge, speed) {
        var newScaleX = rightEdge - leftEdge,
            newScaleY = topEdge - bottomEdge,
            changesMade = (leftEdge !== this.startX) ||
                (bottomEdge !== this.startY) ||
                (newScaleX !== this.scaleX) ||
                (newScaleY !== this.scaleY);

        this.startX = leftEdge;
        this.scaleX = newScaleX;

        this.startY = bottomEdge;
        this.scaleY = newScaleY;

        this.currentRate *= speed / this.speed;

        this.speed = speed;

        if (changesMade) {
            this.convertCurrentPath();
        }
    }
};

Object.defineProperties(galaxies.BossMover.prototype,
    {
        active: {
            get: function () {
                return this.currentPath != null;
            }
        }
    });