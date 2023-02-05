/**
 * @file IntersectionManager
 * @description 元素相交观察者管理器
 */

import type { OptionsType, RenderFnType } from './types';

class ViewportIntersectionObserver {
  // 观察者
  private _observer: any;
  // 需要观察的 元素 的数量
  public num: number;
  // 进入过可视窗口的 元素 的集合
  public intersectedArr: string[] = [];

  constructor(
    pageContext: string,
    {
      selectorsArr = [],
      renderFn = () => {},
      options = {},
    }: {
      selectorsArr: string[];
      renderFn: RenderFnType;
      options: Partial<OptionsType>;
    }
  ) {
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
  watch(
    selectorsArr: string[] = [],
    renderFn: RenderFnType = () => {},
    {
      type = 'relativeToViewport',
      selector = '',
      margins = {},
    }: Partial<OptionsType>
  ) {
    swan.nextTick(() => {
      this._observer[type](
        type === 'relativeToViewport' ? margins : selector
      ).observe(selectorsArr.join(','), (res: any) => {
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
  // 观察者队列
  private _observerList: ViewportIntersectionObserver[] = [];

  watch(
    pageContext = undefined,
    params = {
      selectorsArr: [],
      renderFn: () => {},
      options: {},
    }
  ) {
    if (!pageContext) {
      console.error('【 IntersectionManager log 】pageContext is required');
      return;
    }
    if (params?.selectorsArr?.length <= 0) {
      console.error(
        '【 IntersectionManager log 】params.selectorsArr is empty'
      );
      return;
    }
    let len = this._observerList.push(
      new ViewportIntersectionObserver(pageContext, params)
    );
    return len - 1;
  }

  off(index: number) {
    // 传入合法索引，解绑指定索引observer
    if (index > 0) {
      this._observerList[index]?.off();
    } else {
      this._observerList.forEach((item) => {
        item.off();
      });
      this._observerList = [];
    }
  }
}

export default new IntersectionManager();
