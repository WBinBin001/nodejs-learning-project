/**
 * symbol_async_iterator_usage.ts
 *
 * 演示 Symbol.asyncIterator 这个特殊符号的用途。
 * 这个符号是作为对象异步迭代方法的标准键名。
 */

// 引入我们之前创建的倒计时结果类型 (或者定义一个简单的替代)
interface CountdownResult {
    message: string;
    elapsedTime: number;
  }
  
  console.log("Symbol.asyncIterator 是一个:", typeof Symbol.asyncIterator); // 输出: symbol
  console.log("它是一个唯一的符号:", Symbol.asyncIterator.toString()); // 输出: Symbol(Symbol.asyncIterator)
  
  // 创建一个简单的异步可迭代对象字面量
  // 注意这里我们直接使用了 Symbol.asyncIterator 作为方法名
  const simpleAsyncSequence = {
    start: 1,
    end: 3,
    delayMs: 300,
  
    // 这里是关键：使用计算属性名 [Symbol.asyncIterator] 来定义异步迭代器方法
    [Symbol.asyncIterator](): AsyncIterator<string, string> { // T=string, TReturn=string
      let current = this.start;
      const end = this.end;
      const delayMs = this.delayMs;
      let count = 0; // 记录调用次数
  
      console.log("[迭代器] 创建，从", current, "到", end);
  
      // 返回一个符合 AsyncIterator<string, string> 接口的对象
      return {
        async next(): Promise<IteratorResult<string, string>> {
          count++;
          console.log(`[迭代器 next()] 第 ${count} 次调用，当前值: ${current}`);
  
          if (current > end) {
            console.log("[迭代器 next()] 迭代完成。");
            // done 为 true, value 是 TReturn 类型
            return { value: `总共迭代了 ${count - 1} 次`, done: true };
          }
  
          // 模拟异步操作
          await new Promise(resolve => setTimeout(resolve, delayMs));
  
          const valueToSend = `当前数字: ${current}`; // 这是 T 类型
          current++;
  
          console.log(`[迭代器 next()] 产出值: "${valueToSend}"`);
          // done 为 false, value 是 T 类型
          return { value: valueToSend, done: false };
        }
        // 这里可以省略 return 和 throw 方法
      };
    }
  };
  
  // 使用 for await...of 循环来消费这个对象
  async function consumeSimpleSequence() {
    console.log("\n--- 开始消费 simpleAsyncSequence ---");
    try {
      // 因为 simpleAsyncSequence 有 [Symbol.asyncIterator] 方法，所以可以用 for await...of
      for await (const item of simpleAsyncSequence) {
        // item 的类型是 string (T)
        console.log("收到:", item);
      }
      console.log("--- 消费 simpleAsyncSequence 结束 ---");
      // 注意：for await...of 循环不会捕获 TReturn 值
    } catch (error) {
      console.error("消费时出错:", error);
    }
  }
  
  // 运行示例
  consumeSimpleSequence();