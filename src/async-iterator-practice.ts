/**
 * 异步迭代器学习与练习
 * 
 * 本文件包含多个异步迭代器的示例和练习，帮助理解异步迭代器的概念和用法
 */

// 基本的异步迭代器实现
async function* createBasicAsyncIterator(): AsyncIterableIterator<number> {
  yield Promise.resolve(1);
  yield Promise.resolve(2);
  yield Promise.resolve(3);
}

// 模拟异步数据源的迭代器
async function* createDelayedAsyncIterator(): AsyncIterableIterator<number> {
  for (let i = 0; i < 5; i++) {
    // 模拟网络请求或其他异步操作
    await new Promise(resolve => setTimeout(resolve, 1000));
    yield i;
  }
}

// 从API获取数据的异步迭代器示例
async function* fetchDataAsyncIterator(url: string, pageSize: number = 10): AsyncIterableIterator<any> {
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(`${url}?page=${page}&pageSize=${pageSize}`);
    const data = await response.json();
    
    // 假设API返回的数据格式为 { items: any[], hasMore: boolean }
    yield* data.items;
    hasMore = data.hasMore;
    page++;
  }
}

// 异步迭代器的过滤器
async function* filterAsyncIterator<T>(
  iterator: AsyncIterableIterator<T>,
  predicate: (value: T) => Promise<boolean> | boolean
): AsyncIterableIterator<T> {
  for await (const item of iterator) {
    if (await predicate(item)) {
      yield item;
    }
  }
}

// 异步迭代器的映射器
async function* mapAsyncIterator<T, R>(
  iterator: AsyncIterableIterator<T>,
  mapper: (value: T) => Promise<R> | R
): AsyncIterableIterator<R> {
  for await (const item of iterator) {
    yield await mapper(item);
  }
}

// 使用示例
async function runExamples() {
  console.log("基本异步迭代器示例:");
  const basicIterator = createBasicAsyncIterator();
  for await (const value of basicIterator) {
    console.log(value);
  }
  
  console.log("\n延迟异步迭代器示例:");
  const delayedIterator = createDelayedAsyncIterator();
  for await (const value of delayedIterator) {
    console.log(`${new Date().toISOString()} - 收到值: ${value}`);
  }
  
  console.log("\n过滤异步迭代器示例:");
  const filteredIterator = filterAsyncIterator(
    createDelayedAsyncIterator(),
    value => value % 2 === 0
  );
  for await (const value of filteredIterator) {
    console.log(`过滤后的值: ${value}`);
  }
  
  console.log("\n映射异步迭代器示例:");
  const mappedIterator = mapAsyncIterator(
    createDelayedAsyncIterator(),
    async value => {
      // 模拟一些异步处理
      await new Promise(resolve => setTimeout(resolve, 500));
      return `处理后的值: ${value * 2}`;
    }
  );
  for await (const value of mappedIterator) {
    console.log(value);
  }
}

// 实现一个可以取消的异步迭代器
function createCancellableAsyncIterator(): { 
  iterator: AsyncIterableIterator<number>; 
  cancel: () => void 
} {
  let cancelled = false;
  
  const iterator = (async function*(): AsyncIterableIterator<number> {
    try {
      for (let i = 0; !cancelled && i < 100; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        yield i;
      }
    } finally {
      console.log("迭代器已清理资源");
    }
  })();
  
  return {
    iterator,
    cancel: () => { cancelled = true; }
  };
}

// 异步迭代器与异步生成器的练习
async function asyncIteratorExercises(): Promise<void> {
  // 练习1: 实现一个读取文件流的异步迭代器
  async function* readFileLineByLine(filePath: string): AsyncIterableIterator<string> {
    // 使用 ESM 导入替代 require
    const fs = await import('fs');
    const readline = await import('readline');
    
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    for await (const line of rl) {
      yield line;
    }
  }
  
  // 练习2: 实现一个合并多个异步迭代器的函数
  async function* mergeAsyncIterators<T>(...iterators: AsyncIterableIterator<T>[]): AsyncIterableIterator<T> {
    // 创建一个数组来存储所有迭代器的下一个值的Promise
    const pendingPromises = iterators.map(it => it.next());
    
    // 只要还有未完成的迭代器，就继续迭代
    while (pendingPromises.length > 0) {
      // 等待任意一个迭代器产生下一个值
      const { value: nextPromise, index } = await Promise.race(
        pendingPromises.map((promise, index) => 
          promise.then(result => ({ value: result, index }))
        )
      );
      
      // 如果迭代器没有完成，获取它的下一个值并放入数组
      if (!nextPromise.done) {
        yield nextPromise.value;
        pendingPromises[index] = iterators[index].next();
      } else {
        // 如果迭代器完成了，从数组中移除它
        pendingPromises.splice(index, 1);
        iterators.splice(index, 1);
      }
    }
  }
  
  // 练习3: 修复类型问题并改进实现
  async function* limitConcurrency<T, R>(
    items: Iterable<T>,
    asyncOperation: (item: T) => Promise<R>,
    concurrency: number
  ): AsyncIterableIterator<R> {
    const iterator = items[Symbol.iterator]();
    const inProgress = new Set<Promise<R>>();
    const results: R[] = [];
    let completed = false;
    
    function startNext(): Promise<R> | null {
      const { value, done } = iterator.next();
      if (done) {
        completed = inProgress.size === 0;
        return null;
      }
      
      const promise = asyncOperation(value);
      inProgress.add(promise);
      
      promise.then(result => {
        inProgress.delete(promise);
        results.push(result);
        startNext();
      }).catch(error => {
        inProgress.delete(promise);
        console.error("操作执行出错:", error);
        startNext();
      });
      
      return promise;
    }
    
    // 初始化并发任务
    while (inProgress.size < concurrency && !completed) {
      startNext();
    }
    
    // 输出结果
    while (!completed || results.length > 0) {
      if (results.length > 0) {
        yield results.shift()!;
      } else {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }
}

// 添加一个专门用于调试的函数
async function debugAsyncIterators() {
  console.log("开始调试异步迭代器...");
  
  // 在这里可以设置断点
  const basicIterator = createBasicAsyncIterator();
  console.log("基本异步迭代器:");
  for await (const value of basicIterator) {
    // 在这里设置断点
    console.log(`值: ${value}`);
  }
  
  // 调试延迟异步迭代器
  console.log("\n延迟异步迭代器:");
  const delayedIterator = createDelayedAsyncIterator();
  // 只获取前两个值以加快调试速度
  let count = 0;
  for await (const value of delayedIterator) {
    // 在这里设置断点
    console.log(`${new Date().toISOString()} - 收到值: ${value}`);
    if (++count >= 2) break;
  }
  
  // 调试过滤器
  console.log("\n过滤异步迭代器:");
  const filteredIterator = filterAsyncIterator(
    createBasicAsyncIterator(),
    value => value % 2 === 0
  );
  for await (const value of filteredIterator) {
    // 在这里设置断点
    console.log(`过滤后的值: ${value}`);
  }
  
  // 调试可取消的迭代器
  console.log("\n可取消的异步迭代器:");
  const { iterator, cancel } = createCancellableAsyncIterator();
  setTimeout(() => {
    console.log("取消迭代器");
    cancel();
  }, 2500);
  
  try {
    for await (const value of iterator) {
      // 在这里设置断点
      console.log(`收到值: ${value}`);
    }
  } catch (error) {
    console.error("迭代器错误:", error);
  }
  
  console.log("调试完成");
}

// 修改为直接调用调试函数
if (typeof import.meta.url === 'string' && import.meta.url.startsWith('file:')) {
  debugAsyncIterators().catch(console.error);
}

// 导出所有函数以便在其他文件中使用
export {
  createBasicAsyncIterator,
  createDelayedAsyncIterator,
  fetchDataAsyncIterator,
  filterAsyncIterator,
  mapAsyncIterator,
  createCancellableAsyncIterator,
  runExamples,
  debugAsyncIterators // 导出调试函数
}; 