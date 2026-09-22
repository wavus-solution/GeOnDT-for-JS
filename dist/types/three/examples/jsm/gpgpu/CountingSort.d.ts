import { Node, Renderer, StorageBufferAttribute, StorageBufferNode } from "../../../build/three.webgpu.js";

export interface CountingSortOptions {
    binCount?: number | undefined;
    workgroupSize?: number | undefined;
}

export class CountingSort {
    constructor(count: number, options?: CountingSortOptions);

    count: number;
    binCount: number;
    workgroupSize: number;

    orderAttribute: StorageBufferAttribute;

    orderRead: StorageBufferNode<"uint">;
    orderWrite: StorageBufferNode<"uint">;
    binRead: StorageBufferNode<"uint">;
    binWrite: StorageBufferNode<"uint">;
    histogramAtomic: StorageBufferNode<"uint">;
    offsetAtomic: StorageBufferNode<"uint">;

    setBinNode(binNode: () => Node): void;

    compute(renderer: Renderer): void;

    computeCPU(binFn: (index: number) => number): void;

    enableWebGLBuffers(): void;
}
