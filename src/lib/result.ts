import { Result } from 'better-result'

// Automatically strips all functions (like .toJSON, .toString) from the type
type StripMethods<T> = {
  [K in keyof T as NonNullable<T[K]> extends (...args: Array<any>) => any ? never : K]: T[K]
}

// Strips the methods AND safely forces the 'cause' to be a string
type SafeErrorType<E> = Omit<StripMethods<E>, 'cause'> & { cause?: string }

// The true, network-safe return type
export type SafeSerializedResult<T, E> =
  | { status: 'ok'; value: T }
  | { status: 'error'; error: SafeErrorType<E> }

/**
 * Helper function to safely serialize a Result<T, E> into a SafeSerializedResult<T, E>.
 * This is because currently `Result.serialize()` does not strip methods and can include non-serializable properties,
 * causing a problem with Tanstack Start's server functions
 *
 * @param result The Result<T, E> to be serialized. This can be either a success or an error result.
 * @returns A SafeSerializedResult<T, E> that is safe to send over the network without including any functions or non-serializable properties.
 */
export function safeSerialize<T, E>(result: Result<T, E>): SafeSerializedResult<T, E> {
  return Result.serialize(result) as unknown as SafeSerializedResult<T, E>
}

/**
 * Collects an array of Results into a single Result containing an array of values.
 * Returns the first error encountered, or an Ok with all values if all succeed.
 *
 * @param results - Array of Result<T, E> to collect
 * @returns A Result containing either an array of all T values, or the first E error
 */
export function collectResults<T, E>(results: Array<Result<T, E>>): Result<Array<T>, E> {
  const values: Array<T> = []

  for (const result of results) {
    if (result.isErr()) return result as Result<Array<T>, E>
    values.push(result.value)
  }

  return Result.ok(values)
}

/**
 * Ensures an array is non-empty, returning Ok with the array or an Err with a message.
 *
 * @param items - The array to check
 * @param error - the error with the message, optional
 * @returns Ok(items) if non-empty, otherwise Err with a descriptive message
 */

export function ensureNonEmpty<T>(
  items: Array<T>,
  error: { message: string } = { message: 'Expected at least one item.' },
): Result<Array<T>, { message: string }> {
  return items.length > 0 ? Result.ok(items) : Result.err(error)
}
