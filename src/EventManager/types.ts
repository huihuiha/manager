/** 事件校验函数  */
type PayloadFnType = (...args: unknown[]) => boolean;

/** 事件处理喊出 */
export type EventFnType = (...args: unknown[]) => void;

/** 监听配置 */
export type EventInfoType = {
  /** 事件名称 */
  eventName: string;
  /** 事件校验函数 true才通过 false不通过 */
  payloadFn: PayloadFnType;
  /** 触发者集合 emit会校验触发者是否合法 */
  trigger: string[];
  /** 监听者集合 */
  listener: ListenerType;
};

type ListenerType = Record<
  string,
  {
    /** 监听者监听函数命名空间 */
    namespace: string;
    /** 监听者监听函数是否只执行一遍 */
    once?: boolean;
    fn?: EventFnType;
  }
>;

/** 批量函数绑定 */
export type EventFnMap = [EventInfoType, PayloadFnType][];

/** 监听集合 */
export type EventsType = Record<string, EventInfoType>;
