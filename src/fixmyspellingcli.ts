import { promisify } from "util";
import { exec } from "child_process";
import { getSelectedText, Clipboard, showToast, Toast, showHUD } from "@raycast/api";
import os from "os";
import path from "path";

const execAsync = promisify(exec);

export default async function main() {

  const fixmyspelling = path.join(
    os.homedir(),
    ".local",
    "bin",
    'fixmyspelling'
  )

  try {
    const selectedText = await getSelectedText();
    const command = [fixmyspelling, `'${selectedText}'`].join(' ')
    const { stdout, stderr } = await execAsync(command);
    await showHUD("Spelling fixed")
    Clipboard.paste(stdout)
  } catch (error) {
    console.log(error)
    await showToast({
      style: Toast.Style.Failure,
      title: "Error",
      message: String(error)
    })
  }
}

