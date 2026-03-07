function stripWrappingQuotes(value: string): string {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];

    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }

  return value;
}

export function readEnv(name: string): string | undefined {
  const rawValue = process.env[name];
  if (!rawValue) {
    return undefined;
  }

  const normalizedValue = stripWrappingQuotes(rawValue.trim()).trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

export function readEnvUrl(name: string): string | undefined {
  const value = readEnv(name);
  if (!value) {
    return undefined;
  }

  return value.replace(/\/+$/, "");
}