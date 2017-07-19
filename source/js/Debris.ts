/// <reference path="Rubble.ts" />

namespace galaxies {
    export class Debris extends Rubble {
        constructor(pool: Pool<Debris>) {
            super(pool, 0.2);

            this.object = new THREE.Mesh(galaxies.resources.geometries["debris"],
                galaxies.resources.materials["debris"].clone());
        }
    }
}