export function getApiError(error, fallbackMessage = 'Something went wrong. Please try again.') {
  const response = error?.response?.data;
  const fieldErrors = response?.fieldErrors && typeof response.fieldErrors === 'object'
    ? response.fieldErrors
    : {};

  let message = response?.message;
  if (!message && error?.request && !error?.response) {
    message = 'Could not reach the MiniMart API. Check that the backend is running and try again.';
  }

  return {
    message: message || fallbackMessage,
    fieldErrors,
  };
}
