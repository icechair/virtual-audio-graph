import {
  audioParamProperties,
  constructorParamsKeys,
  setters,
  startAndStopNodes,
} from "../data.ts";
import {
  IAudioNodeFactoryParam,
  IAudioNodePropertyLookup,
  IVirtualAudioNodeParams,
  Output,
  VirtualAudioNode,
} from "../types.ts";
import { capitalize, equals, find, values } from "../utils.ts";
import CustomVirtualAudioNode from "./CustomVirtualAudioNode.ts";

interface IAudioContextFactoryLookup {
  [_: string]: any;
}

const createAudioNode = (
  audioContext: AudioContext,
  name: string,
  audioNodeFactoryParam: IAudioNodeFactoryParam,
) => {
  const audioNodeFactoryName = `create${capitalize(name)}`;
  if (
    typeof (audioContext as IAudioContextFactoryLookup)[
      audioNodeFactoryName
    ] !== "function"
  ) {
    throw new Error(`Unknown node type: ${name}`);
  }

  const audioNode = audioNodeFactoryParam
    ? (audioContext as IAudioContextFactoryLookup)[audioNodeFactoryName](
      audioNodeFactoryParam,
    )
    : (audioContext as IAudioContextFactoryLookup)[audioNodeFactoryName]();

  return audioNode;
};

export default class StandardVirtualAudioNode {
  public audioNode: AudioNode;
  public connected: boolean = false;
  private connections: AudioNode[] = [];
  private stopCalled: boolean;

  constructor(
    public readonly node: string,
    public output?: Output,
    public params?: IVirtualAudioNodeParams,
    public readonly input?: string,
  ) {
    const stopTime = params && params.stopTime;
    this.stopCalled = stopTime !== undefined;
  }

  public connect(...connectArgs: any[]): void {
    const { audioNode } = this;
    const filteredConnectArgs = connectArgs.filter(Boolean);
    const [firstArg, ...rest] = filteredConnectArgs;
    if (audioNode.connect) {
      audioNode.connect(firstArg, ...rest);
    }
    this.connections = this.connections.concat(filteredConnectArgs);
    this.connected = true;
  }

  public disconnect(node?: VirtualAudioNode): void {
    const { audioNode } = this;
    if (node) {
      if (node instanceof CustomVirtualAudioNode) {
        for (const childNode of values(node.virtualNodes)) {
          if (!this.connections.some((x) => x === childNode.audioNode)) {
            continue;
          }
          this.connections = this.connections.filter(
            (x) => x !== childNode.audioNode,
          );
        }
      } else {
        if (!this.connections.some((x) => x === node.audioNode)) return;
        this.connections = this.connections.filter((x) => x !== node.audioNode);
      }
    }
    if (audioNode.disconnect) audioNode.disconnect();
    this.connected = false;
  }

  public disconnectAndDestroy(): void {
    const { audioNode, stopCalled } = this;
    if ((audioNode as OscillatorNode).stop && !stopCalled) {
      (audioNode as OscillatorNode).stop();
    }
    if (audioNode.disconnect) audioNode.disconnect();
    this.connected = false;
  }

  public initialize(audioContext: AudioContext): this {
    const params = this.params || {};
    const constructorParam = params[
      find(
        (key) => constructorParamsKeys.indexOf(key) !== -1,
        Object.keys(params),
      )
    ];
    const { offsetTime, startTime, stopTime } = params;

    // TODO remove `any` when AudioScheduledSourceNode typings are correct
    const audioNode: any = createAudioNode(
      audioContext,
      this.node,
      constructorParam,
    );

    this.audioNode = audioNode;
    this.params = undefined;
    this.update(params);

    if (startAndStopNodes.indexOf(this.node) !== -1) {
      audioNode.start(
        startTime == null ? audioContext.currentTime : startTime,
        offsetTime || 0,
      );
      if (stopTime != null) audioNode.stop(stopTime);
    }

    return this;
  }

  public update(params: IVirtualAudioNodeParams = {}): this {
    const audioNode: IAudioNodePropertyLookup = this.audioNode;
    for (const key of Object.keys(params)) {
      if (constructorParamsKeys.indexOf(key) !== -1) continue;
      const param = params[key];
      if (this.params && equals(this.params[key], param)) continue;
      if (audioParamProperties.indexOf(key) !== -1) {
        if (Array.isArray(param)) {
          if (this.params) audioNode[key].cancelScheduledValues(0);
          const callMethod = ([methodName, ...args]: [string, ...any[]]) =>
            audioNode[key][methodName](...args);
          Array.isArray(param[0])
            ? param.forEach(callMethod)
            : callMethod(param as [string, any[]]);
          continue;
        }
        audioNode[key].value = param;
        continue;
      }
      if (setters.indexOf(key) !== -1) {
        audioNode[`set${capitalize(key)}`](...param);
        continue;
      }
      audioNode[key] = param;
    }
    this.params = params;
    return this;
  }
}
