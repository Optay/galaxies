"use strict";

this.galaxies = this.galaxies || {};

galaxies.colliders = {};

galaxies.colliders.Collider = function (type) {
    this.type = type;
};

galaxies.colliders.SphereCollider = function (position, radius) {
    galaxies.colliders.Collider.call(this, "sphere");

    this.position = position;
    this.radius = radius;

    this.rootPosition = null;
    this.rootRadius = null;
};

galaxies.colliders.CapsuleCollider = function (position1, position2, radius) {
    galaxies.colliders.Collider.call(this, "capsule");

    this.position1 = position1;
    this.position2 = position2;
    this.radius = radius;

    this.rootPosition1 = null;
    this.rootPosition2 = null;
    this.rootRadius = null;
};
