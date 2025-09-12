import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// SupabaseのセッションをSSRレベルで更新するミドルウェア
export const updateSession = async (request: NextRequest) => {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // セッションを更新(有効期限切れの場合も自動でリフレッシュされる)
    await supabase.auth.getUser();

    // リダイレクトはせず、各ページ側で認証を判定
    return response;
  } catch {
    // Supabaseクライアント生成に失敗した場合はそのまま通す
    return NextResponse.next({ request: { headers: request.headers } });
  }
};
