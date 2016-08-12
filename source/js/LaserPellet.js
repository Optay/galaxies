"use strict";

this.galaxies = this.galaxies || {};

galaxies.LaserPellet = function () {
    this.state = "inactive";
    this.velocity = new THREE.Vector3();

    this.initModel();
};

galaxies.LaserPellet.prototype = {};

galaxies.LaserPellet.prototype.addToScene = function (position) {
    this.state = "active";

    this.object.position.copy(position);

    galaxies.engine.rootObject.add(this.object);

    galaxies.utils.conify(this.object);

    this.velocity = position.clone().normalize().multiplyScalar(-30);
};

galaxies.LaserPellet.prototype.impact = function (hitPlayer) {
    this.state = "inactive";

    galaxies.fx.showHit(this.object.position, "heart");

    if (hitPlayer) {
        galaxies.fx.shakeCamera(0.7, 1);

        galaxies.engine.hitPlayer();
    }

    this.removeFromScene();
};

galaxies.LaserPellet.prototype.initModel = function () {
    this.object = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), new THREE.MeshBasicMaterial({
        color: 0xFF0000,
        transparent: true,
        blending: THREE.AdditiveBlending
    }));
};

galaxies.LaserPellet.prototype.removeFromScene = function () {
    galaxies.engine.rootObject.remove(this.object);
};

galaxies.LaserPellet.prototype.update = function (delta) {
    if (this.state === "inactive") {
        return;
    }

    this.object.position.add(this.velocity.clone().multiplyScalar(delta));

    var flatLenSq = galaxies.utils.flatLengthSqr(this.object.position),
        radius;

    if (galaxies.engine.shielded) {
        radius = galaxies.engine.SHIELD_RADIUS - 0.9; // Why this is, I'm not really sure

        if (flatLenSq <= radius * radius) {
            this.impact(true);
        }
    } else {
        radius = galaxies.engine.PLANET_RADIUS;

        if (flatLenSq <= radius * radius) {
            this.impact(false);
        } else {
            radius += 0.6;

            if (flatLenSq <= radius * radius) {
                var angle = Math.atan2(-this.object.position.x, this.object.position.y);

                if (Math.abs(galaxies.utils.normalizeAngle(angle - galaxies.engine.angle)) < 0.35) {
                    this.impact(true);
                }

                if (galaxies.engine.currentPowerup === "clone") {
                    var cloneAngle = galaxies.engine.player.cloneSprite.material.rotation;

                    if (Math.abs(galaxies.utils.normalizeAngle(angle - cloneAngle)) < 0.35) {
                        this.impact(false);

                        galaxies.engine.setPowerup('');
                    }
                }
            }
        }
    }

    galaxies.utils.conify(this.object);
};
