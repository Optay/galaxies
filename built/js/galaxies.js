"use strict";
var galaxies;
(function (galaxies) {
    var Galaxies = (function () {
        function Galaxies(destinationCanvas) {
            if (!!destinationCanvas) {
                this.canvas = destinationCanvas;
            }
            else {
                this.canvas = document.createElement("canvas");
            }
            this.lastUpdate = performance.now();
            this.gl = this.canvas.getContext("webgl", { antialias: false });
        }
        Galaxies.prototype.update = function (timestamp) {
            this.lastUpdate = timestamp;
        };
        Galaxies.prototype.render = function () {
        };
        return Galaxies;
    }());
    galaxies.Galaxies = Galaxies;
})(galaxies || (galaxies = {}));
//# sourceMappingURL=galaxies.js.map