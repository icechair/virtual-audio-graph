import VirtualAudioGraph from "./VirtualAudioGraph.ts";

export * from "./nodeFactories.ts";

export { default as createNode } from "./createNode.ts";
export { default as createWorkletNode } from "./createWorkletNode.ts";

export default (config?: {
  audioContext?: AudioContext;
  output?: AudioDestinationNode;
}): VirtualAudioGraph => {
  const audioContext = (config && config.audioContext) || new AudioContext();
  const output = (config && config.output) || audioContext.destination;
  return new VirtualAudioGraph(audioContext, output);
};
