"use strict";

this.galaxies = this.galaxies || {};

galaxies.Boss = function () {
    this.initModel();
    this.initAudio();
    this.reset();
};

galaxies.Boss.prototype = {
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

        this.updateCoordinates();
    },

    update: function (delta) {
        if (this.state === "inactive") {
            return;
        }

            if (this.state === "entering") {
            this.updateEntering(delta);
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
