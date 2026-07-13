import { isValidElement, type ReactNode } from "react";

export function extractNodeText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractNodeText).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractNodeText(node.props.children);
  }

  return "";
}
