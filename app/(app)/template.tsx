/** Re-mounts on navigation so app pages get a subtle enter animation. */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="app-page-enter">{children}</div>;
}
