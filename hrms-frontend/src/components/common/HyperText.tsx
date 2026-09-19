// Server component. Pure-CSS "hyperspeed" typography: each word streaks in
// from the side with motion blur and settles into crisp text, then a slow
// light sweep runs across the gradient. Text is always in the DOM (fully
// readable with no JS); reduced-motion users get static text.
export function HyperText({
  lines,
  className = "",
}: {
  lines: string[];
  className?: string;
}) {
  let index = 0;
  return (
    <span className={`hyper-text ${className}`}>
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.split(" ").map((word) => {
            const i = index++;
            return (
              <span
                key={`${li}-${i}`}
                className="hyper-word"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                {word}
                {" "}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}
