/** Standardised "unhandled validation" warning used by every generator. */
export const unhandledValidation = (schemaType: string, actionType: string): string =>
  `Unhandled ${schemaType} validation: ${actionType}`;
