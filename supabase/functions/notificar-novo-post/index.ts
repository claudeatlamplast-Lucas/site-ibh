// Edge Function: notificar-novo-post
// Disparada por um trigger do Postgres (via pg_net) a cada INSERT em "posts"
// — ver supabase/migration-005-trigger-notificacoes.sql.
// Envia uma notificação push pra todo aluno inscrito (exceto quem postou).
// Deploy: cole este arquivo em Edge Functions > notificar-novo-post no painel,
// e desative "Enforce JWT Verification" nas configurações da função (quem
// chama é o próprio Postgres do projeto, não um usuário logado — a proteção
// aqui é o cabeçalho x-webhook-secret conferido abaixo).

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:ibhapkido@outlook.com";
const webhookSecret = Deno.env.get("WEBHOOK_SECRET")!;

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

Deno.serve(async (req: Request) => {
  try {
    if (req.headers.get("x-webhook-secret") !== webhookSecret) {
      return new Response("não autorizado", { status: 401 });
    }

    const payload = await req.json();
    const post = payload.record; // formato padrão do Database Webhook do Supabase
    if (!post) return new Response("sem post", { status: 200 });

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: autor } = await supabase
      .from("profiles")
      .select("nome_exibicao")
      .eq("id", post.autor_id)
      .single();

    const nomeAutor = autor?.nome_exibicao || "Um aluno";
    const corpo = post.legenda
      ? nomeAutor + " postou: " + String(post.legenda).slice(0, 80)
      : nomeAutor + " publicou uma nova foto na comunidade.";

    const { data: inscricoes, error: erroInscricoes } = await supabase
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth")
      .neq("user_id", post.autor_id);

    if (erroInscricoes) throw erroInscricoes;
    if (!inscricoes || inscricoes.length === 0) {
      return new Response("sem inscritos", { status: 200 });
    }

    const notificacao = JSON.stringify({
      title: "Comunidade IBH",
      body: corpo,
      url: "/comunidade.html",
    });

    await Promise.all(
      inscricoes.map(async (s: { id: string; endpoint: string; p256dh: string; auth: string }) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            notificacao,
          );
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            // Inscrição expirada ou revogada pelo navegador — remove do banco.
            await supabase.from("push_subscriptions").delete().eq("id", s.id);
          } else {
            console.error("Falha ao enviar push:", err);
          }
        }
      }),
    );

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("erro", { status: 500 });
  }
});
