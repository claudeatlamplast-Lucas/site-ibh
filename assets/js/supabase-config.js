/* Configuração do cliente Supabase para a Comunidade IBH.
   A anon/publishable key é feita para ficar exposta no navegador —
   quem protege os dados de verdade são as regras de RLS no banco. */
(function(){
  var SUPABASE_URL = 'https://iishtrwbbvlbwlgdcysd.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_nldSMV_0YKWk2FyzgJ7KNg_5k4ozTkR';

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
