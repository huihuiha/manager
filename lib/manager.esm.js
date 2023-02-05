/**
 * @file ActionManager
 * @description 交互管理器
 */
// debug控制开关 true 打开log、 false 关闭log
let debug$3 = false;
/**
 * 交互基类
 */
class Action {
    constructor(orderBy) {
        // 排序规则
        this.orderBy = 'DESC';
        // 支持的事件列表
        this._supportEvents = ['action', 'done', 'allDone'];
        // 事件监听函数集合
        this._eventFn = {
            // 交互执行事件监听回调函数集合
            action: {},
            // 交互结束事件监听回调函数集合
            done: {},
            // 交互全部结束事件监听回调函数集合
            allDone: {},
        };
        this.orderBy = orderBy;
        this.queue = [];
    }
    /**
     * enQueue 交互入队
     *
     * @param {ActionFnType} actionFn 交互回调函数
     * @param {ActionInfoType} actionInfo 交互配置信息
     */
    enQueue(actionFn = () => { }, actionInfo = {
        name: '',
        weight: 0,
        series: true,
        exec: false,
        status: 'wait',
    }) {
        // 查找交互队列中是否已入队该交互
        let action = this.queue.find((action) => action.actionInfo.name === actionInfo.name);
        if (action) {
            // 已入队该交互则更新交互信息
            action.actionFn = actionFn;
            action.actionInfo = Object.assign(Object.assign(Object.assign({}, action.actionInfo), actionInfo), { status: 'wait' });
            debug$3 &&
                console.info('【 ActionManager log 】交互入队过程中发现交互已存在，更新交互信息', action);
        }
        else {
            // 未入队该交互则入队交互
            this.queue.push({
                // 交互回调函数
                actionFn,
                // 交互信息
                actionInfo: Object.assign(Object.assign({ 
                    // 是否串行 默认为true
                    series: true, 
                    // clear时是否执行交互回调函数 默认为false
                    exec: false }, actionInfo), { 
                    // 交互状态 wait => 等待、 start 交互开始、 end 交互结束
                    status: 'wait' }),
            });
            debug$3 && console.info('【 ActionManager log 】交互入队', actionInfo);
        }
        // 对交互队列进行重新排序
        this.queue.sort((a, b) => {
            return this.orderBy === 'ASC'
                ? a.actionInfo.weight - b.actionInfo.weight
                : b.actionInfo.weight - a.actionInfo.weight;
        });
        debug$3 && console.info('【 ActionManager log 】交互排序', this.queue);
    }
    /**
     * unQueue 交互出队
     */
    unQueue() {
        // 检查当前是否已有串行交互在执行
        let actioning = this.queue.find((action) => action.actionInfo.status === 'start' && action.actionInfo.series);
        if (actioning) {
            debug$3 &&
                console.info('【 ActionManager log 】交互正在执行，出队操作被阻止', actioning.actionInfo);
            return;
        }
        // 查找交互队列中首个等待中的交互
        let action = this.queue.find((action) => action.actionInfo.status === 'wait');
        if (!action) {
            debug$3 && console.info('【 ActionManager log 】交互已全部结束');
            // 执行 allDone 监听事件回调
            Object.keys(this._eventFn.allDone).forEach((allDoneFnName) => {
                debug$3 &&
                    console.info(`【 ActionManager log 】allDone 事件监听函数 ${allDoneFnName} 被触发`, this.queue);
                this._eventFn.allDone[allDoneFnName].fn(this.queue);
                // 检查该事件监听函数是否只执行一次
                if (this._eventFn.allDone[allDoneFnName] &&
                    this._eventFn.allDone[allDoneFnName].once) {
                    // 移除该事件监听函数
                    this._eventFn.allDone[allDoneFnName].fn = () => { };
                    debug$3 &&
                        console.info(`【 ActionManager log 】allDone 事件监听函数 ${allDoneFnName} 被移除`, this.queue);
                }
            });
            return;
        }
        debug$3 &&
            console.info(`【 ActionManager log 】${action.actionInfo.name} 交互执行`, action.actionInfo);
        // 标记交互开始
        action.actionInfo.status = 'start';
        // 执行当前交互
        action.actionFn(action.actionInfo, this.queue);
        // 检查当前交互是否为非串行交互（串行交互不可与其他交互叠加展示，反之则可叠加展示，不需要等待其结束）
        // eg. 先入队了一个弱打扰型交互（tips提示引导），后入队了一个强打扰型交互（获奖弹窗）
        if (!action.actionInfo.series) {
            debug$3 &&
                console.info(`【 ActionManager log 】${action.actionInfo.name} 是非串行交互，故继续执行下个交互`);
            // 并行交互可与其他交互叠加展示（不需要等其结束）
            this.unQueue();
        }
        // 执行 action 监听事件回调
        Object.keys(this._eventFn.action).forEach((actionFnName) => {
            debug$3 &&
                console.info(`【 ActionManager log 】action 事件监听函数 ${actionFnName} 被触发`, action.actionInfo);
            this._eventFn.action[actionFnName].fn(action.actionInfo, this.queue);
            // 检查该事件监听函数是否只执行一次
            if (this._eventFn.action[actionFnName] &&
                this._eventFn.action[actionFnName].once) {
                // 移除该事件监听函数
                this._eventFn.action[actionFnName].fn = () => { };
                debug$3 &&
                    console.info(`【 ActionManager log 】action 事件监听函数 ${actionFnName} 被移除`, action.actionInfo);
            }
        });
    }
    /**
     * done 交互结束
     * @param {string} actionName 交互名称
     */
    done(actionName = '') {
        // 查找交互队列中是否已入队该交互
        let action = this.queue.find((action) => action.actionInfo.name === actionName);
        if (action) {
            debug$3 &&
                console.info(`【 ActionManager log 】${action.actionInfo.name} 交互结束`, action.actionInfo);
            // 标记交互结束
            action.actionInfo.status = 'end';
            // 执行 done 监听事件回调
            Object.keys(this._eventFn.done).forEach((doneFnName) => {
                debug$3 &&
                    console.info(`【 ActionManager log 】done 事件监听函数 ${doneFnName} 被触发`, action.actionInfo);
                this._eventFn.done[doneFnName].fn(action.actionInfo, this.queue);
                // 检查该事件监听函数是否只执行一次
                if (this._eventFn.done[doneFnName] &&
                    this._eventFn.done[doneFnName].once) {
                    // 移除该事件监听函数
                    this._eventFn.done[doneFnName].fn = () => { };
                    debug$3 &&
                        console.info(`【 ActionManager log 】done 事件监听函数 ${doneFnName} 被移除`, action.actionInfo);
                }
            });
            // 交互出队 继续执行下一个交互
            this.unQueue();
        }
        else {
            debug$3 &&
                console.info(`【 ActionManager log 】执行 ${actionName} 交互结束时发生错误，在交互队列中未找到该交互！`);
        }
    }
    /**
     * on 绑定事件处理函数，支持绑定多个处理函数
     *
     * @param {SupportEvent} event 事件类型
     * @param {EventFnType} fn 该事件被触发时执行的函数
     * @param {EventInfoType} options 可选参数
     */
    on(event, fn = () => { }, options = { namespace: '', once: false }) {
        if (typeof event !== 'string' || !event) {
            console.error('【 ActionManager Action.on error 】 event must be a string!');
            return this;
        }
        if (typeof fn !== 'function') {
            console.error('【 ActionManager Action.on error 】 fn must be a function!');
            return this;
        }
        if (this._supportEvents.indexOf(event) < 0) {
            console.error('【 ActionManager Action.on error 】 event only supports "action"、"done"、"allDone"!');
            return this;
        }
        if (!options.namespace) {
            options.namespace = `${event}_fn_${Object.keys(this._eventFn[event]).length + 1}`;
        }
        debug$3 &&
            console.info(`【 ActionManager log 】注册 ${event} 事件监听函数 ${options.namespace}`, options);
        this._eventFn[event][options.namespace] = { fn, once: options.once };
        return this;
    }
    /**
     * off 解绑事件处理函数
     *
     * @param {SupportEvent} event action => 交互进行、 done => 交互结束、 allDone => 交互全部结束
     * @param {string} namespace 函数的命名空间，即唯一标识符，不传则全部解绑
     */
    off(event = 'action', namespace = '') {
        if (!event) {
            debug$3 && console.info('【 ActionManager log 】移除所有事件监听函数');
            this._eventFn = { action: {}, done: {}, allDone: {} };
            return this;
        }
        if (this._supportEvents.indexOf(event) < 0) {
            console.error('【 ActionManager Action.off error 】 event only supports "action"、"done"、"allDone"!');
            return this;
        }
        if (namespace === '') {
            debug$3 &&
                console.info(`【 ActionManager log 】移除 ${event} 事件所有监听函数`);
            this._eventFn[event] = {};
            return this;
        }
        debug$3 &&
            console.info(`【 ActionManager log 】移除 ${event} 事件监听函数 ${namespace}`);
        this._eventFn[event][namespace].fn = () => { };
        return this;
    }
    /**
     * clear 清空交互队列
     * @description 注意：清空队列时并不会将正在执行的交互一并停止
     */
    clear() {
        debug$3 && console.info('【 ActionManager log 】清空交互队列');
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
        debug$3 = true;
    }
    /**
     * init 创建交互实例
     *
     * @param {String} instanceName 交互实例的名称，建议传递命名空间防止多次调用被覆盖
     * @param {OrderByType} orderBy 排序规则  ASC 升序、 DESC 降序
     */
    init(instanceName = '__DEFAULT__', orderBy = 'DESC') {
        debug$3 &&
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
    use(instanceName = '__DEFAULT__') {
        debug$3 &&
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
    enQueue(actionFn = () => { }, actionInfo = {
        name: '',
        weight: 0,
        series: true,
        exec: false,
        status: 'wait',
    }) {
        // 检查是否传递交互名称
        if (actionInfo.name === '') {
            console.error('【 ActionManager.enQueue error 】 actionInfo.name cannot be empty!');
            return this;
        }
        this._actions[this._activated].enQueue(actionFn, actionInfo);
        return this;
    }
    /**
     * start 启动交互实例
     */
    start() {
        debug$3 &&
            console.info(`【 ActionManager log 】启动交互实例 ${this._activated}`);
        this._actions[this._activated].unQueue();
        return this;
    }
    /**
     * done 交互结束
     * @param {string} actionName 交互名称
     */
    done(actionName = '') {
        if (actionName === '') {
            console.error('【 ActionManager.done error 】 actionName cannot be empty!');
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
    on(event, fn, options) {
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
    off(event = 'action', namespace = '', instanceName = '') {
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
    clear(instanceName) {
        instanceName = instanceName || this._activated;
        this._actions[instanceName] && this._actions[instanceName].clear();
        return this;
    }
    /**
     * getActionQueue 获取当前
     * @param {string} instanceName 获取交互实例名称
     */
    getActionQueue(instanceName) {
        instanceName = instanceName || this._activated;
        return this._actions[instanceName].queue;
    }
}
var index$4 = new ActionManager();

/**
 * @file DialogManager
 * @description 弹窗管理器
 */
// debug控制开关 true 打开log、 false 关闭log
let debug$2 = false;
/**
 * 弹窗基类
 */
class Dialog {
    constructor() {
        this.dialogInfo = {
            // 弹窗名称
            name: '',
            // 弹窗数据
            data: {},
        };
        // 支持的事件列表
        this._supportEvents = ['show', 'close'];
        // 事件监听函数集合
        this._eventFn = {
            // 弹窗展示事件集合
            show: {},
            // 弹窗关闭事件集合
            close: {},
        };
    }
    /**
     * show 展示弹窗
     * @param {DialogInfoType} dialogInfo 弹窗信息
     */
    show(dialogInfo = { name: '', data: {} }) {
        debug$2 && console.info(`【 DialogManager log 】${dialogInfo.name} 被打开`);
        // 记录当前弹窗数据
        this.dialogInfo = dialogInfo;
        // 执行 show 监听事件
        Object.keys(this._eventFn.show).forEach((showFnName) => {
            debug$2 &&
                console.info(`【 DialogManager log 】show 事件监听函数 ${showFnName} 被触发`, dialogInfo);
            this._eventFn.show[showFnName].fn(dialogInfo);
            // 检查该事件监听函数是否只执行一次
            if (this._eventFn.show[showFnName] &&
                this._eventFn.show[showFnName].once) {
                // 移除该事件监听函数
                this._eventFn.show[showFnName].fn = () => { };
                debug$2 &&
                    console.info(`【 DialogManager log 】show 事件监听函数 ${showFnName} 被移除`, dialogInfo);
            }
        });
    }
    /**
     * close 关闭弹窗
     * @param {Object} payload 关闭弹窗时传递的数据
     */
    close(payload = {}) {
        // 拷贝弹窗数据供 close 监听事件使用
        const dialogInfo = JSON.parse(JSON.stringify(this.dialogInfo));
        debug$2 && console.info(`【 DialogManager log 】${dialogInfo.name} 被关闭`);
        // 执行 close 监听事件
        Object.keys(this._eventFn.close).forEach((closeFnName) => {
            debug$2 &&
                console.info(`【 DialogManager log 】close 事件监听函数 ${closeFnName} 被触发`, dialogInfo);
            this._eventFn.close[closeFnName].fn(dialogInfo, payload);
            // 检查该事件监听函数是否只执行一次
            if (this._eventFn.close[closeFnName] &&
                this._eventFn.close[closeFnName].once) {
                // 移除该事件监听函数
                this._eventFn.close[closeFnName].fn = () => { };
                debug$2 &&
                    console.info(`【 DialogManager log 】close 事件监听函数 ${closeFnName} 被移除`, dialogInfo);
            }
        });
    }
    /**
     * on 绑定事件处理函数，支持绑定多个处理函数
     * @param {SupportEventsType} event 事件类型 show => 弹窗展示、 close => 弹窗关闭
     * @param {EventFnType} fn 该事件被触发时执行的函数
     * @param {EventInfoType} options 可选参数
     */
    on(event, fn = () => { }, options = { namespace: '', once: false }) {
        if (typeof event !== 'string' || !event) {
            console.error('【 DialogManager.on error 】 event must be a string!');
            return this;
        }
        if (typeof fn !== 'function') {
            console.error('【 DialogManager.on error 】 fn must be a function!');
            return this;
        }
        if (this._supportEvents.indexOf(event) < 0) {
            console.error('【 DialogManager.on error 】 event only supports "show"、"close"!');
            return this;
        }
        if (!options.namespace) {
            options.namespace = `${event}_fn_${Object.keys(this._eventFn[event]).length + 1}`;
        }
        debug$2 &&
            console.info(`【 DialogManager log 】注册 ${event} 事件监听函数 ${options.namespace}`, options);
        this._eventFn[event][options.namespace] = { fn, once: options.once };
        return this;
    }
    /**
     * off 解绑事件处理函数
     * @param {SupportEventsType} event 事件类型 show => 弹窗展示、 close => 弹窗关闭
     * @param {String} namespace 函数的命名空间，即唯一标识符，不传则全部解绑
     */
    off(event = 'show', namespace = '') {
        if (!event) {
            debug$2 && console.info('【 DialogManager log 】移除所有事件监听函数');
            this._eventFn = { show: {}, close: {} };
            return this;
        }
        if (this._supportEvents.indexOf(event) < 0) {
            console.error('【 DialogManager.off error 】 event only supports "show"、"close"!');
            return this;
        }
        if (namespace === '') {
            debug$2 &&
                console.info(`【 DialogManager log 】移除 ${event} 事件所有监听函数`);
            this._eventFn[event] = {};
            return this;
        }
        debug$2 &&
            console.info(`【 DialogManager log 】移除 ${event} 事件监听函数 ${namespace}`);
        this._eventFn[event][namespace].fn = () => { };
        return this;
    }
}
/**
 * 弹窗管理器
 */
class DialogManager {
    constructor() {
        // 弹窗实例集合
        this._dialogs = {
            // 默认实例
            __DEFAULT__: new Dialog(),
        };
        // 当前处于激活态的弹窗实例
        this._activated = '__DEFAULT__';
    }
    /**
     * debug 打开调试日志
     */
    debug() {
        debug$2 = true;
    }
    /**
     * init 创建弹窗实例
     * @param {string} instanceName 弹窗实例的名称，建议传递命名空间防止多次调用被覆盖
     * @returns {Object} DialogManager 弹窗管理器，方便链式调用
     */
    init(instanceName = '__DEFAULT__') {
        debug$2 &&
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
    use(instanceName = '__DEFAULT__') {
        debug$2 &&
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
    show(dialogInfo) {
        // 检查是否传递弹窗名称
        if (dialogInfo.name === '') {
            console.error('【 DialogManager.show error 】 dialogInfo.name cannot be empty!');
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
    close(payload = {}) {
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
    on(event, fn = () => { }, options = { namespace: '', once: false }) {
        this._dialogs[this._activated].on(event, fn, options);
        return this;
    }
    /**
     * off 解绑事件处理函数
     * @param {SupportEventsType} event 事件类型 show => 弹窗展示、 close => 弹窗关闭
     * @param {string} namespace 函数的命名空间，即唯一标识符，不传则全部解绑
     * @returns {Object} DialogManager 弹窗管理器，方便链式调用
     */
    off(event, namespace = '') {
        this._dialogs[this._activated].off(event, namespace);
        return this;
    }
}
var index$3 = new DialogManager();

/**
 * @file EventManager
 * @description 事件管理器
 */
// debug控制开关 true 打开log、 false 关闭log
let debug$1 = false;
class EventManager {
    constructor() {
        /** 监听集合 */
        this._events = {};
    }
    /**
     * debug 打开调试日志
     */
    debug() {
        debug$1 = true;
    }
    /**
     * batch 批处理绑定事件处理函数
     * @param {EventFnMap} eventFnMap 事件监听函数MAP格式信息
     * @param {string} listenerName 监听者名称
     * @returns {EventManager} EventManager 事件管理器，方便链式调用
     */
    batch(eventFnMap = [], listenerName = '') {
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
    on(eventInfo = {
        eventName: '',
        payloadFn: () => true,
        trigger: [],
        listener: {},
    }, fn, listenerName) {
        const { eventName, listener, payloadFn, trigger } = eventInfo;
        if (!eventName) {
            console.error('【 EventManager on error 】 eventInfo.eventName cannot be empty!');
            return this;
        }
        if (typeof fn !== 'function') {
            console.error('【 EventManager on error 】 fn must be a function!');
            return this;
        }
        if (!listener[listenerName]) {
            console.error(`【 EventManager on error 】 ${listenerName} not found in eventInfo.listener!`);
            return this;
        }
        if (!this._events[eventName]) {
            this._events[eventName] = { eventName, payloadFn, trigger, listener };
            debug$1 &&
                console.info(`【 EventManager log 】监听者 ${listenerName} 创建了 ${eventName} 事件`, this._events[eventName]);
        }
        this._events[eventName].listener[listenerName].fn = fn;
        debug$1 &&
            console.info(`【 EventManager log 】监听者 ${listenerName} 注册了 ${eventName} 事件监听函数`, this._events[eventName].listener[listenerName]);
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
    emit(eventInfo = {
        eventName: '',
        payloadFn: () => true,
        trigger: [],
        listener: {},
    }, payload, triggerName) {
        const { eventName, payloadFn, trigger, listener } = eventInfo;
        if (!eventName) {
            console.error('【 EventManager emit error 】 eventInfo.eventName cannot be empty!');
            return this;
        }
        if (typeof payloadFn !== 'function') {
            console.error('【 EventManager emit error 】 eventInfo.payloadFn must be a function!');
            return this;
        }
        if (!trigger.find((item) => item === triggerName)) {
            console.error(`【 EventManager emit error 】 ${triggerName} no permission to trigger!`);
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
        debug$1 &&
            console.info(`【 EventManager log 】${triggerName} 触发了 ${eventName} 事件`, payload, { eventName, payloadFn, trigger, listener });
        // 执行事件回调
        Object.keys(this._events[eventName].listener).forEach((listenerName) => {
            debug$1 &&
                console.info(`【 EventManager log 】${eventName} 事件监听者 ${listenerName} 被触发`, payload);
            // 检查是否存在回调函数 不存在则该监听者尚未注册
            if (this._events[eventName].listener[listenerName].fn) {
                this._events[eventName].listener[listenerName].fn(payload);
            }
            else {
                console.warn(`【 EventManager emit warn 】 ${eventName} 事件监听者 ${listenerName} 尚未注册!`);
            }
            // 检查该事件监听函数是否只执行一次
            if (this._events[eventName].listener[listenerName].once) {
                // 移除该事件监听函数
                this._events[eventName].listener[listenerName].fn = () => { };
                debug$1 &&
                    console.info(`【 EventManager log 】${eventName} 事件监听者 ${listenerName} 被移除`, payload);
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
    off(eventName = '', listenerName) {
        if (eventName === '') {
            debug$1 && console.info('【 EventManager log 】移除所有事件监听函数');
            this._events = {};
            return this;
        }
        if (listenerName === '') {
            debug$1 &&
                console.info(`【 EventManager log 】移除 ${eventName} 事件所有监听函数`);
            delete this._events[eventName].listener;
            return this;
        }
        debug$1 &&
            console.info(`【 EventManager log 】移除 ${eventName} 事件监听函数 ${listenerName}`);
        this._events[eventName].listener[listenerName].fn = () => { };
        return this;
    }
}
var index$2 = new EventManager();

/**
 * @file TimeManager
 * @description 定时器管理器
 */
// debug控制开关 true 打开log、 false 关闭log
let debug = false;
/**
 * 定时器基类
 */
class Time {
    constructor(instanceName = '', time = 0) {
        // 定时器ID
        this._timer = null;
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
        this._name = instanceName;
        this._time = time;
    }
    /**
     * run 启动定时器
     * @param {number} time 定时器执行时长 单位 ms
     * @param {number} progressTime 定时器执行过程中触发 progress 事件的单位时长
     * @tip progress 事件执行时间间隔，常用于倒计时场景(单位 ms)，不传或为 0 则不触发 progress 事件
     * @returns {Time} Time 定时器实例，方便链式调用
     */
    run(time = 0, progressTime = 0) {
        debug &&
            console.info(`【 TimeManager log 】启动定时器实例 ${this._name}，时长 ${time}`);
        // 重置定时器
        this._reset(time, progressTime);
        // 执行定时器处理函数
        this._next();
        return this;
    }
    /**
     * reset 重置定时器
     * @param {number} time 定时器执行时长 单位 ms
     * @param {number} progressTime 定时器执行过程中触发 progress 事件的单位时长
     * @tip progress 事件执行时间间隔，常用于倒计时场景(单位 ms)，不传或为 0 则不触发 progress 事件
     */
    _reset(time = 0, progressTime = 0) {
        debug &&
            console.info(`【 TimeManager log 】重置定时器实例 ${this._name} 基础参数`);
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
            let timeDiff = Date.now() -
                (this._startTime + this._progressCount * this._progressTime);
            // 计算下一次 progress 事件执行时机
            let nextTime = this._progressTime > 0 && this._progressTime <= this._time
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
                }
                else {
                    // 更新定时器执行时长
                    this._time = 0;
                }
                // 执行下一个 progress 事件
                this._next();
            }, nextTime);
        }
        // 定时器执行结束
        else {
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
                    console.info(`【 TimeManager log 】定时器实例 ${this._name}, progress 事件监听函数 ${progressFnName} 被触发`);
                // 执行 progress 事件监听函数
                this._eventFn.progress[progressFnName].fn(this._time, this._toEnd.bind(this));
                // 检查该事件监听函数是否只执行一次
                if (this._eventFn.progress[progressFnName] &&
                    this._eventFn.progress[progressFnName].once) {
                    // 移除该事件监听函数
                    this._eventFn.progress[progressFnName].fn = () => { };
                    debug &&
                        console.info(`【 TimeManager log 】定时器实例 ${this._name}, progress 事件监听函数 ${progressFnName} 被移除`);
                }
            });
    }
    /**
     * _execEnd 执行 end 事件监听函数
     * @param {string} type 触发函数处理的来源 end 定时器自然结束、 stop 用户主动停止
     */
    _execEnd(type = 'end') {
        Object.keys(this._eventFn.end).forEach((endFnName) => {
            if (type === 'end' ||
                (type === 'stop' && this._eventFn.end[endFnName].exec)) {
                debug &&
                    console.info(`【 TimeManager log 】定时器实例 ${this._name}, end 事件监听函数 ${endFnName} 被触发`);
                // 执行 end 事件监听函数
                this._eventFn.end[endFnName].fn();
                // 检查该事件监听函数是否只执行一次
                if (this._eventFn.end[endFnName] && this._eventFn.end[endFnName].once) {
                    // 移除该事件监听函数
                    this._eventFn.end[endFnName].fn = () => { };
                    debug &&
                        console.info(`【 TimeManager log 】定时器实例 ${this._name}, end 事件监听函数 ${endFnName} 被移除`);
                }
            }
        });
    }
    /**
     * on 绑定事件处理函数，支持绑定多个处理函数
     * @param {SupportEventsType} event 事件类型  progress => 定时器执行中、 end => 定时器执行结束
     * @param {FnType} fn 该事件被触发时执行的函数
     * @param {EventInfoType} options 可选参数
     * @returns {Time} Time 定时器实例，方便链式调用
     */
    on(event, fn = () => { }, options = { namespace: '', once: false, exec: false }) {
        if (typeof event !== 'string' || !event) {
            console.error('【 TimeManager Time.on error 】 event must be a string!');
            return this;
        }
        if (typeof fn !== 'function') {
            console.error('【 TimeManager Time.on error 】 fn must be a function!');
            return this;
        }
        if (this._supportEvents.indexOf(event) < 0) {
            console.error('【 TimeManager Time.on error 】 event only supports "progress"、"end"!');
            return this;
        }
        if (!options.namespace) {
            options.namespace = `${event}_fn_${Object.keys(this._eventFn[event]).length + 1}`;
        }
        debug &&
            console.info(`【 TimeManager log 】定时器实例 ${this._name}, 注册 ${event} 事件监听函数 ${options.namespace}`, options);
        this._eventFn[event][options.namespace] = {
            fn,
            once: options.once,
            exec: options.exec,
        };
        return this;
    }
    /**
     * off 解绑事件处理函数
     * @param {SupportEventsType} event progress => 定时器执行中、 end => 定时器执行结束
     * @param {string} namespace 函数的命名空间，即唯一标识符，不传则全部解绑
     * @returns {Time} Time 定时器实例，方便链式调用
     */
    off(event, namespace = '') {
        if (!event) {
            debug &&
                console.info(`【 TimeManager log 】定时器实例 ${this._name}, 移除所有事件监听函数`);
            this._eventFn = { progress: {}, end: {} };
            return this;
        }
        if (this._supportEvents.indexOf(event) < 0) {
            console.error('【 TimeManager Time.off error 】 event only supports "progress"、"end"!');
            return this;
        }
        if (namespace === '') {
            debug &&
                console.info(`【 TimeManager log 】定时器实例 ${this._name}, 移除 ${event} 事件所有监听函数`);
            this._eventFn[event] = {};
            return this;
        }
        debug &&
            console.info(`【 TimeManager log 】定时器实例 ${this._name}, 移除 ${event} 事件监听函数 ${namespace}`);
        this._eventFn[event][namespace].fn = () => { };
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
     */
    debug() {
        debug = true;
    }
    /**
     * timer 创建/获取定时器实例
     * @param {string} instanceName 定时器实例的名称，建议传递命名空间防止多次调用被覆盖
     * @returns {Time} Time 定时器实例，方便链式调用
     */
    timer(instanceName = '__DEFAULT__') {
        // 如果不存在该定时器实例
        if (!this._timers[instanceName]) {
            // 创建定时器实例
            this._timers[instanceName] = new Time(instanceName);
            debug &&
                console.info(`【 TimeManager log 】创建定时器实例 ${instanceName}`);
        }
        else {
            debug &&
                console.info(`【 TimeManager log 】获取定时器实例 ${instanceName}`);
        }
        return this._timers[instanceName];
    }
    /**
     * stop 停止定时器
     * @param {string} instanceName 定时器实例的名称，建议传递命名空间防止多次调用被覆盖
     * @returns {TimeManager} TimeManager 定时器管理器，方便链式调用
     */
    stop(instanceName = '') {
        if (instanceName) {
            this._timers[instanceName] &&
                this._timers[instanceName]._time > 0 &&
                this._timers[instanceName]._stop().then(() => this.stop(instanceName));
        }
        else {
            // 定时器排序
            let timer = Object.values(this._timers)
                .sort((a, b) => a._time - b._time)
                .find((item) => item._time > 0);
            timer && this._timers[timer._name]._stop().then(() => this.stop());
        }
        return this;
    }
}
var index$1 = new TimeManager();

/**
 * @file IntersectionManager
 * @description 元素相交观察者管理器
 */
class ViewportIntersectionObserver {
    constructor(pageContext, { selectorsArr = [], renderFn = () => { }, options = {}, }) {
        // 进入过可视窗口的 元素 的集合
        this.intersectedArr = [];
        this._observer = swan.createIntersectionObserver(pageContext, {
            selectAll: true,
        });
        this.num = selectorsArr.length;
        // 开始监测
        this.watch(selectorsArr, renderFn, options);
    }
    /**
     * 开启监听
     * @param {Array} selectorsArr 需要观察的 元素 集合 eg. ['#dom']
     * @param {Function} renderFn 元素相交时执行的钩子函数
     * @param {OptionsType} 设置元素相交条件
     */
    watch(selectorsArr = [], renderFn = () => { }, { type = 'relativeToViewport', selector = '', margins = {}, }) {
        swan.nextTick(() => {
            this._observer[type](type === 'relativeToViewport' ? margins : selector).observe(selectorsArr.join(','), (res) => {
                if (res.intersectionRatio) {
                    if (!this.intersectedArr.includes(res.id)) {
                        renderFn(res);
                        this.intersectedArr.push(res.id);
                        if (this.intersectedArr.length >= this.num) {
                            this.off();
                        }
                    }
                }
            });
        });
    }
    /**
     * 取消监听
     */
    off() {
        this._observer.disconnect();
        this.intersectedArr = [];
        this.num = 0;
    }
}
class IntersectionManager {
    constructor() {
        // 观察者队列
        this._observerList = [];
    }
    watch(pageContext = undefined, params = {
        selectorsArr: [],
        renderFn: () => { },
        options: {},
    }) {
        var _a;
        if (!pageContext) {
            console.error('【 IntersectionManager log 】pageContext is required');
            return;
        }
        if (((_a = params === null || params === void 0 ? void 0 : params.selectorsArr) === null || _a === void 0 ? void 0 : _a.length) <= 0) {
            console.error('【 IntersectionManager log 】params.selectorsArr is empty');
            return;
        }
        let len = this._observerList.push(new ViewportIntersectionObserver(pageContext, params));
        return len - 1;
    }
    off(index) {
        var _a;
        // 传入合法索引，解绑指定索引observer
        if (index > 0) {
            (_a = this._observerList[index]) === null || _a === void 0 ? void 0 : _a.off();
        }
        else {
            this._observerList.forEach((item) => {
                item.off();
            });
            this._observerList = [];
        }
    }
}
var index = new IntersectionManager();

export { index$4 as ActionManager, index$3 as DialogManager, index$2 as EventManager, index as IntersectionManager, index$1 as TimeManager };
