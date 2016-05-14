"use strict";

this.galaxies = this.galaxies || {};

this.galaxies.miniUFO = function () {
    this.hitThreshold = 0.4;
    this.isHittable = false;
    this.state = "inactive";

    this.initModel();

    this.initParticles();
    
    this.reset();
};

this.galaxies.miniUFO.prototype = {
    addToScene: function () {
        this.state = "active";
        this.isHittable = true;
        this.hitThreshold = 0.4;

        galaxies.engine.rootObject.add(this.object);
    },

    hit: function () {
        this.state = "inactive";

        // TODO: Effect
    },

    initModel: function () {
        this.object = new THREE.Object3D();

        this.model = galaxies.resources.geometries['ufo'].clone();
        this.model.children[0].material = galaxies.resources.materials['ufo'].clone();
        this.model.children[1].material = galaxies.resources.materials['ufocanopy'].clone();

        this.model.scale.set(0.35, 0.35, 0.35);
        this.model.rotation.set(Math.PI, galaxies.engine.CONE_ANGLE * 3, -Math.PI/2);

        this.object.add(this.model);
    },

    initParticles: function () {
        var texture = new THREE.Texture(galaxies.queue.getResult("starparticle"));

        texture.needsUpdate = true;

        this.laserChargeEmitter = new SPE.Emitter({
            type: SPE.distributions.SPHERE,
            particleCount: 50,
            direction: -1,
            duration: 0.4,
            maxAge: {value: 0.6, spread: 0.4},
            position: {radius: 0.1},
            velocity: {value: new THREE.Vector3(2, 0, 0)},
            drag: {value: 0.5},
            color: {value: [new THREE.Color(0.8, 1, 0.8), new THREE.Color(0.3, 0.7, 0.3)]},
            opacity: {value: [1, 0]},
            size: {value: [0.5, 1]}
        });

        this.laserChargeGroup = new SPE.Group({
            texture: {value: texture},
            blending: THREE.AdditiveBlending,
            transparent: true,
            maxParticleCount: 100
        });

        this.laserChargeGroup.addEmitter(this.laserChargeEmitter);
        this.laserChargeGroup.mesh.position.setY(-0.8);

        this.laserChargeEmitter.disable();

        this.model.add(this.laserChargeGroup.mesh);
    },

    removeFromScene: function () {
        this.isHittable = false;

        galaxies.engine.rootObject.remove(this.object);
    },

    reset: function () {
        this.model.position.set(galaxies.engine.VISIBLE_RADIUS * 1.8, 0, 0);

        this.rootPosition = galaxies.utils.rootPosition(this.model);

        this.timeToNextRangeChange = 5;
        this.timeToNextShot = 3;
        this.angularVelocity = 0;
    },

    update: function (delta) {
        var radiusChanged = false;

        this.timeToNextRangeChange -= delta;
        this.timeToNextShot -= delta;

        this.laserChargeGroup.tick(delta);

        if (this.model.position.x > galaxies.engine.VISIBLE_RADIUS) {
            radiusChanged = true;

            this.model.position.setX(this.model.position.x - delta);
        }

        if (this.timeToNextRangeChange <= 0) {
            if (this.timeToNextRangeChange <= -1) {
                this.timeToNextRangeChange += 6;
            } else {
                radiusChanged = true;

                this.model.position.setX(this.model.position.x - delta * 0.3);
            }
        }

        if (this.timeToNextShot <= 0) {
            if (this.timeToNextShot + delta > 0) {
                this.laserChargeEmitter.enable();
            }
            
            if (this.timeToNextShot <= -1) {
                this.timeToNextShot += 6;

                var laserBullet = galaxies.engine.getLaserBullet(),
                    position = this.rootPosition.clone(),
                    direction = position.clone().multiplyScalar(-1).normalize();

                position.add(direction.clone());

                laserBullet.addToScene(position, direction);
            }
        }

        if (radiusChanged) {
            var radius = this.model.position.x;

            this.angularVelocity = 12 / (Math.PI * radius * radius);
        }

        this.object.rotation.z += this.angularVelocity * delta;

        this.rootPosition = galaxies.utils.rootPosition(this.model);

        galaxies.utils.conify(this.model);
    }
};
