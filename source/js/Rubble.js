/// <reference path="PoolItem.ts" />
"use strict";
var __extends = (this && this.__extends) ||
    function(d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];

        function __() { this.constructor = d; }

        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
var galaxies;
(function(galaxies) {
    var Rubble = (function(_super) {
        __extends(Rubble, _super);

        function Rubble(pool, scale) {
            _super.call(this, pool);
            this.sourceScale = scale;
            this.velocity = new THREE.Vector3();
            this.rotationAxis = new THREE.Vector3();
        }

        Object.defineProperty(Rubble.prototype,
            "position",
            {
                get: function() {
                    return this.object.position;
                },
                enumerable: true,
                configurable: true
            });
        Rubble.prototype.Activate = function(maxAge) {
            if (maxAge === void 0) {
                maxAge = 1;
            }
            _super.prototype.Activate.call(this);
            this.startScale = THREE.Math.randFloat(this.sourceScale / 2, this.sourceScale * 1.5);
            this.maxAge = maxAge;
            this.age = 0;
            this.object.scale.set(this.startScale, this.startScale, this.startScale);
            this.object.rotation.set(THREE.Math.randFloatSpread(Math.PI * 2),
                THREE.Math.randFloatSpread(Math.PI * 2),
                THREE.Math.randFloatSpread(Math.PI * 2));
            this.velocity.set(0, 0, 0);
            this.rotationAxis.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
            this.rotationAxis.normalize();
            this.rotationSpeed = THREE.Math.randFloat(-5, 5);
            galaxies.engine.rootObject.add(this.object);
        };
        Rubble.prototype.Deactivate = function() {
            _super.prototype.Deactivate.call(this);
            galaxies.engine.rootObject.remove(this.object);
        };
        Rubble.prototype.Update = function(delta) {
            if (!this.IsActive()) {
                return;
            }
            this.age += delta;
            var ageProgress = this.age / this.maxAge;
            this.object.rotateOnAxis(this.rotationAxis, this.rotationSpeed * delta);
            this.object.position.addScaledVector(this.velocity, delta);
            this.object.scale.setScalar(THREE.Math.lerp(this.startScale, 0, ageProgress));
            if (ageProgress >= 1) {
                this.Deactivate();
            }
        };
        return Rubble;
    }(galaxies.PoolItem));
    galaxies.Rubble = Rubble;
})(galaxies || (galaxies = {}));