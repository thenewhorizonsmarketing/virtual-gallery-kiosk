export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = { _: [] };
  let index = 0;
  while (index < rest.length) {
    const token = rest[index];
    if (token.startsWith('--')) {
      const [flag, valueFromEquals] = token.slice(2).split('=', 2);
      if (!flag) {
        index += 1;
        continue;
      }
      let value = valueFromEquals;
      if (value === undefined) {
        const next = rest[index + 1];
        if (next && !next.startsWith('--')) {
          value = next;
          index += 1;
        } else {
          value = 'true';
        }
      }
      options[flag.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = normaliseValue(value);
    } else {
      options._.push(token);
    }
    index += 1;
  }
  return { command, options };
}

function normaliseValue(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && value.trim() !== '') {
    return asNumber;
  }
  return value;
}
