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

// 符号信息类
class SymbolInfo {
  static logInfo(): void {
    console.log('Symbol.asyncIterator 是一个:', typeof Symbol.asyncIterator); // 输出: symbol
    console.log('它是一个唯一的符号:', Symbol.asyncIterator.toString()); // 输出: Symbol(Symbol.asyncIterator)
  }
}

// 异步迭代器类
class AsyncIteratorImpl implements AsyncIterator<string, string> {
  private current: number;
  private count: number = 0;

  constructor(
    private start: number,
    private end: number,
    private delayMs: number,
  ) {
    this.current = start;
    console.log('[迭代器] 创建，从', this.current, '到', this.end);
  }

  async next(): Promise<IteratorResult<string, string>> {
    this.count++;
    console.log(`[迭代器 next()] 第 ${this.count} 次调用，当前值: ${this.current}`);

    if (this.current > this.end) {
      console.log('[迭代器 next()] 迭代完成。');
      // done 为 true, value 是 TReturn 类型
      return { value: `总共迭代了 ${this.count - 1} 次`, done: true };
    }

    // 模拟异步操作
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));

    const valueToSend = `当前数字: ${this.current}`; // 这是 T 类型
    this.current++;

    console.log(`[迭代器 next()] 产出值: "${valueToSend}"`);
    // done 为 false, value 是 T 类型
    return { value: valueToSend, done: false };
  }
}

// 创建一个异步可迭代的类
class SimpleAsyncSequence {
  constructor(
    public start: number = 1,
    public end: number = 3,
    public delayMs: number = 300,
  ) {}

  // 实现异步迭代器方法
  [Symbol.asyncIterator](): AsyncIterator<string, string> {
    return new AsyncIteratorImpl(this.start, this.end, this.delayMs);
  }
}

// 序列消费者类
class SequenceConsumer {
  constructor(private name: string = '默认') {}

  async consume(sequence: SimpleAsyncSequence): Promise<void> {
    console.log(`\n--- 开始消费 ${this.name}序列 ---`);
    try {
      for await (const item of sequence) {
        console.log(`${this.name}序列收到:`, item);
      }
      console.log(`--- ${this.name}序列消费结束 ---`);
    } catch (error) {
      console.error(`${this.name}序列消费时出错:`, error);
    }
  }
}

// 应用执行类
class Application {
  static async run(): Promise<void> {
    // 显示符号信息
    SymbolInfo.logInfo();

    // 创建默认序列并消费
    const defaultSequence = new SimpleAsyncSequence();
    const defaultConsumer = new SequenceConsumer();
    await defaultConsumer.consume(defaultSequence);

    // 创建自定义序列并消费
    const customSequence = new SimpleAsyncSequence(5, 7, 200);
    const customConsumer = new SequenceConsumer('自定义');
    await customConsumer.consume(customSequence);
  }
}

// 检查是否是直接运行此文件 (ESM方式)
import { fileURLToPath } from 'url';

// 立即执行函数
(async () => {
  // 比较当前文件路径和执行文件路径
  if (process.argv[1] === fileURLToPath(import.meta.url)) {
    // 运行应用
    Application.run();
  }
})();
