export type ResultAsync<T> = {
  data?: T;
  error?: unknown;
};

export async function resultAsync<T>(promise: Promise<T>): Promise<ResultAsync<T>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: undefined, error };
  }
}
