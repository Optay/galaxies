/// <reference path="Pool.ts" />
"use strict";
var galaxies;
(function(galaxies) {
    var PoolItem = (function() {
        function PoolItem(pool) {
            this.owningPool = pool;
        }

        PoolItem.prototype.Activate = function() {
            this.bIsActive = true;
        };
        PoolItem.prototype.Deactivate = function() {
            this.bIsActive = false;
            this.owningPool.ReturnOne(this);
        };
        PoolItem.prototype.IsActive = function() {
            return this.bIsActive;
        };
        return PoolItem;
    }());
    galaxies.PoolItem = PoolItem;
})(galaxies || (galaxies = {}));