import { getSelectedText, Clipboard, showToast, Toast, showHUD, environment } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";


export default async function main() {
  try {
    const selectedText = await getSelectedText();
    const correctedText = await fixmyspelling(selectedText)
    await showHUD(correctedText);
  } catch (error) {
    console.log(error)
    await showFailureToast(error, {
      title: "Cannot fix spelling",
      message: String(error)
    })
  }
}


async function fixmyspelling(
  text: string,
  maxIterations: number = 200,
): Promise<string> {

  console.log(text)

  const harper = await import("harper.js");

  const linter = new harper.LocalLinter({
    binary: harper.binary,
    dialect: harper.Dialect.American,
  });


  let cleanText = text;
  let iterations = 0;

  // Iteratively lint and apply the first available suggestion.
  // We re-lint after each application to keep spans correct.
  while (iterations < maxIterations) {
    const lints = await linter.lint(cleanText, { language: "plaintext" });
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
