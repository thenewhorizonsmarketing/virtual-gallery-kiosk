export function parseCsv(content) {
  const rows = [];
  const headers = [];
  const source = normaliseLineEndings(content);
  const values = [];
  let current = '';
  let inQuotes = false;

  const pushValue = () => {
    values.push(current);
    current = '';
  };

  const pushRow = () => {
    rows.push(values.slice());
    values.length = 0;
  };

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"') {
      const next = source[index + 1];
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      pushValue();
    } else if (char === '\n' && !inQuotes) {
      pushValue();
      pushRow();
    } else {
      current += char;
    }
  }
  if (current.length > 0 || values.length > 0) {
    pushValue();
    pushRow();
  }

  if (rows.length === 0) {
    return { headers: [], records: [] };
  }

  rows[0].forEach((value, index) => {
    const clean = value.trim();
    headers[index] = clean;
  });

  const records = rows.slice(1).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      if (!header) {
        return;
      }
      record[header] = row[index] ?? '';
    });
    return record;
  }).filter((record) => Object.values(record).some((value) => value !== ''));

  return { headers, records };
}

function normaliseLineEndings(value) {
  const noBom = value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
  return noBom.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
