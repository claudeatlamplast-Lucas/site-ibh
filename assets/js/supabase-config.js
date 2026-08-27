/* Configuração do cliente Supabase para a Comunidade IBH.
   A anon/publishable key é feita para ficar exposta no navegador —
   quem protege os dados de verdade são as regras de RLS no banco. */
(function(){
  var SUPABASE_URL = 'https://iishtrwbbvlbwlgdcysd.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_nldSMV_0YKWk2FyzgJ7KNg_5k4ozTkR';

  /* Chave pública do Web Push (VAPID) — é pública por natureza, igual a
     anon key acima; a chave privada correspondente fica só nos secrets
     da Edge Function "notificar-novo-post" no painel do Supabase. */
  window.VAPID_PUBLIC_KEY = 'BP9JZVv9zT0K0riw1R1iRUJjUX5sNwLSX6oQakkyuc2A9jFe502eKQrMiHUFFRPrrXTUonbEVs4N-a9bue9m89M';

  if(!window.supabase){
    console.error('Biblioteca do Supabase não carregou.');
    return;
  }
  /* Mantém o aluno logado entre visitas: a sessão fica salva no localStorage
     do navegador e é renovada sozinha em segundo plano. O tempo máximo real
     da sessão (60-90 dias) é definido no painel do Supabase, em
     Authentication > Sessions — ver README da comunidade. */
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: window.localStorage,
      detectSessionInUrl: false
    }
  });
})();
