import { useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export type UrlFilterField<T> = {
  default: T;
  parse: (value: string | null) => T;
  serialize?: (value: T) => string | null;
};

export type UrlFilterConfig<T extends Record<string, unknown>> = {
  [K in keyof T]: UrlFilterField<T[K]>;
};

const readFilters = <T extends Record<string, unknown>>(
  params: URLSearchParams,
  config: UrlFilterConfig<T>,
): T => {
  const result = {} as T;
  (Object.keys(config) as (keyof T)[]).forEach((key) => {
    result[key] = config[key].parse(params.get(key as string));
  });
  return result;
};

/**
 * Generic filter state synced to the URL's search params, so a view can be
 * shared or bookmarked and reopened as-is. `config` describes each filter's
 * default value, how to read it from a param string, and (optionally) how
 * to write it back; a filter at its default is omitted from the URL.
 */
export const useUrlFilters = <T extends Record<string, unknown>>(
  config: UrlFilterConfig<T>,
) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const filters = useMemo(
    () => readFilters(searchParams, config),
    [searchParams, config],
  );

  const setFilters = useCallback(
    (patch: Partial<T>) => {
      const current = new URLSearchParams(window.location.search);
      const merged = { ...readFilters(current, config), ...patch };
      const next = new URLSearchParams(current);

      (Object.keys(config) as (keyof T)[]).forEach((key) => {
        const field = config[key];
        const value = merged[key];

        if (value === field.default) {
          next.delete(key as string);
          return;
        }

        const serialized = field.serialize
          ? field.serialize(value)
          : value === null || value === undefined
            ? null
            : String(value);

        if (serialized === null) {
          next.delete(key as string);
        } else {
          next.set(key as string, serialized);
        }
      });

      navigate({ search: next.toString() }, { replace: true });
    },
    [navigate, config],
  );

  return { filters, setFilters };
};
