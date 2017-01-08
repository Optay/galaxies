/// <reference path="PoolItem.ts"/>

"use strict";

namespace galaxies {
    export abstract class Rubble extends PoolItem {
        public get position(): THREE.Vector3 {
            return this.object.position;
        }

        public startScale: number;
        public velocity: THREE.Vector3;

        protected object: THREE.Mesh;

        private age: number;
        private sourceScale: number;
        private maxAge: number;
        private rotationAxis: THREE.Vector3;
        private rotationSpeed: number;

        constructor(pool: Pool<Rubble>, scale: number) {
            super(pool);

            this.sourceScale = scale;
            this.velocity = new THREE.Vector3();
            this.rotationAxis = new THREE.Vector3();
        }

        public Activate(maxAge: number = 1): void {
            super.Activate();

            this.startScale = THREE.Math.randFloat(this.sourceScale / 2, this.sourceScale * 1.5);
            this.maxAge = maxAge;
            this.age = 0;

            this.object.scale.set(this.startScale, this.startScale, this.startScale);
            this.object.rotation.set(THREE.Math.randFloatSpread(Math.PI * 2), THREE.Math.randFloatSpread(Math.PI * 2), THREE.Math.randFloatSpread(Math.PI * 2));

            this.velocity.set(0, 0, 0);

            this.rotationAxis.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
            this.rotationAxis.normalize();

            this.rotationSpeed = THREE.Math.randFloat(-5, 5);

            galaxies.engine.rootObject.add(this.object);
        }

        public Deactivate() {
            super.Deactivate();

            galaxies.engine.rootObject.remove(this.object);
        }

        public Update(delta: number): void {
            if (!this.IsActive()) {
                return;
            }

            this.age += delta;

            let ageProgress = this.age / this.maxAge;

            this.object.rotateOnAxis(this.rotationAxis, this.rotationSpeed * delta);
            this.object.position.addScaledVector(this.velocity, delta);
            this.object.scale.setScalar(THREE.Math.lerp(this.startScale, 0, ageProgress));

            if (ageProgress >= 1) {
                this.Deactivate();
            }
        }
    }
}
