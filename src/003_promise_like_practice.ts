/**
 * promise_like_practice_zh.ts
 *
 * 演示 PromiseLike<T> 接口。
 * 这个接口定义了与 Promise 兼容的对象所需的最小结构，即一个 then 方法。
 */

console.log('--- PromiseLike<T> 接口演示 ---');

// 这是一个辅助的延迟函数
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// --- 1. 自定义一个符合 PromiseLike 的类 ---
// 这个类不是真正的 Promise，但它有 then 方法，所以是 "PromiseLike"

type ResolveFn<T> = (value: T) => void;
type RejectFn = (reason?: any) => void;

class SimplePromiseLike<T> implements PromiseLike<T> {
  // 'pending'（待定）、'fulfilled'（已完成）或 'rejected'（已拒绝）
  private _state: 'pending' | 'fulfilled' | 'rejected' = 'pending'; // 内部状态
  private _value?: T; // 成功时的值
  private _reason?: any; // 失败时的原因
  private _onFulfilledCallbacks: ResolveFn<T>[] = []; // 成功回调队列
  private _onRejectedCallbacks: RejectFn[] = []; // 失败回调队列

  constructor(executor: (resolve: ResolveFn<T>, reject: RejectFn) => void) {
    console.log('[SimplePromiseLike] 创建实例');

    // 定义内部的 resolve 和 reject 函数
    const resolve: ResolveFn<T> = (value: T) => {
      // 状态只能从 pending 改变
      if (this._state === 'pending') {
        this._state = 'fulfilled';
        this._value = value;
        console.log(`[SimplePromiseLike] 状态变为 fulfilled, 值: ${value}`);
        // 异步执行所有成功回调
        this._onFulfilledCallbacks.forEach((cb) => setTimeout(() => cb(this._value!), 0));
        this._clearCallbacks(); // 清理回调防止内存泄漏
      }
    };

    const reject: RejectFn = (reason?: any) => {
      // 状态只能从 pending 改变
      if (this._state === 'pending') {
        this._state = 'rejected';
        this._reason = reason;
        console.log(`[SimplePromiseLike] 状态变为 rejected, 原因: ${reason}`);
        // 异步执行所有失败回调
        this._onRejectedCallbacks.forEach((cb) => setTimeout(() => cb(this._reason), 0));
        this._clearCallbacks(); // 清理回调
      }
    };

    // 立即执行 executor，传入内部的 resolve 和 reject
    try {
      console.log('[SimplePromiseLike] 执行 executor 函数...');
      executor(resolve, reject);
    } catch (error) {
      console.error('[SimplePromiseLike] Executor 执行出错，自动 reject');
      reject(error);
    }
  }

  // 这是 PromiseLike<T> 接口要求的唯一方法
  // TResult1 是 onfulfilled 成功回调返回的值的类型 (或其 PromiseLike)
  // TResult2 是 onrejected 失败回调返回的值的类型 (或其 PromiseLike)
  public then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): PromiseLike<TResult1 | TResult2> {
    // **必须**返回一个新的 PromiseLike
    console.log('[SimplePromiseLike then()] 被调用');

    // then 方法的核心是返回一个新的 Promise (因为 Promise 本身就是 PromiseLike)，
    // 这个新的 Promise 的状态由 onfulfilled 或 onrejected 的执行结果决定。
    // 这是实现 Promise 链式调用的关键。
    return new Promise<TResult1 | TResult2>((resolve, reject) => {
      const wrappedOnFulfilled = () => {
        // 确保异步执行
        setTimeout(() => {
          if (typeof onfulfilled === 'function') {
            try {
              console.log('  [then] 执行 onfulfilled 回调...');
              const result = onfulfilled(this._value!);
              // 如果回调返回的是 PromiseLike，需要等待它完成
              if (result && typeof (result as any).then === 'function') {
                console.log('    [then] onfulfilled 返回了 PromiseLike，等待其结果...');
                (result as PromiseLike<TResult1>).then(resolve, reject);
              } else {
                console.log('    [then] onfulfilled 返回了普通值，resolve 新 Promise:', result);
                resolve(result as TResult1);
              }
            } catch (error) {
              console.error('    [then] onfulfilled 回调执行出错，reject 新 Promise:', error);
              reject(error);
            }
          } else {
            console.log(
              '  [then] 无 onfulfilled 回调，直接 resolve 新 Promise (值穿透):',
              this._value,
            );
            // 如果没有提供 onfulfilled，则将原值传递下去 (类型断言可能需要调整)
            resolve(this._value as any); // 类型穿透可能导致问题，真实Promise处理更复杂
          }
        }, 0);
      };

      const wrappedOnRejected = () => {
        // 确保异步执行
        setTimeout(() => {
          if (typeof onrejected === 'function') {
            try {
              console.log('  [then] 执行 onrejected 回调...');
              const result = onrejected(this._reason);
              // 如果回调返回 PromiseLike，等待它
              if (result && typeof (result as any).then === 'function') {
                console.log('    [then] onrejected 返回了 PromiseLike，等待其结果...');
                (result as PromiseLike<TResult2>).then(resolve, reject);
              } else {
                console.log(
                  '    [then] onrejected 返回了普通值 (可能用于恢复)，resolve 新 Promise:',
                  result,
                );
                resolve(result as TResult2); // onrejected 成功处理后，新 Promise 是 fulfilled
              }
            } catch (error) {
              console.error('    [then] onrejected 回调执行出错，reject 新 Promise:', error);
              reject(error); // 如果 onrejected 也出错，新 Promise 是 rejected
            }
          } else {
            console.log(
              '  [then] 无 onrejected 回调，直接 reject 新 Promise (原因穿透):',
              this._reason,
            );
            // 如果没有提供 onrejected，则将原错误传递下去
            reject(this._reason);
          }
        }, 0);
      };

      // 根据当前状态决定是立即执行回调还是将它们加入队列
      if (this._state === 'fulfilled') {
        console.log('  [then] 当前已 fulfilled，准备执行 onfulfilled');
        wrappedOnFulfilled();
      } else if (this._state === 'rejected') {
        console.log('  [then] 当前已 rejected，准备执行 onrejected');
        wrappedOnRejected();
      } else {
        // state === 'pending'
        console.log('  [then] 当前是 pending，将回调加入队列');
        if (onfulfilled) this._onFulfilledCallbacks.push(wrappedOnFulfilled);
        if (onrejected) this._onRejectedCallbacks.push(wrappedOnRejected);
        // 注意：在上面的简单实现中，回调只会被执行一次，所以加入队列的逻辑需要调整
        // 修正：应该将 wrapped 回调加入队列，而不是直接的 onfulfilled/onrejected
        // 上面的实现逻辑更倾向于直接返回 new Promise，这里简化了队列处理部分
        // 为了演示接口，当前实现是可接受的，但不是完整的 Promise A+ 实现
      }
    });
  }

  // 清理回调函数，防止在 resolve 或 reject 后重复执行或内存泄漏
  private _clearCallbacks(): void {
    this._onFulfilledCallbacks = [];
    this._onRejectedCallbacks = [];
  }
}

// --- 2. 使用自定义的 SimplePromiseLike ---

async function testSuccess() {
  console.log('\n--- 创建并使用 SimplePromiseLike 实例 (模拟成功) ---');
  const myPromiseLikeSuccess = new SimplePromiseLike<string>((resolve, reject) => {
    console.log('  (Executor) 模拟异步操作 (成功)...');
    setTimeout(() => {
      resolve('操作成功完成！');
    }, 1000);
  });

  await delay(2000);

  console.log('调用 myPromiseLikeSuccess.then()...');
  myPromiseLikeSuccess
    .then(
      (value) => {
        // onfulfilled
        console.log(`*** then 回调 (成功): 收到值 "${value}"`);
        return `处理后的值: ${value} NEW`; // 返回一个新值
      },
      (reason) => {
        // onrejected (这个不会被调用)
        console.error(`*** then 回调 (失败): 收到原因 "${reason}"`);
      },
    )
    .then(
      // 链式调用，处理上一个 then 返回的值
      (processedValue) => {
        console.log(`*** 链式 then 回调: 收到处理后的值 "${processedValue}"`);
      },
    );
}

// 使用 await (await 能够处理任何 PromiseLike 对象)
async function testWithAwaitSuccess() {
  console.log('\n--- 使用 await 等待 SimplePromiseLike (成功) ---');
  try {
    // 注意：这里创建了一个新的实例，因为 Promise 状态是不可逆的
    const myPromiseLikeForAwait = new SimplePromiseLike<number>((resolve) => {
      console.log('  (Executor for await) 模拟异步获取数字...');
      setTimeout(() => resolve(42), 500);
    });
    console.log('  await 开始...');
    const result = await myPromiseLikeForAwait; // await 会自动调用 then
    console.log(`  await 结束，结果: ${result}`); // result 的类型是 number (T)
  } catch (error) {
    console.error('  await 捕获到错误:', error);
  }
}

// --- 3. 模拟失败情况 ---
async function testWithAwaitFailure() {
  console.log('\n--- 使用 await 等待 SimplePromiseLike (失败) ---');
  const myPromiseLikeFailure = new SimplePromiseLike<string>((resolve, reject) => {
    console.log('  (Executor for failure) 模拟异步操作 (失败)...');
    setTimeout(() => {
      reject('数据库连接超时');
    }, 800);
  });

  // 使用 then 处理失败
  myPromiseLikeFailure.then(
    (value) => console.log(`(失败场景 then) 成功回调不应执行: ${value}`),
    (reason) => console.log(`*** (失败场景 then) 失败回调执行: ${reason}`),
  );

  // 使用 await 和 try...catch 处理失败
  try {
    console.log('  await (失败场景) 开始...');
    // 需要创建新实例或确保 Promise 状态正确
    const anotherFailure = new SimplePromiseLike<void>((res, rej) =>
      setTimeout(() => rej('另一个错误'), 100),
    );
    await anotherFailure;
    console.log('  await (失败场景) 成功了？(不应到达这里)');
  } catch (error) {
    console.error(`*** await (失败场景) 捕获到错误: ${error}`);
  }
}

// --- 4. 内建 Promise 也是 PromiseLike ---

async function testWithPromise() {
  console.log('\n--- 内建 Promise 也符合 PromiseLike ---');
  const nativePromise: Promise<boolean> = Promise.resolve(true);
  const promiseLikeVar: PromiseLike<boolean> = nativePromise; // 完全兼容
  
  console.log('可以将原生 Promise 赋值给 PromiseLike 类型的变量。');
  promiseLikeVar.then((val) => console.log(`通过 PromiseLike 变量调用原生 Promise 的 then: ${val}`));
  
}
// 运行所有测试
async function runAll() {
  await testSuccess();
  // 等待第一个 PromiseLike 完成 (虽然 then 是异步的，但主流程会继续)
  await delay(2000); // 等待第一个 then 链完成打印
  await testWithAwaitSuccess();
  await testWithAwaitFailure();
  await testWithPromise();
  await delay(500); // 等待最后的 PromiseLike 示例完成
  console.log('\n--- 所有演示完成 ---');
}

runAll();
