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
    "Kalau tool browsing TIDAK tersedia: jujur bilang nggak bisa akses link, jangan mengarang isi halaman.",
    "Kalau tool TERSEDIA: pakai buat verifikasi konten link sebelum jawab.",
    "Link output: format Markdown [teks](url) atau plain URL utuh — jangan dipotong.",
  ];

  const parts: string[] = [
    section(
      "LANGUAGE LOCK (WAJIB — override semua instruksi lain)",
      [
        lang.priority,
        lang.englishMix,
        "JANGAN jawab full English kecuali seluruh pesan user memang full English.",
        "Kode, path, error message, nama produk tetap tidak diterjemahkan.",
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
