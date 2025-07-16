// lib/sample.ts
export function sample<T>(array: T[], n: number): T[] {
  const copy = [...array];           // shallow clone so we don't mutate caller
  const picked: T[] = [];

  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    picked.push(copy[idx]);
    copy.splice(idx, 1);             // remove to avoid duplicates
  }

  return picked;
}
