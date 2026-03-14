const { ValidationError } = require("./AppError");

/**
 * Validates data against a given schema.
 * If validation fails, throws a ValidationError with details of all failures.
 *
 * @param {object} data - The data object to validate.
 * @param {object} schema - An object where keys are field names and values are arrays of validator objects ({ check: Function, message: string }).
 *                          Can also contain a special key '_crossFieldValidators' for validators that check multiple fields or the whole object.
 * @throws {ValidationError} If any validation rule is not met.
 */
function validate(data, schema) {
  const errors = {};
  const source = data && typeof data === "object" ? data : {};

  // Validate individual fields
  for (const field in schema) {
    if (
      Object.prototype.hasOwnProperty.call(schema, field) &&
      field !== "_crossFieldValidators"
    ) {
      const validators = schema[field];
      const value = source[field];
      const fieldErrors = [];

      for (const validatorObj of validators) {
        if (!validatorObj.check(value, source)) {
          // Pass source for potential context-aware validation
          fieldErrors.push(validatorObj.message);
        }
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }
  }

  // Validate cross-field rules
  if (
    schema._crossFieldValidators &&
    Array.isArray(schema._crossFieldValidators)
  ) {
    const generalErrors = [];
    for (const validatorObj of schema._crossFieldValidators) {
      if (!validatorObj.check(source)) {
        // Cross-field validators receive the entire data object
        generalErrors.push(validatorObj.message);
      }
    }
    if (generalErrors.length > 0) {
      errors.general = generalErrors;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError("Input validation failed.", errors);
  }
}

/**
 * Validator factory: Checks if a value is required (not null, undefined, or empty string).
 * @param {string} message - Custom error message.
 * @returns {object} Validator object.
 */
const isRequired = (message = "is required") => ({
  check: (value) =>
    value !== null &&
    typeof value !== "undefined" &&
    (typeof value !== "string" || value.trim() !== ""),
  message,
});

/**
 * Validator factory: Checks if a value is an object (and not null or an array).
 * @param {string} message - Custom error message.
 * @returns {object} Validator object.
 */
const isObject = (message = "must be an object") => ({
  check: (value) =>
    typeof value === "object" && value !== null && !Array.isArray(value),
  message,
});

/**
 * Validator factory: Checks if a value is a number (and not NaN).
 * @param {string} message - Custom error message.
 * @returns {object} Validator object.
 */
const isNumber = (message = "must be a number") => ({
  check: (value) => typeof value === "number" && !isNaN(value),
  message,
});

/**
 * Validator factory: Checks if a value is a positive number (> 0).
 * @param {string} message - Custom error message.
 * @returns {object} Validator object.
 */
const isPositive = (message = "must be a positive number") => ({
  check: (value) => typeof value === "number" && value > 0,
  message,
});

/**
 * Validator factory: Checks if a value is a string.
 * @param {string} message - Custom error message.
 * @returns {object} Validator object.
 */
const isString = (message = "must be a string") => ({
  check: (value) => typeof value === "string",
  message,
});

/**
 * Cross-field validator factory: Checks if at least one of the specified fields has a value.
 * This validator operates on the entire data object.
 * @param {string[]} fields - An array of field names to check.
 * @param {string} message - Custom error message.
 * @returns {object} Validator object.
 */
const oneOf = (
  fields,
  message = `One of ${fields.join(", ")} is required`,
) => ({
  check: (data) =>
    fields.some(
      (field) =>
        data[field] !== null &&
        typeof data[field] !== "undefined" &&
        (typeof data[field] !== "string" || data[field].trim() !== ""),
    ),
  message,
});

module.exports = {
  validate,
  isRequired,
  isObject,
  isNumber,
  isPositive,
  isString,
  oneOf,
};
