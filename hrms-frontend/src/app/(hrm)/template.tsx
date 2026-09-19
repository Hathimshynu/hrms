// Server component: a CSS-only enter fade. No exit animation and no
// AnimatePresence, so navigation is never blocked waiting on an animation.
export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="page-enter min-h-full">{children}</div>;
}
