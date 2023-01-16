/** 弹窗信息 */
export type DialogInfoType = {
  /** 弹窗名称 */
  name: string;
  /** 弹窗数据 */
  data?: Record<string, any>;
};

/** 弹窗支持的监听事件 */
export type SupportEventsType = 'show' | 'close';

/** 事件监听函数集合 */
export type SupportEventFn = {
  [Key in SupportEventsType]: Record<string, any>;
};

/** 监听处理事件 */
export type EventFnType = (...args: any[]) => void;

/** 监听配置 */
export type EventInfoType = {
  /** 函数的命名空间，即唯一标识符，同名函数会被覆盖 */
  namespace: string;
  /** 函数是否只执行一次 */
  once: boolean;
};
