"use strict";

this.galaxies = this.galaxies || {};

galaxies.BossMover = function (topEdge, bottomEdge, leftEdge, rightEdge, speed) {
    this.reset();

    this.updateCoordinates(topEdge, bottomEdge, leftEdge, rightEdge, speed);
};

galaxies.BossMover.prototype = {
    addPoint: function (point) {
        var worldX = this.startX + point.x * this.scaleX,
            worldY = this.startY + point.y * this.scaleY,
            newPoint = {
                screenData: {
                    inX: point.x,
                    inY: point.y,
                    x: point.x,
                    y: point.y,
                    outX: point.x,
                    outY: point.y
                },
                worldData: {
                    inX: worldX,
                    inY: worldY,
                    x: worldX,
                    y: worldY,
                    outX: worldX,
                    outY: worldY
                }
            },
            numPoints = this.bezierPoints.length,
            lastPoint, secondLastPoint, diff;

        if (numPoints > 1) {
            lastPoint = this.bezierPoints[numPoints - 1];
            secondLastPoint = this.bezierPoints[numPoints - 2];

            // Crude, but all we really need for now, and it's cheap
            diff = new THREE.Vector2(newPoint.screenData.x - secondLastPoint.screenData.x,
                newPoint.screenData.y - secondLastPoint.screenData.y);

            diff.divideScalar(5);

            lastPoint.screenData.inX = lastPoint.screenData.x - diff.x;
            lastPoint.screenData.inY = lastPoint.screenData.y - diff.y;

            lastPoint.screenData.outX = lastPoint.screenData.x + diff.x;
            lastPoint.screenData.outY = lastPoint.screenData.y + diff.y;

            this.updatePointWorldData(lastPoint);
        }

        this.bezierPoints.push(newPoint);

        if (numPoints < 2) {
            this.segmentChangeRate = this.calculateSegmentChangeRate(this.segmentStartIndex);
        }
    },

    addPoints: function (points) {
        points.forEach(this.addPoint, this);
    },

    calculateSegmentChangeRate: function (segmentStartIndex) {
        if (segmentStartIndex > this.bezierPoints.length - 2) {
            return 0;
        }

        var d0 = this.bezierPoints[segmentStartIndex].worldData,
            d1 = this.bezierPoints[segmentStartIndex + 1].worldData,
            totalDistance = 0,
            subdivisions = 8,
            i, point, prevPoint;

        for (i = 0; i <= subdivisions; ++i) {
            point = galaxies.utils.getBezierPoint(d0.x, d0.y, d0.outX, d0.outY, d1.inX, d1.inY, d1.x, d1.y,
                i / subdivisions);

            if (prevPoint) {
                totalDistance += prevPoint.distanceTo(point);
            }

            prevPoint = point;
        }

        return this.speed / totalDistance;
    },

    getCurrentFacingAngle: function () {
        if (this.bezierPoints.length < 2) {
            return null;
        }

        var d0 = this.bezierPoints[this.segmentStartIndex].worldData,
            d1 = this.bezierPoints[this.segmentStartIndex + 1].worldData,
            tangent = galaxies.utils.getBezierTangent(d0.x, d0.y, d0.outX, d0.outY, d1.inX, d1.inY, d1.x, d1.y,
                this.segmentProgress);

        return Math.atan2(tangent.y, tangent.x);
    },

    getCurrentPosition: function () {
        if (this.bezierPoints.length < 2) {
            return null;
        }

        var d0 = this.bezierPoints[this.segmentStartIndex].worldData,
            d1 = this.bezierPoints[this.segmentStartIndex + 1].worldData;

        return galaxies.utils.getBezierPoint(d0.x, d0.y, d0.outX, d0.outY, d1.inX, d1.inY, d1.x, d1.y,
            this.segmentProgress);
    },

    reset: function () {
        this.bezierPoints = [];

        this.segmentStartIndex = 0;
        this.segmentProgress = 0;
        this.segmentChangeRate = 1;
    },

    update: function (delta) {
        var prevProgress = this.segmentProgress;

        // TODO: use instantaneous change rate of bezier instead? Would be more even
        this.segmentProgress += this.segmentChangeRate * delta;

        if (this.segmentProgress > 1) {
            if (this.segmentStartIndex < this.bezierPoints.length - 1) {
                ++this.segmentStartIndex;

                if (this.segmentStartIndex > 1) {
                    --this.segmentStartIndex;

                    this.bezierPoints = this.bezierPoints.slice(1);
                }

                var overByScalar = (this.segmentProgress - 1) / this.segmentChangeRate;

                this.segmentChangeRate = this.calculateSegmentChangeRate(this.segmentStartIndex);

                this.segmentProgress = this.segmentChangeRate * overByScalar;
            } else {
                this.segmentProgress = 1;
            }
        }

        return this.segmentProgress != prevProgress;
    },

    updateCoordinates: function (topEdge, bottomEdge, leftEdge, rightEdge, speed) {
        this.startX = leftEdge;
        this.scaleX = rightEdge - leftEdge;

        this.startY = bottomEdge;
        this.scaleY = topEdge - bottomEdge;

        this.speed = speed;

        this.bezierPoints.forEach(this.updatePointWorldData, this);

        this.segmentChangeRate = this.calculateSegmentChangeRate(this.segmentStartIndex);
    },

    updatePointWorldData: function (point) {
        var screenData = point.screenData,
            worldData = point.worldData;

        worldData.inX = this.startX + screenData.inX * this.scaleX;
        worldData.inY = this.startY + screenData.inY * this.scaleY;

        worldData.x = this.startX + screenData.x * this.scaleX;
        worldData.y = this.startY + screenData.y * this.scaleY;

        worldData.outX = this.startX + screenData.outX * this.scaleX;
        worldData.outY = this.startY + screenData.outY * this.scaleY;
    }
};

Object.defineProperties(galaxies.BossMover.prototype, {
    numPoints: {
        get: function () {
            return this.bezierPoints.length - this.segmentStartIndex;
        }
    }
});
