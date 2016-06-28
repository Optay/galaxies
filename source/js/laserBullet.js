"use strict";

this.galaxies = this.galaxies || {};

galaxies.LaserBullet = function () {
    this.state = "inactive";
    this.velocity = new THREE.Vector3();
    this.isHittable = false;
    this.impactCallbacks = [];

    this.initModel();
};

galaxies.LaserBullet.prototype = {
    addImpactCallback: function (callback) {
        this.impactCallbacks.push(callback);
    },

    addToScene: function (position, direction) {
        this.state = "active";
        this.isHittable = false;

        galaxies.engine.rootObject.add(this.object);

        this.setStartingPosition(position, direction);
    },

    impact: function (didHitPlayer) {
        if (this.state === "inactive") {
            return;
        }

        this.impactCallbacks.forEach(function (callback) {
            if (typeof callback === "function") {
                callback(didHitPlayer);
            }
        });

        this.state = "inactive";

        galaxies.fx.showLaserHit(this.object.position.clone().add(this.velocity.normalize().multiplyScalar(1.5)));
    },

    initModel: function () {
        var texture = new THREE.Texture(galaxies.queue.getResult("laserbeam")),
            geometry = new THREE.PlaneGeometry(1, 0.25),
            material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                blending: THREE.AdditiveBlending
            });

        texture.needsUpdate = true;

        this.object = new THREE.Mesh(geometry, material);
        this.object.scale.set(0.4, 0.4, 0.4);
    },

    removeFromScene: function () {
        galaxies.engine.rootObject.remove(this.object);

        this.impactCallbacks = [];
    },

    setStartingPosition: function (position, direction) {
        var angle = Math.atan2(direction.y, direction.x);

        this.velocity = direction.clone().normalize().multiplyScalar(25);
        this.object.position.copy(position);
        this.object.rotation.z = angle;

        galaxies.utils.conify(this.object);
    },

    update: function (delta) {
        if (this.state === "inactive") {
            return;
        }

        var flatLenSq;

        this.object.position.add(this.velocity.clone().multiplyScalar(delta));

        flatLenSq = galaxies.utils.flatLengthSqr(this.object.position);

        if (galaxies.engine.shielded) {
            var radius = galaxies.engine.SHIELD_RADIUS - 0.9; // Why this is, I'm not really sure

            if (flatLenSq <= radius * radius && !this.isHittable) {
                var normal = this.object.position.clone().normalize(),
                    normVel;

                this.isHittable = true;

                this.velocity.reflect(normal);

                normVel = this.velocity.clone().normalize();

                this.object.rotation.z = Math.atan2(normVel.y, normVel.x);

                this.object.position.add(this.velocity.clone().multiplyScalar(delta));

                galaxies.engine.hitShield(1);
            }
        } else {
            if (flatLenSq <= galaxies.engine.PLANET_RADIUS * galaxies.engine.PLANET_RADIUS) {
                this.impact(false);
            } else {
                var radSq = galaxies.engine.PLANET_RADIUS + 0.6;

                radSq *= radSq;

                if (flatLenSq <= radSq) {
                    var angle = Math.atan2(-this.object.position.x, this.object.position.y);

                    if (Math.abs(galaxies.utils.normalizeAngle(angle - galaxies.engine.angle)) < 0.35) {
                        this.impact(true);

                        galaxies.engine.hitPlayer();
                    }

                    if (galaxies.engine.currentPowerup === "clone") {
                        var cloneAngle = galaxies.engine.player.cloneSprite.material.rotation;

                        if (Math.abs(galaxies.utils.normalizeAngle(angle - cloneAngle)) < 0.35) {
                            this.impact(true);

                            galaxies.engine.setPowerup('');
                        }
                    }
                }
            }
        }

        if (flatLenSq >= galaxies.engine.OBSTACLE_START_DISTANCE * galaxies.engine.OBSTACLE_START_DISTANCE) {
            this.state = "inactive";
        }

        galaxies.utils.conify(this.object);
    }
};
