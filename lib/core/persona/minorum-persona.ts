import persona from "@/lib/core/persona/minorum_persona.json";

export type SystemPromptOptions = {
  /** True when web_search tools are attached to this chat request. */
  webToolsActive?: boolean;
};

function bulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function section(title: string, body: string): string {
  return `## ${title}\n${body}`;
}

function entries(record: Record<string, string>): string {
  return Object.entries(record)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");
}

export function buildSystemPrompt(options: SystemPromptOptions = {}): string {
  const webToolsActive = options.webToolsActive ?? false;
  const lang = persona.communication.language;
  const domains = persona.knowledgeDomains;
  const skill = persona.skillLevelDetection;
  const humor = persona.humor;
  const formatting = persona.responseFormatting;

  const webAccessLines = [
    `Available in THIS request: ${webToolsActive ? "YES — web_search tool is attached; verify link content before answering." : "NO — do not claim you opened or browsed URLs."}`,
    "If browsing tools are NOT available: say honestly you cannot access the link; do not invent page content.",
    "If tools ARE available: use them to verify link content before answering.",
    "Link output: Markdown [text](url) or full plain URL — do not truncate.",
  ];

  const parts: string[] = [
    section(
      "LANGUAGE LOCK (MANDATORY — overrides all other instructions)",
      [
        lang.priority,
        lang.englishMix,
        lang.matchUser,
        "Do NOT reply fully in English unless the user's entire message is in English.",
        "Code, paths, error messages, and product names stay untranslated.",
      ].join("\n"),
    ),
    "",
    `You are ${persona.identity.name}, ${persona.identity.role}. ${persona.identity.mission}`,
    persona.identity.persona,
    "",
    section("Technical capabilities", webAccessLines.join("\n")),
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
      "Honesty",
      [persona.honesty.principle, "", "Rules:", bulletList(persona.honesty.rules)].join(
        "\n",
      ),
    ),
    "",
    section(
      "Communication",
      [
        `Language: ${lang.priority}`,
        `English mix: ${lang.englishMix}`,
        `Match user: ${lang.matchUser}`,
        "",
        "Tone:",
        bulletList(persona.communication.tone),
      ].join("\n"),
    ),
    "",
    section(
      "Knowledge domains",
      [domains.scope, domains.principle].join("\n"),
    ),
    "",
    section(
      "Skill level",
      [
        `Default: ${skill.default}`,
        "",
        "Behavior:",
        entries(skill.behavior),
      ].join("\n"),
    ),
    "",
    section(
      "Humor",
      [
        `Types: ${humor.types.join(", ")}`,
        `Frequency: ${humor.frequency}`,
        `Rule: ${humor.rule}`,
        "",
        "Triggers:",
        bulletList(humor.triggers),
        "",
        "Never trigger:",
        bulletList(humor.neverTrigger),
      ].join("\n"),
    ),
    "",
    section(
      "Sarcasm",
      [
        `Enabled: ${persona.sarcasm.enabled ? "yes" : "no"}`,
        `Condition: ${persona.sarcasm.condition}`,
        "",
        "Rules:",
        bulletList(persona.sarcasm.rules),
      ].join("\n"),
    ),
    "",
    section(
      "Safety",
      [
        "Refusals:",
        bulletList(persona.safety.refusals),
        "",
        "Controversial topics:",
        bulletList(persona.safety.controversialTopics),
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
      "Response formatting",
      [
        formatting.principle,
        "",
        `Short answers: ${formatting.shortAnswers}`,
        `Long answers: ${formatting.longAnswers}`,
        `Code: ${formatting.code}`,
        "",
        "Code comment rule: non-trivial snippets MUST open with a multi-line block comment (/** … */). Inline comments only where logic is unclear.",
      ].join("\n"),
    ),
    "",
    section(
      "LANGUAGE REMINDER",
      "Before replying: use Bahasa Indonesia when the user writes in Indonesian. Reply in English only when their message is fully in English.",
    ),
  ];

  return parts.join("\n");
}

/** Default system prompt (no web tools). */
export const systemPrompt = buildSystemPrompt();

export const personaMeta = {
  name: persona.name,
  description: persona.description,
  version: persona.version,
} as const;
