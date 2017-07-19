/// <reference path="Rubble.ts" />
var __extends = (this && this.__extends) ||
    function(d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];

        function __() { this.constructor = d; }

        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
var galaxies;
(function(galaxies) {
    var IceCubeRubble = (function(_super) {
        __extends(IceCubeRubble, _super);

        function IceCubeRubble(pool) {
            _super.call(this, pool, 1);
            this.object = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2),
                galaxies.resources.materials["asteroidice"].clone());
        }

        return IceCubeRubble;
    }(galaxies.Rubble));
    galaxies.IceCubeRubble = IceCubeRubble;
})(galaxies || (galaxies = {}));