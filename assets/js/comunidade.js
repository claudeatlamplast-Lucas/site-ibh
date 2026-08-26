(function(){
  var client = window.supabaseClient;
  if(!client){ console.error('Supabase client não inicializado'); return; }

  var BUCKET = 'comunidade-fotos';
  var MAX_FOTO_MB = 5;
  var TIPOS_ACEITOS = ['image/jpeg','image/png','image/webp'];
  var FAIXAS = [
    'Branca',
    'Amarela',
    'Amarela p/ Verde',
    'Verde',
    'Verde p/ Azul',
    'Azul',
    'Azul p/ Vermelha',
    'Vermelha',
    'Vermelha p/ Preta',
    'Preta Honorário',
    'Preta 1º Dan',
    'Preta 2º Dan',
    'Preta 3º Dan'
  ];

  var secAuth = document.getElementById('authSection');
  var secPending = document.getElementById('pendingSection');
  var secFeed = document.getElementById('feedSection');

  var tabLogin = document.getElementById('tabLogin');
  var tabCadastro = document.getElementById('tabCadastro');
  var formLogin = document.getElementById('loginForm');
  var formCadastro = document.getElementById('cadastroForm');
  var authError = document.getElementById('authError');

  var pendingTitle = document.getElementById('pendingTitle');
  var pendingText = document.getElementById('pendingText');
  var pendingLogoutBtn = document.getElementById('pendingLogoutBtn');

  var feedLogoutBtn = document.getElementById('feedLogoutBtn');
  var meNome = document.getElementById('meNome');
  var meAvatar = document.getElementById('meAvatar');
  var postForm = document.getElementById('postForm');
  var postFotoInput = document.getElementById('postFoto');
  var postLegendaInput = document.getElementById('postLegenda');
  var postError = document.getElementById('postError');
  var feedList = document.getElementById('feedList');
  var feedEmpty = document.getElementById('feedEmpty');
  var feedEnd = document.getElementById('feedEnd');
  var feedTabTodos = document.getElementById('feedTabTodos');
  var feedTabMeus = document.getElementById('feedTabMeus');

  var postDropzone = document.getElementById('postDropzone');
  var dzEmpty = document.getElementById('dzEmpty');
  var dzPreview = document.getElementById('dzPreview');
  var dzPreviewImg = document.getElementById('dzPreviewImg');
  var dzRemoveBtn = document.getElementById('dzRemoveBtn');

  var meuPerfilBtn = document.getElementById('meuPerfilBtn');
  var profilePanel = document.getElementById('profilePanel');
  var profileFotoInput = document.getElementById('profileFotoInput');
  var profileFotoPreview = document.getElementById('profileFotoPreview');
  var profileFotoStatus = document.getElementById('profileFotoStatus');
  var profileFaixaAtual = document.getElementById('profileFaixaAtual');
  var profilePendenteMsg = document.getElementById('profilePendenteMsg');
  var profileFaixaForm = document.getElementById('profileFaixaForm');
  var profileFaixaSelect = document.getElementById('profileFaixaSelect');
  var profileError = document.getElementById('profileError');

  var currentUser = null;
  var currentProfile = null;
  var feedMode = 'todos';
  var ultimoPosts = [];
  var ultimoComentarios = [];
  var ultimasCurtidas = [];

  function populaSelectFaixas(select){
    select.innerHTML = '';
    FAIXAS.forEach(function(f){
      var opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f;
      select.appendChild(opt);
    });
  }
  populaSelectFaixas(document.getElementById('cadFaixa'));
  populaSelectFaixas(profileFaixaSelect);

  var cadEscolaSelect = document.getElementById('cadEscola');
  client.from('escolas').select('id, nome, cidade, uf').order('nome').then(function(res){
    if(res.error || !res.data) return;
    cadEscolaSelect.innerHTML = '';
    res.data.forEach(function(e){
      var opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = e.nome + (e.cidade ? ' — ' + e.cidade + (e.uf ? '/' + e.uf : '') : '');
      cadEscolaSelect.appendChild(opt);
    });
  });

  function showOnly(section){
    [secAuth, secPending, secFeed].forEach(function(s){
      if(s) s.hidden = (s !== section);
    });
  }

  function traduzErro(msg){
    if(/already registered/i.test(msg)) return 'Este e-mail já está cadastrado.';
    if(/Invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.';
    return msg;
  }

  function escapeHtml(str){
    var d = document.createElement('div');
    d.textContent = str == null ? '' : str;
    return d.innerHTML;
  }

  function validaFoto(file){
    if(!file) return null;
    if(TIPOS_ACEITOS.indexOf(file.type) === -1) return 'Formato de imagem não aceito. Use JPG, PNG ou WEBP.';
    if(file.size > MAX_FOTO_MB * 1024 * 1024) return 'Imagem muito grande (máx. ' + MAX_FOTO_MB + 'MB).';
    return null;
  }

  function uploadFoto(file, prefixo){
    var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    var path = currentUser.id + '/' + prefixo + '-' + Date.now() + '.' + ext;
    return client.storage.from(BUCKET).upload(path, file).then(function(res){
      if(res.error) throw res.error;
      var pub = client.storage.from(BUCKET).getPublicUrl(path);
      return pub.data.publicUrl;
    });
  }

  /* ---------- Auth: login / cadastro ---------- */

  tabLogin.addEventListener('click', function(){
    tabLogin.classList.add('active'); tabCadastro.classList.remove('active');
    formLogin.hidden = false; formCadastro.hidden = true;
    authError.textContent = '';
  });
  tabCadastro.addEventListener('click', function(){
    tabCadastro.classList.add('active'); tabLogin.classList.remove('active');
    formCadastro.hidden = false; formLogin.hidden = true;
    authError.textContent = '';
  });

  formLogin.addEventListener('submit', function(e){
    e.preventDefault();
    authError.textContent = '';
    var email = document.getElementById('loginEmail').value.trim();
    var senha = document.getElementById('loginSenha').value;
    client.auth.signInWithPassword({ email: email, password: senha }).then(function(res){
      if(res.error){ authError.textContent = 'Não foi possível entrar: ' + traduzErro(res.error.message); return; }
      init();
    });
  });

  formCadastro.addEventListener('submit', function(e){
    e.preventDefault();
    authError.textContent = '';
    var email = document.getElementById('cadEmail').value.trim();
    var senha = document.getElementById('cadSenha').value;
    var nome = document.getElementById('cadNome').value.trim();
    var faixa = document.getElementById('cadFaixa').value.trim();
    var escolaId = cadEscolaSelect.value;
    var fotoFile = document.getElementById('cadFoto').files[0];

    if(senha.length < 6){ authError.textContent = 'A senha precisa ter pelo menos 6 caracteres.'; return; }
    if(!nome){ authError.textContent = 'Informe seu nome.'; return; }
    if(!escolaId){ authError.textContent = 'Selecione sua escola.'; return; }
    var erroFoto = fotoFile ? validaFoto(fotoFile) : null;
    if(erroFoto){ authError.textContent = erroFoto; return; }

    var submitBtn = formCadastro.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    client.auth.signUp({ email: email, password: senha }).then(function(res){
      if(res.error){ throw res.error; }
      if(!res.data.session){
        authError.textContent = 'Cadastro criado! Confirme seu e-mail e depois faça login.';
        submitBtn.disabled = false;
        return null;
      }
      currentUser = res.data.user;
      var fotoPromise = fotoFile
        ? uploadFoto(fotoFile, 'perfil').catch(function(){
            authError.textContent = 'Cadastro criado, mas houve um erro ao enviar a foto. Você pode adicionar depois.';
            return null;
          })
        : Promise.resolve(null);

      return fotoPromise.then(function(fotoUrl){
        return client.from('profiles').insert({
          id: currentUser.id,
          nome_exibicao: nome,
          foto_url: fotoUrl,
          faixa: faixa || null,
          escola_id: escolaId
        });
      }).then(function(perfilRes){
        if(perfilRes.error){ throw perfilRes.error; }
        return init();
      });
    }).catch(function(err){
      authError.textContent = 'Não foi possível cadastrar: ' + traduzErro(err.message);
    }).finally(function(){
      submitBtn.disabled = false;
    });
  });

  pendingLogoutBtn.addEventListener('click', logout);
  feedLogoutBtn.addEventListener('click', logout);

  function logout(){
    client.auth.signOut().then(function(){
      currentUser = null; currentProfile = null;
      formLogin.reset(); formCadastro.reset();
      profilePanel.hidden = true;
      showOnly(secAuth);
    });
  }

  /* ---------- Aguardando aprovação ---------- */

  function renderPending(){
    if(currentProfile.status === 'rejeitado'){
      pendingTitle.textContent = 'Cadastro não aprovado';
      pendingText.textContent = 'Seu cadastro na comunidade não foi aprovado. Fale com seu instrutor para mais informações.';
    } else {
      pendingTitle.textContent = 'Cadastro em análise';
      pendingText.textContent = 'Seu cadastro foi recebido e está aguardando aprovação. Assim que for aprovado, você poderá acessar o feed da comunidade.';
    }
    showOnly(secPending);
  }

  /* ---------- Meu perfil / troca de faixa ---------- */

  meuPerfilBtn.addEventListener('click', function(){
    profilePanel.hidden = !profilePanel.hidden;
    if(!profilePanel.hidden) renderProfilePanel();
  });

  profileFotoInput.addEventListener('change', function(){
    var file = profileFotoInput.files[0];
    if(!file) return;
    var erro = validaFoto(file);
    if(erro){ profileFotoStatus.textContent = erro; profileFotoInput.value = ''; return; }
    profileFotoStatus.textContent = 'Enviando...';
    uploadFoto(file, 'perfil').then(function(fotoUrl){
      return client.from('profiles').update({ foto_url: fotoUrl }).eq('id', currentUser.id).then(function(res){
        if(res.error) throw res.error;
        currentProfile.foto_url = fotoUrl;
        profileFotoPreview.src = fotoUrl;
        meAvatar.src = fotoUrl;
        profileFotoStatus.textContent = 'Foto atualizada!';
        return carregarFeed();
      });
    }).catch(function(err){
      profileFotoStatus.textContent = 'Erro ao enviar foto: ' + traduzErro(err.message);
    }).finally(function(){
      profileFotoInput.value = '';
    });
  });

  function renderProfilePanel(){
    profileError.textContent = '';
    profileFotoStatus.textContent = '';
    profileFotoPreview.src = currentProfile.foto_url || 'assets/ibh-logo.png';
    profileFaixaAtual.textContent = currentProfile.faixa || 'Não informada';
    if(currentProfile.faixa_pendente){
      profilePendenteMsg.hidden = false;
      profilePendenteMsg.textContent = 'Solicitação de troca para "' + currentProfile.faixa_pendente + '" aguardando aprovação.';
      profileFaixaForm.hidden = true;
    } else {
      profilePendenteMsg.hidden = true;
      profileFaixaForm.hidden = false;
      profileFaixaSelect.value = currentProfile.faixa || 'Branca';
    }
  }

  profileFaixaForm.addEventListener('submit', function(e){
    e.preventDefault();
    profileError.textContent = '';
    var novaFaixa = profileFaixaSelect.value;
    if(novaFaixa === currentProfile.faixa){
      profileError.textContent = 'Essa já é sua faixa atual.';
      return;
    }
    var btn = profileFaixaForm.querySelector('button');
    btn.disabled = true;
    client.from('profiles').update({ faixa_pendente: novaFaixa }).eq('id', currentUser.id).then(function(res){
      btn.disabled = false;
      if(res.error){ profileError.textContent = 'Erro ao enviar solicitação: ' + traduzErro(res.error.message); return; }
      currentProfile.faixa_pendente = novaFaixa;
      renderProfilePanel();
    });
  });

  /* ---------- Feed ---------- */

  function setPostFotoPreview(file){
    if(!file){
      dzPreview.hidden = true; dzEmpty.hidden = false; dzPreviewImg.src = '';
      return;
    }
    dzPreviewImg.src = URL.createObjectURL(file);
    dzEmpty.hidden = true; dzPreview.hidden = false;
  }

  postFotoInput.addEventListener('change', function(){
    var file = postFotoInput.files[0];
    postError.textContent = '';
    if(file){
      var erro = validaFoto(file);
      if(erro){ postError.textContent = erro; postFotoInput.value = ''; setPostFotoPreview(null); return; }
    }
    setPostFotoPreview(file);
  });

  dzRemoveBtn.addEventListener('click', function(e){
    e.preventDefault(); e.stopPropagation();
    postFotoInput.value = '';
    setPostFotoPreview(null);
  });

  ['dragover','dragenter'].forEach(function(evt){
    postDropzone.addEventListener(evt, function(e){ e.preventDefault(); postDropzone.classList.add('dz-drag'); });
  });
  ['dragleave','drop'].forEach(function(evt){
    postDropzone.addEventListener(evt, function(e){ e.preventDefault(); postDropzone.classList.remove('dz-drag'); });
  });
  postDropzone.addEventListener('drop', function(e){
    e.preventDefault();
    var file = e.dataTransfer.files[0];
    if(!file) return;
    var erro = validaFoto(file);
    if(erro){ postError.textContent = erro; return; }
    try{
      var dt = new DataTransfer();
      dt.items.add(file);
      postFotoInput.files = dt.files;
    }catch(err){}
    postError.textContent = '';
    setPostFotoPreview(file);
  });

  postForm.addEventListener('submit', function(e){
    e.preventDefault();
    postError.textContent = '';
    var fotoFile = postFotoInput.files[0];
    var legenda = postLegendaInput.value.trim();
    if(!fotoFile){ postError.textContent = 'Escolha uma foto para publicar.'; return; }
    var erroFoto = validaFoto(fotoFile);
    if(erroFoto){ postError.textContent = erroFoto; return; }

    var submitBtn = postForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    uploadFoto(fotoFile, 'post').then(function(fotoUrl){
      return client.from('posts').insert({
        autor_id: currentUser.id,
        foto_url: fotoUrl,
        legenda: legenda || null
      });
    }).then(function(res){
      if(res.error) throw res.error;
      postForm.reset();
      setPostFotoPreview(null);
      return carregarFeed();
    }).catch(function(err){
      postError.textContent = 'Erro ao publicar: ' + traduzErro(err.message);
    }).finally(function(){
      submitBtn.disabled = false;
    });
  });

  function carregarFeed(){
    return Promise.all([
      client.from('posts').select('id, autor_id, foto_url, legenda, criado_em, profiles!posts_autor_id_fkey(nome_exibicao, foto_url, faixa, escolas(nome))').order('criado_em', { ascending: false }),
      client.from('comentarios').select('id, post_id, autor_id, texto, criado_em, profiles(nome_exibicao, foto_url, faixa, escolas(nome))').order('criado_em', { ascending: true }),
      client.from('curtidas').select('post_id, autor_id')
    ]).then(function(results){
      var postsRes = results[0], comentariosRes = results[1], curtidasRes = results[2];
      if(postsRes.error){
        feedList.innerHTML = '<p class="feed-error">Não foi possível carregar o feed.</p>';
        return;
      }
      ultimoPosts = postsRes.data || [];
      ultimoComentarios = comentariosRes.data || [];
      ultimasCurtidas = curtidasRes.data || [];
      aplicarFiltroFeed();
    });
  }

  function aplicarFiltroFeed(){
    var posts = feedMode === 'meus'
      ? ultimoPosts.filter(function(p){ return p.autor_id === currentUser.id; })
      : ultimoPosts;
    feedEmpty.textContent = feedMode === 'meus'
      ? 'Você ainda não publicou nada. Que tal compartilhar seu primeiro momento?'
      : 'Ainda não há publicações. Seja o primeiro a postar!';
    renderFeed(posts, ultimoComentarios, ultimasCurtidas);
  }

  function setFeedMode(mode){
    feedMode = mode;
    feedTabTodos.classList.toggle('active', mode === 'todos');
    feedTabMeus.classList.toggle('active', mode === 'meus');
    aplicarFiltroFeed();
  }
  feedTabTodos.addEventListener('click', function(){ setFeedMode('todos'); });
  feedTabMeus.addEventListener('click', function(){ setFeedMode('meus'); });

  function renderFeed(posts, comentarios, curtidas){
    feedList.innerHTML = '';
    feedEmpty.hidden = posts.length > 0;
    feedEnd.hidden = posts.length === 0;
    var isAdmin = currentProfile.role === 'admin';
    var meFoto = currentProfile.foto_url || 'assets/ibh-logo.png';

    posts.forEach(function(post){
      var meusComentarios = comentarios.filter(function(c){ return c.post_id === post.id; });
      var minhasCurtidas = curtidas.filter(function(c){ return c.post_id === post.id; });
      var jaCurti = minhasCurtidas.some(function(c){ return c.autor_id === currentUser.id; });
      var podeApagarPost = isAdmin || post.autor_id === currentUser.id;
      var autorFoto = (post.profiles && post.profiles.foto_url) || 'assets/ibh-logo.png';
      var autorNome = (post.profiles && post.profiles.nome_exibicao) || 'Aluno';
      var autorFaixa = post.profiles && post.profiles.faixa;
      var autorEscola = post.profiles && post.profiles.escolas && post.profiles.escolas.nome;

      var card = document.createElement('article');
      card.className = 'post-card';
      var autorAttrs = 'data-user-nome="' + escapeHtml(autorNome) + '" data-user-foto="' + escapeHtml(autorFoto) + '" data-user-faixa="' + escapeHtml(autorFaixa || '') + '" data-user-escola="' + escapeHtml(autorEscola || '') + '"';

      card.innerHTML =
        '<div class="post-header">' +
          '<img class="post-avatar user-trigger" ' + autorAttrs + ' src="' + escapeHtml(autorFoto) + '" alt="">' +
          '<div class="post-author">' +
            '<span class="post-author-nome user-trigger" ' + autorAttrs + '>' + escapeHtml(autorNome) + (autorEscola ? ' <span class="post-author-escola">· ' + escapeHtml(autorEscola) + '</span>' : '') + '</span>' +
            (autorFaixa ? '<span class="post-author-faixa">' + escapeHtml(autorFaixa) + '</span>' : '') +
          '</div>' +
          (podeApagarPost ? '<button type="button" class="delete-btn" data-post-id="' + post.id + '" title="Apagar publicação">&times;</button>' : '') +
        '</div>' +
        '<img class="post-photo" src="' + escapeHtml(post.foto_url) + '" alt="Foto da publicação" loading="lazy">' +
        (post.legenda ? '<p class="post-legenda">' + escapeHtml(post.legenda) + '</p>' : '') +
        '<div class="post-actions">' +
          '<button type="button" class="like-btn' + (jaCurti ? ' liked' : '') + '" data-post-id="' + post.id + '">&#9733; <span>' + minhasCurtidas.length + '</span></button>' +
        '</div>' +
        '<div class="comment-list">' +
          meusComentarios.map(function(c){
            var podeApagarComentario = isAdmin || c.autor_id === currentUser.id;
            var comentarioNome = (c.profiles && c.profiles.nome_exibicao) || 'Aluno';
            var comentarioFoto = (c.profiles && c.profiles.foto_url) || 'assets/ibh-logo.png';
            var comentarioFaixa = (c.profiles && c.profiles.faixa) || '';
            var comentarioEscola = (c.profiles && c.profiles.escolas && c.profiles.escolas.nome) || '';
            var comentarioAttrs = 'data-user-nome="' + escapeHtml(comentarioNome) + '" data-user-foto="' + escapeHtml(comentarioFoto) + '" data-user-faixa="' + escapeHtml(comentarioFaixa) + '" data-user-escola="' + escapeHtml(comentarioEscola) + '"';
            return '<div class="comment">' +
              '<img class="comment-avatar user-trigger" ' + comentarioAttrs + ' src="' + escapeHtml(comentarioFoto) + '" alt="">' +
              '<div class="comment-body">' +
                '<span class="comment-autor user-trigger" ' + comentarioAttrs + '>' + escapeHtml(comentarioNome) + '</span>' +
                '<span class="comment-texto">' + escapeHtml(c.texto) + '</span>' +
              '</div>' +
              (podeApagarComentario ? '<button type="button" class="comment-delete" data-comment-id="' + c.id + '">&times;</button>' : '') +
            '</div>';
          }).join('') +
        '</div>' +
        '<form class="comment-form" data-post-id="' + post.id + '">' +
          '<img class="comment-form-avatar" src="' + escapeHtml(meFoto) + '" alt="">' +
          '<input type="text" placeholder="Escreva um comentário..." maxlength="500" required>' +
          '<button type="submit" class="btn-gold">Enviar</button>' +
        '</form>';

      feedList.appendChild(card);
    });
  }

  var userModal = document.getElementById('userModal');
  var userModalPhoto = document.getElementById('userModalPhoto');
  var userModalNome = document.getElementById('userModalNome');
  var userModalEscola = document.getElementById('userModalEscola');
  var userModalFaixa = document.getElementById('userModalFaixa');
  var userModalClose = document.getElementById('userModalClose');

  function openUserModal(trigger){
    userModalPhoto.src = trigger.dataset.userFoto || 'assets/ibh-logo.png';
    userModalNome.textContent = trigger.dataset.userNome || 'Aluno';
    var escola = trigger.dataset.userEscola;
    userModalEscola.textContent = escola || '';
    userModalEscola.hidden = !escola;
    var faixa = trigger.dataset.userFaixa;
    userModalFaixa.textContent = faixa || '';
    userModalFaixa.hidden = !faixa;
    userModal.hidden = false;
  }
  function closeUserModal(){ userModal.hidden = true; }
  if(userModal){
    userModalClose.addEventListener('click', closeUserModal);
    userModal.addEventListener('click', function(e){ if(e.target === userModal) closeUserModal(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !userModal.hidden) closeUserModal(); });
  }

  feedList.addEventListener('click', function(e){
    var userTrigger = e.target.closest('.user-trigger');
    if(userTrigger){ openUserModal(userTrigger); return; }
    var likeBtn = e.target.closest('.like-btn');
    if(likeBtn){
      var postId = likeBtn.dataset.postId;
      var jaCurti = likeBtn.classList.contains('liked');
      likeBtn.disabled = true;
      var acao = jaCurti
        ? client.from('curtidas').delete().eq('post_id', postId).eq('autor_id', currentUser.id)
        : client.from('curtidas').insert({ post_id: postId, autor_id: currentUser.id });
      acao.then(function(){ return carregarFeed(); });
      return;
    }
    var delBtn = e.target.closest('.delete-btn');
    if(delBtn){
      if(!window.confirm('Apagar esta publicação?')) return;
      client.from('posts').delete().eq('id', delBtn.dataset.postId).then(function(){ return carregarFeed(); });
      return;
    }
    var delComment = e.target.closest('.comment-delete');
    if(delComment){
      if(!window.confirm('Apagar este comentário?')) return;
      client.from('comentarios').delete().eq('id', delComment.dataset.commentId).then(function(){ return carregarFeed(); });
      return;
    }
  });

  feedList.addEventListener('submit', function(e){
    var form = e.target.closest('.comment-form');
    if(!form) return;
    e.preventDefault();
    var postId = form.dataset.postId;
    var input = form.querySelector('input');
    var texto = input.value.trim();
    if(!texto) return;
    var btn = form.querySelector('button');
    btn.disabled = true;
    client.from('comentarios').insert({ post_id: postId, autor_id: currentUser.id, texto: texto }).then(function(res){
      btn.disabled = false;
      if(!res.error){ input.value = ''; return carregarFeed(); }
    });
  });

  /* ---------- Inicialização ---------- */

  function init(){
    return client.auth.getSession().then(function(res){
      var session = res.data.session;
      if(!session){ showOnly(secAuth); return; }
      currentUser = session.user;
      return client.from('profiles').select('*').eq('id', currentUser.id).single().then(function(profileRes){
        if(profileRes.error || !profileRes.data){ showOnly(secAuth); return; }
        currentProfile = profileRes.data;
        if(currentProfile.status !== 'aprovado'){ renderPending(); return; }
        meNome.textContent = currentProfile.nome_exibicao;
        meAvatar.src = currentProfile.foto_url || 'assets/ibh-logo.png';
        showOnly(secFeed);
        return carregarFeed();
      });
    });
  }

  init();
})();
