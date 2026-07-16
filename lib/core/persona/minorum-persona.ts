import persona from "@/lib/core/persona/minorum_persona.json";

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

function buildSystemPrompt(): string {
  const lang = persona.communication.language;
  const mix = persona.communication.englishMix;
  const domains = persona.knowledgeDomains;
  const skill = persona.skillLevelDetection;
  const humor = persona.humor;
  const formatting = persona.responseFormatting;

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
