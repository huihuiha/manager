/**
 * @file TimeManager
 * @description 定时器管理器
 * @author chenhui20@baidu.com
 *
 * 设计文档
 * @see http://agroup.baidu.com/share/md/38ebc0f344a448c7a276be8dff8635d0
 *
 * 使用文档
 * @see 参考 READEME.md
 *
 */

// debug控制开关 true 打开log、 false 关闭log
let debug = false;

/**
 * 定时器基类
 */
class Time {
  constructor(instanceName = '', time = 0) {
    // 定时器实例名称
    this._name = instanceName;

    // 定时器ID
    this._timer = null;

    // 定时器时长
    this._time = time;

    // 定时器执行过程中触发 progress 事件的单位时长，为 0 则不触发 progress 事件
    this._progressTime = 0;

    // progress 事件执行次数【首次执行不计入次数】（用来矫正定时器误差）
    this._progressCount = 0;

    // 定时器时开始执行时间（用来矫正定时器误差）
    this._startTime = 0;

    // 支持的事件列表
    this._supportEvents = ['progress', 'end'];

    // 事件监听函数集合
    this._eventFn = {
      // 定时器执行过程事件监听回调函数集合
      progress: {},
      // 定时器执行结束事件监听回调函数集合
      end: {},
    };
  }

  /**
   * run 启动定时器
   *
   * @param {Number} time 定时器执行时长 单位 ms
   * @param {Number} progressTime 定时器执行过程中触发 progress 事件的单位时长
   * @tip progress 事件执行时间间隔，常用于倒计时场景(单位 ms)，不传或为 0 则不触发 progress 事件
   * @returns {Object} Time 定时器实例，方便链式调用
   */
  run(time = 0, progressTime = 0) {
    debug &&
      console.info(
        `【 TimeManager log 】启动定时器实例 ${this._name}，时长 ${time}`
      );

    // 重置定时器
    this._reset(time, progressTime);

    // 执行定时器处理函数
    this._next();

    return this;
  }

  /**
   * reset 重置定时器
   *
   * @param {Number} time 定时器执行时长 单位 ms
   * @param {Number} progressTime 定时器执行过程中触发 progress 事件的单位时长
   * @tip progress 事件执行时间间隔，常用于倒计时场景(单位 ms)，不传或为 0 则不触发 progress 事件
   */
  _reset(time = 0, progressTime = 0) {
    debug &&
      console.info(
        `【 TimeManager log 】重置定时器实例 ${this._name} 基础参数`
      );

    // 如果当前存在正在执行的定时器
    if (this._timer) {
      // 停止定时器
      clearTimeout(this._timer);
      // 清空定时器ID
      this._timer = null;
    }

    // progress 事件执行次数计数归零
    this._progressCount = 0;

    // 重新设置定时器时开始执行时间
    this._startTime = Date.now();

    // 重新设置定时器时长
    this._time = time;

    // 重新设置定时器执行过程中触发 progress 事件的单位时长 (progress 事件执行时间间隔)
    this._progressTime = progressTime;
  }

  // 定时器处理函数
  _next() {
    // 定时器时长尚未结束
    if (this._time > 0) {
      // 执行 progress 事件监听函数
      this._execProgress();

      // 计算定时器 progress 事件执行误差值 当前时间 - (定时器开始执行时间 + progress 事件执行次数【首次执行不计入次数】 * progress 事件执行时间间隔)
      let timeDiff =
        Date.now() -
        (this._startTime + this._progressCount * this._progressTime);

      // 计算下一次 progress 事件执行时机
      let nextTime =
        this._progressTime > 0 && this._progressTime <= this._time
          ? this._progressTime - timeDiff
          : this._time - timeDiff;

      // 如果下一次 progress 事件执行时机小于 0 则置为 0
      if (nextTime < 0) {
        nextTime = 0;
      }

      // 定义下一个 progress 事件定时器
      this._timer = setTimeout(() => {
        // 校验是否设置 _progressTime && progress间隔时间小于等于剩余时间
        if (this._progressTime > 0 && this._progressTime <= this._time) {
          // 更新定时器执行时长
          this._time -= this._progressTime;
          // 更新 progress 事件执行次数
          this._progressCount++;
        } else {
          // 更新定时器执行时长
          this._time = 0;
        }

        // 执行下一个 progress 事件
        this._next();
      }, nextTime);
    }

    // 定时器执行结束
    else {
      // PS: 手百安卓 若先执行 clearTimeout 清空倒计时，则后续回调将会不执行 待小程序团队修复
      // clearTimeout(this.timer);

      // 重置定时器
      this._reset();

      // 执行 end 事件监听函数
      this._execEnd('end');
    }
  }

  // 定时器直接进入结束阶段
  _toEnd() {
    this._time = 0;
  }

  // 执行 progress 事件监听函数
  _execProgress() {
    // 校验定时器在执行过程中是否需要触发 progress 事件
    this._progressTime &&
      Object.keys(this._eventFn.progress).forEach((progressFnName) => {
        debug &&
          console.info(
            `【 TimeManager log 】定时器实例 ${this._name}, progress 事件监听函数 ${progressFnName} 被触发`
          );

        // 执行 progress 事件监听函数
        this._eventFn.progress[progressFnName].fn(
          this._time,
          this._toEnd.bind(this)
        );

        // 检查该事件监听函数是否只执行一次
        if (
          this._eventFn.progress[progressFnName] &&
          this._eventFn.progress[progressFnName].once
        ) {
          // 移除该事件监听函数
          this._eventFn.progress[progressFnName].fn = () => {};

          debug &&
            console.info(
              `【 TimeManager log 】定时器实例 ${this._name}, progress 事件监听函数 ${progressFnName} 被移除`
            );
        }
      });
  }

  /**
   * _execEnd 执行 end 事件监听函数
   * @param {String} type 触发函数处理的来源 end 定时器自然结束、 stop 用户主动停止
   */
  _execEnd(type = 'end') {
    Object.keys(this._eventFn.end).forEach((endFnName) => {
      if (
        type === 'end' ||
        (type === 'stop' && this._eventFn.end[endFnName].exec)
      ) {
        debug &&
          console.info(
            `【 TimeManager log 】定时器实例 ${this._name}, end 事件监听函数 ${endFnName} 被触发`
          );

        // 执行 end 事件监听函数
        this._eventFn.end[endFnName].fn();

        // 检查该事件监听函数是否只执行一次
        if (this._eventFn.end[endFnName] && this._eventFn.end[endFnName].once) {
          // 移除该事件监听函数
          this._eventFn.end[endFnName].fn = () => {};

          debug &&
            console.info(
              `【 TimeManager log 】定时器实例 ${this._name}, end 事件监听函数 ${endFnName} 被移除`
            );
        }
      }
    });
  }

  /**
   * on 绑定事件处理函数，支持绑定多个处理函数
   *
   * @param {String} event 事件类型  progress => 定时器执行中、 end => 定时器执行结束
   * @param {Function} fn 该事件被触发时执行的函数
   * @param {Object} options 可选参数
   * @param {String} options.namespace 函数的命名空间，即唯一标识符，同名函数会被覆盖
   * @param {Boolean} options.once 函数是否只执行一次 默认 false
   * @param {Boolean} options.exec 定时器非正常停止时监听函数是否执行 默认 false，(通常在定时器模拟动画结束【animationend】时使用)
   * @returns {Object} Time 定时器实例，方便链式调用
   */
  on(
    event,
    fn = () => {},
    options = { namespace: '', once: false, exec: false }
  ) {
    if (typeof event !== 'string' || !event) {
      console.error('【 TimeManager Time.on error 】 event must be a string!');
      return this;
    }
    if (typeof fn !== 'function') {
      console.error('【 TimeManager Time.on error 】 fn must be a function!');
      return this;
    }
    if (this._supportEvents.indexOf(event) < 0) {
      console.error(
        '【 TimeManager Time.on error 】 event only supports "progress"、"end"!'
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
        `【 TimeManager log 】定时器实例 ${this._name}, 注册 ${event} 事件监听函数 ${options.namespace}`,
        options
      );
    this._eventFn[event][options.namespace] = {
      fn,
      once: options.once,
      exec: options.exec,
    };
    return this;
  }

  /**
   * off 解绑事件处理函数
   *
   * @param {String} event progress => 定时器执行中、 end => 定时器执行结束
   * @param {String} namespace 函数的命名空间，即唯一标识符，不传则全部解绑
   * @returns {Object} Time 定时器实例，方便链式调用
   */
  off(event = '', namespace = '') {
    if (event === '') {
      debug &&
        console.info(
          `【 TimeManager log 】定时器实例 ${this._name}, 移除所有事件监听函数`
        );
      this._eventFn = { progress: {}, end: {} };
      return this;
    }
    if (this._supportEvents.indexOf(event) < 0) {
      console.error(
        '【 TimeManager Time.off error 】 event only supports "progress"、"end"!'
      );
      return this;
    }
    if (namespace === '') {
      debug &&
        console.info(
          `【 TimeManager log 】定时器实例 ${this._name}, 移除 ${event} 事件所有监听函数`
        );
      this._eventFn[event] = {};
      return this;
    }
    debug &&
      console.info(
        `【 TimeManager log 】定时器实例 ${this._name}, 移除 ${event} 事件监听函数 ${namespace}`
      );
    this._eventFn[event][namespace].fn = () => {};
    return this;
  }

  /**
   * _stop 停止定时器
   * @returns {Promise} Promise.resolve 停止定时器成功
   */
  _stop() {
    debug && console.info(`【 TimeManager log 】定时器实例 ${this._name} 停止`);

    // 如果当前定时器正在执行
    if (this._time) {
      // 重置定时器
      this._reset();

      // 执行 end 事件监听函数
      this._execEnd('stop');
    }

    return Promise.resolve();
  }
}

/**
 * 定时器管理器
 */
class TimeManager {
  constructor() {
    // 定时器实例集合
    this._timers = {
      // 默认定时器实例
      __DEFAULT__: new Time('__DEFAULT__'),
    };
  }

  /**
   * debug 打开调试日志
   *
   */
  debug() {
    debug = true;
  }

  /**
   * timer 创建/获取定时器实例
   *
   * @param {String} instanceName 定时器实例的名称，建议传递命名空间防止多次调用被覆盖
   * @returns {Object} Time 定时器实例，方便链式调用
   */
  timer(instanceName = '__DEFAULT__') {
    // 如果不存在该定时器实例
    if (!this._timers[instanceName]) {
      // 创建定时器实例
      this._timers[instanceName] = new Time(instanceName);

      debug &&
        console.info(`【 TimeManager log 】创建定时器实例 ${instanceName}`);
    } else {
      debug &&
        console.info(`【 TimeManager log 】获取定时器实例 ${instanceName}`);
    }

    return this._timers[instanceName];
  }

  /**
   * stop 停止定时器
   *
   * @param {String} instanceName 定时器实例的名称，建议传递命名空间防止多次调用被覆盖
   * @returns {Object} TimeManager 定时器管理器，方便链式调用
   */
  stop(instanceName = '') {
    if (instanceName) {
      this._timers[instanceName] &&
        this._timers[instanceName]._time > 0 &&
        this._timers[instanceName]._stop().then(() => this.stop(instanceName));
    } else {
      // 定时器排序
      let timer = Object.values(this._timers)
        .sort((a, b) => a._time - b._time)
        .find((item) => item._time > 0);
      timer && this._timers[timer._name]._stop().then(() => this.stop());
    }

    return this;
  }
}

export default new TimeManager();
