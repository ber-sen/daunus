export const isObject = (value: any): value is object =>
  value === null ||
  Array.isArray(value) ||
  typeof value == 'function' ||
  value?.constructor === Date
    ? false
    : typeof value == 'object';

export const isTineVar = (value: any) => isObject(value) && '__value' in value;

export const isArray = (value: any): value is any[] => Array.isArray(value);

export const isMapLike = (value: any): value is Map<any, any> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.has === 'function' &&
    typeof value.get === 'function'
  );
};
