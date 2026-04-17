import enCommon from '@locales/en/common.json';

type DotPrefix<T extends string> = T extends '' ? '' : `.${T}`;

type DotNestedKeys<T> = (
  T extends object
    ? {
        [K in Exclude<keyof T, symbol>]: `${Extract<K, string>}${DotPrefix<DotNestedKeys<T[K]>>}`;
      }[Exclude<keyof T, symbol>]
    : ''
) extends infer D
  ? Extract<D, string>
  : never;

export type I18nKey = DotNestedKeys<typeof enCommon>;

export function i18nKey<T extends I18nKey>(key: T) {
  return key;
}
