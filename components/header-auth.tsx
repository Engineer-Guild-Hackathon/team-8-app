'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import type { User } from '@supabase/supabase-js';

import { signOutAction } from '@/app/actions';
import LoginModal from '@/components/LoginModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { hasEnvVars } from '@/utils/supabase/check-env-vars';
import { createClient } from '@/utils/supabase/client';

export default function AuthButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // 初回ユーザー取得
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN') {
        setIsModalOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!hasEnvVars) {
    return (
      <div className="flex gap-4 items-center">
        <Badge variant="default" className="font-normal pointer-events-none">
          Please update .env.local file with anon key and url
        </Badge>
        <div className="flex gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            disabled
            className="opacity-75 cursor-none pointer-events-none"
          >
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="default"
            disabled
            className="opacity-75 cursor-none pointer-events-none"
          >
            <Link href="/sign-up">Sign up</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {user ? (
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="sm">
              ログアウト
            </Button>
          </form>
        </div>
      ) : (
        <Button
          size="sm"
          variant="default"
          onClick={() => setIsModalOpen(true)}
        >
          ログイン
        </Button>
      )}

      <LoginModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
