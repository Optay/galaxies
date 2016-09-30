"use strict";

this.galaxies = this.galaxies || {};

galaxies.InsectSegment = function () {
    this.object = new THREE.Object3D();

    this.initModel();

    this.reset();
};

galaxies.InsectSegment.prototype = {};
galaxies.InsectSegment.prototype.constructor = galaxies.InsectSegment;

Object.defineProperties(galaxies.InsectSegment.prototype, {
    angle: {
        get: function () {
            return this._angle;
        },
        set: function (value) {
            this._angle = value;

            this.object.rotation.z = value + Math.PI / 2;
        }
    },
    enabled: {
        get: function () {
            return this._enabled;
        },
        set: function (value) {
            this._enabled = value;

            this.object.visible = value;
        }
    },
    scale: {
        get: function () {
            return this._scale;
        },
        set: function (value) {
            this._scale = value;

            this.object.scale.set(value, value, value);
        }
    }
});

galaxies.InsectSegment.prototype.didGetHit = function (projectile) {
    return galaxies.utils.doCollidersOverlap(projectile.flatCapsule, this.collider);
};

galaxies.InsectSegment.prototype.initModel = function () {
    this.segment = galaxies.utils.makeSprite("insecticlydesegment", true);

    this.segment.scale.set(2.24, 1.09, 1);
    this.segment.position.set(0, 0.54, 0);

    this.object.add(this.segment);

    this.collider = new galaxies.colliders.SphereCollider(new THREE.Vector3(), 0.4);
};

galaxies.InsectSegment.prototype.reset = function () {
    this.angle = 0;
    this.enabled = true;
    this.targetScale = 1;
    this.scale = 1;
};

galaxies.InsectSegment.prototype.update = function (delta) {
    var scaleDiff = this.targetScale - this.scale,
        absScaleDiff = Math.abs(scaleDiff);

    if (absScaleDiff > 0.0001) {
        var scaleAdd = delta / 4;

        if (scaleAdd > absScaleDiff) {
            this.scale = this.targetScale;
        } else {
            this.scale += Math.sign(scaleDiff) * scaleAdd;
        }
    }

    galaxies.utils.updateCollider(this.collider, this.segment);
};
