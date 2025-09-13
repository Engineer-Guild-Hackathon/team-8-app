'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { type VariantProps } from 'class-variance-authority';

import LoginModal from '@/components/LoginModal';
import { Button, buttonVariants } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';

type Props = {
  children?: ReactNode;
  className?: string;
  variant?: VariantProps<typeof buttonVariants>['variant'];
  size?: VariantProps<typeof buttonVariants>['size'];
  hideWhenAuthenticated?: boolean;
};

export default function LoginButton({
  children = 'ログイン',
  className,
  variant = 'default',
  size = 'sm',
  hideWhenAuthenticated = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthed(!!user);
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session?.user);
      if (session?.user) setOpen(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (hideWhenAuthenticated && isAuthed) return null;

  return (
    <>
      <Button
        className={className}
        size={size}
        variant={variant}
        onClick={() => setOpen(true)}
        type="button"
      >
        {children}
      </Button>
      <LoginModal open={open} onOpenChange={setOpen} />
    </>
  );
}
