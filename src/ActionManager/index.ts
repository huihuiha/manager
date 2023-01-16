/**
 * @file ActionManager
 * @description 交互管理器
 */

import type {
  OrderByType,
  SupportEvent,
  SupportEventFn,
  ActionFnType,
  ActionInfoType,
  ActionQueueType,
  EventFnType,
  EventInfoType,
} from './types';

// debug控制开关 true 打开log、 false 关闭log
let debug: boolean = false;

/**
 * 交互基类
 */
class Action {
  // 排序规则
  protected orderBy: OrderByType = 'DESC';
  // 交互队列
  public queue: ActionQueueType[];
  // 支持的事件列表
  private _supportEvents: SupportEvent[] = ['action', 'done', 'allDone'];
  // 事件监听函数集合
  private _eventFn: SupportEventFn = {
    // 交互执行事件监听回调函数集合
    action: {},
    // 交互结束事件监听回调函数集合
    done: {},
    // 交互全部结束事件监听回调函数集合
    allDone: {},
  };

  constructor(orderBy?: OrderByType) {
    this.orderBy = orderBy;
    this.queue = [];
  }

  /**
   * enQueue 交互入队
   *
   * @param {ActionFnType} actionFn 交互回调函数
   * @param {ActionInfoType} actionInfo 交互配置信息
   */
  enQueue(
    actionFn: ActionFnType = () => {},
    actionInfo: ActionInfoType = {
      name: '',
      weight: 0,
      series: true,
      exec: false,
      status: 'wait',
    }
  ) {
    // 查找交互队列中是否已入队该交互
    let action = this.queue.find(
      (action) => action.actionInfo.name === actionInfo.name
    );
    if (action) {
      // 已入队该交互则更新交互信息
      action.actionFn = actionFn;
      action.actionInfo = {
        ...action.actionInfo,
        ...actionInfo,
        status: 'wait',
      };

      debug &&
        console.info(
          '【 ActionManager log 】交互入队过程中发现交互已存在，更新交互信息',
          action
        );
    } else {
      // 未入队该交互则入队交互
      this.queue.push({
        // 交互回调函数
        actionFn,
        // 交互信息
        actionInfo: {
          // 是否串行 默认为true
          series: true,
          // clear时是否执行交互回调函数 默认为false
          exec: false,
          ...actionInfo,
          // 交互状态 wait => 等待、 start 交互开始、 end 交互结束
          status: 'wait',
        },
      });

      debug && console.info('【 ActionManager log 】交互入队', actionInfo);
    }

    // 对交互队列进行重新排序
    this.queue.sort((a, b) => {
      return this.orderBy === 'ASC'
        ? a.actionInfo.weight - b.actionInfo.weight
        : b.actionInfo.weight - a.actionInfo.weight;
    });

    debug && console.info('【 ActionManager log 】交互排序', this.queue);
  }

  /**
   * unQueue 交互出队
   */
  unQueue() {
    // 检查当前是否已有串行交互在执行
    let actioning = this.queue.find(
      (action) =>
        action.actionInfo.status === 'start' && action.actionInfo.series
    );
    if (actioning) {
      debug &&
        console.info(
          '【 ActionManager log 】交互正在执行，出队操作被阻止',
          actioning.actionInfo
        );
      return;
    }

    // 查找交互队列中首个等待中的交互
    let action = this.queue.find(
      (action) => action.actionInfo.status === 'wait'
    );
    if (!action) {
      debug && console.info('【 ActionManager log 】交互已全部结束');

      // 执行 allDone 监听事件回调
      Object.keys(this._eventFn.allDone).forEach((allDoneFnName) => {
        debug &&
          console.info(
            `【 ActionManager log 】allDone 事件监听函数 ${allDoneFnName} 被触发`,
            this.queue
          );

        this._eventFn.allDone[allDoneFnName].fn(this.queue);

        // 检查该事件监听函数是否只执行一次
        if (
          this._eventFn.allDone[allDoneFnName] &&
          this._eventFn.allDone[allDoneFnName].once
        ) {
          // 移除该事件监听函数
          this._eventFn.allDone[allDoneFnName].fn = () => {};

          debug &&
            console.info(
              `【 ActionManager log 】allDone 事件监听函数 ${allDoneFnName} 被移除`,
              this.queue
            );
        }
      });
      return;
    }

    debug &&
      console.info(
        `【 ActionManager log 】${action.actionInfo.name} 交互执行`,
        action.actionInfo
      );

    // 标记交互开始
    action.actionInfo.status = 'start';

    // 执行当前交互
    action.actionFn(action.actionInfo, this.queue);

    // 检查当前交互是否为非串行交互（串行交互不可与其他交互叠加展示，反之则可叠加展示，不需要等待其结束）
    // eg. 先入队了一个弱打扰型交互（tips提示引导），后入队了一个强打扰型交互（获奖弹窗）
    if (!action.actionInfo.series) {
      debug &&
        console.info(
          `【 ActionManager log 】${action.actionInfo.name} 是非串行交互，故继续执行下个交互`
        );

      // 并行交互可与其他交互叠加展示（不需要等其结束）
      this.unQueue();
    }

    // 执行 action 监听事件回调
    Object.keys(this._eventFn.action).forEach((actionFnName) => {
      debug &&
        console.info(
          `【 ActionManager log 】action 事件监听函数 ${actionFnName} 被触发`,
          action.actionInfo
        );

      this._eventFn.action[actionFnName].fn(action.actionInfo, this.queue);

      // 检查该事件监听函数是否只执行一次
      if (
        this._eventFn.action[actionFnName] &&
        this._eventFn.action[actionFnName].once
      ) {
        // 移除该事件监听函数
        this._eventFn.action[actionFnName].fn = () => {};

        debug &&
          console.info(
            `【 ActionManager log 】action 事件监听函数 ${actionFnName} 被移除`,
            action.actionInfo
          );
      }
    });
  }

  /**
   * done 交互结束
   * @param {string} actionName 交互名称
   */
  done(actionName: string = '') {
    // 查找交互队列中是否已入队该交互
    let action = this.queue.find(
      (action) => action.actionInfo.name === actionName
    );
    if (action) {
      debug &&
        console.info(
          `【 ActionManager log 】${action.actionInfo.name} 交互结束`,
          action.actionInfo
        );

      // 标记交互结束
      action.actionInfo.status = 'end';

      // 执行 done 监听事件回调
      Object.keys(this._eventFn.done).forEach((doneFnName) => {
        debug &&
          console.info(
            `【 ActionManager log 】done 事件监听函数 ${doneFnName} 被触发`,
            action.actionInfo
          );

        this._eventFn.done[doneFnName].fn(action.actionInfo, this.queue);

        // 检查该事件监听函数是否只执行一次
        if (
          this._eventFn.done[doneFnName] &&
          this._eventFn.done[doneFnName].once
        ) {
          // 移除该事件监听函数
          this._eventFn.done[doneFnName].fn = () => {};

          debug &&
            console.info(
              `【 ActionManager log 】done 事件监听函数 ${doneFnName} 被移除`,
              action.actionInfo
            );
        }
      });

      // 交互出队 继续执行下一个交互
      this.unQueue();
    } else {
      debug &&
        console.info(
          `【 ActionManager log 】执行 ${actionName} 交互结束时发生错误，在交互队列中未找到该交互！`
        );
    }
  }

  /**
   * on 绑定事件处理函数，支持绑定多个处理函数
   *
   * @param {SupportEvent} event 事件类型
   * @param {EventFnType} fn 该事件被触发时执行的函数
   * @param {EventInfoType} options 可选参数
   */
  on(
    event: SupportEvent,
    fn: EventFnType = () => {},
    options: EventInfoType = { namespace: '', once: false }
  ) {
    if (typeof event !== 'string' || !event) {
      console.error(
        '【 ActionManager Action.on error 】 event must be a string!'
      );
      return this;
    }

    if (typeof fn !== 'function') {
      console.error(
        '【 ActionManager Action.on error 】 fn must be a function!'
      );
      return this;
    }

    if (this._supportEvents.indexOf(event) < 0) {
      console.error(
        '【 ActionManager Action.on error 】 event only supports "action"、"done"、"allDone"!'
      );
      return this;
    }

    if (!options.namespace) {
      options.namespace = `${event}_fn_${
        Object.keys(this._eventFn[event]).length + 1
      }`;
    }

    debug &&
      console.info(
        `【 ActionManager log 】注册 ${event} 事件监听函数 ${options.namespace}`,
        options
      );

    this._eventFn[event][options.namespace] = { fn, once: options.once };
    return this;
  }

  /**
   * off 解绑事件处理函数
   *
   * @param {SupportEvent} event action => 交互进行、 done => 交互结束、 allDone => 交互全部结束
   * @param {string} namespace 函数的命名空间，即唯一标识符，不传则全部解绑
   */
  off(event: SupportEvent = 'action', namespace: string = '') {
    if (!event) {
      debug && console.info('【 ActionManager log 】移除所有事件监听函数');

      this._eventFn = { action: {}, done: {}, allDone: {} };
      return this;
    }

    if (this._supportEvents.indexOf(event) < 0) {
      console.error(
        '【 ActionManager Action.off error 】 event only supports "action"、"done"、"allDone"!'
      );
      return this;
    }

    if (namespace === '') {
      debug &&
        console.info(`【 ActionManager log 】移除 ${event} 事件所有监听函数`);

      this._eventFn[event] = {};
      return this;
    }

    debug &&
      console.info(
        `【 ActionManager log 】移除 ${event} 事件监听函数 ${namespace}`
      );

    this._eventFn[event][namespace].fn = () => {};
    return this;
  }

  /**
   * clear 清空交互队列
   * @description 注意：清空队列时并不会将正在执行的交互一并停止
   */
  clear() {
    debug && console.info('【 ActionManager log 】清空交互队列');

    // 遍历交互队列
    this.queue.forEach((action) => {
      // 当前交互是否为等待状态
      action.actionInfo.status === 'wait' &&
        // 是否执行回调
        action.actionInfo.exec &&
        // 执行当前交互
        action.actionFn(action.actionInfo, this.queue);
    });

    // 清空交互队列
    this.queue = [];
    return this;
  }
}

/**
 * 交互管理器
 */
class ActionManager {
  // 交互实例集合
  private _actions: Record<string, Action>;
  // 当前处于激活态的交互实例
  private _activated: string;

  constructor() {
    this._actions = {
      __DEFAULT__: new Action(),
    };
    this._activated = '__DEFAULT__';
  }

  /**
   * debug 打开调试日志
   *
   */
  debug() {
    debug = true;
  }

  /**
   * init 创建交互实例
   *
   * @param {String} instanceName 交互实例的名称，建议传递命名空间防止多次调用被覆盖
   * @param {OrderByType} orderBy 排序规则  ASC 升序、 DESC 降序
   */
  init(
    instanceName: string = '__DEFAULT__',
    orderBy: OrderByType = 'DESC'
  ): ActionManager {
    debug &&
      console.info(`【 ActionManager log 】初始化交互实例 ${instanceName}`);

    // 初始化交互实例
    this._actions[instanceName] = new Action(orderBy);

    // 激活交互实例
    this.use(instanceName);

    return this;
  }

  /**
   * use 激活交互实例
   *
   * @description 当页面切换或onShow/onHide时，需要激活对应的交互实例
   * @param {String} instanceName 需要激活的交互实例名称
   */
  use(instanceName: string = '__DEFAULT__'): ActionManager {
    debug &&
      console.info(`【 ActionManager log 】激活交互实例 ${instanceName}`);

    // 记录当前被激活的交互实例名称
    this._activated = instanceName;
    return this;
  }

  /**
   * enQueue 交互入队
   *
   * @param {ActionFnType} actionFn 交互回调函数
   * @param {ActionInfoType} actionInfo 交互信息
   */
  enQueue(
    actionFn: ActionFnType = () => {},
    actionInfo: ActionInfoType = {
      name: '',
      weight: 0,
      series: true,
      exec: false,
      status: 'wait',
    }
  ): ActionManager {
    // 检查是否传递交互名称
    if (actionInfo.name === '') {
      console.error(
        '【 ActionManager.enQueue error 】 actionInfo.name cannot be empty!'
      );
      return this;
    }

    this._actions[this._activated].enQueue(actionFn, actionInfo);
    return this;
  }

  /**
   * start 启动交互实例
   */
  start(): ActionManager {
    debug &&
      console.info(`【 ActionManager log 】启动交互实例 ${this._activated}`);

    this._actions[this._activated].unQueue();
    return this;
  }

  /**
   * done 交互结束
   * @param {string} actionName 交互名称
   */
  done(actionName: string = ''): ActionManager {
    if (actionName === '') {
      console.error(
        '【 ActionManager.done error 】 actionName cannot be empty!'
      );
      return this;
    }

    this._actions[this._activated].done(actionName);
    return this;
  }

  /**
   * on 绑定事件处理函数，支持绑定多个处理函数
   *
   * @param {SupportEvent} event 事件类型
   * @param {EventFnType} fn 该事件被触发时执行的函数
   * @param {EventInfoType} options 可选参数
   */
  on(
    event: SupportEvent,
    fn: EventFnType,
    options?: EventInfoType
  ): ActionManager {
    this._actions[this._activated].on(event, fn, options);
    return this;
  }

  /**
   * off 解绑事件处理函数
   *
   * @param {SupportEvent} event action => 交互进行、 done => 交互结束、 allDone => 交互实例中的交互全部结束
   * @param {string} namespace 函数的命名空间，即唯一标识符，不传则全部解绑
   * @param {string} instanceName 需要清空的交互实例名称
   */
  off(
    event: SupportEvent = 'action',
    namespace: string = '',
    instanceName: string = ''
  ): ActionManager {
    instanceName = instanceName || this._activated;

    this._actions[instanceName] &&
      this._actions[instanceName].off(event, namespace);
    return this;
  }

  /**
   * clear 清空交互队列
   * @description 注意：清空队列时并不会将正在执行的交互一并停止
   * @param {string} instanceName 需要清空的交互实例名称
   */
  clear(instanceName?: string): ActionManager {
    instanceName = instanceName || this._activated;

    this._actions[instanceName] && this._actions[instanceName].clear();
    return this;
  }

  /**
   * getActionQueue 获取当前
   * @param {string} instanceName 获取交互实例名称
   */
  getActionQueue(instanceName?: string): ActionQueueType[] {
    instanceName = instanceName || this._activated;

    return this._actions[instanceName].queue;
  }
}

export default new ActionManager();
