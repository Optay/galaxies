"use strict";
/// <reference path="./Resources.ts"/>

namespace galaxies {
    export class Asteroid {
        age: number;
        angle: number;
        radius: number;
        previousRadius: number;
        life: number;
        state: string;
        isActive: boolean;
        velocityRadial: number;
        maxVelocityRadial: number;
        velocityTangential: number;
        tumbleSpeed: number;
        type: string = "asteroid";
        hitThreshold: number = 0.6;
        cameraShakeOnDestroy: number = 0.2;
        tumbling: boolean = true;
        remainOriented: boolean = true;
        tumbleAxis: THREE.Vector3 = new THREE.Vector3();
        updateTumbleAxisOnHit: boolean = true;
        baseTumbleSpeed: number = 1.5;
        spiral: number = 0;
        baseSpeed: number = 0.2;
        mass: number = 1;
        baseLife: number = 1;
        state: string = "inactive";
        isActive: boolean = false;
        rubbleType: string = "plain";
        object: THREE.Mesh;

        Asteroid() {
            this.object = new THREE.Mesh(galaxies.Resources.geometries['asteroid'], galaxies.Resources.materials['asteroid'].clone());
            this.object.scale.set(0.375, 0.375, 0.375);
            this.object.up.set(0, 0, 1);

            this.maxVelocityRadial = this.baseSpeed * (1 - this.spiral);

            Reset();
        }

        reset(): void {
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
        }

        update(delta: number): void {
            // TODO
        }

        retreat():void {
            this.isActive = false;
            this.state = 'retreating';

            this.velocityRadial = 3 * this.baseSpeed;

            this.tumbling = true;
        }

        hit(hitPosition: THREE.Vector3, damage, multiply: number, forceDestroy: boolean):void {
            // TODO
        }

        impact():void {
            this.splode(false);
        }

        splode(spawn: boolean = true):void {
            this.deactivate();

            // TODO: rubble effect
        }

        deactivate():void {
            this.state = 'inactive';
            this.remove();
        }

        remove():void {
            // TODO: remove from scene and physics
        }

        destruct():void {
            this.remove();
        }
    }
}
