/**
 * async_iterable_practice_zh.ts
 *
 * 这个文件演示了如何在 TypeScript 中手动实现 AsyncIterable 和 AsyncIterator 接口。
 * 我们创建了一个自定义的异步倒计时类。
 */

class AsyncIterablePractice {
  // 定义一个延迟函数，用于模拟异步操作
  private static readonly delay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // 我们的主类，实现了 AsyncIterable
  static AsyncCountdown = class
    implements
      AsyncIterable<string, { message: string; elapsedTime: number }, 'hurry' | 'pause' | undefined>
  {
    public startCount: number; // 起始计数
    public intervalMs: number; // 每次计数的间隔时间 (毫秒)

    constructor(startCount: number = 5, intervalMs: number = 500) {
      if (startCount <= 0) {
        throw new Error('起始计数必须为正数。');
      }
      this.startCount = startCount;
      this.intervalMs = intervalMs;
      console.log(`[倒计时器] 初始化: 起始=${startCount}, 间隔=${intervalMs}ms`);
    }

    // 这是 AsyncIterable 接口要求的核心方法。
    // 它必须返回一个符合 AsyncIterator 接口的对象。
    [Symbol.asyncIterator](): AsyncIterator<
      string,
      { message: string; elapsedTime: number },
      'hurry' | 'pause' | undefined
    > {
      let currentCount = this.startCount; // 当前计数 (迭代器内部状态)
      let isPaused = false; // 暂停状态 (演示用)
      const startTime = Date.now(); // 记录开始时间
      let interval = this.intervalMs; // 当前间隔，允许被 'hurry' 命令修改

      console.log(`[迭代器] 已创建。从 ${currentCount} 开始倒计时。`);

      // 我们返回一个对象字面量，它扮演 AsyncIterator 的角色
      return {
        // next() 方法是迭代器的核心。
        // 它可以选择性地接受一个来自消费者的值 (TNext)。
        // 它必须返回一个 Promise，该 Promise 解析为一个 IteratorResult 对象。
        async next(
          command?: 'hurry' | 'pause' | undefined,
        ): Promise<IteratorResult<string, { message: string; elapsedTime: number }>> {
          console.log(`[迭代器 next()] 被调用。当前计数: ${currentCount}, 收到命令: ${command}`);

          // 处理通过 next(command) 传入的命令
          if (command === 'hurry') {
            console.log("  [命令] 收到 'hurry'！正在缩短间隔。");
            interval = Math.max(50, interval / 2); // 加速，但别太快
          } else if (command === 'pause') {
            // 这里的 'pause' 仅作演示，简单打印日志。
            // 真正的暂停逻辑会更复杂，因为它需要与 for await...of 的行为协调。
            // 为简单起见，我们只打印日志，不实际暂停迭代流程。
            isPaused = !isPaused;
            console.log(`  [命令] 收到 'pause' 开关！当前暂停状态: ${isPaused}`);
            if (isPaused) console.log('     (注意: 此 pause 仅打印日志，迭代仍会继续)');
          }

          // 检查倒计时是否结束
          if (currentCount <= 0) {
            const endTime = Date.now();
            const result = {
              // 这是 TReturn 类型的值
              message: '倒计时完成!',
              elapsedTime: endTime - startTime,
            };
            console.log(`[迭代器 next()] 倒计时结束。返回 done: true。`);
            // 当 done 为 true 时，返回最终的结果值 (TReturn)
            return { value: result, done: true };
          }

          // 模拟异步工作 (等待指定间隔)
          console.log(`  等待 ${interval}ms...`);
          await AsyncIterablePractice.delay(interval);

          // 准备要产出的值 (T 类型)
          const value = `倒计时: ${currentCount}`; // 这是 T 类型的值
          currentCount--; // 计数减一

          console.log(`[迭代器 next()] 产出值: "${value}"。计数递减。`);
          // 产出当前值，并表明迭代尚未完成 (done: false)
          return { value: value, done: false };
        },

        // 可选: return() 方法。如果消费者提前停止迭代
        // (例如在 for await...of 中使用了 break 或 return)，则会调用此方法。
        async return(
          value?:
            | { message: string; elapsedTime: number }
            | PromiseLike<{ message: string; elapsedTime: number }>,
        ): Promise<IteratorResult<string, { message: string; elapsedTime: number }>> {
          console.log('[迭代器 return()] 迭代被提前停止。');
          // 在这里执行必要的清理工作 (例如清除计时器、关闭资源)
          currentCount = 0; // 强制停止计数
          const finalValue = (await value) ?? {
            message: '被中断',
            elapsedTime: Date.now() - startTime,
          };
          // 返回一个表示迭代结束的结果
          return { value: finalValue, done: true };
        },

        // 可选: throw() 方法。如果在迭代过程中发生错误，
        // 或者消费者向迭代器抛入错误，则会调用此方法。
        async throw(
          e?: any,
        ): Promise<IteratorResult<string, { message: string; elapsedTime: number }>> {
          console.error('[迭代器 throw()] 遇到错误:', e);
          // 执行清理工作
          currentCount = 0;
          // 通常，你要么处理错误并标记为完成，要么重新抛出错误。
          // 我们这里选择标记为完成，并带上错误信息。
          const result = {
            message: `倒计时出错: ${e}`,
            elapsedTime: Date.now() - startTime,
          };
          return { value: result, done: true }; // 也可以返回 { value: undefined, done: true }
        },
      };
    }
  };

  // --- 使用示例 ---

  static async runCountdownNormally() {
    console.log('\n--- 示例1: 使用 for await...of 正常运行倒计时 ---');
    const countdown = new this.AsyncCountdown(3, 700); // 从 3 开始, 700ms 间隔

    try {
      // for await...of 循环自动处理调用 .next()
      // 并解开 'value' 直到 'done' 为 true。
      // 重要: 这个循环本身 *不会* 让你直接访问到迭代完成时的 TReturn 值
      for await (const message of countdown) {
        // message 的类型是 string (泛型 T)
        console.log(`收到消息: ${message}`);

        // 提前退出的示例:
        // if (message.includes("2")) {
        //   console.log("提前中断循环!");
        //   break; // 这会触发迭代器的 return() 方法
        // }
      }
      console.log('for await...of 循环正常结束。');
      // 注意: 我们在这里无法自动获取到最终的结果。
    } catch (error) {
      console.error('for await...of 循环出错:', error);
    }
  }

  static async runCountdownWithReturn() {
    console.log('\n--- 示例2: 使用 return() 提前停止迭代并传递值 ---');
    const countdown = new this.AsyncCountdown(5, 1000); // 从 5 开始, 1 秒间隔

    // 获取迭代器实例
    const iterator = countdown[Symbol.asyncIterator]();

    let result: IteratorResult<string, { message: string; elapsedTime: number }> | undefined;
    const startTime = Date.now(); // 在这里定义 startTime

    try {
      // 手动调用 next()
      result = await iterator.next(); // 第一次调用，开始计时
      while (!result.done) {
        console.log(`手动收到: ${result.value}`);

        // 有条件地发送命令给下一次 next() 调用
        if (result.value.includes('3')) {
          console.log('>>> 发送 return() 命令，提前停止迭代并传递值!');
          // 调用 return() 方法，传递一个结果对象
          if (iterator.return) {
            const finalResult = await iterator.return({
              message: '用户提前中断',
              elapsedTime: Date.now() - startTime,
            });
            console.log('最终结果:', finalResult.value); // 这里将输出传递的值
          }
          break; // 退出循环
        }

        // 继续调用 next()
        result = await iterator.next();
      }
    } catch (error) {
      console.error('手动迭代出错:', error);
    } finally {
      // 确保在循环意外退出时关闭迭代器
      if (iterator.return && !(result && result.done)) {
        console.log('>>> 在 finally 块中调用 iterator.return() (可能因为提前退出)');
        await iterator.return(); // 发送一个中断信号
      }
    }
  }

  static async runCountdownManually() {
    console.log('\n--- 示例3: 手动迭代以观察 TNext 和 TReturn ---');
    const countdown = new this.AsyncCountdown(5, 1000); // 从 5 开始, 1 秒间隔

    // 1. 获取迭代器实例
    const iterator = countdown[Symbol.asyncIterator]();

    let result: IteratorResult<string, { message: string; elapsedTime: number }> | undefined; // 用来存储每次 next() 的结果

    try {
      // 2. 手动重复调用 next()
      result = await iterator.next(); // 第一次调用，开始计时
      while (!result.done) {
        // result.value 的类型是 string (泛型 T)
        console.log(`手动收到: ${result.value}`);

        // 3. 有条件地发送命令 (TNext) 给下一次 next() 调用
        let command: 'hurry' | 'pause' | undefined = undefined;
        if (result.value?.includes('4')) {
          console.log(">>> 下次将发送 'hurry' 命令!");
          command = 'hurry';
        } else if (result.value?.includes('2')) {
          console.log(">>> 下次将发送 'pause' 命令 (迭代器会打印日志)!");
          command = 'pause';
        }

        // 将命令传递给 next()
        result = await iterator.next(command);
      }

      // 4. 当 result.done 为 true 时, result.value 包含的就是最终的 TReturn 值
      console.log('手动迭代完成。');
      console.log('最终结果 (TReturn):', result.value);
      console.log(`最终消息: ${result.value.message}, 总耗时: ${result.value.elapsedTime}ms`);
    } catch (error) {
      console.error('手动迭代出错:', error);
      // 如果发生错误, 你可能想调用 iterator.throw() 或 iterator.return() 来处理或清理
      // await iterator.throw(error); // 示例
    } finally {
      // 好的实践: 确保在循环意外退出时关闭迭代器
      // (虽然 try/catch 处理了错误, finally 确保清理总是发生)
      // `for await...of` 在 break/return/throw 时会自动处理。
      // 检查 return 方法是否存在，并且迭代没有正常完成
      if (iterator.return && !(result && result.done)) {
        console.log('>>> 在 finally 块中调用 iterator.return() (可能因为提前退出)');
        await iterator.return(); // 发送一个中断信号
      }
    }
  }

  // --- 运行主函数 ---
  static async test() {
    await this.runCountdownNormally();
    await this.runCountdownWithReturn();
    await this.runCountdownManually();
  }
}

// 检查是否是直接运行此文件 (ESM方式)
import { fileURLToPath } from 'url';

// 立即执行函数
(async () => {
  // 比较当前文件路径和执行文件路径
  if (process.argv[1] === fileURLToPath(import.meta.url)) {
    // 运行应用
    AsyncIterablePractice.test().catch((error) => {
      console.error('[Main] Error running demo:', error);
    });
  }
})();
