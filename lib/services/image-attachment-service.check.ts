import { scaleDimensions } from "./image-attachment-service";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  scaleDimensions(2000, 1000).width === 1536 &&
    scaleDimensions(2000, 1000).height === 768,
  "scale wide image",
);
assert(
  scaleDimensions(800, 600).width === 800 &&
    scaleDimensions(800, 600).height === 600,
  "keep small image",
);
assert(
  scaleDimensions(1000, 2000).height === 1536,
  "scale tall image",
);

console.log("image-attachment-service checks passed");
