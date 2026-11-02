// Transforme les URLs présentes dans un texte libre en vrais liens cliquables.
export function linkify(text) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-jardinerie-primary underline hover:text-green-700"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}
