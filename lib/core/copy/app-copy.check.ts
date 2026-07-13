import { getAppCopy, loadAppCopy } from "@/lib/core/copy/app-copy";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

loadAppCopy();

const copy = getAppCopy();
assert(copy.app_meta.app_name === "Minorum", "app_meta loaded");
assert(copy.setup_screen.save.length > 0, "setup_screen loaded");

console.log("app-copy checks passed");
