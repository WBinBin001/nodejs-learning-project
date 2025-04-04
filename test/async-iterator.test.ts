import { expect } from 'chai';
import { 
  createBasicAsyncIterator,
  createDelayedAsyncIterator,
  filterAsyncIterator,
  mapAsyncIterator,
  createCancellableAsyncIterator
} from '../src/async-iterator-practice.js';

describe('异步迭代器测试', function() {
  // 增加超时时间，因为有些测试包含延迟
  this.timeout(10000);

  describe('基本异步迭代器', function() {
    it('应该按顺序产生所有值', async function() {
      const iterator = createBasicAsyncIterator();
      const results: number[] = [];
      
      for await (const value of iterator) {
        results.push(value);
      }
      
      expect(results).to.deep.equal([1, 2, 3]);
    });
  });

  describe('延迟异步迭代器', function() {
    it('应该产生0到4的值', async function() {
      const iterator = createDelayedAsyncIterator();
      const results: number[] = [];
      
      for await (const value of iterator) {
        results.push(value);
      }
      
      expect(results).to.deep.equal([0, 1, 2, 3, 4]);
    });
  });

  describe('过滤异步迭代器', function() {
    it('应该只产生偶数', async function() {
      const filteredIterator = filterAsyncIterator(
        createDelayedAsyncIterator(),
        value => value % 2 === 0
      );
      
      const results: number[] = [];
      for await (const value of filteredIterator) {
        results.push(value);
      }
      
      expect(results).to.deep.equal([0, 2, 4]);
    });
  });

  describe('映射异步迭代器', function() {
    it('应该将每个值乘以2', async function() {
      const mappedIterator = mapAsyncIterator(
        createDelayedAsyncIterator(),
        async value => value * 2
      );
      
      const results: number[] = [];
      for await (const value of mappedIterator) {
        results.push(value);
      }
      
      expect(results).to.deep.equal([0, 2, 4, 6, 8]);
    });
  });

  describe('可取消的异步迭代器', function() {
    it('应该在取消后停止产生值', async function() {
      const { iterator, cancel } = createCancellableAsyncIterator();
      const results: number[] = [];
      
      // 设置一个定时器在2.5秒后取消迭代器
      setTimeout(() => cancel(), 2500);
      
      for await (const value of iterator) {
        results.push(value);
      }
      
      // 应该只产生约2-3个值（取决于精确的计时）
      expect(results.length).to.be.lessThan(4);
      expect(results).to.deep.equal([0, 1, 2].slice(0, results.length));
    });
  });
}); 