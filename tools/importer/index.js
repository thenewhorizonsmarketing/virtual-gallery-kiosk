#!/usr/bin/env node
import { parseArgs } from './lib/args.js';
import { importPack } from './commands/import-pack.js';
import { activateStaged } from './commands/activate-staged.js';
import { rollbackActive } from './commands/rollback.js';
import { generateDerivatives } from './commands/gen-derivatives.js';
import { checkIntegrity } from './commands/check-integrity.js';
import { reindexFts } from './commands/reindex-fts.js';
import { logError } from './lib/logger.js';

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));

  try {
    switch (command) {
      case 'import-pack':
        await importPack(options);
        break;
      case 'activate-staged':
        await activateStaged(options);
        break;
      case 'rollback':
        await rollbackActive(options);
        break;
      case 'gen-derivatives':
        await generateDerivatives(options);
        break;
      case 'check-integrity':
        await checkIntegrity(options);
        break;
      case 'reindex-fts':
        await reindexFts(options);
        break;
      case 'help':
      case undefined:
        printHelp();
        break;
      default:
        logError(`Unknown command: ${command}`);
        printHelp();
        process.exitCode = 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logError(message);
    if (error instanceof Error && error.stack) {
      logError(error.stack);
    }
    process.exitCode = 1;
  }
}

function printHelp() {
  console.log(`Offline Kiosk Tooling\n\n` +
    `Usage: node tools/importer/index.js <command> [options]\n\n` +
    `Commands:\n` +
    `  import-pack <pack.zip>   Verify and stage a content pack\n` +
    `  activate-staged          Promote the staged database and snapshot previous\n` +
    `  rollback                 Restore the previous active database snapshot\n` +
    `  gen-derivatives          Generate image derivatives for all known photos\n` +
    `  check-integrity          Run integrity checks against the database\n` +
    `  reindex-fts              Rebuild the FTS5 search index\n` +
    `  help                     Show this message\n` +
    `\nOptions:\n` +
    `  --content-root <path>    Override the kiosk content directory (default ./content)\n` +
    `  --verify                 Require signature and hash verification during import\n` +
    `  --public-key <path>      Path to Ed25519 public key for signature verification\n` +
    `  --staged-db <path>       Override the staged database path\n` +
    `  --active-db <path>       Override the active database path\n` +
    `  --skip-derivatives       Skip derivative generation during import\n` +
    `  --force                  Force regeneration for derivatives\n` +
    `  --level <basic|strict>   Integrity check strictness (default basic)\n`);
}

await main();
