/**
 * promise_resolve_practice_ts.ts
 *
 * 练习 Promise.resolve() 静态方法的不同用法。
 * 这个方法用于快速创建一个已解决的 Promise 或将 PromiseLike 对象转换为标准 Promise。
 */

class PromiseResolvePractice {
  // 辅助函数，增加一点延迟，让异步感更明显 (虽然 resolve 本身可能很快)
  private static readonly delay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // --- 1. resolve() 无参数 ---
  static async practiceResolveVoid() {
    console.log('\n--- 1. Promise.resolve() 无参数 ---');
    const pVoid = Promise.resolve(); // 创建一个 Promise<void>
    console.log('已创建 Promise<void>:', pVoid);

    await pVoid.then(() => {
      console.log('  ✅ Promise<void> 的 then 回调执行 (解决值为 undefined)');
    });
  }

  // --- 2. resolve(非 Promise 值) ---
  static async practiceResolveValue() {
    console.log('\n--- 2. Promise.resolve(value) 使用普通值 ---');

    // 字符串
    const strValue = '成功!';
    const pString = Promise.resolve(strValue);
    console.log(`已创建 Promise<string> (值为 "${strValue}"):`, pString);
    await pString.then((resolvedStr) => {
      console.log(`  ✅ Promise<string> 的 then 回调执行, 值: "${resolvedStr}"`);
      console.log(`  值是否与原始值相同? ${resolvedStr === strValue}`);
    });

    // 数字
    const numValue = 42;
    const pNumber = Promise.resolve(numValue);
    console.log(`已创建 Promise<number> (值为 ${numValue}):`, pNumber);
    await pNumber.then((resolvedNum) => {
      console.log(`  ✅ Promise<number> 的 then 回调执行, 值: ${resolvedNum}`);
    });

    // 对象
    const objValue = { id: 1, message: '数据对象' };
    const pObject = Promise.resolve(objValue);
    console.log(`已创建 Promise<object> (值为 ${JSON.stringify(objValue)}):`, pObject);
    await pObject.then((resolvedObj) => {
      console.log('  ✅ Promise<object> 的 then 回调执行, 值:', resolvedObj);
      console.log(`  对象引用是否相同? ${resolvedObj === objValue}`); // 引用相同
    });
  }

  // --- 3. resolve(Promise 实例) ---
  static async practiceResolvePromise() {
    console.log('\n--- 3. Promise.resolve(promise) 使用已存在的 Promise ---');

    // 情况 A: 传入一个最终会 resolve 的 Promise
    const innerPromiseSuccess = new Promise<string>((resolve) => {
      console.log('  (内部 Promise - 成功 - 开始执行...)');
      setTimeout(() => {
        const successMsg = '内部 Promise 已解决';
        console.log(`  (内部 Promise - 成功 - 解决: "${successMsg}")`);
        resolve(successMsg);
      }, 50);
    });

    const outerPromiseSuccess = Promise.resolve(innerPromiseSuccess);
    console.log('已创建包装 Promise (等待内部成功):', outerPromiseSuccess);
    // 注意: V8 等引擎优化下，通常会返回同一个实例，但规范只保证行为一致
    console.log(
      `  Promise.resolve(promise) 是否返回同一个实例? ${outerPromiseSuccess === innerPromiseSuccess}`,
    );

    await outerPromiseSuccess.then((resolvedValue) => {
      // resolvedValue 来自 innerPromiseSuccess
      console.log(`  ✅ 外部 Promise 的 then (成功场景) 执行, 值来自内部: "${resolvedValue}"`);
    });

    await this.delay(100); // 确保上一个完成

    // 情况 B: 传入一个最终会 reject 的 Promise
    const innerPromiseFailure = new Promise<number>((resolve, reject) => {
      console.log('  (内部 Promise - 失败 - 开始执行...)');
      setTimeout(() => {
        const errorReason = '内部数据库错误';
        console.error(`  (内部 Promise - 失败 - 拒绝: "${errorReason}")`);
        reject(new Error(errorReason));
      }, 60);
    });
    // 如果不处理 innerPromiseFailure 本身的拒绝，可能会导致 Unhandled Rejection
    innerPromiseFailure.catch(() => {
      /* 静默处理原始拒绝 */
    });

    const outerPromiseFailure = Promise.resolve(innerPromiseFailure);
    console.log('已创建包装 Promise (等待内部失败):', outerPromiseFailure);

    await outerPromiseFailure
      .then((value) => {
        console.log(`  ❌ 外部 Promise 的 then (失败场景) 不应执行: ${value}`);
      })
      .catch((error: Error) => {
        // error 来自 innerPromiseFailure 的拒绝原因
        console.error(
          `  ✅ 外部 Promise 的 catch (失败场景) 执行, 原因来自内部: "${error.message}"`,
        );
      });
  }

  // --- 4. resolve(PromiseLike / thenable 对象) ---
  static async practiceResolveThenable() {
    console.log('\n--- 4. Promise.resolve(thenable) 使用 PromiseLike 对象 ---');

    // 创建一个简单的 PromiseLike (thenable) 对象
    const myThenableSuccess = {
      then(
        onFulfilled?: ((value: string) => any) | null,
        onRejected?: ((reason: any) => any) | null,
      ) {
        console.log('  (myThenableSuccess.then 方法被 Promise.resolve 调用)');
        // 模拟异步成功
        setTimeout(() => {
          if (onFulfilled) {
            console.log('  (myThenableSuccess 模拟成功, 调用 onFulfilled)');
            try {
              onFulfilled('来自成功 Thenable 的值');
            } catch (e) {
              // 如果 onFulfilled 出错，应该调用 onRejected (如果提供)
              if (onRejected) onRejected(e);
            }
          }
        }, 80);

        return this; // 返回 this 使其成为链式调用
      },
    };

    const promiseFromThenableSuccess = Promise.resolve(myThenableSuccess);
    console.log('已创建基于成功 Thenable 的 Promise:', promiseFromThenableSuccess);

    await promiseFromThenableSuccess.then((value: string) => {
      console.log(`  ✅ 基于成功 Thenable 的 Promise 解决, 值: "${value}"`);
    });

    await this.delay(100); // 分隔

    // 再创建一个模拟失败的 Thenable
    const myThenableFailure = {
      then(
        onFulfilled?: ((value: number) => any) | null,
        onRejected?: ((reason: any) => any) | null,
      ) {
        console.log('  (myThenableFailure.then 方法被 Promise.resolve 调用)');
        // 模拟异步失败
        setTimeout(() => {
          if (onRejected) {
            const reason = 'Thenable 自定义失败原因';
            console.error(`  (myThenableFailure 模拟失败, 调用 onRejected: "${reason}")`);
            onRejected(reason);
          }
        }, 70);

        return this; // 返回 this 使其成为链式调用
      },
    };

    const promiseFromThenableFailure = Promise.resolve(myThenableFailure);
    console.log('已创建基于失败 Thenable 的 Promise:', promiseFromThenableFailure);

    await promiseFromThenableFailure
      .then((value) => {
        console.log(`  ❌ 基于失败 Thenable 的 Promise 的 then 不应执行: ${value}`);
      })
      .catch((error) => {
        console.error(`  ✅ 基于失败 Thenable 的 Promise 的 catch 执行, 原因: "${error}"`);
      });
  }

  // --- 5. 主要用途说明 ---
  static showUsageContext() {
    console.log('\n--- 5. 主要用途说明 ---');
    console.log(
      '1. **标准化**: 将各种类型的值（普通值, Promise, thenable）统一转换成标准的 Promise 对象，方便后续统一处理（如传递给期望 Promise 的函数或库）。',
    );
    console.log(
      '2. **快速返回已解决状态**: 在 `async` 函数或其他需要返回 Promise 的地方，如果需要立即返回一个已解决的 Promise，`Promise.resolve(value)` 非常方便。',
    );
    console.log(
      '   例如: `async function getData() { if (cachedData) { return Promise.resolve(cachedData); } ... }`',
    );
  }

  // --- 主执行函数  ---
  static async test() {
    console.log('--- Promise.resolve() 练习开始 ---');

    await this.practiceResolveVoid();
    await this.delay(50); // 小间隔
    await this.practiceResolveValue();
    await this.delay(50);
    await this.practiceResolvePromise();
    await this.delay(150); // 等待内部 Promise 完成
    await this.practiceResolveThenable();
    await this.delay(150); // 等待 thenable 完成
    this.showUsageContext();
    console.log('\n--- Promise.resolve() 练习结束 ---');
  }
}

export function promise_resolve_practice(): void {
  PromiseResolvePractice.test();
}
// 为了支持直接运行此文件，我们使用以下 ESM 兼容的方法
// 检测 import.meta.url 与 process.argv[1] 的关系来判断是否为主模块
import { fileURLToPath } from 'url';
import { argv } from 'process';

// 立即执行函数
(async () => {
  // 检查是否是直接运行此文件 (ESM 方式)
  const importMetaUrl = import.meta.url;
  const modulePath = fileURLToPath(importMetaUrl);
  
  // 通过比较路径判断是否为主模块
  if (argv[1] === modulePath) {
    promise_resolve_practice();
  }
})();