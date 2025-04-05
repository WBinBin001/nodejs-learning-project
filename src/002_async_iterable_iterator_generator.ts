/**
 * async_iterable_iterator_generator.ts
 *
 * 演示异步生成器函数 (async function*)，它返回的对象
 * 天然地符合 AsyncIterableIterator 接口。
 */

class AsyncIterableIteratorGeneratorDemo {
  // 定义延迟函数
  private static readonly delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

  // 使用 async function* 定义一个异步生成器
  static async *createMessageGenerator(prefix: string, count: number): AsyncIterableIterator<string, number, 'skip' | undefined> {
    console.log(`[生成器] 开始运行，前缀: "${prefix}", 数量: ${count}`);
    let messagesSent = 0;
    let shouldSkip = false;

    for (let i = 1; i <= count; i++) {
      // 1. yield 表达式会返回数据给迭代器的调用者，并暂停生成器执行
      // 2. 当迭代器的 next() 被再次调用时，生成器会在此处继续执行
      // 3. next(value) 中传入的值会成为 yield 表达式的返回值
      const command: 'skip' | undefined = yield `消息 ${i}: ${prefix} - ${new Date().getSeconds()}s`;
      // 注意：第一次调用 next() 时传入的值会被忽略，因为还没有执行到任何 yield 语句

      console.log(`  [生成器内部] 第 ${i} 次 yield 后，收到命令: ${command}`);
      messagesSent++; // 每次成功 yield 后计数

      if (command === 'skip') {
        console.log("    [命令] 收到 'skip'，下次将跳过延迟");
        shouldSkip = true;
      } else {
        shouldSkip = false;
      }

      // 2. 执行异步操作
      if (!shouldSkip) {
          const waitTime = Math.random() * 500 + 100; // 随机延迟
          console.log(`    模拟发送消息后的等待 (${waitTime.toFixed(0)}ms)...`);
          await this.delay(waitTime);
      } else {
          console.log("    跳过本次延迟。");
      }

      // 模拟可能提前结束
      // if (i === 2) {
      //   throw new Error("模拟生成器内部错误");
      // }
    }

    console.log("[生成器] 循环结束。");
    // 3. 使用 return 语句指定最终的 TReturn 值
    return messagesSent;
  }

  // 使用 for await...of 消费生成器
  static async consumeWithForAwait() {
    console.log("\n--- 示例1: 使用 for await...of 消费生成器 ---");
    // 调用生成器函数，得到一个 AsyncIterableIterator 对象
    const messageProducer = this.createMessageGenerator("重要通知", 3);

    try {
      let i = 0;
      // 可以直接用于 for await...of
      for await (const message of messageProducer) {
        // message 是 YieldType (string)
        console.log("收到消息:", message);
        i++;
        // 注意：无法在 for await...of 内部直接向生成器发送 TNext 值
        // 也无法直接获取 TReturn 值
        if (i === 1) {
            // 无法在这里发送 'skip' 命令给下一次迭代
        }
      }
      console.log("--- for await...of 消费完成 (无法获取 TReturn) ---");
    } catch (error) {
      console.error("for await...of 消费时出错:", error);
    }
  }

  // 手动迭代生成器以使用 TNext 和获取 TReturn
  static async consumeManually() {
    console.log("\n--- 示例2: 手动迭代生成器以使用 TNext 和 TReturn ---");
    // 再次调用生成器函数，获取新的迭代器实例
    const messageProducer = this.createMessageGenerator("次要更新", 4);

    // messageProducer 同时是 AsyncIterator 和 AsyncIterable
    // 验证： messageProducer[Symbol.asyncIterator]() === messageProducer  (通常为 true)
    console.log("生成器对象是否等于其自身的迭代器?", messageProducer[Symbol.asyncIterator]() === messageProducer);

    let result: IteratorResult<string, number> | undefined;
    try {
      // 第一次调用 next()，不传入参数，启动生成器执行到第一个 yield
      result = await messageProducer.next();

      while (!result.done) {
        // result.value 是 YieldType (string)
        console.log("手动收到:", result.value);

        let commandToSend: 'skip' | undefined = undefined;
        if (result.value.includes("消息 2")) {
          console.log(">>> 下次迭代将发送 'skip' 命令");
          commandToSend = 'skip';
        }

        // 调用 next() 并传入 TNext 类型的值
        // 这个值会成为上一个 yield 表达式的结果
        result = await messageProducer.next(commandToSend);
      }

      // 当 result.done 为 true 时
      // result.value 是 ReturnType (number)
      console.log("--- 手动迭代完成 ---");
      console.log("最终结果 (TReturn):", result.value); // 输出处理的消息数量

    } catch (error) {
      console.error("手动迭代时出错:", error);
      // 可以选择调用 messageProducer.throw() 或 return()
      // await messageProducer.throw(new Error("外部抛入错误"));
    } finally {
      // 生成器在完成或出错时通常会自动关闭，但手动调用 return 以防万一
      if (messageProducer.return && !(result && result.done)) {
        console.log(">>> 在 finally 中调用 return() 清理");
        await messageProducer.return(); // 值是可选的
      }
    }
  }

  // 运行示例
  static async test() {
    await this.consumeWithForAwait();
    await this.consumeManually();
  }
}

// 检查是否是直接运行此文件 (ESM方式)
import { fileURLToPath } from 'url';

// 立即执行函数
(async () => {
  // 比较当前文件路径和执行文件路径
  if (process.argv[1] === fileURLToPath(import.meta.url)) {
    // 运行应用
    AsyncIterableIteratorGeneratorDemo.test().catch((error) => {
      console.error('[Main] Error running demo:', error);
    });
  }
})();