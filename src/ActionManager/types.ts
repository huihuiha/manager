/** 排序规则  ASC 升序、 DESC 降序 */
export type OrderByType = 'DESC' | 'ASC';

/** 支持的事件 */
export type SupportEvent = 'action' | 'done' | 'allDone';

/** 交互事件函数 */
export type ActionFnType = (...args: unknown[]) => void;

/** 交互事件配置信息  */
export type ActionInfoType = {
  /** 交互名称 */
  name: string;
  /** 交互权重 */
  weight?: number;
  /** 是否串行 true表示串行：交互不可与其他交互叠加执行，反之可与其他交互叠加执行 */
  series?: boolean;
  /** 交互管理器clear时是否执行交互回调函数*/
  exec?: boolean;
  /** 交互状态  wait => 等待、 start 交互开始、 end 交互结束 */
  status?: 'wait' | 'start' | 'end';
};

/** 交互队列 */
export type ActionQueueType = {
  /** 交互事件函数 */
  actionFn: ActionFnType;
  /** 交互事件配置信息  */
  actionInfo: ActionInfoType;
};

/** 监听事件的集合 */
type EventInfo = {
  /** 处理函数 */
  fn: EventFnType;
  /** 函数是否只执行一次 */
  once: EventInfoType['once'];
};

/** 事件监听函数集合 */
export type SupportEventFn = {
  [Key in SupportEvent]: Record<string, EventInfo>;
};

/** 交互事件监听函数 */
export type EventFnType = (...args: unknown[]) => void;

/** 交互事件监听配置 */
export type EventInfoType = {
  /** 监听函数的唯一标识 */
  namespace?: string;
  /** 是否只执行一次 */
  once?: boolean;
};
