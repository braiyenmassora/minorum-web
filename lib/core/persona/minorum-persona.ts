import persona from "@/lib/core/persona/minorum_persona.json";

function bulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function section(title: string, body: string): string {
  return `## ${title}\n${body}`;
}

function buildSystemPrompt(): string {
  const parts: string[] = [
    `Kamu adalah ${persona.identity.name}, ${persona.identity.role}. ${persona.identity.mission}`,
    persona.identity.persona,
    "",
    section(
      "Personality",
      [
        "Core traits:",
        bulletList(persona.personality.core),
        "",
        "Principles:",
        bulletList(persona.personality.principles),
      ].join("\n"),
    ),
    "",
    section(
      "Communication",
      [
        `Language: ${persona.communication.language}`,
        "",
        "Tone:",
        bulletList(persona.communication.tone),
        "",
        "English mix:",
        `- Style: ${persona.communication.englishMix.style}`,
        bulletList(persona.communication.englishMix.rules),
        "",
        "Example English words/phrases (use naturally, not forced):",
        persona.communication.englishMix.examples.join(", "),
      ].join("\n"),
    ),
    "",
    section(
      "Sarcasm",
      [
        `Enabled: ${persona.sarcasm.enabled ? "yes" : "no"} (default ${persona.sarcasm.default ? "on" : "off"})`,
        "",
        "Rules:",
        bulletList(persona.sarcasm.rules),
        "",
        "Example tone:",
        bulletList(persona.sarcasm.examples),
      ].join("\n"),
    ),
    "",
    section(
      "Roasting",
      [
        persona.roasting.style,
        "",
        "Target (OK to roast):",
        bulletList(persona.roasting.target),
        "",
        "Never target:",
        bulletList(persona.roasting.neverTarget),
      ].join("\n"),
    ),
    "",
    section(
      "Behavior",
      [
        "When answering:",
        bulletList(persona.behavior.answering),
        "",
        "When ambiguous:",
        bulletList(persona.behavior.ambiguity),
        "",
        "Honesty:",
        bulletList(persona.behavior.honesty),
      ].join("\n"),
    ),
    "",
    section(
      "Serious mode",
      [
        "Triggers:",
        bulletList(persona.seriousMode.trigger),
        "",
        "Behavior:",
        bulletList(persona.seriousMode.behavior),
      ].join("\n"),
    ),
    "",
    section(
      "Coding",
      [
        "Principles:",
        bulletList(persona.coding.principles),
        "",
        "When a bug is found:",
        bulletList(persona.coding.whenBugFound),
      ].join("\n"),
    ),
  ];

  return parts.join("\n");
}

/** Full system message sent to the chat API. */
export const systemPrompt = buildSystemPrompt();

export const personaMeta = {
  name: persona.name,
  description: persona.description,
  version: persona.version,
} as const;
