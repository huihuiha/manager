/**
 * @file AudioManager
 * @description 音频管理器
 */

import type { AudioOption, PlayOption, AudioType } from './types';

class AudioManager {
  // 音频管理器状态 true => 打开，可以播放、 false => 关闭，不可以播放
  private _status: boolean = true;
  // 音频实例集合
  private _audios: Record<string, AudioType> = {};
  // 音频实例同时存在的数量最大限制
  private _maxConcurrentNum: number;

  constructor(maxNum: number = 3) {
    this._maxConcurrentNum = maxNum;
  }

  /**
   * 设置音频管理器播放状态
   * @param {boolean} status 音频管理器播放状态 true => 打开，可以播放、 false => 关闭，不可以播放
   * @return {AudioManager} AudioManager
   */
  setAudioEnable(status: boolean = true): AudioManager {
    // 更新状态
    this._status = status;
    // 若当前状态为 关闭状态
    if (!this._status) {
      // 停止所有音乐
      this.stop();
    }
    return this;
  }

  /**
   * 进行小程序内部的全局设置
   * @param {AudioOption} option 全局配置项
   * @return {AudioManager} AudioManager
   */
  setAudioOption(option: AudioOption = { mixWithOther: true }): AudioManager {
    swan.setInnerAudioOption(option);
    return this;
  }

  /**
   * 播放音频
   * @param {PlayOption} option 配置项
   */
  play(
    option: PlayOption = {
      concurrentNum: 1,
      src: '',
      startTime: 0,
      autoplay: false,
      loop: false,
      obeyMuteSwitch: true,
      volume: 1,
    }
  ): AudioManager {
    if (!option.src) {
      console.error('【AudioManager.play error】 option.src is not found！');
      return this;
    }

    // 当前不可进行音频播放
    if (!this._status) {
      return this;
    }

    // 尚未创建实例
    if (!this._audios[option.src]) {
      // 保存实例
      this._audios[option.src] = {
        playIndex: 0,
        audioList: Array.from(
          Array(
            option.concurrentNum > this._maxConcurrentNum
              ? this._maxConcurrentNum
              : option.concurrentNum
          ),
          () => {
            // 创建音效实例
            const audio = swan.createInnerAudioContext();
            // 设置配置
            audio.src = option.src;
            audio.startTime = option.startTime;
            audio.autoplay = option.autoplay;
            audio.loop = option.loop;
            audio.obeyMuteSwitch = option.obeyMuteSwitch;
            audio.volume = option.volume;
            return audio;
          }
        ),
      };
    }

    // 重置音效到起始位置
    this._audios[option.src].audioList[this._audios[option.src].playIndex].seek(
      0
    );
    // 播放音频
    this._audios[option.src].audioList[
      this._audios[option.src].playIndex
    ].play();

    // 更新当前可进行播放的音频实例下标
    this._audios[option.src].playIndex += 1;
    if (
      this._audios[option.src].playIndex >
      this._audios[option.src].audioList.length - 1
    ) {
      this._audios[option.src].playIndex = 0;
    }
    return this;
  }

  /**
   * 关闭音频
   * @param {string} src 音频地址 若传入音频地址则关闭该音频实例，不传则关闭所有音频实例
   */
  stop(src: string = ''): AudioManager {
    if (src) {
      if (!this._audios[src]) {
        return this;
      }
      // 关闭音效
      this._audios[src].audioList.forEach((audio) => audio.pause());
      // 重置当前可进行播放的音频实例下标
      this._audios[src].playIndex = 0;
      return this;
    }
    Object.keys(this._audios).forEach((item) => {
      // 关闭音效
      this._audios[item].audioList.forEach((audio) => audio.pause());
      // 重置当前可进行播放的音频实例下标
      this._audios[item].playIndex = 0;
    });
    return this;
  }
}

export default new AudioManager();
