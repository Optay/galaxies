/// <reference path="Rubble.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var galaxies;
(function (galaxies) {
    var RadRubble = (function (_super) {
        __extends(RadRubble, _super);
        function RadRubble(pool) {
            _super.call(this, pool, 0.1);
            this.object = new THREE.Mesh(galaxies.resources.geometries["asteroid"], new THREE.MeshLambertMaterial({
                color: 0x60A173
            }));
        }
        return RadRubble;
    }(galaxies.Rubble));
    galaxies.RadRubble = RadRubble;
})(galaxies || (galaxies = {}));
