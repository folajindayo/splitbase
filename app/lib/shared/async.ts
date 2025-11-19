/**
 * Async utility functions
 */

export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        await sleep(delayMs * attempt);
      }
    }
  }

  throw lastError!;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function timeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMessage: string = "Operation timed out"
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), ms);
  });

  return Promise.race([promise, timeoutPromise]);
}

export async function parallel<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number = Infinity
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]();

    const p = task.then((result) => {
      results[i] = result;
    });

    executing.push(p);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      const index = executing.findIndex((p) => p === Promise.resolve());
      if (index !== -1) executing.splice(index, 1);
    }
  }

  await Promise.all(executing);
  return results;
}

export async function sequential<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
  const results: T[] = [];

  for (const task of tasks) {
    results.push(await task());
  }

  return results;
}

export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout | null = null;
  let pendingPromise: Promise<ReturnType<T>> | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (!pendingPromise) {
      pendingPromise = new Promise((resolve, reject) => {
        timeoutId = setTimeout(async () => {
          try {
            const result = await fn(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            pendingPromise = null;
            timeoutId = null;
          }
        }, delayMs);
      });
    }

    return pendingPromise;
  };
}

export function throttleAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  limitMs: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let lastCall = 0;
  let pendingPromise: Promise<ReturnType<T>> | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= limitMs) {
      lastCall = now;
      return fn(...args);
    }

    if (!pendingPromise) {
      pendingPromise = new Promise((resolve, reject) => {
        setTimeout(async () => {
          lastCall = Date.now();
          try {
            const result = await fn(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            pendingPromise = null;
          }
        }, limitMs - timeSinceLastCall);
      });
    }

    return pendingPromise;
  };
}

export async function allSettled<T>(
  promises: Promise<T>[]
): Promise<Array<{ status: "fulfilled"; value: T } | { status: "rejected"; reason: any }>> {
  return Promise.all(
    promises.map((promise) =>
      promise
        .then((value) => ({ status: "fulfilled" as const, value }))
        .catch((reason) => ({ status: "rejected" as const, reason }))
    )
  );
}
