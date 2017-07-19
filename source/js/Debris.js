/// <reference path="Rubble.ts" />
var __extends = (this && this.__extends) ||
    function(d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];

        function __() { this.constructor = d; }

        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
var galaxies;
(function(galaxies) {
    var Debris = (function(_super) {
        __extends(Debris, _super);

        function Debris(pool) {
            _super.call(this, pool, 0.2);
            this.object = new THREE.Mesh(galaxies.resources.geometries["debris"],
                galaxies.resources.materials["debris"].clone());
        }

        return Debris;
    }(galaxies.Rubble));
    galaxies.Debris = Debris;
})(galaxies || (galaxies = {}));