/**
 * General purpose utility functions.
 */

/**
 * Splits an array into chunks of a specified size.
 * @param {any[]} items - The array to split.
 * @param {number} chunkSize - The maximum size of each chunk.
 * @returns {any[][]} An array of chunks.
 */
function chunkArray(items, chunkSize) {
  if (!Array.isArray(items)) return [];
  const size = Math.max(1, Number(chunkSize) || 100);
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

/**
 * Deeply merges multiple objects into a target object.
 * @param {object} target - The target object to merge into.
 * @param {...object} sources - Source objects to merge from.
 * @returns {object} The merged target object.
 */
function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * Checks if a value is a plain object.
 * @param {any} item - The item to check.
 * @returns {boolean} True if it is an object and not an array.
 */
function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

/**
 * Pauses execution for a specified duration.
 * @param {number} ms - Milliseconds to sleep.
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  chunkArray,
  deepMerge,
  isObject,
  sleep,
};
