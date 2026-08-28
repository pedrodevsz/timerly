import { describe, expect, it } from "vitest";
import { parseBulkTopics } from "./parse-bulk-topics";

describe("parseBulkTopics", () => {
  it("processa uma linha", () => {
    expect(parseBulkTopics("SQL")).toEqual({
      topics: ["SQL"],
      lineCount: 1,
      duplicateCount: 0,
    });
  });

  it("preserva a ordem de várias linhas", () => {
    expect(parseBulkTopics("Modelo relacional\nNormalização\nJOIN").topics).toEqual(
      ["Modelo relacional", "Normalização", "JOIN"],
    );
  });

  it("remove linhas vazias e limpa espaços externos e internos", () => {
    expect(parseBulkTopics("  Modelo   relacional  \n\n  JOIN \n").topics).toEqual(
      ["Modelo relacional", "JOIN"],
    );
  });

  it("remove duplicados sem diferenciar maiúsculas e minúsculas", () => {
    expect(parseBulkTopics("SQL\nsql\nSql")).toEqual({
      topics: ["SQL"],
      lineCount: 3,
      duplicateCount: 2,
    });
  });

  it("retorna uma coleção vazia para texto vazio ou somente espaços", () => {
    expect(parseBulkTopics(" \n\n  ")).toEqual({
      topics: [],
      lineCount: 0,
      duplicateCount: 0,
    });
  });
});
