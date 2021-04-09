export type ActionsOf<T extends { [key: string]: (...args: any) => any }> = ReturnType<T[keyof T]>;
