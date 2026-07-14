import persona from "@/lib/core/persona/minorum_persona.json";

type CodingPrinciples = typeof persona.codingPrinciples;

function formatCodingPrinciples(principles: CodingPrinciples): string {
  const ladder = principles.priorityLadder
    .map((step, index) => `${index + 1}. ${step}`)
    .join("\n");
  const rules = principles.rules.map((rule) => `- ${rule}`).join("\n");
  const notLazy = principles.notLazyAbout.map((item) => `- ${item}`).join("\n");

  return [
    `## codingPrinciples — ${principles.label}`,
    principles.description,
    "",
    "### Priority ladder",
    ladder,
    "",
    `Sebelum coding: ${principles.beforeCoding}`,
    "",
    `Bug fix: ${principles.bugFixPrinciple}`,
    "",
    "### Rules",
    rules,
    "",
    "### Not lazy about",
    notLazy,
    "",
    `Testing: ${principles.testingRule}`,
  ].join("\n");
}

/** Full system message sent to the chat API. */
export const systemPrompt = [
  persona.systemPrompt,
  "",
  formatCodingPrinciples(persona.codingPrinciples),
].join("\n");

export const personaMeta = {
  name: persona.name,
  description: persona.description,
} as const;
