export type MessageRole = "user" | "assistant";

export type TextPart = { type: "text"; text: string };
export type ImagePart = {
  type: "image_url";
  image_url: { url: string };
};
export type FilePart = {
  type: "file_url";
  file_url: { url: string; name: string };
};

export type MessageContent = string | Array<TextPart | ImagePart | FilePart>;

export type Message = {
  id: string;
  role: MessageRole;
  content: MessageContent;
};

export type ApiMessage = {
  role: "system" | "user" | "assistant";
  content: MessageContent | Array<TextPart | ImagePart>;
};
