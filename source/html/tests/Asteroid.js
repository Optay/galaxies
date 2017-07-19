"use strict";
/// <reference path="./Resources.ts"/>
var galaxies;
(function (galaxies) {
    var Asteroid = (function () {
        function Asteroid() {
            this.type = "asteroid";
            this.hitThreshold = 0.6;
            this.cameraShakeOnDestroy = 0.2;
            this.tumbling = true;
            this.remainOriented = true;
            this.tumbleAxis = new THREE.Vector3();
            this.updateTumbleAxisOnHit = true;
            this.baseTumbleSpeed = 1.5;
            this.spiral = 0;
            this.baseSpeed = 0.2;
            this.mass = 1;
            this.baseLife = 1;
            this.state = "inactive";
            this.isActive = false;
            this.rubbleType = "plain";
        }
        Asteroid.prototype.Asteroid = function () {
            this.object = new THREE.Mesh(galaxies.Resources.geometries['asteroid'], galaxies.Resources.materials['asteroid'].clone());
            this.object.scale.set(0.375, 0.375, 0.375);
            this.object.up.set(0, 0, 1);
            this.maxVelocityRadial = this.baseSpeed * (1 - this.spiral);
            Reset();
        };
        Asteroid.prototype.reset = function () {
            this.age = 0;
            this.angle = Math.random() * Math.PI * 2;
            this.radius = ; // TODO: OBSTACLE_START_DISTANCE
            this.previousRadius = this.radius;
            this.updatePosition();
            this.object.lookAt(new THREE.Vector3());
            this.life = this.baseLife;
            this.state = 'falling';
            this.isActive = false;
            this.velocityRadial = 0;
            this.velocityTangential = this.baseSpeed * this.spiral;
            this.tumbleAxis.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
            this.tumbleSpeed = this.baseTumbleSpeed;
            // TODO: Add to scene, and collision system.
        };
        Asteroid.prototype.update = function (delta) {
            // TODO
        };
        Asteroid.prototype.retreat = function () {
            this.isActive = false;
            this.state = 'retreating';
            this.velocityRadial = 3 * this.baseSpeed;
            this.tumbling = true;
        };
        Asteroid.prototype.hit = function (hitPosition, damage, multiply, forceDestroy) {
            // TODO
        };
        Asteroid.prototype.impact = function () {
            this.splode(false);
        };
        Asteroid.prototype.splode = function (spawn) {
            if (spawn === void 0) { spawn = true; }
            this.deactivate();
            // TODO: rubble effect
        };
        Asteroid.prototype.deactivate = function () {
            this.state = 'inactive';
            this.remove();
        };
        Asteroid.prototype.remove = function () {
            // TODO: remove from scene and physics
        };
        Asteroid.prototype.destruct = function () {
            this.remove();
        };
        return Asteroid;
    }());
    galaxies.Asteroid = Asteroid;
})(galaxies || (galaxies = {}));
