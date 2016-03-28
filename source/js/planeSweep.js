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
                return function (a, b) {
                    var aVal = a.object.position[axis] - (a.hitThreshold || 0),
                        bVal = b.object.position[axis] - (b.hitThreshold || 0);

                    return bVal < aVal;
                };
            };

        bubbleSort(this.xList, getBubbleCompare('x'));
        bubbleSort(this.yList, getBubbleCompare('y'));
    },

    potentialCollisions: function () {
        var xOverlaps, yOverlaps,
            getOverlaps = function(list, axis) {
                var listSize = list.length,
                    listSizeM1 = listSize - 1,
                    pairs = [],
                    i, j, checkVal, baseItem, checkItem;

                for (i = 0; i < listSizeM1; ++i) {
                    baseItem = list[i];
                    checkVal = baseItem.object.position[axis] + (baseItem.hitThreshold || 0);

                    for (j = i + 1; j < listSize; ++j) {
                        checkItem = list[j];

                        if (checkItem.object.position[axis] - (baseItem.hitThreshold || 0) > checkVal) {
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
