"use strict";

this.galaxies = this.galaxies || {};

galaxies.Boss = function () {
    this.initModel();
    this.initAudio();
    this.reset();

    this.name = '';
};

galaxies.Boss.prototype = {
    defeat: function (defeatBonus) {
        defeatBonus = defeatBonus || 0;

        this.state = "exiting";

        if (this.age < 20) {
            defeatBonus += 40000;
        } else if (this.age < 30) {
            defeatBonus += 20000;
        } else if (this.age < 40) {
            defeatBonus += 5000;
        }

        galaxies.engine.showCombo(defeatBonus, 1, this.object);
    },

    disable: function () {
        this.state = "inactive";
        this.object.visible = false;
    },

    enter: function () {
        if (this.state === "preEntry") {
            this.state = "entering";
            this.object.visible = true;

            this.updateCoordinates();
        }
    },

    initAudio: function () {
        // No default functionality
    },

    initModel: function () {
        this.object = new THREE.Object3D();
    },

    reset: function () {
        this.state = "preEntry";
        this.object.visible = false;
        this.invincible = true;
        this.age = 0;

        this.updateCoordinates();
    },

    update: function (delta) {
        if (this.state === "inactive") {
            return;
        }

        if (this.state === "entering") {
            this.updateEntering(delta);
        } else if (this.state !== "preEntry") {
            this.age += delta;
        }

        if (this.state === "exiting") {
            this.updateExiting(delta);
        }
    },

    updateCoordinates: function () {
        // May change if the planet is to be put in another part of the screen
        var bottomRightCorner = new THREE.Vector3(1, -1, 0.5),
            topLeftCorner = new THREE.Vector3(-1, 1, 0.5),
            camPos = galaxies.engine.camera.position.clone();

        bottomRightCorner.unproject(galaxies.engine.camera);
        bottomRightCorner = galaxies.engine.rootObject.worldToLocal(bottomRightCorner);
        bottomRightCorner.sub(camPos).normalize();
        bottomRightCorner.multiplyScalar(-camPos.z / bottomRightCorner.z).add(camPos);

        topLeftCorner.unproject(galaxies.engine.camera);
        topLeftCorner = galaxies.engine.rootObject.worldToLocal(topLeftCorner);
        topLeftCorner.sub(camPos).normalize();
        topLeftCorner.multiplyScalar(-camPos.z / topLeftCorner.z).add(camPos);

        this.topEdge = topLeftCorner.y;
        this.leftEdge = topLeftCorner.x;
        this.bottomEdge = bottomRightCorner.y;
        this.rightEdge = bottomRightCorner.x;
    },

    updateEntering: function () {
        // No default functionality
    },

    updateExiting: function () {
        // No default functionality
    }
};
