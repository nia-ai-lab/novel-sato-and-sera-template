import { cp, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { ensureDir, exists } from "./lib/novel-project.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const options = {
    dest: "",
    title: "新しいおっさんサトー回",
    subtitle: "",
    author: "",
    genre: "現代スパイ日常コメディ",
    logline: "",
    force: false,
  };

  for (const arg of argv.slice(2)) {
    if (!arg.startsWith("--")) {
      continue;
    }

    const separatorIndex = arg.indexOf("=");
    const key = separatorIndex === -1 ? arg.slice(2) : arg.slice(2, separatorIndex);
    const value = separatorIndex === -1 ? "true" : arg.slice(separatorIndex + 1);

    if (key === "force") {
      options.force = value !== "false";
      continue;
    }

    if (key in options) {
      options[key] = value;
    }
  }

  if (!options.dest) {
    throw new Error("Missing required --dest=/path/to/new-project");
  }

  return options;
}

async function listVisibleEntries(targetDir) {
  if (!(await exists(targetDir))) {
    return [];
  }

  return (await readdir(targetDir)).filter((entry) => entry !== ".DS_Store");
}

async function ensureEmptyDestination(targetDir, force) {
  await ensureDir(targetDir);
  const entries = await listVisibleEntries(targetDir);
  if (entries.length > 0 && !force) {
    throw new Error(`Destination is not empty: ${targetDir}`);
  }
}

async function copyTemplateFiles(targetDir) {
  const tasks = [
    ["package.json", "package.json"],
    ["package-lock.json", "package-lock.json"],
    [".gitignore", ".gitignore"],
    ["AGENTS.md", "AGENTS.md"],
    ["README.md", "README.md"],
    ["scripts", "scripts"],
    ["soudoku-novel-builder", "soudoku-novel-builder"],
  ];

  for (const [fromRel, toRel] of tasks) {
    const fromPath = path.join(rootDir, fromRel);
    const toPath = path.join(targetDir, toRel);
    await cp(fromPath, toPath, { recursive: true, force: true });
  }

  await ensureDir(path.join(targetDir, "project", "assets", "characters"));

  const canonicalCharacterFiles = [
    "sato.png",
    "sato.raw.png",
    "sato.json",
    "sera.png",
    "sera.raw.png",
    "sera.json",
  ];

  for (const fileName of canonicalCharacterFiles) {
    const fromPath = path.join(rootDir, "project", "assets", "characters", fileName);
    if (await exists(fromPath)) {
      await cp(
        fromPath,
        path.join(targetDir, "project", "assets", "characters", fileName),
        { force: true },
      );
    }
  }
}

function runNodeScript(scriptPath, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd,
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Command failed with exit code ${code}`));
    });

    child.on("error", reject);
  });
}

async function main() {
  const options = parseArgs(process.argv);
  const targetDir = path.resolve(options.dest);

  await ensureEmptyDestination(targetDir, options.force);
  await copyTemplateFiles(targetDir);

  const initScriptPath = path.join(targetDir, "scripts", "init-novel-project.mjs");
  const initArgs = [
    `--title=${options.title}`,
    `--subtitle=${options.subtitle}`,
    `--author=${options.author}`,
    `--genre=${options.genre}`,
    `--logline=${options.logline}`,
    "--series=sato-kimama",
  ];

  await mkdir(path.join(targetDir, "docs"), { recursive: true });
  await runNodeScript(initScriptPath, initArgs, targetDir);

  process.stdout.write(
    `Bootstrapped Sato series template into ${targetDir}\n` +
      `Next steps:\n` +
      `- cd ${targetDir}\n` +
      `- npm install\n` +
      `- configure GEMINI_API_KEY\n`,
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
