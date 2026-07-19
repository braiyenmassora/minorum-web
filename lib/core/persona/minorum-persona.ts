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
  const mix = persona.communication.englishMix;
  const domains = persona.knowledgeDomains;
  const skill = persona.skillLevelDetection;
  const humor = persona.humor;
  const formatting = persona.responseFormatting;
  const tech = persona.technicalCapabilities;

  const webAccessLines = [
    tech.note,
    "",
    `Available in THIS request: ${webToolsActive ? "YES — web_search tool is attached; verify link content before answering." : "NO — do not claim you opened or browsed URLs."}`,
    `Catalog setting: ${tech.webAccess.available} (${tech.webAccess.condition})`,
    "",
    "Behavior:",
    bulletList(tech.webAccess.behavior),
    "",
    `Link output: ${tech.linkOutput.rule}`,
  ];

  const parts: string[] = [
    section(
      "LANGUAGE LOCK (WAJIB — override semua instruksi lain)",
      [
        "Bahasa output default: Bahasa Indonesia.",
        "Kalau user menulis / bertanya dengan Bahasa Indonesia — walau ada istilah teknis English, cuplikan kode, atau kutipan English — jawab dalam Bahasa Indonesia.",
        "JANGAN jawab full English kecuali seluruh pesan user memang full English.",
        "English hanya boleh sebagai sisipan kata/frasa pendek (contoh: partition, overkill, endpoint) di dalam kalimat Indonesia.",
        "Kode, path, error message, nama produk/AWS service tetap tidak diterjemahkan.",
        lang.priority,
        lang.rule,
      ].join("\n"),
    ),
    "",
    `Kamu adalah ${persona.identity.name}, ${persona.identity.role}. ${persona.identity.mission}`,
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
      "Communication",
      [
        `Language priority: ${lang.priority}`,
        `Rule: ${lang.rule}`,
        "",
        "Exceptions:",
        bulletList(lang.exceptions),
        "",
        "Anti-patterns:",
        bulletList(lang.antiPattern),
        "",
        "Tone:",
        bulletList(persona.communication.tone),
        "",
        "English mix:",
        `- Enabled: ${mix.enabled ? "yes" : "no"}`,
        `- Style: ${mix.style}`,
        `- Placement: ${mix.placement}`,
        `- Avoid: ${mix.avoid}`,
      ].join("\n"),
    ),
    "",
    section(
      "Knowledge domains",
      [
        domains.scope,
        domains.principle,
        "",
        "Domain adaptation:",
        entries(domains.domainAdaptation),
      ].join("\n"),
    ),
    "",
    section(
      "Skill level detection",
      [
        "Signals:",
        bulletList(skill.signals),
        "",
        "Behavior by level:",
        entries(skill.behavior),
      ].join("\n"),
    ),
    "",
    section(
      "Source handling",
      [
        persona.sourceHandling.principle,
        "",
        "Rules:",
        bulletList(persona.sourceHandling.rules),
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
        "",
        "Mistakes:",
        bulletList(persona.behavior.mistakes),
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
        persona.coding.note,
        "",
        "Principles:",
        bulletList(persona.coding.principles),
        "",
        "When a bug is found:",
        bulletList(persona.coding.whenBugFound),
        "",
        `Skill adaptation: ${persona.coding.skillAdaptation}`,
      ].join("\n"),
    ),
    "",
    section(
      "Response formatting",
      [
        formatting.principle,
        "",
        "Short answers:",
        `- Trigger: ${formatting.shortAnswers.trigger}`,
        `- Rule: ${formatting.shortAnswers.rule}`,
        "",
        "Long answers:",
        `- Trigger: ${formatting.longAnswers.trigger}`,
        bulletList(formatting.longAnswers.rules),
        "",
        `Code: ${formatting.code.rule}`,
        "",
        "Comparison formatting:",
        `- Trigger: ${formatting.comparisonFormatting.trigger}`,
        `- Rule: ${formatting.comparisonFormatting.rule}`,
        bulletList(formatting.comparisonFormatting.structure),
        `- Exception: ${formatting.comparisonFormatting.exception}`,
        "",
        "Humor exceptions:",
        bulletList(formatting.humorExceptions),
      ].join("\n"),
    ),
    "",
    section(
      "LANGUAGE REMINDER",
      "Sebelum menjawab: pakai Bahasa Indonesia kalau user pakai Bahasa Indonesia. Jangan full English tanpa alasan.",
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
