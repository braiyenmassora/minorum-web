export type MessageRole = "user" | "assistant";

export type TextPart = { type: "text"; text: string };
export type ImagePart = {
  type: "image_url";
  image_url: { url: string };
};

export type MessageContent = string | Array<TextPart | ImagePart>;

export type Message = {
  id: string;
  role: MessageRole;
  content: MessageContent;
};

export type ApiMessage = {
  role: "system" | "user" | "assistant";
  content: MessageContent;
};
