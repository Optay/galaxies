"use strict";

this.galaxies = this.galaxies || {};

this.galaxies.LaserBullet = function () {
    this.state = "inactive";
    this.velocity = new THREE.Vector3();

    this.initModel();
};

this.galaxies.LaserBullet.prototype = {
    addToScene: function (position, direction) {
        this.state = "active";

        galaxies.engine.rootObject.add(this.object);

        this.setStartingPosition(position, direction);
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
    },

    setStartingPosition: function (position, direction) {
        var angle = Math.atan2(direction.y, direction.x);

        this.velocity = direction.clone().normalize().multiplyScalar(2);
        this.object.position.copy(position);
        this.object.rotation.z = angle;
        //this.object.rotation.set(-Math.sin(angle) * tilt, Math.cos(angle) * tilt, angle); // TODO?

        galaxies.utils.conify(this.object);
    },

    update: function (delta) {
        var flatLenSq;

        this.object.position.add(this.velocity.clone().multiplyScalar(delta));

        flatLenSq = galaxies.utils.flatLengthSqr(this.object.position);

        if (galaxies.engine.shielded) {
            var radius = galaxies.engine.SHIELD_RADIUS - 0.9; // Why this is, I'm not really sure

            if (flatLenSq <= radius * radius) {
                this.velocity.multiplyScalar(-1);

                this.object.position.add(this.velocity.clone().multiplyScalar(delta));
            }
        } else {
            if (flatLenSq <= galaxies.engine.PLANET_RADIUS * galaxies.engine.PLANET_RADIUS) {
                this.state = "inactive"
            } else {
                var radSq = galaxies.engine.PLANET_RADIUS + 0.6;

                radSq *= radSq;

                if (flatLenSq <= radSq) {
                    var angle = Math.atan2(-this.object.position.x, this.object.position.y);

                    if (Math.abs(angle - galaxies.engine.angle) < 0.35) {
                        this.state = "inactive";
                        galaxies.engine.hitPlayer();
                    }
                }
            }
        }

        if (flatLenSq >= galaxies.engine.VISIBLE_RADIUS * galaxies.engine.VISIBLE_RADIUS) {
            this.state = "inactive";
        }

        galaxies.utils.conify(this.object);
    }
};
