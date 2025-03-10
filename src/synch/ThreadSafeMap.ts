import { Mutex } from "async-mutex";

/**
 * ThreadSafeMap is a class that provides a thread-safe implementation of a Map-like data structure.
 * All operations on the map are synchronized to ensure atomicity and prevent race conditions.
 *
 * @template K - The type of the keys in the map.
 * @template V - The type of the values in the map.
 */
class ThreadSafeMap<K, V> {
  private map: Map<K, V>;
  private mutex: Mutex;

  /**
   * Initializes a new instance of the class with a Map and a Mutex.
   *
   * @return {Object} A new instance of the class containing an empty map and a mutex for synchronization.
   */
  constructor() {
    this.map = new Map<K, V>();
    this.mutex = new Mutex();
  }

  /**
   * Atomically compares and sets a value in the map associated with a specific key if a given condition is met.
   * The operation is performed within a mutex to ensure thread safety.
   *
   * @param {K} key - The key associated with the value to compare and set.
   * @param {V} value - The new value to set if the condition is met.
   * @param {function(V): boolean} compare - A function that evaluates the condition for replacing the existing value.
   *                                         The function takes the current value as an argument and returns a boolean.
   * @return {Promise<boolean>} A promise that resolves to true if the value was set, otherwise false.
   */
  async compareAndSetValue(key: K, value: V, compare: (oldValue: V) => boolean): Promise<boolean> {
    return await this.mutex.runExclusive(async () => {
      const oldValue = this.map.get(key);
      if (oldValue === undefined || compare(oldValue)) {
        this.map.set(key, value);
        return true;
      }
      return false;
    });
  }

  /**
   * Deletes the specified key from the map.
   *
   * @param {K} key - The key to delete from the map.
   * @return {Promise<boolean>} A promise that resolves to true if the key was successfully deleted, or false if the key did not exist.
   */
  async delete(key: K): Promise<boolean> {
    return await this.mutex.runExclusive(() => {
      return this.map.delete(key);
    });
  }

  /**
   * Retrieves the value associated with the specified key from the map.
   *
   * @param {K} key - The key for which the associated value is to be retrieved.
   * @return {Promise<V | undefined>} A promise that resolves to the value associated with the key,
   * or `undefined` if the key does not exist in the map.
   */
  async get(key: K): Promise<V | undefined> {
    return await this.mutex.runExclusive(() => {
      return this.map.get(key);
    });
  }

  /**
   * Sets a value in the map for the specified key. The operation is thread-safe.
   *
   * @param {K} key - The key of the element to be added or updated in the map.
   * @param {V} value - The value to be associated with the specified key.
   * @return {Promise<void>} A promise that resolves once the operation is complete.
   */
  async set(key: K, value: V): Promise<void> {
    await this.mutex.runExclusive(() => {
      this.map.set(key, value);
    });
  }

  /**
   * Determines if a given key exists in the map.
   *
   * @param {K} key - The key to check for existence in the map.
   * @return {Promise<boolean>} A promise that resolves to `true` if the key exists, otherwise `false`.
   */
  async has(key: K): Promise<boolean> {
    return await this.mutex.runExclusive(() => {
      return this.map.has(key);
    });
  }

  /**
   * Retrieves the current size of the map.
   *
   * @return {Promise<number>} A promise that resolves to the number of elements in the map.
   */
  async size(): Promise<number> {
    return await this.mutex.runExclusive(() => {
      return this.map.size;
    });
  }
}

export { ThreadSafeMap };
