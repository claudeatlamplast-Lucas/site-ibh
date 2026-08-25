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
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();
