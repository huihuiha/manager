import TimeManager from '..';

describe('TimeManager', () => {
  test('基本使用', (done) => {
    TimeManager.timer('TEST')
      .on('progress', (time) => {
        expect(time).toBe(1000);
        done();
      })
      .run(1000, 1000);
  });

  test('end 函数结束的时候使用', () => {
    jest.useFakeTimers();
    const fn = jest.fn();
    TimeManager.timer('TEST3').on('end', fn).run(1000, 1000);
    jest.runAllTimers();
    expect(fn).toBeCalledTimes(1);
  });

  test('设置倒计时为2秒，时间间隔为1秒，监听progress函数会被调用2次，监听end函数会被调用一次', () => {
    jest.useFakeTimers();
    const progreeFn = jest.fn();
    const endFn = jest.fn();
    TimeManager.timer('Test2')
      .on('progress', progreeFn)
      .on('end', endFn)
      .run(2000, 1000);

    jest.runAllTimers();
    expect(progreeFn).toBeCalledTimes(2);
    expect(endFn).toBeCalledTimes(1);
  });

  test('模拟不同地方监听不同命名空间的计时器，监听函数触发次数相同', () => {
    jest.useFakeTimers();
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    TimeManager.timer('Test3').on('progress', fn1, { namespace: 'time' });
    TimeManager.timer('Test3')
      .on('progress', fn2, { namespace: 'time1' })
      .run(2000, 1000);
    jest.runAllTimers();
    expect(fn1).toBeCalledTimes(2);
    expect(fn2).toBeCalledTimes(2);
  });

  test('模拟不同地方监听不同命名空间的计时器，如果on监听是放在最后执行的，则后续添加的监听函数执行次数少一次', () => {
    jest.useFakeTimers();
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    TimeManager.timer('Test3')
      .on('progress', fn1, { namespace: 'time' })
      .run(2000, 1000);
    TimeManager.timer('Test3').on('progress', fn2, { namespace: 'time1' });
    jest.runAllTimers();
    expect(fn1).toBeCalledTimes(2);
    expect(fn2).toBeCalledTimes(1);
  });

  test('调用计时器stop方法，触发监听器end函数执行', () => {
    jest.useFakeTimers();
    const fn1 = jest.fn();
    TimeManager.timer('Test3')
      .on('progress', fn1, { namespace: 'time' })
      .run(4000, 1000);

    TimeManager.stop('Test3');
    jest.runAllTimers();
    expect(fn1).toBeCalledTimes(1);
  });

  test('设置只progress事件监听一次', () => {
    jest.useFakeTimers();
    const fn1 = jest.fn();
    TimeManager.timer('Test3')
      .on('progress', fn1, { namespace: 'time', once: true })
      .run(4000, 1000);
    jest.runAllTimers();
    expect(fn1).toBeCalledTimes(1);
  });
});
