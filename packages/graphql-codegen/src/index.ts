import { mkdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { constants as fsConstants } from 'node:fs';
import { generate } from '@graphql-codegen/cli';
import type { CodegenConfig } from '@graphql-codegen/cli';

type RawTargetConfig = {
  name: string;
  schema: string;
  outputDir: string;
  documents?: string[];
  headers?: Record<string, string>;
};

type RawCodegenConfig = {
  targets: RawTargetConfig[];
};

type CodegenTarget = {
  name: string;
  schema: string;
  outputDir: string;
  documents: string[];
  headers: Record<string, string>;
};

const DEFAULT_CONFIG_PATH = 'graphql.codegen.targets.json';
const DEFAULT_ENV_FILES = ['.env', '.env.local', 'apps/web/.env', 'apps/web/.env.local'];
const WORKSPACE_ROOT = process.env.INIT_CWD ?? process.cwd();

function parseArgs(argv: string[]) {
  const args = { target: null as string | null, configPath: DEFAULT_CONFIG_PATH };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token) {
      continue;
    }

    if (token === '--target') {
      args.target = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token.startsWith('--target=')) {
      args.target = token.slice('--target='.length);
      continue;
    }

    if (token === '--config') {
      args.configPath = argv[index + 1] ?? DEFAULT_CONFIG_PATH;
      index += 1;
      continue;
    }

    if (token.startsWith('--config=')) {
      args.configPath = token.slice('--config='.length);
    }
  }

  return args;
}

function resolveEnvPlaceholders(value: string): string {
  const pattern = /\$\{([A-Z0-9_]+)\}/gi;

  return value.replace(pattern, (_match, envName: string) => {
    const envValue = process.env[envName];

    if (!envValue) {
      throw new Error(`Missing environment variable: ${envName}`);
    }

    return envValue;
  });
}

function normalizeTarget(raw: RawTargetConfig): CodegenTarget {
  const documents = raw.documents ?? [];
  const headers: Record<string, string> = {};

  for (const [key, value] of Object.entries(raw.headers ?? {})) {
    headers[key] = resolveEnvPlaceholders(value);
  }

  return {
    name: raw.name,
    schema: resolveEnvPlaceholders(raw.schema),
    outputDir: raw.outputDir,
    documents,
    headers
  };
}

async function fileExists(absolutePath: string) {
  try {
    await access(absolutePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function stripWrappedQuotes(value: string) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}

async function loadDotEnvFiles() {
  for (const relativePath of DEFAULT_ENV_FILES) {
    const absolutePath = path.resolve(WORKSPACE_ROOT, relativePath);
    const exists = await fileExists(absolutePath);

    if (!exists) {
      continue;
    }

    const content = await readFile(absolutePath, 'utf8');
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const equalIndex = trimmed.indexOf('=');
      if (equalIndex <= 0) {
        continue;
      }

      const key = trimmed.slice(0, equalIndex).trim();
      if (!key || process.env[key]) {
        continue;
      }

      const value = stripWrappedQuotes(trimmed.slice(equalIndex + 1).trim());
      process.env[key] = value;
    }
  }
}

async function loadTargets(configPath: string): Promise<CodegenTarget[]> {
  const absolutePath = path.resolve(WORKSPACE_ROOT, configPath);
  const exists = await fileExists(absolutePath);

  if (!exists) {
    throw new Error(
      `Codegen config file not found: ${absolutePath}. Create ${DEFAULT_CONFIG_PATH} with one or more GraphQL targets.`
    );
  }

  const rawContent = await readFile(absolutePath, 'utf8');
  const parsed = JSON.parse(rawContent) as RawCodegenConfig;

  if (!Array.isArray(parsed.targets) || parsed.targets.length === 0) {
    throw new Error(`Config file ${absolutePath} must contain a non-empty "targets" array.`);
  }

  return parsed.targets.map(normalizeTarget);
}

async function runTarget(target: CodegenTarget) {
  const absoluteOutputDir = path.resolve(WORKSPACE_ROOT, target.outputDir);
  await mkdir(absoluteOutputDir, { recursive: true });
  const documents = target.documents.map((pattern) => path.resolve(WORKSPACE_ROOT, pattern));

  const schemaConfig = {
    [target.schema]: {
      headers: target.headers
    }
  };

  const generates: CodegenConfig['generates'] = {
    [path.join(absoluteOutputDir, 'schema.types.ts')]: {
      plugins: ['typescript']
    }
  };

  if (target.documents.length > 0) {
    generates[path.join(absoluteOutputDir, 'operations.ts')] = {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node']
    };
  }

  const config: CodegenConfig = {
    schema: schemaConfig,
    documents,
    ignoreNoDocuments: true,
    overwrite: true,
    generates,
    hooks: {
      afterOneFileWrite: ['prettier --write']
    }
  };

  await generate(config, true);
}

async function main() {
  await loadDotEnvFiles();
  const { target: targetName, configPath } = parseArgs(process.argv.slice(2));
  const allTargets = await loadTargets(configPath);

  const selectedTargets = targetName ? allTargets.filter((item) => item.name === targetName) : allTargets;

  if (selectedTargets.length === 0) {
    const availableTargets = allTargets.map((item) => item.name).join(', ');
    throw new Error(`Target "${targetName}" not found. Available targets: ${availableTargets}`);
  }

  for (const target of selectedTargets) {
    console.log(`\n[codegen] Generating target: ${target.name}`);
    await runTarget(target);
  }

  console.log(`\n[codegen] Done. Generated ${selectedTargets.length} target(s).`);
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unexpected codegen error.';
  console.error(`\n[codegen] Failed: ${message}`);
  process.exit(1);
});
