import * as V from "../../src/index.ts";

export default V.createNode(() => ({
  0: V.gain("output", null, "input"),
}));
