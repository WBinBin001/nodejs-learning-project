/**
 * async_iterator_manual_impl.ts
 *
 * 演示如何手动创建一个符合 AsyncIterator 接口的对象。
 * 这个对象本身负责执行异步迭代逻辑。
 */

class AsyncIteratorManualImplementation {
  // 定义类型
  private static readonly delay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // 创建一个手动实现的异步迭代器对象
  // 它需要自己维护迭代状态
  static createManualAsyncIterator(
    maxItems: number = 3,
  ): AsyncIterator<
    { id: number; data: string },
    { count: number; summary: string },
    'fastForward' | undefined
  > {
    let currentIndex = 0;
    let itemsGenerated = 0;
    let currentDelay = 600; // 初始延迟

    console.log(`[手动迭代器] 创建，最多生成 ${maxItems} 项`);

    // 返回符合 AsyncIterator 接口的对象
    return {
      // next 方法是必须的
      async next(
        command?: 'fastForward' | undefined,
      ): Promise<IteratorResult<{ id: number; data: string }, { count: number; summary: string }>> {
        console.log(`[手动迭代器 next()] 调用，当前索引: ${currentIndex}, 收到命令: ${command}`);

        if (command === 'fastForward') {
          console.log("  [命令] 收到 'fastForward'，减少延迟！");
          currentDelay = Math.max(100, currentDelay / 2);
        }

        if (currentIndex >= maxItems) {
          console.log('[手动迭代器 next()] 达到最大项数，迭代完成。');
          const finalResult = {
            count: itemsGenerated,
            summary: `共生成 ${itemsGenerated} 个项目。`,
          };
          // done: true, value 是 TReturn 类型
          return { value: finalResult, done: true };
        }

        console.log(`  模拟异步获取数据 (等待 ${currentDelay}ms)...`);
        await AsyncIteratorManualImplementation.delay(currentDelay);

        const newItem = {
          // 这是 T 类型
          id: currentIndex + 1,
          data: `数据 #${currentIndex + 1} @ ${new Date().toLocaleTimeString()}`,
        };

        currentIndex++;
        itemsGenerated++;

        console.log(`[手动迭代器 next()] 生成并产出:`, newItem);
        // done: false, value 是 T 类型
        return { value: newItem, done: false };
      },

      // 可选的 return 方法
      async return(
        value?:
          | { count: number; summary: string }
          | PromiseLike<{ count: number; summary: string }>,
      ): Promise<IteratorResult<{ id: number; data: string }, { count: number; summary: string }>> {
        console.log('[手动迭代器 return()] 被调用，可能需要清理资源...');
        currentIndex = maxItems; // 强制结束
        const finalValue = (await value) ?? { count: itemsGenerated, summary: '迭代被中断。' };
        console.log('  返回最终值:', finalValue);
        return { value: finalValue, done: true };
      },

      // 可选的 throw 方法
      async throw(
        e?: any,
      ): Promise<IteratorResult<{ id: number; data: string }, { count: number; summary: string }>> {
        console.error('[手动迭代器 throw()] 遇到错误:', e);
        currentIndex = maxItems; // 强制结束
        const finalResult = {
          count: itemsGenerated,
          summary: `迭代因错误 '${e}' 而终止。`,
        };
        // 根据需要决定是抛出错误还是返回一个表示错误的完成状态
        return { value: finalResult, done: true };
        // 或者: throw new Error("处理迭代器错误时发生问题");
      },
    };
  }

  // 如何使用这个手动创建的迭代器
  static async useManualIterator() {
    console.log('\n--- 开始使用手动创建的 AsyncIterator ---');
    const manualIterator = this.createManualAsyncIterator(4);

    let result:
      | IteratorResult<{ id: number; data: string }, { count: number; summary: string }>
      | undefined;

    try {
      // 必须手动调用 next()
      result = await manualIterator.next();
      while (!result.done) {
        // result.value 是 ItemType (T)
        console.log('主循环收到:', result.value);

        let command: 'fastForward' | undefined = undefined;
        if (result.value.id === 2) {
          // 检查 next 是否存在（总是存在）
          console.log(">>> 准备发送 'fastForward' 命令");
          command = 'fastForward';
          // 提前退出演示 return()
          // if (manualIterator.return) {
          //    console.log(">>> 手动调用 return() 提前退出");
          //    result = await manualIterator.return({ count: -1, summary: "手动提前返回"});
          //    break;
          // }
        }

        // 向下一次调用传递命令
        result = await manualIterator.next(command);
      }

      // 迭代结束后 (result.done === true)
      // result.value 是 FinalResultType (TReturn)
      console.log('--- 手动迭代结束 ---');
      console.log('最终结果:', result.value);
    } catch (error) {
      console.error('使用手动迭代器时出错:', error);
      // 如果迭代器有 throw 方法，可以在这里调用它
      if (manualIterator.throw) {
        console.log('>>> 尝试调用迭代器的 throw() 方法');
        await manualIterator.throw(error);
      }
    } finally {
      // 确保清理 (如果循环未正常结束)
      if (manualIterator.return && !(result && result.done)) {
        console.log('>>> 在 finally 中调用 return() 以确保清理');
        await manualIterator.return();
      }
    }
  }

  // 执行演示
  static async test() {
    await this.useManualIterator();
  }
}

// 检查是否是直接运行此文件 (ESM方式)
import { fileURLToPath } from 'url';

// 立即执行函数
(async () => {
  // 比较当前文件路径和执行文件路径
  if (process.argv[1] === fileURLToPath(import.meta.url)) {
    // 运行应用
    AsyncIteratorManualImplementation.test().catch((error) => {
      console.error('[Main] Error running demo:', error);
    });
  }
})();
