"use strict";

namespace galaxies {
    export class Pool<T> {
        get available(): number {
            return this.items.filter(function(item) {
                return !!item;
            }).length;
        }

        get length(): number {
            return this.items.length;
        }

        private items: T[] = [];
        private createCache: { [key: string]: any };
        private createNew: (owningPool: Pool<T>, createCache?: { [key: string]: any }) => T;

        constructor(createFunction: (owningPool: Pool<T>, createCache?: { [key: string]: any }) => T,
            initialSize: number = 0,
            createCache?: { [key: string]: any }) {
            this.createCache = createCache;
            this.createNew = createFunction;

            this.CreateMany(initialSize);
        }

        CreateMany(count: number): void {
            for (let i = 0; i < count; ++i) {
                this.CreateOne();
            }
        }

        CreateOne(): void {
            this.items.push(this.createNew(this, this.createCache));
        }

        GetMany(count: number): T[] {
            const items = this.items;
            const requested: any[] = [];
            let next = 0;

            for (let i = 0; i < count; ++i) {
                next = this.NextAvailable(next);

                if (next === -1) {
                    requested.push(this.createNew(this, this.createCache));
                } else {
                    requested.push(items[next]);

                    delete items[next];
                }
            }

            return requested;
        }

        GetOne(): T {
            const next = this.NextAvailable();

            if (next === -1) {
                return this.createNew(this, this.createCache);
            } else {
                const item = this.items[next];

                delete this.items[next];

                return item;
            }
        }

        ReturnMany(items: T[]): void {
            let next = 0;
            const numItems = items.length;

            for (let i = 0; i < numItems; ++i) {
                next = this.NextEmpty(next);

                if (next === -1) {
                    this.items.push(items[i]);
                } else {
                    this.items[next] = items[i];
                }

                delete items[i];
            }
        }

        ReturnOne(item: T): void {
            const next = this.NextEmpty();

            if (next === -1) {
                this.items.push(item);
            } else {
                this.items[next] = item;
            }
        }

        private NextAvailable(startAt: number = 0): number {
            if (startAt === -1) {
                return -1;
            }

            const items = this.items;
            const numItems = this.length;

            for (let i = startAt; i < numItems; ++i) {
                if (items[i] !== void 0) {
                    return i;
                }
            }

            return -1;
        }

        private NextEmpty(startAt: number = 0): number {
            if (startAt === -1) {
                return -1;
            }

            const items = this.items;
            const numItems = this.length;

            for (let i = startAt; i < numItems; ++i) {
                if (items[i] === void 0) {
                    return i;
                }
            }

            return -1;
        }
    }
}