'use client';

import { useEffect } from 'react';

import { createClient } from '@/utils/supabase/client';

export function GoogleOneTap() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('開発環境ではGoogle One Tapは無効化されています');
      return;
    }

    const handleCredentialResponse = async (response: any) => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        });

        if (error) {
          console.error('Google One Tap認証エラー:', error);
        } else if (data?.user) {
          // ログイン成功 → TOPへ
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Google One Tap処理エラー:', error);
      }
    };

    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.error('Google Client ID が設定されていません');
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: true,
        cancel_on_tap_outside: false,
      });

      window.google.accounts.id.prompt();
    }

    return () => {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, []);

  return null;
}
