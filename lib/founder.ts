/**
 * The person behind BiteSync, as they have chosen to be named. One source for
 * the about page, the structured data, the FAQ, llms.txt and article
 * reviewer lines, so the site never describes its founder two ways.
 *
 * First name only, by choice. A surname and HCPC registration number would
 * make the credential independently checkable on the public HCPC register;
 * add them here and every surface picks them up.
 */
export const FOUNDER = {
  name: "James",
  credential: "Dietitian",
  path: "/about",
} as const;

export const FOUNDER_BYLINE = `${FOUNDER.name}, ${FOUNDER.credential}`;
