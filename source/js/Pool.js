"use strict";
var galaxies;
(function (galaxies) {
    var Pool = (function () {
        function Pool(createFunction, initialSize, createCache) {
            if (initialSize === void 0) { initialSize = 0; }
            this.items = [];
            this.createCache = createCache;
            this.createNew = createFunction;
            this.CreateMany(initialSize);
        }
        Object.defineProperty(Pool.prototype, "available", {
            get: function () {
                return this.items.filter(function (item) {
                    return !!item;
                }).length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pool.prototype, "length", {
            get: function () {
                return this.items.length;
            },
            enumerable: true,
            configurable: true
        });
        Pool.prototype.CreateMany = function (count) {
            for (var i = 0; i < count; ++i) {
                this.CreateOne();
            }
        };
        Pool.prototype.CreateOne = function () {
            this.items.push(this.createNew(this, this.createCache));
        };
        Pool.prototype.GetMany = function (count) {
            var items = this.items;
            var requested = [];
            var next = 0;
            for (var i = 0; i < count; ++i) {
                next = this.NextAvailable(next);
                if (next === -1) {
                    requested.push(this.createNew(this, this.createCache));
                }
                else {
                    requested.push(items[next]);
                    delete items[next];
                }
            }
            return requested;
        };
        Pool.prototype.GetOne = function () {
            var next = this.NextAvailable();
            if (next === -1) {
                return this.createNew(this, this.createCache);
            }
            else {
                var item = this.items[next];
                delete this.items[next];
                return item;
            }
        };
        Pool.prototype.ReturnMany = function (items) {
            var next = 0;
            var numItems = items.length;
            for (var i = 0; i < numItems; ++i) {
                next = this.NextEmpty(next);
                if (next === -1) {
                    this.items.push(items[i]);
                }
                else {
                    this.items[next] = items[i];
                }
                delete items[i];
            }
        };
        Pool.prototype.ReturnOne = function (item) {
            var next = this.NextEmpty();
            if (next === -1) {
                this.items.push(item);
            }
            else {
                this.items[next] = item;
            }
        };
        Pool.prototype.NextAvailable = function (startAt) {
            if (startAt === void 0) { startAt = 0; }
            if (startAt === -1) {
                return -1;
            }
            var items = this.items;
            var numItems = this.length;
            for (var i = startAt; i < numItems; ++i) {
                if (items[i] !== void 0) {
                    return i;
                }
            }
            return -1;
        };
        Pool.prototype.NextEmpty = function (startAt) {
            if (startAt === void 0) { startAt = 0; }
            if (startAt === -1) {
                return -1;
            }
            var items = this.items;
            var numItems = this.length;
            for (var i = startAt; i < numItems; ++i) {
                if (items[i] === void 0) {
                    return i;
                }
            }
            return -1;
        };
        return Pool;
    }());
    galaxies.Pool = Pool;
})(galaxies || (galaxies = {}));
