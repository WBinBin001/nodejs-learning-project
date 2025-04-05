/**
 * event_loop_demonstration_ts.ts
 *
 * 这个文件通过 TypeScript 演示 JavaScript 事件循环的核心概念：
 * 1. 同步代码执行 (Call Stack)
 * 2. 微任务队列 (Microtask Queue) - 如 Promise.then/catch/finally, queueMicrotask
 * 3. 宏任务队列 (Callback Queue / Macrotask Queue) - 如 setTimeout, setInterval, I/O
 *
 * 执行顺序:
 * 1. 执行所有当前的同步代码。
 * 2. 执行完同步代码后，检查微任务队列。如果队列不为空，则清空整个微任务队列。
 *    (如果在执行微任务时又添加了新的微任务，这些新微任务也会在当前轮次被执行)。
 * 3. 从宏任务队列中取出一个任务（如果有的话）来执行。
 * 4. 重复步骤 2 和 3。
 */

console.log('--- 脚本开始 ---'); // 1. 同步任务

// 注册一个宏任务 (setTimeout)
setTimeout(() => {
  console.log('setTimeout 1 (宏任务 - 0ms)'); // 8. 宏任务队列中的第一个任务
  Promise.resolve().then(() => {
    console.log('Promise inside setTimeout 1 (微任务)'); // 9. 在宏任务执行期间添加的微任务，在此宏任务结束后、下一个宏/同步任务前执行
  });
  queueMicrotask(() => {
      console.log('queueMicrotask inside setTimeout 1 (微任务)'); // 10. 同上，微任务之间按添加顺序执行
  });
}, 0); // 即使是 0ms，回调也会被放入宏任务队列，等待下一轮事件循环

// 注册另一个宏任务
setTimeout(() => {
  console.log('setTimeout 2 (宏任务 - 10ms)'); // 11. 宏任务队列中的第二个任务 (在0ms的之后)
}, 10); // 稍长的延迟

// 注册一个微任务 (Promise.then)
Promise.resolve().then(() => {
  console.log('Promise.resolve().then 1 (微任务)'); // 4. 同步代码执行完后，第一个执行的微任务
  // 在微任务中再注册一个微任务
  Promise.resolve().then(() => {
    console.log('Nested Promise.resolve().then 2 (微任务)'); // 6. 这个微任务也会在当前微任务队列清空阶段执行
  });
});

// 显式注册一个微任务
queueMicrotask(() => {
  console.log('queueMicrotask 1 (微任务)'); // 5. 同步代码执行完后，第二个执行的微任务 (按注册顺序)
});

// 更多同步代码
function syncFunction() {
  console.log('同步函数 syncFunction 执行'); // 2. 同步任务
}
syncFunction();

console.log('--- 脚本结束 ---'); // 3. 同步任务

/*
 * --- 预测输出顺序 ---
 * 1.  '--- 脚本开始 ---'                   (同步)
 * 2.  '同步函数 syncFunction 执行'          (同步)
 * 3.  '--- 脚本结束 ---'                   (同步)
 * --- 同步代码执行完毕，开始处理微任务队列 ---
 * 4.  'Promise.resolve().then 1 (微任务)'  (微任务)
 * 5.  'queueMicrotask 1 (微任务)'          (微任务 - 按注册顺序在 Promise 1 之后)
 * 6.  'Nested Promise.resolve().then 2 (微任务)' (微任务 - 在 Promise 1 执行期间添加，但在清空当前队列时执行)
 * --- 微任务队列清空，事件循环进入下一轮，处理宏任务 ---
 * 7.  (Event Loop Tick)
 * 8.  'setTimeout 1 (宏任务 - 0ms)'        (宏任务 - 队列中的第一个)
 * --- setTimeout 1 的同步代码执行完毕，检查其产生的微任务 ---
 * 9.  'Promise inside setTimeout 1 (微任务)' (在宏任务回调中产生的微任务)
 * 10. 'queueMicrotask inside setTimeout 1 (微任务)' (同上，按顺序)
 * --- setTimeout 1 的微任务队列清空，事件循环进入下一轮，处理宏任务 ---
 * 11. 'setTimeout 2 (宏任务 - 10ms)'       (宏任务 - 队列中的第二个，在等待10ms后执行)
 */