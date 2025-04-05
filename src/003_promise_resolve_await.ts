class PromiseResolveAwait {

    static async test() {
        await this.promise_resolve_await();
    }
     static async promise_resolve_await() {
        const p1 = Promise.resolve(123); // p1 类型是 Promise<number>
        const p2 = Promise.resolve(Promise.resolve("abc")); // p2 类型是 Promise<string> (而不是 Promise<Promise<string>>)
        const p3 = Promise.resolve({ then(resolve: (value: boolean) => void) { resolve(true); } }); // p3 类型是 Promise<boolean>
        
        const v1 = await p1; // v1 类型是 number
        console.log(v1);
        const v2 = await p2; // v2 类型是 string
        console.log(v2);
        const v3 = await p3; // v3 类型是 boolean
        console.log(v3);
    }
}


export function promise_resolve_await(): void {
    PromiseResolveAwait.test();
  }

// 检查是否是直接运行此文件 (ESM方式)
import { fileURLToPath } from 'url';

// 立即执行函数
(async () => {
  // 比较当前文件路径和执行文件路径
  if (process.argv[1] === fileURLToPath(import.meta.url)) {
    promise_resolve_await();
  }
})();
