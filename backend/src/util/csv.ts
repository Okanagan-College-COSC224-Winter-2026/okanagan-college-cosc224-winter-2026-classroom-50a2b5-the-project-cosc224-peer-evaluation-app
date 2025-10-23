export function csv2json(csv: string) {
  const lines = csv.split('\n');
  const headers = lines[0].split(',');
  const data = lines.slice(1).map(line => {
    // If the line is empty or doens't contain commas, end early
    if (!line.includes(',') || line.trim() === '') {
      return null;
    }

    const values = line.split(',');
    const obj = {};
    headers.forEach((header, i) => {
      // @ts-expect-error SHUT UP !!!!
      obj[header] = values[i];
    });

    return obj;
  }).filter(Boolean);

  return data;
}