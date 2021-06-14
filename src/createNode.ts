import {
  CustomVirtualAudioNodeFactory,
  IVirtualAudioNodeParams,
  Output,
} from "./types.ts";
import CustomVirtualAudioNode from "./VirtualAudioNodes/CustomVirtualAudioNode.ts";

export default <P = IVirtualAudioNodeParams>(
  node: CustomVirtualAudioNodeFactory<P>,
) =>
  (output: Output, params?: P) =>
    new CustomVirtualAudioNode(node, output, params);
