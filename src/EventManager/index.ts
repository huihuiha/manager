/**
 * @file EventManager
 * @description 事件管理器
 */

import type {
  EventFnMap,
  EventFnType,
  EventInfoType,
  EventsType,
} from './types';

// debug控制开关 true 打开log、 false 关闭log
let debug = false;

class EventManager {
  /** 监听集合 */
  private _events: EventsType = {};

  /**
   * debug 打开调试日志
   */
  debug() {
    debug = true;
  }

  /**
   * batch 批处理绑定事件处理函数
   * @param {EventFnMap} eventFnMap 事件监听函数MAP格式信息
   * @param {string} listenerName 监听者名称
   * @returns {EventManager} EventManager 事件管理器，方便链式调用
   */
  batch(eventFnMap: EventFnMap = [], listenerName: string = ''): EventManager {
    eventFnMap.forEach((item) => {
      this.on(item[0], item[1], listenerName);
    });
    return this;
  }

  /**
   * on 绑定事件处理函数 会根据事件信息进行相应处理
   *
   * @param {EventInfoType} eventInfo 事件信息
   * @param {EventFnType} fn 该事件被触发时执行的监听函数
   * @param {string} listenerName 监听者名称 用于在 eventInfo 读取该事件监听者的配置项
   * @returns {EventManager} EventManager 事件管理器，方便链式调用
   */
  on(
    eventInfo: EventInfoType = {
      eventName: '',
      payloadFn: () => true,
      trigger: [],
      listener: {},
    },
    fn: EventFnType,
    listenerName: string
  ): EventManager {
    const { eventName, listener, payloadFn, trigger } = eventInfo;
    if (!eventName) {
      console.error(
        '【 EventManager on error 】 eventInfo.eventName cannot be empty!'
      );
      return this;
    }

    if (typeof fn !== 'function') {
      console.error('【 EventManager on error 】 fn must be a function!');
      return this;
    }

    if (!listener[listenerName]) {
      console.error(
        `【 EventManager on error 】 ${listenerName} not found in eventInfo.listener!`
      );
      return this;
    }

    if (!this._events[eventName]) {
      this._events[eventName] = { eventName, payloadFn, trigger, listener };

      debug &&
        console.info(
          `【 EventManager log 】监听者 ${listenerName} 创建了 ${eventName} 事件`,
          this._events[eventName]
        );
    }

    this._events[eventName].listener[listenerName].fn = fn;

    debug &&
      console.info(
        `【 EventManager log 】监听者 ${listenerName} 注册了 ${eventName} 事件监听函数`,
        this._events[eventName].listener[listenerName]
      );
    return this;
  }

  /**
   * emit 触发事件
   *
   * @param {EventInfoType} eventInfo 事件信息
   * @param {any} payload 挂载的数据
   * @param {string} triggerName 触发者名称 用于在 eventInfo 检查触发者是否合法
   * @returns {Object} EventManager 事件管理器，方便链式调用
   */
  emit(
    eventInfo: EventInfoType = {
      eventName: '',
      payloadFn: () => true,
      trigger: [],
      listener: {},
    },
    payload: any,
    triggerName: string
  ): EventManager {
    const { eventName, payloadFn, trigger, listener } = eventInfo;
    if (!eventName) {
      console.error(
        '【 EventManager emit error 】 eventInfo.eventName cannot be empty!'
      );
      return this;
    }

    if (typeof payloadFn !== 'function') {
      console.error(
        '【 EventManager emit error 】 eventInfo.payloadFn must be a function!'
      );
      return this;
    }

    if (!trigger.find((item) => item === triggerName)) {
      console.error(
        `【 EventManager emit error 】 ${triggerName} no permission to trigger!`
      );
      return this;
    }

    if (!payloadFn(payload)) {
      console.error('【 EventManager emit error 】 Invalid payload parameter');
      return this;
    }

    if (!this._events[eventName]) {
      console.warn(`【 EventManager emit warn 】 ${eventName} 事件尚未创建!`);
      return this;
    }

    debug &&
      console.info(
        `【 EventManager log 】${triggerName} 触发了 ${eventName} 事件`,
        payload,
        { eventName, payloadFn, trigger, listener }
      );

    // 执行事件回调
    Object.keys(this._events[eventName].listener).forEach((listenerName) => {
      debug &&
        console.info(
          `【 EventManager log 】${eventName} 事件监听者 ${listenerName} 被触发`,
          payload
        );

      // 检查是否存在回调函数 不存在则该监听者尚未注册
      if (this._events[eventName].listener[listenerName].fn) {
        this._events[eventName].listener[listenerName].fn(payload);
      } else {
        console.warn(
          `【 EventManager emit warn 】 ${eventName} 事件监听者 ${listenerName} 尚未注册!`
        );
      }

      // 检查该事件监听函数是否只执行一次
      if (this._events[eventName].listener[listenerName].once) {
        // 移除该事件监听函数
        this._events[eventName].listener[listenerName].fn = () => {};

        debug &&
          console.info(
            `【 EventManager log 】${eventName} 事件监听者 ${listenerName} 被移除`,
            payload
          );
      }
    });
    return this;
  }

  /**
   * off 解绑事件处理函数
   *
   * @param {string} eventName 事件名称,不传则全部解绑
   * @param {string} listenerName 事件监听者名称,不传则该事件全部监听都进行解绑
   * @returns {Object} EventManager 事件管理器，方便链式调用
   */
  off(eventName: string = '', listenerName?: string): EventManager {
    if (eventName === '') {
      debug && console.info('【 EventManager log 】移除所有事件监听函数');

      this._events = {};
      return this;
    }

    if (listenerName === '') {
      debug &&
        console.info(
          `【 EventManager log 】移除 ${eventName} 事件所有监听函数`
        );

      delete this._events[eventName].listener;
      return this;
    }

    debug &&
      console.info(
        `【 EventManager log 】移除 ${eventName} 事件监听函数 ${listenerName}`
      );

    this._events[eventName].listener[listenerName].fn = () => {};
    return this;
  }
}

export default new EventManager();
