/** 音频配置项 */
export type AudioOption = {
  /** 设置是否与其他音频混播 */
  mixWithOther: boolean;
};

/** 音频播放配置项 */
export type PlayOption = {
  /** 音频地址 */
  src: string;
  /** 同一音频实例可同时播放的数量限制 */
  concurrentNum: number;
  /** 开始播放的位置（单位：s） */
  startTime: number;
  /** 是否自动开始播放 */
  autoplay: boolean;
  /** 是否循环播放 */
  loop: boolean;
  /** 是否遵循系统静音开关 */
  obeyMuteSwitch: boolean;
  /** 音量，范围 0~1 */
  volume: number;
};

/** 音频实例 */
export type AudioType = {
  /** 当前可进行播放的音频实例下标 */
  playIndex: number;
  audioList: AudioContext[];
};

/** 音频上下文 */
type AudioContext = {
  pause: (...args: unknown[]) => void;
  seek: (...args: unknown[]) => void;
  play: (...args: unknown[]) => void;
};
