import * as fs from "node:fs";
import * as path from "node:path";

export function getTotalSpinsFromFeature(): number[] {
  const featurePath = path.join(
    __dirname,
    "../tests/features/wheel-distribution.feature"
  );
  const content = fs.readFileSync(featurePath, "utf-8");

  const spins: number[] = [];
  const lines = content.split("\n");

  let inExamples = false;
  for (const line of lines) {
    if (line.includes("| totalSpins |")) {
      inExamples = true;
      continue;
    }
    if (inExamples && line.trim().startsWith("|")) {
      const regex = /\|\s*(\d+)\s*\|/;
      const match = regex.exec(line);
      if (match) {
        spins.push(Number.parseInt(match[1], 10));
      }
    }
    if (inExamples && line.trim() === "") {
      break;
    }
  }

  return spins;
}
