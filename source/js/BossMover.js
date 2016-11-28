"use strict";

this.galaxies = this.galaxies || {};

galaxies.BossMover = function (pathChangeCallback, topEdge, bottomEdge, leftEdge, rightEdge, speed) {
    this.pathChangeCallback = pathChangeCallback;

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

        var startX = this.startX,
            startY = this.startY,
            scaleX = this.scaleX,
            scaleY = this.scaleY,
            convertedPoints = this.paths[0].map(function (point) {
                return new THREE.Vector3(startX + point.x * scaleX, startY + point.y * scaleY, point.z || 0);
            });

        this.currentPath = new THREE.CatmullRomCurve3(convertedPoints);
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

        this.currentRate = this.currentRate * 0.8 + calculatedSpeed * 0.2;

        this.pathProgress += this.currentRate;

        if (this.pathProgress >= 1) {
            this.moveToNextPath();

            if (this.currentPath !== null && this.pathChangeCallback) {
                this.pathChangeCallback();
            }
        }
    },
    updateCoordinates: function (topEdge, bottomEdge, leftEdge, rightEdge, speed) {
        var newScaleX = rightEdge - leftEdge,
            newScaleY = topEdge - bottomEdge,
            changesMade = (leftEdge !== this.startX) || (bottomEdge !== this.startY) ||
                (newScaleX !== this.scaleX) || (newScaleY !== this.scaleY);

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
