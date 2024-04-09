export type ResultAsync<T> = {
  data?: T;
  error?: unknown;
};

export async function resultAsync<T>(promise: Promise<T>, resultify: "resultfiy"): Promise<ResultAsync<T>>;
export async function resultAsync<T>(promise: Promise<T>, resultify: "bare"): Promise<T | unknown>;
export async function resultAsync<T>(
  promise: Promise<T>,
  resultify: "resultfiy" | "bare" = "resultfiy",
): Promise<ResultAsync<T> | T | unknown> {
  try {
    const data = await promise;
    if (resultify === "resultfiy") {
      return { data, error: null };
    }

    if (resultify === "bare") {
      return data;
    }
  } catch (error) {
    if (resultify === "resultfiy") {
      return { data: undefined, error };
    }

    if (resultify === "bare") {
      return error;
    }
  }
}

export * from "./timer";
