import ActionManager from '../index';

beforeEach(() => {
  ActionManager.init('test').use('test');
});

describe('ActionManager', () => {
  test('交互管理器的基本使用', () => {
    const actionFn = jest.fn();
    ActionManager.enQueue(actionFn, { name: 's' }).start();
    expect(actionFn).toBeCalledTimes(1);
  });

  test('多个交互入队，例如 A -> B -> C，ActionManager 队列中存在3个交互', () => {
    const actionA = jest.fn();
    const actionB = jest.fn();
    const actionC = jest.fn();
    ActionManager.enQueue(actionA, { name: 'actionA' })
      .enQueue(actionB, { name: 'actionB' })
      .enQueue(actionC, { name: 'actionC' });

    expect(ActionManager.getActionQueue('').length).toBe(3);
  });

  test('交互事件存在 A -> B -> C，执行出队操作，则当前交互队列中应该存在 一个状态为 end, 一个状态为 start，一个状态为 end 的交互', () => {
    ActionManager.enQueue(() => {}, { name: 'actionA' });
    ActionManager.enQueue(() => {}, { name: 'actionB' });
    ActionManager.enQueue(() => {}, { name: 'actionC' });
    ActionManager.done('actionA');

    console.log(ActionManager.getActionQueue());
    expect(ActionManager.getActionQueue('test').length).toBe(3);
    expect(
      ActionManager.getActionQueue('test').filter(
        (action) => action.actionInfo.status === 'start'
      ).length
    ).toBe(1);
    expect(
      ActionManager.getActionQueue('test').filter(
        (action) => action.actionInfo.status === 'wait'
      ).length
    ).toBe(1);
    expect(
      ActionManager.getActionQueue('test').filter(
        (action) => action.actionInfo.status === 'end'
      ).length
    ).toBe(1);
  });

  test('多个交互 A -> B，默认按照降序先执行A后执行B', () => {
    let startActionName = '';
    ActionManager.enQueue(
      () => {
        startActionName = 'actionA';
      },
      { name: 'actionA', weight: 100 }
    ).enQueue(
      () => {
        startActionName = 'actionB';
      },
      { name: 'actionB', weight: 200 }
    );
    ActionManager.start();

    expect(startActionName).toBe('actionB');
  });

  test('多个交互 A -> B，使用升序先执行B后执行A', () => {
    let startActionName = '';
    ActionManager.init('test', 'ASC');
    ActionManager.enQueue(
      () => {
        startActionName = 'actionA';
      },
      { name: 'actionA', weight: 100 }
    ).enQueue(
      () => {
        startActionName = 'actionB';
      },
      { name: 'actionB', weight: 200 }
    );
    ActionManager.start();

    expect(startActionName).toBe('actionA');
  });

  test('相同的相互事件，则进行覆盖操作,只执行最新的', () => {
    const action1 = jest.fn();
    const action2 = jest.fn();

    ActionManager.enQueue(action1, { name: 'action' })
      .enQueue(action2, { name: 'action' })
      .start();

    expect(ActionManager.getActionQueue().length).toBe(1);
    ActionManager.done('action');
    expect(action1).toBeCalledTimes(0);
    expect(action2).toBeCalledTimes(1);
  });

  test('执行交互 A -> B -> C, B 设置为并行交互，则A执行结束，B执行，C会执行', () => {
    const actionA = jest.fn();
    const actionB = jest.fn();
    const actionC = jest.fn();

    ActionManager.enQueue(actionA, { name: 'actionA' })
      .enQueue(actionB, { name: 'actionB', series: false })
      .enQueue(actionC, { name: 'actionC' });

    ActionManager.start();
    ActionManager.done('actionA');

    expect(actionA).toBeCalledTimes(1);
    expect(actionB).toBeCalledTimes(1);
    expect(actionC).toBeCalledTimes(1);
  });

  test('相同命名的交互事件只会执行一次', () => {
    const actionFn = jest.fn();
    ActionManager.enQueue(actionFn, { name: 'action' }).enQueue(actionFn, {
      name: 'action',
    });
    ActionManager.start();

    ActionManager.done('action1');
    expect(actionFn).toBeCalledTimes(1);
  });

  test('清空交互队列', () => {
    ActionManager.enQueue(() => {}, { name: 'actionA' });
    ActionManager.enQueue(() => {}, { name: 'actionB' });

    ActionManager.clear('test');
    expect(ActionManager.getActionQueue('test').length).toBe(0);
  });

  test('监听action交互执行，start后则触发监听函数调用', () => {
    const actionFn = jest.fn();
    ActionManager.on('action', actionFn);

    ActionManager.enQueue(() => {}, { name: 'test' }).start();

    expect(actionFn).toBeCalledTimes(1);
  });

  test('监听 done allDone，交互事件结束执行done，全部交互事件结束执行allDone', () => {
    const doneFn = jest.fn();
    const allDoneFn = jest.fn();
    ActionManager.on('done', doneFn);
    ActionManager.on('allDone', allDoneFn);

    ActionManager.enQueue(() => {}, { name: 'test1' })
      .enQueue(() => {}, { name: 'test2' })
      .start();

    ActionManager.done('test1');

    expect(doneFn).toBeCalledTimes(1);
    expect(allDoneFn).toBeCalledTimes(0);

    ActionManager.done('test2');

    expect(doneFn).toBeCalledTimes(2);
    expect(allDoneFn).toBeCalledTimes(1);
  });

  test('交互事件设置多个监听函数，当交互进行时，则多个监听函数都会执行', () => {
    const actionFn1 = jest.fn();
    const actionFn2 = jest.fn();

    ActionManager.on('action', actionFn1);
    ActionManager.on('action', actionFn2);

    ActionManager.enQueue(() => {}, { name: 'action' }).start();
    expect(actionFn1).toBeCalledTimes(1);
    expect(actionFn2).toBeCalledTimes(1);
  });

  test('配置交互事件监听函数只执行一遍，后续不会再执行', () => {
    const actionFn = jest.fn();
    ActionManager.on('action', actionFn, { once: true });

    ActionManager.enQueue(() => {}, { name: 'test1' })
      .enQueue(() => {}, {
        name: 'test2',
      })
      .start();

    expect(actionFn).toBeCalledTimes(1);
  });

  test('设置相同命名空间的监听函数，则进行覆盖操作', () => {
    const actionFn1 = jest.fn();
    const actionFn2 = jest.fn();

    ActionManager.on('action', actionFn1, { namespace: 'action' });
    ActionManager.on('action', actionFn2, { namespace: 'action' });

    ActionManager.enQueue(() => {}, { name: 'aciton' }).start();

    expect(actionFn1).toBeCalledTimes(0);
    expect(actionFn2).toBeCalledTimes(1);
  });

  test('取消交互事件action监听，执行start不再触发监听函数的执行', () => {
    const actionFn = jest.fn();
    ActionManager.on('action', actionFn);
    ActionManager.off('action');

    ActionManager.enQueue(() => {}, { name: 'test1' }).start();

    expect(actionFn).toBeCalledTimes(0);
  });
});
