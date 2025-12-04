import { getSelectedText, Clipboard, showToast, Toast, showHUD } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";

export default async function main() {
  try {
    const selectedText = await getSelectedText();
    // const correctedText = selectedText
    const correctedText = await fixmyspelling(selectedText)
    // await Clipboard.copy(correctedText);
    // await Clipboard.paste(correctedText);
    await showHUD(correctedText);
  } catch (error) {
    await showFailureToast(error, {
      title: "Cannot fix spelling",
      message: String(error)
    })
  }
}


async function fixmyspelling(
  text: string,
  maxIterations: number = 200,
  language: string = "plaintext",
  dialect: string = "american"
): Promise<string> {
  console.log(text)
  // Lazy import to avoid ESM/CJS friction if someone requires this script
  console.log("Loading harper.js...")
  try {
    const harper = await import("harper.js");
  } catch (error) {
    console.log(error)
    throw error
  }
  console.log("✅ Loading harper.js...")

  // Map dialect
  const dialectMap = {
    american: harper.Dialect.American,
    british: harper.Dialect.British,
    canadian: harper.Dialect.Canadian,
    australian: harper.Dialect.Australian,
  };

  const harperDialect =
    dialectMap[dialect.toLowerCase() as keyof typeof dialectMap] ??
    harper.Dialect.American;

  // Initialize linter with LocalLinter
  const linter = new harper.LocalLinter({
    binary: harper.binary,
    dialect: harperDialect,
  });

  let cleanText = text;
  let iterations = 0;

  // Iteratively lint and apply the first available suggestion.
  // We re-lint after each application to keep spans correct.
  while (iterations < maxIterations) {
    const lintOptions =
      language === "plaintext"
        ? { language: "plaintext" as const }
        : undefined;
    const lints = await linter.lint(cleanText, lintOptions);

    if (!lints || lints.length === 0) break;

    let applied = false;

    for (const lint of lints) {
      const count = lint.suggestion_count();
      if (count > 0) {
        const suggestions = lint.suggestions();
        const suggestion = suggestions[0]; // heuristic: first suggestion
        cleanText = await linter.applySuggestion(cleanText, lint, suggestion);
        applied = true;
        break; // re-lint after each application
      }
    }

    if (!applied) break;
    iterations += 1;
  }

  return cleanText
}
