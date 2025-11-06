import path from 'node:path';
import { spawn } from 'node:child_process';
import { copyFile } from 'node:fs/promises';
import { ensureDir, listFilesRecursive, pathExists } from '../lib/fs.js';
import { resolveContentPaths, DEFAULT_CONTENT_ROOT } from '../lib/paths.js';
import { logInfo, logSuccess, logWarn } from '../lib/logger.js';

export async function generateDerivatives(options) {
  const contentRoot = options.contentRoot ? path.resolve(options.contentRoot) : DEFAULT_CONTENT_ROOT;
  const paths = resolveContentPaths(contentRoot);
  await ensureDir(paths.imagesDir);
  await ensureDir(paths.thumbDir);
  await ensureDir(paths.screenDir);

  await generateDerivativesForImages({
    imagesDir: paths.imagesDir,
    thumbDir: paths.thumbDir,
    screenDir: paths.screenDir,
    force: options.force === true,
  });

  logSuccess('Derivative generation complete.');
}

export async function generateDerivativesForImages({ imagesDir, thumbDir, screenDir, force = false }) {
  const files = await listFilesRecursive(imagesDir);
  if (files.length === 0) {
    logWarn('No images available for derivative generation.');
    return;
  }

  const magickCommand = await detectImageMagick();
  if (!magickCommand) {
    logWarn('ImageMagick not found. Derivatives will be simple copies of originals.');
  } else {
    logInfo(`Using ${magickCommand} for image processing.`);
  }

  let processed = 0;
  for (const relative of files) {
    if (!relative.match(/\.(jpg|jpeg|png|webp)$/i)) {
      continue;
    }
    const source = path.join(imagesDir, relative);
    const thumbTarget = path.join(thumbDir, relative);
    const screenTarget = path.join(screenDir, relative);
    await ensureDir(path.dirname(thumbTarget));
    await ensureDir(path.dirname(screenTarget));

    const needsThumb = force || !(await pathExists(thumbTarget));
    const needsScreen = force || !(await pathExists(screenTarget));

    if (needsThumb) {
      await createDerivative({ command: magickCommand, source, target: thumbTarget, size: '256x256', crop: true });
    }
    if (needsScreen) {
      await createDerivative({ command: magickCommand, source, target: screenTarget, size: '1600x1600', crop: false });
    }
    processed += needsThumb || needsScreen ? 1 : 0;
  }
  logInfo(`Derivatives processed for ${processed} source images.`);
}

async function createDerivative({ command, source, target, size, crop }) {
  if (!command) {
    await copyFile(source, target);
    return;
  }
  const args = crop
    ? [source, '-auto-orient', '-resize', `${size}^`, '-gravity', 'center', '-extent', size, target]
    : [source, '-auto-orient', '-resize', `${size}>`, target];
  await runCommand(command, args, source);
}

async function detectImageMagick() {
  if (await commandExists('magick')) {
    return 'magick';
  }
  if (await commandExists('convert')) {
    return 'convert';
  }
  return null;
}

function commandExists(command) {
  return new Promise((resolve) => {
    const locator = process.platform === 'win32' ? 'where' : 'which';
    const child = spawn(locator, [command]);
    child.on('close', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

function runCommand(command, args, source) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (code) => {
      if (code !== 0) {
        logWarn(`Derivative generation failed for ${source}: ${stderr}`);
        reject(new Error(stderr || `${command} exited with ${code}`));
      } else {
        resolve();
      }
    });
    child.on('error', (error) => {
      logWarn(`Unable to launch ${command}: ${error.message}`);
      reject(error);
    });
  }).catch(async () => {
    await copyFile(source, args[args.length - 1]);
  });
}
