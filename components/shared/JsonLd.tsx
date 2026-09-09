/**
 * Renders a JSON-LD block.
 *
 * `dangerouslySetInnerHTML` is required — React escapes text children, which
 * would corrupt the JSON. The payload is built from our own constants, never
 * from user input, so there is nothing here for a visitor to inject into. The
 * `<` escape guards the one case that still matters: a literal "</script>"
 * inside any string would otherwise close the tag early.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
