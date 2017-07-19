/// <reference path="Rubble.ts" />
var __extends = (this && this.__extends) ||
    function(d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];

        function __() { this.constructor = d; }

        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
var galaxies;
(function(galaxies) {
    var AsteroidRubble = (function(_super) {
        __extends(AsteroidRubble, _super);

        function AsteroidRubble(pool) {
            _super.call(this, pool, 0.1);
            this.object = new THREE.Mesh(galaxies.resources.geometries["asteroid"],
                new THREE.MeshLambertMaterial({
                    color: 0x847360,
                    opacity: 1,
                    transparent: true
                }));
        }

        return AsteroidRubble;
    }(galaxies.Rubble));
    galaxies.AsteroidRubble = AsteroidRubble;
})(galaxies || (galaxies = {}));