import { getEncodedType, getType } from './zod';

export function parsePathParams(params: string) {
  const parts = params.split('/').filter(Boolean);

  const entries = parts
    .filter((item) => item.includes(':'))
    .map((part) => part.split(':'));

  return `z.object({${entries.reduce((acc, [name, rawType]) => {
    const type = getType(rawType);

    return `${acc} ${name}: ${type},`;
  }, '')} })`;
}

export function encodePathParams(params: string) {
  if (!Boolean(params.replace(/\s/, ''))) {
    return '/';
  }

  const body = params.split('z.object({')[1].split('})').slice(0, -1).join('');

  const parts = body
    .replace(/\s/g, '')
    .split(',')
    .filter((item) => item.includes(':'))
    .map((item) => item.split(':'));

  return parts.reduce(
    (acc, [name, type]) => `${acc}/${name}:${getEncodedType(type)}`,
    '',
  );
}
