import copyData from "@/lib/assets/copy/minorum_copy.json";

export type MinorumCopy = typeof copyData;

let loaded = false;

export function loadAppCopy(): void {
  loaded = true;
}

export function getAppCopy(): MinorumCopy {
  if (!loaded) {
    throw new Error("AppCopy belum di-load. Panggil loadAppCopy() dulu.");
  }
  return copyData;
}

export function getErrorMessage(
  key: keyof MinorumCopy["error_and_snackbar_messages"],
): string {
  return getAppCopy().error_and_snackbar_messages[key];
}
