import { setTimeout } from 'timers/promises'; // Node.js 环境

// 假设这是你的 API 数据块类型
type ApiStreamChunk = { id: number; data: string };

// 模拟从 API 获取数据流的函数
async function* fetchApiStream(): AsyncGenerator<ApiStreamChunk, void, undefined> {
    let counter = 0;
    try {
        while (counter < 5) { // 假设流中有 5 个块
            await setTimeout(500); // 模拟网络延迟
            const chunk: ApiStreamChunk = { id: counter, data: `Chunk ${counter}` };
            console.log(`[Producer] Yielding chunk ${counter}`);
            yield chunk; // 使用 yield 发送数据块，暂停执行
            counter++;
        }
        console.log("[Producer] Stream finished");
        // 生成器函数正常结束，表示流结束 (done: true)
    } catch (error) {
        console.error("[Producer] Error fetching stream:", error);
        // 如果需要，可以抛出错误，或者 yield 一个错误信号
        // throw error; // 这会让消费者端的 for await...of 循环中断并抛出错误
    }
}

// --- 如何使用这个异步生成器 ---
async function consumeStream() {
    const streamGenerator = fetchApiStream();

    console.log("[Consumer] Starting to consume stream...");
    try {
        // for await...of 语法糖极大地简化了异步迭代
        for await (const chunk of streamGenerator) {
            console.log(`[Consumer] Received:`, chunk);
            // 在这里处理你的 chunk
        }
        console.log("[Consumer] Finished consuming stream.");
    } catch (error) {
        console.error("[Consumer] Error consuming stream:", error);
    }
}

consumeStream();