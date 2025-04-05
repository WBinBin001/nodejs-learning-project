import { setTimeout } from 'timers/promises'; // 适用于 Node.js v16+

// 1. 定义你的 API 数据块类型
type ApiStreamChunk = { id: number; data: string };

// 2. 明确定义一个简单的 IteratorResult 类型供内部使用 (重要!)
type SimpleIteratorResult<T> = { value: T | undefined; done: boolean };

// 3. 实现 AsyncIterable 接口的类
class ManualApiStream implements AsyncIterable<ApiStreamChunk> {
    // 内部状态使用简单的 SimpleIteratorResult 类型
    private queue: SimpleIteratorResult<ApiStreamChunk>[] = [];
    private waitingResolver: ((value: SimpleIteratorResult<ApiStreamChunk>) => void) | null = null;
    private isFetching = false;
    private isFinished = false;

    constructor() {
        this.startFetching();
    }

    private async startFetching() {
        if (this.isFetching) return;
        this.isFetching = true;
        let counter = 0;
        try {
            while (counter < 5 && !this.isFinished) {
                await setTimeout(500);
                const chunkData: ApiStreamChunk = { id: counter, data: `Chunk ${counter}` };
                // 创建的对象符合 SimpleIteratorResult， done: false
                this._push({ value: chunkData, done: false });
                counter++;
            }
            // 创建的对象符合 SimpleIteratorResult， done: true
            this._push({ value: undefined, done: true });
            this.isFinished = true;
        } catch (error) {
            console.error("Error during fetching:", error);
            this._push({ value: undefined, done: true });
            this.isFinished = true;
        } finally {
            this.isFetching = false;
        }
    }

    // _push 方法参数类型使用简单的 SimpleIteratorResult
    private _push(result: SimpleIteratorResult<ApiStreamChunk>) {
        if (this.waitingResolver) {
            console.log(`[Stream Class] Resolving waiting promise with: ${result.done ? 'done' : 'chunk ' + result.value?.id}`);
            const resolve = this.waitingResolver;
            this.waitingResolver = null;
            // resolve 期望 SimpleIteratorResult, result 类型匹配
            resolve(result);
        } else {
            console.log(`[Stream Class] Queuing: ${result.done ? 'done signal' : 'chunk ' + result.value?.id}`);
            this.queue.push(result);
        }
    }

    // ***** 关键修改点 1: next 方法的 *声明* 使用精确的联合类型 *****
    public async next(): Promise<
        IteratorYieldResult<ApiStreamChunk> |
        IteratorReturnResult<undefined>
    > {
        if (this.queue.length > 0) {
            const result = this.queue.shift()!; // result 的类型是 SimpleIteratorResult
            console.log(`[Stream Class] Dequeuing: ${result.done ? 'done signal' : 'chunk ' + result.value?.id}`);
            // ***** 关键修改点 2: 使用类型断言 *****
            // 告诉 TS，这个内部的 result 可以作为精确联合类型返回
            return Promise.resolve(result as IteratorYieldResult<ApiStreamChunk> | IteratorReturnResult<undefined>);
        }

        if (this.isFinished) {
            console.log("[Stream Class] Returning final done signal.");
            // 这个对象字面量结构本身就符合 IteratorReturnResult<undefined>
            // 断言可以省略，但加上也无妨，更明确
            return Promise.resolve({ value: undefined, done: true } as IteratorReturnResult<undefined>);
        }

        console.log("[Stream Class] Queue empty, waiting for next chunk...");
        // ***** 关键修改点 3: Promise 的泛型 T 仍然使用简单的 SimpleIteratorResult *****
        // 这使得 resolve 函数的类型与 waitingResolver 的类型能够匹配
        return new Promise<SimpleIteratorResult<ApiStreamChunk>>((resolve) => {
            this.waitingResolver = resolve;
        // ***** 关键修改点 4: Promise 返回值需要断言 *****
        // 这个 Promise 最终会 resolve 一个 SimpleIteratorResult,
        // 但 next() 声明要返回精确联合类型，所以需要断言
        }) as Promise<IteratorYieldResult<ApiStreamChunk> | IteratorReturnResult<undefined>>;
    }

    // 这个方法应该能通过类型检查了，因为 next() 的 *声明* 满足要求
    [Symbol.asyncIterator](): AsyncIterator<ApiStreamChunk> {
        return this;
    }

    public cancelStream() {
        console.log("[Stream Class] Cancelling stream fetch.");
        this.isFinished = true;
        if (this.waitingResolver) {
            // resolve 函数期望 SimpleIteratorResult，这个对象符合
            this.waitingResolver({ value: undefined, done: true });
            this.waitingResolver = null;
        }
        // this.queue = [];
    }
}

// --- 如何使用这个类 ---
async function consumeManualStream() {
    const manualStream = new ManualApiStream();

    console.log("[Consumer] Starting to consume manual stream...");
    try {
        for await (const chunk of manualStream) {
            console.log(`[Consumer] Received:`, chunk);
        }
        console.log("[Consumer] Finished consuming manual stream.");
    } catch (error) {
        console.error("[Consumer] Error consuming manual stream:", error);
    }
}

consumeManualStream();