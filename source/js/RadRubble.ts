/// <reference path="Rubble.ts" />

namespace galaxies {
    export class RadRubble extends Rubble {
        constructor(pool: Pool<RadRubble>) {
            super(pool, 0.1);

            this.object = new THREE.Mesh(galaxies.resources.geometries["asteroid"],
                new THREE.MeshLambertMaterial({
                    color: 0x60A173
                }));
        }
    }
}