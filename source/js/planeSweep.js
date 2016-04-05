"use strict";

this.galaxies = this.galaxies || {};

galaxies.PlaneSweep = function () {
    this.xList = [];
    this.yList = [];
    this.zList = [];
};

galaxies.PlaneSweep.prototype = {
    constructor: galaxies.PlaneSweep,

    add: function (item) {
        if (this.xList.indexOf(item) > -1) {
            return;
        }

        var itemPos = (item === galaxies.engine.ufo ? item.rootPosition : item.object.position),
            itemX = itemPos.x,
            itemY = itemPos.y,
            itemZ = itemPos.z,
            listLen = this.xList.length,
            placedX = false,
            placedY = false,
            placedZ = false,
            i;

        for (i = 0; i < listLen; ++i) {
            if (!placedX && itemX < this.getItemMinVal(this.xList[i], 'x')) {
                placedX = true;
                this.xList.splice(i, 0, item);
            }

            if (!placedY && itemY < this.getItemMinVal(this.yList[i], 'y')) {
                placedY = true;
                this.yList.splice(i, 0, item);
            }

            if (!placedZ && itemZ < this.getItemMinVal(this.zList[i], 'z')) {
                placedZ = true;
                this.zList.splice(i, 0, item);
            }

            if (placedX && placedY && placedZ) {
                break;
            }
        }

        if (!placedX) {
            this.xList.push(item);
        }

        if (!placedY) {
            this.yList.push(item);
        }

        if (!placedZ) {
            this.zList.push(item);
        }
    },

    getItemMinVal: function (item, axis) {
        if (item instanceof galaxies.Projectile) {
            return Math.min(item.object.position[axis], item.lastPos[axis]);
        } else {
            return (item === galaxies.engine.ufo ? item.rootPosition : item.object.position)[axis] - (item.hitThreshold || 0);
        }
    },

    getItemMaxVal: function (item, axis) {
        if (item instanceof galaxies.Projectile) {
            return Math.max(item.object.position[axis], item.lastPos[axis]);
        } else {
            return (item === galaxies.engine.ufo ? item.rootPosition : item.object.position)[axis] + (item.hitThreshold || 0);
        }
    },

    remove: function (item) {
        var xListIdx = this.xList.indexOf(item);

        if (xListIdx === -1) {
            return;
        }

        this.xList.splice(xListIdx, 1);
        this.yList.splice(this.yList.indexOf(item), 1);
        this.zList.splice(this.zList.indexOf(item), 1);
    },

    update: function () {
        var getMinVal = this.getItemMinVal,
            bubbleSort = function(a, compareFn)
            {
                var swapped,
                    aLenM1 = a.length - 1,
                    i, iP1;

                do {
                    swapped = false;
                    for (i = 0; i < aLenM1; ++i) {
                        iP1 = i + 1;

                        if (compareFn(a[i], a[iP1])) {
                            var temp = a[i];
                            a[i] = a[iP1];
                            a[iP1] = temp;
                            swapped = true;
                        }
                    }
                } while (swapped);
            },
            getBubbleCompare = function(axis) {
                return function (a, b) {
                    return getMinVal(b, axis) < getMinVal(a, axis);
                };
            };

        bubbleSort(this.xList, getBubbleCompare('x'));
        bubbleSort(this.yList, getBubbleCompare('y'));
        bubbleSort(this.zList, getBubbleCompare('z'));
    },

    potentialCollisions: function () {
        var xOverlaps, yOverlaps, zOverlaps,
            getItemMinVal = this.getItemMinVal,
            getItemMaxVal = this.getItemMaxVal,
            getOverlaps = function(list, axis) {
                var listSize = list.length,
                    listSizeM1 = listSize - 1,
                    pairs = [],
                    i, j, checkVal, baseItem, checkItem;

                for (i = 0; i < listSizeM1; ++i) {
                    baseItem = list[i];
                    checkVal = getItemMaxVal(baseItem, axis);

                    for (j = i + 1; j < listSize; ++j) {
                        checkItem = list[j];

                        if (getItemMinVal(checkItem, axis) > checkVal) {
                            break;
                        } else {
                            pairs.push([baseItem, checkItem]);
                        }
                    }
                }

                return pairs;
            };

        xOverlaps = getOverlaps(this.xList, 'x');
        yOverlaps = getOverlaps(this.yList, 'y');
        zOverlaps = getOverlaps(this.zList, 'z');

        return xOverlaps.filter(function (overlapPair) {
            var doesMatchPair = function (checkPair) {
                    return overlapPair.every(function (item) {
                        return checkPair.indexOf(item) !== -1;
                    });
                };

            return yOverlaps.some(doesMatchPair) && zOverlaps.some(doesMatchPair);
        });
    }
};
