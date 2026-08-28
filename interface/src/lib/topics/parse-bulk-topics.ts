export type ParsedBulkTopics = {
  topics: string[];
  lineCount: number;
  duplicateCount: number;
};

export function cleanTopicName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function normalizeTopicName(name: string) {
  return cleanTopicName(name).toLocaleLowerCase("pt-BR");
}

export function parseBulkTopics(text: string): ParsedBulkTopics {
  const lines = text
    .split(/\r?\n/)
    .map(cleanTopicName)
    .filter(Boolean);
  const seen = new Set<string>();
  const topics: string[] = [];

  for (const line of lines) {
    const normalized = normalizeTopicName(line);
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    topics.push(line);
  }

  return {
    topics,
    lineCount: lines.length,
    duplicateCount: lines.length - topics.length,
  };
}
