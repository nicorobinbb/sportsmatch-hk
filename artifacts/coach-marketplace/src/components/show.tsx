// Simple Show component replacement for Clerk's Show
export function Show({ 
  children, 
  when, 
  fallback 
}: { 
  children: React.ReactNode; 
  when: boolean; 
  fallback?: React.ReactNode 
}) {
  return when ? <>{children}</> : <>{fallback}</>;
}