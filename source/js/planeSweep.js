"use strict";

this.galaxies = this.galaxies || {};

galaxies.PlaneSweep = function () {
    this.xList = [];
    this.yList = [];
};

galaxies.PlaneSweep.prototype = {
    constructor: galaxies.PlaneSweep,

    add: function (item) {
        if (this.xList.indexOf(item) > -1) {
            return;
        }

        this.xList.push(item);
        this.yList.push(item);
    },

    remove: function (item) {
        var xListIdx = this.xList.indexOf(item);

        if (xListIdx === -1) {
            return;
        }

        this.xList.splice(xListIdx, 1);
        this.yList.splice(this.yList.indexOf(item), 1);
    },

    update: function () {
        var bubbleSort = function(a, compareFn)
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
                var getItemVal = function (item) {
                    if (item instanceof galaxies.Projectile) {
                        return Math.min(item.object.position[axis], item.lastPos[axis]);
                    } else {
                        return item.object.position[axis] - (item.hitThreshold || 0);
                    }
                };

                return function (a, b) {
                    return getItemVal(b) < getItemVal(a);
                };
            };

        bubbleSort(this.xList, getBubbleCompare('x'));
        bubbleSort(this.yList, getBubbleCompare('y'));
    },

    potentialCollisions: function () {
        var xOverlaps, yOverlaps,
            getOverlaps = function(list, axis) {
                var getItemMinVal = function(item) {
                        if (item instanceof galaxies.Projectile) {
                            return Math.min(item.object.position[axis], item.lastPos[axis]);
                        } else {
                            return item.object.position[axis] - (item.hitThreshold || 0);
                        }
                    },
                    getItemMaxVal = function(item) {
                        if (item instanceof galaxies.Projectile) {
                            return Math.max(item.object.position[axis], item.lastPos[axis]);
                        } else {
                            return item.object.position[axis] + (item.hitThreshold || 0);
                        }
                    },
                    listSize = list.length,
                    listSizeM1 = listSize - 1,
                    pairs = [],
                    i, j, checkVal, baseItem, checkItem;

                for (i = 0; i < listSizeM1; ++i) {
                    baseItem = list[i];
                    checkVal = getItemMaxVal(baseItem);

                    for (j = i + 1; j < listSize; ++j) {
                        checkItem = list[j];

                        if (getItemMinVal(checkItem) > checkVal) {
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

        return xOverlaps.filter(function (overlapPair) {
            var doesMatchPair = function (checkPair) {
                    return overlapPair.every(function (item) {
                        return checkPair.indexOf(item) !== -1;
                    });
                };

            return yOverlaps.some(doesMatchPair);
        });
    }
};
