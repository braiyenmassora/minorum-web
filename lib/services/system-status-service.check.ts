import {
  getStatusDefinition,
  resolveProbeStatus,
} from "./system-status-service";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  getStatusDefinition("operational").label === "All Systems Operational",
  "operational label",
);
assert(getStatusDefinition("major_outage").tone === "danger", "major tone");
assert(getStatusDefinition("operational").tone === "success", "op tone");
assert(resolveProbeStatus(true, true) === "operational", "both ok");
assert(resolveProbeStatus(false, false) === "major_outage", "both down");
assert(resolveProbeStatus(true, false) === "degraded_performance", "api down");
assert(resolveProbeStatus(false, true) === "partial_outage", "web down");

console.log("system-status checks passed");
