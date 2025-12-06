export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth pages don't need sidebar/header - they're full-page
  return <>{children}</>;
}
