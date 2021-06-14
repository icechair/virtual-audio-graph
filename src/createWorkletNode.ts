import { IVirtualAudioNodeParams, Output } from "./types.ts";
import AudioWorkletVirtualAudioNode from "./VirtualAudioNodes/AudioWorkletVirtualAudioNode.ts";

export default (nodeName: string) =>
  (output: Output, params?: IVirtualAudioNodeParams) =>
    new AudioWorkletVirtualAudioNode(nodeName, output, params);
