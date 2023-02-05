/** 元素相交条件 */
export type OptionsType = {
  /**  设置元素相交参考区域类型
   * 1. relativeToViewport: 指定页面显示区域
   * 2. relativeTo: 指定一个节点
   */
  type: 'relativeToViewport' | 'relativeTo';
  /** 元素选择器 */
  selector: string;
  /** 扩展或收缩参考节点布局区域的边界 */
  margins: Record<string, any>;
};

/** 元素相交时执行函数 */
export type RenderFnType = (...args: unknown[]) => void;
