/// <reference path="Rubble.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var galaxies;
(function (galaxies) {
    var IcyRubble = (function (_super) {
        __extends(IcyRubble, _super);
        function IcyRubble(pool) {
            _super.call(this, pool, 0.1);
            this.object = new THREE.Mesh(galaxies.resources.geometries["asteroid"], galaxies.resources.materials["rubbleice"].clone());
        }
        return IcyRubble;
    }(galaxies.Rubble));
    galaxies.IcyRubble = IcyRubble;
})(galaxies || (galaxies = {}));
