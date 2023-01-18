/**  */
export type SupportEventsType = 'progress' | 'end';

/** 监听集合列表 */
export type EventFnType = {
  [Key in SupportEventsType]: Record<string, EventInfoType>;
};

/** 监听函数 */
export type FnType = (...args: unknown[]) => void;

/** 监听配置 */
export type EventInfoType = {
  /** 监听处理函数 */
  fn?: (...args: unknown[]) => void;
  /** 是否只执行一次 */
  once?: boolean;
  /** 定时器非正常停止时监听函数是否执行 */
  exec?: boolean;
  /** 函数命名空间 */
  namespace?: string;
};
