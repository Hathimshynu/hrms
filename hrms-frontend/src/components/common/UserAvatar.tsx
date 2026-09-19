// Initials avatar. The backend exposes no profile photo for the signed-in
// user, so this replaces the previous static image shown for everyone.
export function UserAvatar({
  name,
  className = "",
}: {
  name?: string | null;
  className?: string;
}) {
  const initials = (name ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary-dark to-primary font-semibold text-white ${className}`}
    >
      {initials || "?"}
    </span>
  );
}
