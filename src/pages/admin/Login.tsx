import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  pin: z
    .string()
    .min(1, 'Enter the admin PIN to continue.')
    .max(32, 'PINs are usually short—check your notes.'),
});

type FormValues = z.infer<typeof formSchema>;

const AdminLogin = () => {
  const { isAuthenticated, signIn, loading, pinHint } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pin: '',
    },
  });

  const from = (location.state as { from?: Location })?.from?.pathname ?? '/admin/alumni-import';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const onSubmit = async (values: FormValues) => {
    try {
      await signIn(values.pin);
      toast.success('Admin access granted.');
      navigate(from, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to verify PIN.';
      toast.error(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border/40 bg-card p-8 shadow-xl">
        <div className="mb-6 space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Kiosk Admin PIN</h1>
          <p className="text-sm text-muted-foreground">
            Enter the shared PIN to unlock the offline alumni import tools.
          </p>
          {pinHint ? (
            <p className="text-xs font-medium text-primary/80">Hint: {pinHint}</p>
          ) : null}
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin PIN</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="one-time-code" inputMode="numeric" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading || form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Verifying…' : 'Unlock admin tools'}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="font-medium text-primary hover:underline">
            ← Back to museum lobby
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
