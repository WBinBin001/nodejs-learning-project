/**
 * promise_practice_ts.ts
 *
 * 这个文件通过 TypeScript 练习 JavaScript Promise 的核心概念。
 * 包括: 创建 Promise, .then() 链式调用, .catch() 错误处理,
 * .finally(), async/await 语法糖, 以及 Promise 静态方法。
 */

export class PromisePractice {
  // 辅助函数：模拟异步操作
  static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 辅助函数：创建一个可能成功或失败的 Promise
  static createAsyncTask(
    taskName: string,
    duration: number,
    shouldSucceed: boolean,
  ): Promise<string> {
    console.log(`[任务 ${taskName}] 开始执行 (预计 ${duration}ms)...`);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldSucceed) {
          const result = `[任务 ${taskName}] 成功完成!`;
          console.log(result);
          resolve(result); // 成功时调用 resolve
        } else {
          const errorMsg = `[任务 ${taskName}] 执行失败!`;
          console.error(errorMsg);
          reject(new Error(errorMsg)); // 失败时调用 reject
        }
      }, duration);
    });
  }

  // --- 1. 创建和基本使用 (.then, .catch) ---
  static async practiceBasicPromise() {
    console.log('\n--- 1. Promise 基本使用 ---');

    // 示例 1: 成功的 Promise
    const successTask = this.createAsyncTask('读取文件', 500, true);
    successTask
      .then((result: string) => {
        // then 的第一个参数是 onFulfilled 回调
        console.log(`  ➡️ then (成功): ${result.toUpperCase()}`);
        return result.length; // 可以返回一个新值给下一个 then
      })
      .then((length: number) => {
        console.log(`  ➡️ 链式 then: 上一步结果的长度是 ${length}`);
      })
      .catch((error: Error) => {
        // 如果前面的 Promise 链中有任何 reject，会执行 catch
        console.error(`  ❌ catch (成功任务不应执行): ${error.message}`);
      });

    await this.delay(600); // 等待上一个任务完成

    // 示例 2: 失败的 Promise
    const failureTask = this.createAsyncTask('写入数据库', 400, false);
    failureTask
      .then((result: string) => {
        // 这个 then 不会执行
        console.log(`  ➡️ then (失败任务不应执行): ${result}`);
      })
      .catch((error: Error) => {
        // catch 捕获 reject 的原因
        console.error(`  ❌ catch (失败): ${error.message}`);
        // catch 也可以返回一个值，让 Promise 链从失败状态恢复为成功状态
        return '已从错误中恢复' as string | undefined;
      })
      .then((recoveryMessage: string | void | undefined) => {
        if (recoveryMessage) {
          console.log(`  ➡️ 链式 then (在 catch 之后): ${recoveryMessage}`);
        } else {
          console.log(`  ➡️ 链式 then (在 catch 之后): 没有恢复消息`);
        }
      });

    await this.delay(500); // 等待上一个任务完成
  }

  // --- 2. .finally() ---
  static async practiceFinally() {
    console.log('\n--- 2. .finally() ---');
    // finally 无论 Promise 是成功还是失败，都会执行，常用于清理工作

    const task1 = this.createAsyncTask('资源操作 (成功)', 300, true);
    task1
      .then((result) => console.log(`  ➡️ then: ${result}`))
      .catch((error) => console.error(`  ❌ catch: ${error.message}`))
      .finally(() => {
        // finally 回调不接收参数
        console.log('  🧹 finally (成功任务): 清理资源...');
      });

    await this.delay(400);

    const task2 = this.createAsyncTask('资源操作 (失败)', 200, false);
    task2
      .then((result) => console.log(`  ➡️ then: ${result}`))
      .catch((error) => console.error(`  ❌ catch: ${error.message}`))
      .finally(() => {
        console.log('  🧹 finally (失败任务): 清理资源...');
        // 注意: finally 不会改变 Promise 的最终状态 (成功或失败)
      });

    await this.delay(300);
  }

  // --- 3. async/await 语法糖 ---
  // async 函数隐式返回一个 Promise
  // await 关键字等待一个 Promise 完成，并返回其结果 (如果是 reject，则抛出错误)
  static async practiceAsyncAwait() {
    console.log('\n--- 3. async/await ---');

    async function processTasks(): Promise<string> {
      // async 函数返回 Promise
      console.log('  async 函数开始');
      try {
        console.log('  等待 taskA...');
        const resultA = await PromisePractice.createAsyncTask('TaskA', 600, true); // 等待 Promise 解决
        console.log(`  TaskA 完成，结果: "${resultA}"`);

        console.log('  等待 taskB (将失败)...');
        const resultB = await PromisePractice.createAsyncTask('TaskB', 300, false); // 等待 Promise 拒绝
        // 下面这行不会执行，因为 await 会抛出 TaskB 的错误
        console.log(`  TaskB 完成，结果: "${resultB}" (不应看到)`);

        return '所有任务似乎都成功了？(不应看到)'; // 如果没有错误，async 函数返回的值会 resolve Promise
      } catch (error: any) {
        // 使用 try...catch 捕获 await 抛出的错误
        console.error(`  ❌ async 函数捕获到错误: ${error.message}`);
        // 可以选择在这里处理错误或重新抛出
        // return "处理错误后的默认值"; // 返回值会 resolve async 函数的 Promise
        throw new Error(`在 async 函数中处理后重新抛出: ${error.message}`); // 重新抛出会 reject async 函数的 Promise
      } finally {
        console.log('  🧹 async 函数的 finally 块');
      }
    }

    // 调用 async 函数并处理其返回的 Promise
    processTasks()
      .then((finalResult) => console.log(`  ✅ processTasks 最终结果 (成功): ${finalResult}`))
      .catch((finalError) =>
        console.error(`  ❌ processTasks 最终结果 (失败): ${finalError.message}`),
      );

    await PromisePractice.delay(1200); // 等待 processTasks 完成
  }

  // --- 4. Promise 静态方法 ---
  static async practiceStaticMethods() {
    console.log('\n--- 4. Promise 静态方法 ---');

    const promise1 = this.createAsyncTask('静态 P1', 700, true);
    const promise2 = this.createAsyncTask('静态 P2', 300, true);
    const promise3 = this.createAsyncTask('静态 P3 (失败)', 500, false).catch(() => {
      /* 添加空的 catch 来防止未处理的拒绝错误 */
    });
    const promise4 = this.delay(400).then(() => '[静态 P4] (来自 delay)'); // 另一个成功的 Promise

    // --- 4.1 Promise.all() ---
    // 等待所有 Promise 都成功。如果有一个失败，则立即失败。
    console.log('\n  --- 4.1 Promise.all() ---');
    try {
      console.log('  等待 Promise.all([P1, P2, P4])...'); // 全成功
      const resultsAllSuccess = await Promise.all([promise1, promise2, promise4]);
      console.log('  ✅ Promise.all (全成功) 结果:', resultsAllSuccess); // 按传入顺序返回结果数组
    } catch (error: any) {
      console.error('  ❌ Promise.all (全成功) 出错 (不应执行):', error.message);
    }

    await this.delay(100); // 小间隔

    try {
      console.log('  等待 Promise.all([promise1, promise2, promise3])...'); // 包含失败
      const resultsAllFailure = await Promise.all([
        this.createAsyncTask('重试 P1', 100, true),
        this.createAsyncTask('重试 P2', 50, true),
        this.createAsyncTask('重试 P3 (失败)', 200, false), // 这个会失败
      ]);
      console.log('  ✅ Promise.all (含失败) 结果 (不应执行):', resultsAllFailure);
    } catch (error: any) {
      console.error('  ❌ Promise.all (含失败) 出错:', error.message); // 输出第一个失败的 Promise 的原因
    }

    await this.delay(300);

    // --- 4.2 Promise.race() ---
    // 返回第一个解决(resolve)或拒绝(reject)的 Promise 的结果/原因。
    console.log('\n  --- 4.2 Promise.race() ---');
    try {
      console.log('  等待 Promise.race([P1(700ms), P2(300ms)])...'); // P2 更快
      const resultRaceSuccess = await Promise.race([
        this.createAsyncTask('赛跑 P1 (慢)', 700, true),
        this.createAsyncTask('赛跑 P2 (快)', 300, true),
      ]);
      console.log('  ✅ Promise.race (快者胜) 结果:', resultRaceSuccess); // 输出 P2 的结果
    } catch (error: any) {
      console.error('  ❌ Promise.race (快者胜) 出错 (不应执行):', error.message);
    }

    await this.delay(400);

    try {
      console.log('  等待 Promise.race([P3(500ms 失败), P4(400ms 成功)])...'); // P4 更快成功
      const resultRaceSuccessFirst = await Promise.race([
        this.createAsyncTask('赛跑 P3 (慢失败)', 500, false),
        this.delay(400).then(() => '[赛跑 P4] (快成功)'),
      ]);
      console.log('  ✅ Promise.race (快者成功胜) 结果:', resultRaceSuccessFirst);
    } catch (error: any) {
      console.error('  ❌ Promise.race (快者成功胜) 出错 (不应执行):', error.message);
    }

    await this.delay(600);
    try {
      console.log('  等待 Promise.race([P1(700ms 成功), P3(500ms 失败)])...'); // P3 更快失败

      const resultRaceFailureFirst = await Promise.race([
        this.createAsyncTask('赛跑 P3 (快失败)', 500, false),
        this.createAsyncTask('赛跑 P1 (慢成功)', 700, true),
      ]);
      console.log('  ✅ Promise.race (快者失败胜) 结果 (不应执行):', resultRaceFailureFirst);
    } catch (error: any) {
      console.error('  ❌ Promise.race (快者失败胜) 出错:', error.message); // 输出 P3 的错误
    }

    await this.delay(800);

    // --- 4.3 Promise.allSettled() ---
    // 等待所有 Promise 都安定下来（无论成功或失败），返回每个 Promise 的状态和结果/原因。
    console.log('\n  --- 4.3 Promise.allSettled() ---');
    const allSettledPromises = [
      this.createAsyncTask('安定 P1', 150, true),
      this.createAsyncTask('安定 P2 (失败)', 300, false),
      this.delay(100).then(() => '[安定 P3]'),
    ];
    const settledResults = await Promise.allSettled(allSettledPromises);
    console.log('  ✅ Promise.allSettled 结果:');
    settledResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`    索引 ${index}: 成功 ✅, 值: ${result.value}`);
      } else {
        // status === 'rejected'
        console.error(`    索引 ${index}: 失败 ❌, 原因: ${result.reason.message}`);
      }
    });

    await this.delay(400);

    // --- 4.4 Promise.any() ---
    // 等待第一个成功的 Promise。如果所有都失败，则抛出一个 AggregateError。
    console.log('\n  --- 4.4 Promise.any() ---');
    try {
      console.log('  等待 Promise.any([P3(失败), P2(成功), P1(成功)])...'); // P2 应首先成功
      const anySuccessResult = await Promise.any([
        this.createAsyncTask('任一 P3 (失败)', 500, false),
        this.createAsyncTask('任一 P2 (快成功)', 200, true),
        this.createAsyncTask('任一 P1 (慢成功)', 700, true),
      ]);
      console.log('  ✅ Promise.any (有成功) 结果:', anySuccessResult); // 输出第一个成功 (P2) 的结果
    } catch (error: any) {
      console.error('  ❌ Promise.any (有成功) 出错 (不应执行):', error);
    }

    await this.delay(800);

    try {
      console.log('  等待 Promise.any([P3(失败), 另一失败])...'); // 全部失败
      const anyFailureResult = await Promise.any([
        this.createAsyncTask('任一 P3 (失败)', 100, false),
        this.createAsyncTask('任一 P5 (失败)', 200, false),
      ]);
      console.log('  ✅ Promise.any (全失败) 结果 (不应执行):', anyFailureResult);
    } catch (error: any) {
      // 当所有 Promise 都失败时，Promise.any 抛出 AggregateError
      console.error('  ❌ Promise.any (全失败) 出错:', error.constructor.name, error.message);
      if (error instanceof AggregateError) {
        console.error(
          '    包含的错误:',
          error.errors.map((e: Error) => e.message),
        );
      }
    }
    await this.delay(300);
  }

  // --- 主执行函数 ---
  static async test() {
    console.log('--- Promise 练习开始 ---');

    await this.practiceBasicPromise();
    await this.practiceFinally();
    await this.practiceAsyncAwait();
    await this.practiceStaticMethods();
    console.log('\n--- Promise 练习结束 ---');
  }
}

export function promise_practice(): void {
  PromisePractice.test();
}

// 检查是否是直接运行此文件 (ESM方式)
import { fileURLToPath } from 'url';

// 立即执行函数
(async () => {
  // 比较当前文件路径和执行文件路径
  if (process.argv[1] === fileURLToPath(import.meta.url)) {
    promise_practice();
  }
})();