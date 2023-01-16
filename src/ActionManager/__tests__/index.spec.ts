import ActionManager from '../index';

beforeEach(() => {
  ActionManager.init('test');
  ActionManager.use('test');
});

describe('ActionManager', () => {
  test('基本使用', () => {
    let count = 0;
    ActionManager.enQueue(
      () => {
        count++;
      },
      { name: 's' }
    ).start();
    expect(count).toBe(1);
  });

  test('多个交互入队', () => {
    ActionManager.enQueue(
      () => {
        console.log('action1');
      },
      { name: 'action1', weight: 100 }
    );

    ActionManager.enQueue(
      () => {
        console.log('action2');
      },
      { name: 'action2', weight: 200 }
    );

    expect(ActionManager.getActionQueue('').length).toBe(2);
  });

  test('出队', () => {
    ActionManager.init('test');
    ActionManager.enQueue(
      () => {
        console.log('action1');
      },
      { name: 'action1', weight: 100 }
    );

    ActionManager.enQueue(
      () => {
        console.log('action2');
      },
      { name: 'action2', weight: 200 }
    );

    ActionManager.done('action2');
    console.log('queue', ActionManager.getActionQueue());
    expect(
      ActionManager.getActionQueue('test').filter(
        (action) => action.actionInfo.status !== 'end'
      ).length
    ).toBe(1);
  });

  test('多个交互，默认升序先后执行', () => {
    let count = 0;
    ActionManager.enQueue(
      () => {
        count++;
      },
      { name: 'action1', weight: 100 }
    );

    ActionManager.enQueue(
      () => {
        count++;
      },
      { name: 'action2', weight: 200 }
    );
    ActionManager.start();

    ActionManager.done('action2');
    ActionManager.done('action1');

    expect(count).toBe(2);
  });

  test('多个交互，使用降序执行', () => {
    let name = '';
    ActionManager.init('test', 'DESC');
    ActionManager.enQueue(
      () => {
        name = 'action1';
      },
      { name: 'action1', weight: 100 }
    );

    ActionManager.enQueue(
      () => {
        name = 'action2';
      },
      { name: 'action2', weight: 200 }
    );
    ActionManager.start();

    ActionManager.done('action1');
    ActionManager.done('action2');

    expect(name).toBe('action2');
  });

  test('相同的相互事件只执行一次', () => {
    let count = 0;
    ActionManager.enQueue(
      () => {
        count++;
      },
      { name: 'action1' }
    );

    ActionManager.enQueue(
      () => {
        count++;
      },
      { name: 'action1' }
    );
    ActionManager.start();

    ActionManager.done('action1');
    expect(count).toBe(1);
  });

  test('清空任务队列', () => {
    ActionManager.enQueue(
      () => {
        console.log(1);
      },
      { name: 'action1' }
    );

    ActionManager.enQueue(
      () => {
        console.log(2);
      },
      { name: 'action2' }
    );

    ActionManager.clear('test');
    expect(ActionManager.getActionQueue('test').length).toBe(0);
  });
});
