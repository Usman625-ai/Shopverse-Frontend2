import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '../../components/ui';
export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive"><ShieldX className="h-10 w-10" /></div>
      <h1 className="mt-6 font-display text-3xl font-bold">Access Denied</h1>
      <p className="mt-2 text-center text-muted-foreground">You don't have permission to access this page.</p>
      <Link to="/" className="mt-6"><Button>Go Home</Button></Link>
    </div>
  );
}
