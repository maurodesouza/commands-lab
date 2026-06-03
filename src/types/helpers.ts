export type DeepKeyPaths<T> = T extends object
	? {
			[K in keyof T & string]: K | `${K}.${DeepKeyPaths<T[K]>}`;
		}[keyof T & string]
	: never;


export type DeepKeys<T> =
  T extends object
    ? {
        [K in keyof T]:
          K | DeepKeys<T[K]>
      }[keyof T]
    : never;
