/// <reference path="Pool.ts"/>

"use strict";

namespace galaxies {
    export class PoolItem {
        protected owningPool: Pool<PoolItem>;
        private bIsActive: boolean;

        constructor(pool: Pool<PoolItem>) {
            this.owningPool = pool;
        }

        public Activate(): void {
            this.bIsActive = true;
        }

        public Deactivate(): void {
            this.bIsActive = false;
            this.owningPool.ReturnOne(this);
        }

        public IsActive(): boolean {
            return this.bIsActive;
        }
    }
}
