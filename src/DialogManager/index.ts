/**
 * @file DialogManager
 * @description 弹窗管理器
 */

import type {
  DialogInfoType,
  SupportEventFn,
  SupportEventsType,
  EventFnType,
  EventInfoType,
} from './types';

// debug控制开关 true 打开log、 false 关闭log
let debug = false;

/**
 * 弹窗基类
 */
class Dialog {
  protected dialogInfo: DialogInfoType = {
    // 弹窗名称
    name: '',
    // 弹窗数据
    data: {},
  };
  // 支持的事件列表
  private _supportEvents: SupportEventsType[] = ['show', 'close'];
  // 事件监听函数集合
  private _eventFn: SupportEventFn = {
    // 弹窗展示事件集合
    show: {},
    // 弹窗关闭事件集合
    close: {},
  };

  /**
   * show 展示弹窗
   * @param {DialogInfoType} dialogInfo 弹窗信息
   */
  show(dialogInfo: DialogInfoType = { name: '', data: {} }) {
    debug && console.info(`【 DialogManager log 】${dialogInfo.name} 被打开`);

    // 记录当前弹窗数据
    this.dialogInfo = dialogInfo;

    // 执行 show 监听事件
    Object.keys(this._eventFn.show).forEach((showFnName) => {
      debug &&
        console.info(
          `【 DialogManager log 】show 事件监听函数 ${showFnName} 被触发`,
          dialogInfo
        );

      this._eventFn.show[showFnName].fn(dialogInfo);

      // 检查该事件监听函数是否只执行一次
      if (
        this._eventFn.show[showFnName] &&
        this._eventFn.show[showFnName].once
      ) {
        // 移除该事件监听函数
        this._eventFn.show[showFnName].fn = () => {};

        debug &&
          console.info(
            `【 DialogManager log 】show 事件监听函数 ${showFnName} 被移除`,
            dialogInfo
          );
      }
    });
  }

  /**
   * close 关闭弹窗
   * @param {Object} payload 关闭弹窗时传递的数据
   */
  close(payload: Record<string, any> = {}) {
    // 拷贝弹窗数据供 close 监听事件使用
    const dialogInfo = JSON.parse(JSON.stringify(this.dialogInfo));

    debug && console.info(`【 DialogManager log 】${dialogInfo.name} 被关闭`);

    // 执行 close 监听事件
    Object.keys(this._eventFn.close).forEach((closeFnName) => {
      debug &&
        console.info(
          `【 DialogManager log 】close 事件监听函数 ${closeFnName} 被触发`,
          dialogInfo
        );

      this._eventFn.close[closeFnName].fn(dialogInfo, payload);

      // 检查该事件监听函数是否只执行一次
      if (
        this._eventFn.close[closeFnName] &&
        this._eventFn.close[closeFnName].once
      ) {
        // 移除该事件监听函数
        this._eventFn.close[closeFnName].fn = () => {};

        debug &&
          console.info(
            `【 DialogManager log 】close 事件监听函数 ${closeFnName} 被移除`,
            dialogInfo
          );
      }
    });
  }

  /**
   * on 绑定事件处理函数，支持绑定多个处理函数
   * @param {SupportEventsType} event 事件类型 show => 弹窗展示、 close => 弹窗关闭
   * @param {EventFnType} fn 该事件被触发时执行的函数
   * @param {EventInfoType} options 可选参数
   */
  on(
    event: SupportEventsType,
    fn: EventFnType = () => {},
    options: EventInfoType = { namespace: '', once: false }
  ): Dialog {
    if (typeof event !== 'string' || !event) {
      console.error('【 DialogManager.on error 】 event must be a string!');
      return this;
    }

    if (typeof fn !== 'function') {
      console.error('【 DialogManager.on error 】 fn must be a function!');
      return this;
    }

    if (this._supportEvents.indexOf(event) < 0) {
      console.error(
        '【 DialogManager.on error 】 event only supports "show"、"close"!'
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
        `【 DialogManager log 】注册 ${event} 事件监听函数 ${options.namespace}`,
        options
      );

    this._eventFn[event][options.namespace] = { fn, once: options.once };
    return this;
  }

  /**
   * off 解绑事件处理函数
   * @param {SupportEventsType} event 事件类型 show => 弹窗展示、 close => 弹窗关闭
   * @param {String} namespace 函数的命名空间，即唯一标识符，不传则全部解绑
   */
  off(event: SupportEventsType = 'show', namespace: string = ''): Dialog {
    if (!event) {
      debug && console.info('【 DialogManager log 】移除所有事件监听函数');

      this._eventFn = { show: {}, close: {} };
      return this;
    }

    if (this._supportEvents.indexOf(event) < 0) {
      console.error(
        '【 DialogManager.off error 】 event only supports "show"、"close"!'
      );
      return this;
    }

    if (namespace === '') {
      debug &&
        console.info(`【 DialogManager log 】移除 ${event} 事件所有监听函数`);

      this._eventFn[event] = {};
      return this;
    }

    debug &&
      console.info(
        `【 DialogManager log 】移除 ${event} 事件监听函数 ${namespace}`
      );
    this._eventFn[event][namespace].fn = () => {};
    return this;
  }
}

/**
 * 弹窗管理器
 */
class DialogManager {
  // 弹窗实例集合
  private _dialogs: Record<string, Dialog> = {
    // 默认实例
    __DEFAULT__: new Dialog(),
  };

  // 当前处于激活态的弹窗实例
  private _activated = '__DEFAULT__';

  /**
   * debug 打开调试日志
   */
  debug() {
    debug = true;
  }

  /**
   * init 创建弹窗实例
   * @param {string} instanceName 弹窗实例的名称，建议传递命名空间防止多次调用被覆盖
   * @returns {Object} DialogManager 弹窗管理器，方便链式调用
   */
  init(instanceName: string = '__DEFAULT__'): DialogManager {
    debug &&
      console.info(`【 DialogManager log 】初始化弹窗实例 ${instanceName}`);

    // 初始化弹窗实例
    this._dialogs[instanceName] = new Dialog();

    // 激活弹窗实例
    this.use(instanceName);

    return this;
  }

  /**
   * use 激活弹窗实例
   * @description 当页面切换或onShow/onHide时，需要激活对应的弹窗实例
   * @param {string} instanceName 需要激活的弹窗实例名称
   * @returns {DialogManager} DialogManager 弹窗管理器，方便链式调用
   */
  use(instanceName: string = '__DEFAULT__'): DialogManager {
    debug &&
      console.info(`【 DialogManager log 】激活弹窗实例 ${instanceName}`);

    // 记录当前被激活的弹窗实例名称
    this._activated = instanceName;
    return this;
  }

  /**
   * show 展示弹窗
   * @param {DialogInfoType} dialogInfo 弹窗信
   * @returns {DialogManager} DialogManager 弹窗管理器，方便链式调用
   */
  show(dialogInfo: DialogInfoType): DialogManager {
    // 检查是否传递弹窗名称
    if (dialogInfo.name === '') {
      console.error(
        '【 DialogManager.show error 】 dialogInfo.name cannot be empty!'
      );
      return this;
    }

    this._dialogs[this._activated].show(dialogInfo);
    return this;
  }

  /**
   * close 关闭弹窗
   *
   * @param {Object} payload 关闭弹窗时传递的数据
   * @returns {DialogManager} DialogManager 弹窗管理器，方便链式调用
   */
  close(payload: Record<string, any> | any = {}): DialogManager {
    this._dialogs[this._activated].close(payload);
    return this;
  }

  /**
   * on 绑定事件处理函数，支持绑定多个处理函数
   * @param {SupportEventsType} event 事件类型 show => 弹窗展示、 close => 弹窗关闭
   * @param {EventFnType} fn 该事件被触发时执行的函数
   * @param {EventInfoType} options 可选参数
   * @returns {Object} DialogManager 弹窗管理器，方便链式调用
   */
  on(
    event: SupportEventsType,
    fn: EventFnType = () => {},
    options: EventInfoType = { namespace: '', once: false }
  ): DialogManager {
    this._dialogs[this._activated].on(event, fn, options);
    return this;
  }

  /**
   * off 解绑事件处理函数
   * @param {SupportEventsType} event 事件类型 show => 弹窗展示、 close => 弹窗关闭
   * @param {string} namespace 函数的命名空间，即唯一标识符，不传则全部解绑
   * @returns {Object} DialogManager 弹窗管理器，方便链式调用
   */
  off(event: SupportEventsType, namespace: string = ''): DialogManager {
    this._dialogs[this._activated].off(event, namespace);
    return this;
  }
}

export default new DialogManager();
