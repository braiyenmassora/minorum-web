import {
  getProductionHosts,
  isAllowedProductionHost,
  isLocalHost,
} from "./allowed-hosts";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(isLocalHost("localhost"), "localhost is local");
assert(isLocalHost("127.0.0.1"), "loopback is local");
assert(isLocalHost("foo.localhost"), "*.localhost is local");
assert(!isLocalHost("example.com"), "prod host is not local");

process.env.MINORUM_ALLOWED_HOSTS = " Example.COM , app.example.com ";
assert(isAllowedProductionHost("example.com"), "normalized prod host");
assert(isAllowedProductionHost("app.example.com"), "second prod host");
assert(!isAllowedProductionHost("localhost"), "local not in prod list");
assert(getProductionHosts().size === 2, "deduped host count");

delete process.env.MINORUM_ALLOWED_HOSTS;
assert(getProductionHosts().size === 0, "empty when unset");

console.log("allowed-hosts.check: ok");
