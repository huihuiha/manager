import EventManager from '..';
import type { EventInfoType } from '../types';

// 事件配置1
const EventInfo: EventInfoType = {
  eventName: 'test',
  payloadFn: () => true,
  trigger: ['test'],
  listener: {
    listener1: {
      namespace: 'listener1',
      once: false,
    },
  },
};

// 事件配置2
const OtherEventInfo: EventInfoType = {
  eventName: 'test1',
  payloadFn: () => true,
  trigger: ['test'],
  listener: {
    listener1: {
      namespace: 'listener1',
      once: false,
    },
  },
};

describe('EventManager', () => {
  test('基本使用', () => {
    const eventFn = jest.fn();
    EventManager.on(EventInfo, eventFn, 'listener1');

    EventManager.emit(EventInfo, '', 'test');

    expect(eventFn).toBeCalledTimes(1);
  });

  test('批量绑定监听函数，触发则全部执行', () => {
    const eventFn1 = jest.fn();
    const eventFn2 = jest.fn();
    EventManager.batch(
      [
        [EventInfo, eventFn1],
        [OtherEventInfo, eventFn2],
      ],
      'listener1'
    );

    EventManager.emit(EventInfo, '', 'test');
    EventManager.emit(OtherEventInfo, '', 'test');

    expect(eventFn1).toBeCalledTimes(1);
    expect(eventFn2).toBeCalledTimes(1);
  });

  test('off 解绑监听', () => {
    const eventFn = jest.fn();
    EventManager.on(EventInfo, eventFn, 'listener1');
    EventManager.off('test', 'listener1');
    EventManager.emit(EventInfo, '', 'test');

    expect(eventFn).toBeCalledTimes(0);
  });

  test('当触发者不满足触发条件的时候，不会触发监听函数这行', () => {
    const eventFn = jest.fn();
    EventManager.on(EventInfo, eventFn, 'trigger1');
    EventManager.emit(EventInfo, eventFn, 'noMatch');

    expect(eventFn).toBeCalledTimes(0);
  });

  test('当监听者不满足监听条件的时候，不触发监听函数执行', () => {
    const eventFn = jest.fn();
    EventManager.on(EventInfo, eventFn, 'no-listener');
    EventManager.emit(EventInfo, eventFn, 'test');

    expect(eventFn).toBeCalledTimes(0);
  });

  test('参数校验的不通过的时候，不触发监听函数执行，校验通过则触发函数', () => {
    const eventFn = jest.fn();
    const myEventInfo = { ...EventInfo };
    myEventInfo.payloadFn = (payload: boolean) => payload;
    EventManager.on(myEventInfo, eventFn, 'listener1');

    EventManager.emit(myEventInfo, false, 'test');

    expect(eventFn).toBeCalledTimes(0);

    EventManager.emit(myEventInfo, true, 'test');
    expect(eventFn).toBeCalledTimes(1);
  });

  test('监听函数参数是否正常获取', () => {
    const eventFn = jest.fn();
    EventManager.on(EventInfo, eventFn, 'listener1');
    EventManager.emit(EventInfo, { trigger: 'test' }, 'test');

    expect(eventFn).toBeCalledWith({ trigger: 'test' });
  });

  test('配置监听函数只执行一遍', () => {
    const eventFn = jest.fn();
    const myEventInfo = { ...EventInfo };
    myEventInfo.listener.listener1.once = true;
    EventManager.on(myEventInfo, eventFn, 'listener1');

    EventManager.emit(myEventInfo, '', 'test');

    expect(eventFn).toBeCalledTimes(1);

    EventManager.emit(myEventInfo, '', 'test');
    expect(eventFn).toBeCalledTimes(1);
  });

  test('相同命名空间的监听函数，会执行更新操作', () => {
    const eventFn1 = jest.fn();
    const eventFn2 = jest.fn();

    EventManager.on(EventInfo, eventFn1, 'listener1');
    EventManager.on(EventInfo, eventFn2, 'listener1');

    EventManager.emit(EventInfo, '', 'test');

    expect(eventFn1).toBeCalledTimes(0);
    expect(eventFn2).toBeCalledTimes(1);
  });
});
