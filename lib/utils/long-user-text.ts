export const USER_TEXT_PREVIEW_CHARS = 500;
export const USER_TEXT_PREVIEW_LINES = 6;

export function isLongUserText(text: string): boolean {
  if (text.length > USER_TEXT_PREVIEW_CHARS) {
    return true;
  }
  let lines = 1;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) {
      lines += 1;
      if (lines > USER_TEXT_PREVIEW_LINES) {
        return true;
      }
    }
  }
  return false;
}
