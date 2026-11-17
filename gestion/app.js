/* Condesscky Collection – application de gestion du patron */
(function () {
'use strict';
var $app = document.getElementById('app');
var LOGO = '../img/logo.png';
var STATUTS = [
  ['nouvelle', 'Nouvelle'], ['fabrication', 'En fabrication'], ['prete', 'Prête'],
  ['livraison', 'En livraison'], ['livree', 'Livrée'], ['annulee', 'Annulée']
];
var STL = {}; STATUTS.forEach(function (s) { STL[s[0]] = s[1]; });
var SOURCES = [['boutique', 'Boutique'], ['whatsapp', 'WhatsApp'], ['site', 'Site'], ['facebook', 'Facebook'], ['tiktok', 'TikTok'], ['autre', 'Autre']];
var SRC = {}; SOURCES.forEach(function (s) { SRC[s[0]] = s[1]; });
var DEP = [['pub', 'Publicité Facebook'], ['carburant', 'Carburant livraison'], ['achat', 'Achat de produits'], ['autre', 'Autre']];
var DEPL = {}; DEP.forEach(function (d) { DEPL[d[0]] = d[1]; });
var MODES = [['especes', 'Espèces'], ['orange_money', 'Orange Money']];
var MODEL = { especes: 'Espèces', orange_money: 'Orange Money' };
var TABLES = ['produits', 'clients', 'commandes', 'paiements', 'depenses', 'taches', 'reglages'];

/* ---------------- utilitaires ---------------- */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function n(v) { v = Math.round(Number(v) || 0); return v; }
function fmt(v) { return n(v).toLocaleString('fr-FR').replace(/ | /g, ' ') + ' GNF'; }
function fmtn(v) { return n(v).toLocaleString('fr-FR').replace(/ | /g, ' '); }
function pad(x) { return (x < 10 ? '0' : '') + x; }
function dkey(d) { d = new Date(d); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function today() { return dkey(new Date()); }
function addDays(k, nb) { var d = new Date(k + 'T12:00:00'); d.setDate(d.getDate() + nb); return dkey(d); }
var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
function dlong(k) { var d = new Date(k + 'T12:00:00'); return JOURS[d.getDay()] + ' ' + d.getDate() + ' ' + MOIS[d.getMonth()]; }
var MCOURT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
function dshort(v) { if (!v) return ''; var d = new Date(String(v).length === 10 ? v + 'T12:00:00' : v); return d.getDate() + ' ' + MCOURT[d.getMonth()]; }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function telWa(t) { t = String(t || '').replace(/\D/g, ''); if (!t) return ''; if (t.length === 9) t = '224' + t; return t; }
function waLink(tel, msg) { var t = telWa(tel); return 'https://wa.me/' + t + '?text=' + encodeURIComponent(msg); }
function numero() { var d = new Date(); var s = String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()); var r = ''; for (var i = 0; i < 4; i++) r += 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.charAt(Math.floor(Math.random() * 32)); return 'CC-' + s + '-' + r; }
function toast(msg) { var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600); }
function inPeriod(dateVal, from, to) { var k = dkey(dateVal); return k >= from && k <= to; }

/* ---------------- données ---------------- */
var S = { data: {}, user: null, mode: 'demo' };
TABLES.forEach(function (t) { S.data[t] = []; });
var sb = null;

var SEED_PRODUITS = [
  ['Gourde personnalisée', 'Gourdes', 150000, true], ['Gourde Diamant', 'Gourdes', 120000, true], ['Coque personnalisée', 'Téléphone', 80000, true],
  ['Pochette portefeuille', 'Téléphone', 120000, false], ['Autocollant téléphone', 'Téléphone', 60000, false], ['Autocollant PC', 'PC', 120000, false],
  ['Chaîne prénom', 'Bijoux', 40000, false], ['Bracelet prénom', 'Bijoux', 50000, false], ['Baya prénom', 'Bijoux', 80000, false],
  ['Bijoux complet (chaîne + bracelet + baya)', 'Bijoux', 170000, false], ['Photo cadre A3', 'Cadres', 200000, false], ['Peluche prénom', 'Peluches', 250000, false],
  ['Chargeur de luxe', 'Accessoires', 120000, false], ['Tasse personnalisée', 'Tasses', 50000, false], ['Textile (à partir de)', 'Textile', 60000, false],
  ['Pack Anniversaire', 'Packs', 250000, false], ['Polo au logo', 'Entreprises', 80000, false], ['T-shirt au logo', 'Entreprises', 60000, false],
  ['Casquette au logo', 'Entreprises', 60000, false], ['Parapluie au logo', 'Entreprises', 100000, false]
];
var SEED_REGLAGES = { livraison_conakry: 20000, supplement_urgent: 30000, acompte_pourcent: 50, remise_fidelite_pourcent: 10, remise_fidelite_des: 5, whatsapp_patron: '224613095004', adresse: "Matoto, Bas-fond, près de l'École Kirikou, Conakry", lien_maps: 'https://maps.app.goo.gl/myEMsGnWxyUobgTB7' };

var LS = 'condesscky_demo_v1';
function demoLoad() {
  var raw = null; try { raw = localStorage.getItem(LS); } catch (e) {}
  if (raw) { try { return JSON.parse(raw); } catch (e) {} }
  var d = { seq: 100 }; TABLES.forEach(function (t) { d[t] = []; });
  SEED_PRODUITS.forEach(function (p, i) { d.produits.push({ id: i + 1, nom: p[0], categorie: p[1], prix: p[2], prix_achat: 0, suivi_stock: p[3], stock: 0, stock_alerte: 3, actif: true, created_at: new Date().toISOString() }); });
  Object.keys(SEED_REGLAGES).forEach(function (k) { d.reglages.push({ cle: k, valeur: SEED_REGLAGES[k] }); });
  return d;
}
function demoSave(d) { try { localStorage.setItem(LS, JSON.stringify(d)); } catch (e) {} }

var DB = {
  init: function () {
    var c = window.CONFIG || {};
    if (c.supabaseUrl && c.supabaseKey && window.supabase) {
      sb = window.supabase.createClient(c.supabaseUrl, c.supabaseKey, { auth: { persistSession: true, storageKey: 'condesscky-auth' } });
      S.mode = 'sb';
    }
  },
  getUser: async function () {
    if (S.mode === 'demo') { var u = null; try { u = localStorage.getItem(LS + '_user'); } catch (e) {} return u ? { email: u } : null; }
    var r = await sb.auth.getSession(); return r.data.session ? r.data.session.user : null;
  },
  login: async function (email, pass) {
    if (S.mode === 'demo') { try { localStorage.setItem(LS + '_user', email); } catch (e) {} return { email: email }; }
    var r = await sb.auth.signInWithPassword({ email: email, password: pass });
    if (r.error) throw new Error('E-mail ou mot de passe incorrect.');
    return r.data.user;
  },
  logout: async function () {
    if (S.mode === 'demo') { try { localStorage.removeItem(LS + '_user'); } catch (e) {} return; }
    await sb.auth.signOut();
  },
  load: async function () {
    if (S.mode === 'demo') { var d = demoLoad(); TABLES.forEach(function (t) { S.data[t] = d[t]; }); return; }
    var since = new Date(); since.setDate(since.getDate() - 400);
    var res = await Promise.all(TABLES.map(function (t) {
      var q = sb.from(t).select('*');
      if (t === 'commandes') q = q.gte('created_at', since.toISOString()).order('created_at', { ascending: false });
      if (t === 'paiements' || t === 'depenses') q = q.gte('date', since.toISOString());
      return q.limit(5000);
    }));
    res.forEach(function (r, i) { if (r.error) throw r.error; S.data[TABLES[i]] = r.data; });
    try { localStorage.setItem('condesscky_cache', JSON.stringify(S.data)); } catch (e) {}
  },
  insert: async function (t, row) {
    if (S.mode === 'demo') {
      var d = demoLoad(); row = Object.assign({}, row);
      if (t !== 'reglages') { d.seq++; row.id = d.seq; }
      if (!row.created_at && t !== 'reglages') row.created_at = new Date().toISOString();
      if (t === 'commandes' && !row.client_id && row.client_tel) {
        var c = d.clients.filter(function (x) { return x.telephone === row.client_tel; })[0];
        if (!c) { d.seq++; c = { id: d.seq, nom: row.client_nom, telephone: row.client_tel, quartier: row.quartier, ville: row.ville || 'Conakry', created_at: new Date().toISOString() }; d.clients.push(c); }
        row.client_id = c.id;
      }
      d[t].unshift(row); demoSave(d); TABLES.forEach(function (x) { S.data[x] = d[x]; }); return row;
    }
    var r = await sb.from(t).insert(row).select().single();
    if (r.error) throw r.error;
    S.data[t].unshift(r.data);
    if (t === 'commandes' && r.data.client_id && !findById('clients', r.data.client_id)) { var c2 = await sb.from('clients').select('*').eq('id', r.data.client_id).single(); if (c2.data) S.data.clients.unshift(c2.data); }
    return r.data;
  },
  update: async function (t, id, patch) {
    if (S.mode === 'demo') {
      var d = demoLoad(); d[t].forEach(function (x) { if (x.id === id) Object.assign(x, patch); }); demoSave(d); TABLES.forEach(function (x) { S.data[x] = d[x]; }); return;
    }
    var r = await sb.from(t).update(patch).eq('id', id).select().single();
    if (r.error) throw r.error;
    S.data[t] = S.data[t].map(function (x) { return x.id === id ? r.data : x; });
  },
  remove: async function (t, id) {
    if (S.mode === 'demo') { var d = demoLoad(); d[t] = d[t].filter(function (x) { return x.id !== id; }); demoSave(d); TABLES.forEach(function (x) { S.data[x] = d[x]; }); return; }
    var r = await sb.from(t).delete().eq('id', id); if (r.error) throw r.error;
    S.data[t] = S.data[t].filter(function (x) { return x.id !== id; });
  },
  setReglage: async function (cle, valeur) {
    if (S.mode === 'demo') { var d = demoLoad(); var f = d.reglages.filter(function (x) { return x.cle === cle; })[0]; if (f) f.valeur = valeur; else d.reglages.push({ cle: cle, valeur: valeur }); demoSave(d); S.data.reglages = d.reglages; return; }
    var r = await sb.from('reglages').upsert({ cle: cle, valeur: valeur }); if (r.error) throw r.error;
    var f2 = S.data.reglages.filter(function (x) { return x.cle === cle; })[0]; if (f2) f2.valeur = valeur; else S.data.reglages.push({ cle: cle, valeur: valeur });
  }
};

function R(k) { var f = S.data.reglages.filter(function (x) { return x.cle === k; })[0]; var v = f ? f.valeur : SEED_REGLAGES[k]; return v; }
function findById(t, id) { return S.data[t].filter(function (x) { return x.id === id; })[0]; }
function paidFor(cmdId) { return S.data.paiements.filter(function (p) { return p.commande_id === cmdId; }).reduce(function (a, p) { return a + n(p.montant); }, 0); }
function resteFor(c) { return c.statut === 'annulee' ? 0 : Math.max(0, n(c.total) - paidFor(c.id)); }
function cmdsOfClient(cl) { return S.data.commandes.filter(function (c) { return c.statut !== 'annulee' && (c.client_id === cl.id || (cl.telephone && telWa(c.client_tel) === telWa(cl.telephone))); }); }
function title(c) { var a = c.articles || []; if (!a.length) return c.details ? c.details.slice(0, 40) : 'Commande'; var t = a.map(function (x) { return (n(x.qte) > 1 ? x.qte + ' × ' : '') + x.nom; }).join(' + '); return t; }
function chip(st) { return '<span class="chip st-' + st + '">' + esc(STL[st] || st) + '</span>'; }

/* ---------------- calculs ---------------- */
function periode(p) {
  var t = today();
  if (p === 'jour') return [t, t, "aujourd'hui"];
  if (p === 'semaine') { var d = new Date(t + 'T12:00:00'); var dow = (d.getDay() + 6) % 7; var from = addDays(t, -dow); return [from, addDays(from, 6), 'cette semaine']; }
  var m = t.slice(0, 8) + '01'; var dm = new Date(m + 'T12:00:00'); dm.setMonth(dm.getMonth() + 1); dm.setDate(0); return [m, dkey(dm), 'ce mois-ci'];
}
function bilan(from, to) {
  var cmds = S.data.commandes.filter(function (c) { return c.statut !== 'annulee' && inPeriod(c.created_at, from, to); });
  var pays = S.data.paiements.filter(function (p) { return inPeriod(p.date, from, to); });
  var deps = S.data.depenses.filter(function (d) { return inPeriod(d.date, from, to); });
  var b = { cmds: cmds, ventes: 0, encaisse: 0, esp: 0, om: 0, depenses: 0, depCat: {}, src: {}, prod: {}, cout: 0 };
  cmds.forEach(function (c) {
    b.ventes += n(c.total); b.src[c.source] = (b.src[c.source] || 0) + n(c.total);
    (c.articles || []).forEach(function (a) {
      var k = a.nom; var p = b.prod[k] || (b.prod[k] = { qte: 0, montant: 0, cout: 0 }); p.qte += n(a.qte) || 1; p.montant += (n(a.qte) || 1) * n(a.prix);
      var pr = a.produit_id ? findById('produits', a.produit_id) : null; var ct = pr ? n(pr.prix_achat) * (n(a.qte) || 1) : 0; p.cout += ct; b.cout += ct;
    });
  });
  pays.forEach(function (p) { b.encaisse += n(p.montant); if (p.mode === 'orange_money') b.om += n(p.montant); else b.esp += n(p.montant); });
  deps.forEach(function (d) { b.depenses += n(d.montant); b.depCat[d.categorie] = (b.depCat[d.categorie] || 0) + n(d.montant); });
  b.solde = b.encaisse - b.depenses;
  return b;
}
function soldesTotaux() {
  var esp = 0, om = 0;
  S.data.paiements.forEach(function (p) { if (p.mode === 'orange_money') om += n(p.montant); else esp += n(p.montant); });
  S.data.depenses.forEach(function (d) { if (d.mode === 'orange_money') om -= n(d.montant); else esp -= n(d.montant); });
  var aEnc = S.data.commandes.reduce(function (a, c) { return a + resteFor(c); }, 0);
  return { esp: esp, om: om, aEnc: aEnc };
}
function rappels() {
  var out = []; var t = today(); var lim = addDays(t, 7);
  var now = new Date();
  if (now.getDay() === 0 && now.getHours() >= 18) out.push({ ico: '📊', bg: '#DCE8F7', t: 'Bilan de la semaine à envoyer', d: "C'est dimanche soir : le message est prêt", cta: 'Envoyer', href: '#/bilan/semaine' });
  S.data.commandes.filter(function (c) { return c.statut === 'nouvelle' && c.source === 'site'; }).forEach(function (c) {
    out.push({ ico: '🛒', bg: '#FDF1DC', t: 'Nouvelle commande du site : ' + c.client_nom, d: title(c), cta: 'Voir', href: '#/commande/' + c.id });
  });
  S.data.commandes.filter(function (c) { return c.urgent && ['livree', 'annulee'].indexOf(c.statut) < 0; }).forEach(function (c) {
    out.push({ ico: '⚡', bg: '#FDE2E2', t: 'Urgent : ' + title(c), d: c.client_nom + (c.date_livraison ? ' · à livrer le ' + dshort(c.date_livraison) : ''), cta: 'Voir', href: '#/commande/' + c.id });
  });
  S.data.commandes.filter(function (c) { return ['prete', 'livraison', 'livree'].indexOf(c.statut) >= 0 && resteFor(c) > 0; }).forEach(function (c) {
    out.push({ ico: '💰', bg: '#E3F1E8', t: 'Reste à encaisser : ' + c.client_nom, d: fmt(resteFor(c)) + ' · ' + STL[c.statut], cta: 'Voir', href: '#/commande/' + c.id });
  });
  S.data.produits.filter(function (p) { return p.actif !== false && p.suivi_stock && n(p.stock) <= n(p.stock_alerte); }).forEach(function (p) {
    out.push({ ico: '📦', bg: '#DCE8F7', t: 'Stock bas : ' + p.nom, d: 'Plus que ' + n(p.stock) + ' vierge(s)', cta: 'Stock', href: '#/produits' });
  });
  S.data.clients.forEach(function (cl) {
    if (!cl.anniversaire) return;
    var a = t.slice(0, 4) + cl.anniversaire.slice(4, 10); if (a < t) a = (Number(t.slice(0, 4)) + 1) + cl.anniversaire.slice(4, 10);
    if (a <= lim) { var j = Math.round((new Date(a + 'T12:00:00') - new Date(t + 'T12:00:00')) / 864e5);
      out.push({ ico: '🎂', bg: '#FDF1DC', t: 'Anniversaire de ' + cl.nom + (j === 0 ? " aujourd'hui" : ' dans ' + j + ' jour' + (j > 1 ? 's' : '')), d: cmdsOfClient(cl).length + ' commande(s)', cta: 'Écrire', href: waLink(cl.telephone, 'Bonjour ' + cl.nom + ', ton anniversaire approche ! Pour l’occasion, Condesscky Collection t’offre ' + R('remise_fidelite_pourcent') + ' % sur ta prochaine création.') }); }
  });
  var des = n(R('remise_fidelite_des'));
  S.data.clients.forEach(function (cl) { if (cmdsOfClient(cl).length === des - 1) out.push({ ico: '⭐', bg: '#FDF1DC', t: cl.nom + ' : prochaine commande = la ' + des + 'e', d: 'Remise fidélité de ' + R('remise_fidelite_pourcent') + ' % automatique', cta: 'Fiche', href: '#/client/' + cl.id }); });
  return out;
}
function messagesWA(c) {
  var nom = (c.client_nom || '').split(' ')[0]; var reste = resteFor(c);
  return [
    ['Confirmer la commande', 'Bonjour ' + nom + ', merci pour ta commande chez Condesscky Collection ! 🙏\nCommande ' + c.numero + ' : ' + title(c) + '.\nTotal : ' + fmt(c.total) + (paidFor(c.id) ? ' (déjà payé : ' + fmt(paidFor(c.id)) + ')' : '') + '.\nSuis ta commande ici : https://condessckycollection.github.io/suivi.html'],
    ['En fabrication', 'Bonjour ' + nom + ', bonne nouvelle : ta commande ' + c.numero + ' est en fabrication à l’atelier. Je te préviens dès qu’elle est prête ✨'],
    ['Prête (photo)', 'Bonjour ' + nom + ', ta commande ' + c.numero + ' est prête ! Je t’envoie la photo juste après.' + (reste ? '\nReste à payer : ' + fmt(reste) + '.' : '')],
    ['En livraison', 'Bonjour ' + nom + ', ta commande ' + c.numero + ' est en route 🚚. Le livreur t’appelle à l’arrivée.' + (reste ? '\nMontant à remettre : ' + fmt(reste) + ' (espèces ou Orange Money).' : '')],
    ['Merci après livraison', 'Merci ' + nom + ' pour ta confiance 🙏 J’espère que ta création te plaît ! Une photo ou un petit avis nous ferait très plaisir. À bientôt chez Condesscky Collection.']
  ];
}

/* ---------------- interface ---------------- */
var hooks = [];
function on(fn) { hooks.push(fn); }
function nav(active) {
  function a(h, ic, l, k) { return '<a href="' + h + '" class="' + (active === k ? 'on' : '') + '"><span aria-hidden="true" style="font-size:20px">' + ic + '</span>' + l + '</a>'; }
  return '<nav class="bot" aria-label="Menu principal">' + a('#/', '🏠', 'Accueil', 'home') + a('#/commandes', '🛍️', 'Commandes', 'cmd') +
    '<a href="#/vente" class="' + (active === 'vente' ? 'on' : '') + '"><span class="plus" aria-hidden="true">+</span>Vente</a>' + a('#/argent', '💵', 'Argent', 'argent') + a('#/menu', '☰', 'Menu', 'menu') + '</nav>';
}
function page(o) {
  var head = o.back ? '<header class="top"><button class="back" aria-label="Retour" onclick="history.back()">‹</button><h1>' + esc(o.title) + '</h1>' + (o.right || '') + '</header>'
    : '<header class="top"><img src="' + LOGO + '" alt="Condesscky Collection"><h1></h1>' + (o.right || '') + '</header>';
  var ban = (S.mode === 'demo' ? '<div class="banner demo">Mode essai : les données restent dans ce téléphone seulement.</div>' : '') +
    (navigator.onLine === false ? '<div class="banner off">📶 Pas de connexion internet : les changements ne seront pas enregistrés.</div>' : '');
  return head + ban + '<main>' + o.body + '</main>' + nav(o.nav);
}
var lastHash = null;
function render(html) { hooks = []; var y = window.scrollY; $app.innerHTML = html; window.scrollTo(0, location.hash === lastHash ? y : 0); lastHash = location.hash; hooks.forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); }
function q(s) { return document.querySelector(s); }
function formData(f) { var o = {}; new FormData(f).forEach(function (v, k) { o[k] = v; }); return o; }
async function act(fn, okMsg) { try { await fn(); if (okMsg) toast(okMsg); } catch (e) { console.error(e); toast('Erreur : ' + (e.message || e)); throw e; } }

/* ---- Connexion ---- */
function vLogin() {
  render('<div class="login"><img src="' + LOGO + '" alt="Condesscky Collection"><div style="text-align:center"><span class="script">Bienvenue</span><div style="font-weight:800;font-size:18px">Espace du patron</div></div>' +
    '<form id="f"><label>E-mail<input name="email" type="email" required autocomplete="username"></label><label>Mot de passe<input name="pass" type="password" required autocomplete="current-password"></label>' +
    '<p id="err" style="color:#A32D2D;font-size:13px;margin:0"></p><button class="btn navy" type="submit">Se connecter</button></form>' +
    (S.mode === 'demo' ? '<p class="mut" style="text-align:center">Mode essai : n’importe quel e-mail et mot de passe fonctionnent.</p>' : '') + '</div>');
  q('#f').onsubmit = async function (e) {
    e.preventDefault(); var d = formData(e.target);
    try { S.user = await DB.login(d.email, d.pass); await DB.load(); location.hash = '#/'; route(); } catch (er) { q('#err').textContent = er.message; }
  };
}

/* ---- Accueil ---- */
function cmdRow(c) {
  return '<a class="row" href="#/commande/' + c.id + '"><div class="grow"><span class="t">' + esc(title(c)) + '</span><span class="mut">' + esc(c.client_nom) + ' · ' + esc(SRC[c.source] || c.source) + (c.urgent ? ' · ⚡ urgent' : '') + '</span></div>' + chip(c.statut) + '</a>';
}
function vHome() {
  var t = today(); var b = bilan(t, t); var s = soldesTotaux(); var rp = rappels();
  var enCours = S.data.commandes.filter(function (c) { return ['livree', 'annulee'].indexOf(c.statut) < 0; });
  var body = '<div><span class="mut">' + cap(dlong(t)) + '</span><div style="display:flex;align-items:baseline;gap:8px"><span class="script">Bonjour,</span><b style="font-size:20px">le patron</b></div></div>' +
    '<section class="hero" aria-label="Bilan du jour"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:14px">Bilan du jour</b><a href="#/bilan/jour" style="font-size:12px;background:var(--navy2);color:#fff;padding:6px 12px;border-radius:12px;text-decoration:none">' + b.cmds.length + ' vente(s) · Voir</a></div>' +
    '<div><small style="color:#D6E4F5;font-size:12px">Argent du jour (encaissé − dépenses)</small><div class="big">' + fmt(b.solde) + '</div></div>' +
    '<div class="grid2"><div class="tile"><small>Encaissé</small><b>' + fmt(b.encaisse) + '</b></div><div class="tile"><small>Dépenses</small><b>' + fmt(b.depenses) + '</b></div></div></section>' +
    '<section class="card"><h2>Où est l’argent</h2><div class="grid3"><div class="mini"><small>Espèces</small><b>' + fmtn(s.esp) + '</b></div><div class="mini" style="background:var(--cream)"><small style="color:#6B4A06">Orange Money</small><b>' + fmtn(s.om) + '</b></div><div class="mini"><small>À encaisser</small><b>' + fmtn(s.aEnc) + '</b></div></div></section>' +
    '<div class="grid2"><a class="btn or" href="#/vente">＋ Nouvelle vente</a><a class="btn" href="#/depense">− Dépense</a></div>' +
    '<section class="card"><h2>À ne pas oublier</h2>' + (rp.length ? rp.map(function (r) { var ext = r.href.indexOf('http') === 0; return '<a class="row" href="' + esc(r.href) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '><span class="ico" style="background:' + r.bg + '">' + r.ico + '</span><div class="grow"><span class="t">' + esc(r.t) + '</span><span class="mut">' + esc(r.d) + '</span></div><b style="font-size:12px;color:var(--navy)">' + r.cta + '</b></a>'; }).join('') : '<div class="empty">Rien d’urgent. Bonne journée ✨</div>') + '</section>' +
    '<section class="card"><div style="display:flex;justify-content:space-between"><h2>Commandes en cours (' + enCours.length + ')</h2><a href="#/commandes" style="font-size:13px;font-weight:700;color:var(--navy)">Tout voir</a></div>' +
    (enCours.length ? enCours.slice(0, 6).map(cmdRow).join('') : '<div class="empty">Aucune commande en cours.</div>') + '</section>';
  render(page({ body: body, nav: 'home', right: '<a href="#/taches" class="btn sm" style="border-width:1px">✓ Tâches</a>' }));
}

/* ---- Commandes ---- */
var filtreCmd = 'encours', rechCmd = '';
function vCommandes() {
  var fs = [['encours', 'En cours'], ['nouvelle', 'Nouvelles'], ['fabrication', 'Fabrication'], ['prete', 'Prêtes'], ['livraison', 'Livraison'], ['livree', 'Livrées'], ['annulee', 'Annulées'], ['toutes', 'Toutes']];
  var list = S.data.commandes.filter(function (c) {
    if (filtreCmd === 'encours' && ['livree', 'annulee'].indexOf(c.statut) >= 0) return false;
    if (['encours', 'toutes'].indexOf(filtreCmd) < 0 && c.statut !== filtreCmd) return false;
    if (rechCmd) { var h = (c.client_nom + ' ' + c.client_tel + ' ' + c.numero + ' ' + title(c)).toLowerCase(); if (h.indexOf(rechCmd.toLowerCase()) < 0) return false; }
    return true;
  });
  var body = '<input id="r" type="search" placeholder="Chercher un nom, un numéro…" value="' + esc(rechCmd) + '">' +
    '<div class="chips">' + fs.map(function (f) { return '<button data-f="' + f[0] + '" class="' + (filtreCmd === f[0] ? 'on' : '') + '">' + f[1] + '</button>'; }).join('') + '</div>' +
    '<section class="card">' + (list.length ? list.map(function (c) { return '<a class="row" href="#/commande/' + c.id + '"><div class="grow"><span class="t">' + esc(title(c)) + '</span><span class="mut">' + esc(c.client_nom) + ' · ' + dshort(c.created_at) + ' · ' + fmt(c.total) + (resteFor(c) ? ' · reste ' + fmtn(resteFor(c)) : '') + '</span></div>' + chip(c.statut) + '</a>'; }).join('') : '<div class="empty">Aucune commande ici.</div>') + '</section>';
  render(page({ title: 'Commandes', body: body, nav: 'cmd' }));
  q('#r').oninput = function (e) { rechCmd = e.target.value; var p = e.target.selectionStart; vCommandes(); var r = q('#r'); r.focus(); r.setSelectionRange(p, p); };
  document.querySelectorAll('[data-f]').forEach(function (b) { b.onclick = function () { filtreCmd = b.dataset.f; vCommandes(); }; });
}

function vCommande(id) {
  var c = findById('commandes', id); if (!c) { render(page({ title: 'Commande', back: 1, body: '<div class="empty">Commande introuvable.</div>', nav: 'cmd' })); return; }
  var paid = paidFor(c.id), reste = resteFor(c);
  var pays = S.data.paiements.filter(function (p) { return p.commande_id === c.id; });
  var idx = STATUTS.map(function (s) { return s[0]; }).indexOf(c.statut);
  var next = (idx >= 0 && idx < 4) ? STATUTS[idx + 1] : null;
  var tel = c.client_tel;
  var body = '<section class="card"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>' + esc(c.numero) + '</b>' + chip(c.statut) + '</div>' +
    '<div class="mut" style="margin-top:4px">' + dshort(c.created_at) + ' · ' + esc(SRC[c.source] || c.source) + (c.urgent ? ' · ⚡ Urgent' : '') + (c.date_livraison ? ' · livraison le ' + dshort(c.date_livraison) : '') + '</div>' +
    (next ? '<button class="btn navy" id="next" style="margin-top:12px">Passer à : ' + next[1] + '</button>' : '') +
    '<div class="chips" style="margin-top:10px">' + STATUTS.map(function (s) { return '<button data-st="' + s[0] + '" class="' + (c.statut === s[0] ? 'on' : '') + '">' + s[1] + '</button>'; }).join('') + '</div></section>' +
    '<section class="card"><h2>Client</h2><div class="line"><span>' + esc(c.client_nom) + '</span>' + (c.client_id ? '<a href="#/client/' + c.client_id + '" style="font-size:13px;font-weight:700;color:var(--navy)">Fiche</a>' : '') + '</div>' +
    '<div class="mut">' + esc([tel, c.quartier, c.ville].filter(Boolean).join(' · ')) + '</div>' +
    (tel ? '<div class="grid2" style="margin-top:10px"><a class="btn sm wa" style="width:100%" target="_blank" rel="noopener" href="' + waLink(tel, 'Bonjour ' + c.client_nom.split(' ')[0] + ', ') + '">WhatsApp</a><a class="btn sm" style="width:100%" href="tel:' + esc(tel) + '">Appeler</a></div>' : '') + '</section>' +
    '<section class="card"><h2>Articles</h2>' + ((c.articles || []).map(function (a) { return '<div class="line"><span>' + (n(a.qte) > 1 ? a.qte + ' × ' : '') + esc(a.nom) + (a.perso ? '<br><span class="mut">' + esc(a.perso) + '</span>' : '') + '</span><b>' + fmtn((n(a.qte) || 1) * n(a.prix)) + '</b></div>'; }).join('') || '<div class="mut">' + esc(c.details || '—') + '</div>') +
    (c.remise ? '<div class="line"><span>Remise fidélité</span><b>− ' + fmtn(c.remise) + '</b></div>' : '') +
    (c.supplement_urgent ? '<div class="line"><span>Supplément urgent</span><b>' + fmtn(c.supplement_urgent) + '</b></div>' : '') +
    (c.livraison ? '<div class="line"><span>Livraison</span><b>' + fmtn(c.livraison) + '</b></div>' : '') +
    '<div class="line tot"><span>Total</span><span>' + fmt(c.total) + '</span></div>' +
    (c.details && (c.articles || []).length ? '<div class="mut" style="margin-top:6px">Note : ' + esc(c.details) + '</div>' : '') + '</section>' +
    '<section class="card"><h2>Paiements</h2>' + (pays.map(function (p) { return '<div class="line"><span>' + dshort(p.date) + ' · ' + MODEL[p.mode] + '</span><b>' + fmtn(p.montant) + '</b></div>'; }).join('') || '<div class="mut">Aucun paiement pour l’instant.</div>') +
    '<div class="line tot"><span>Reste à payer</span><span style="color:' + (reste ? 'var(--bad)' : 'var(--ok)') + '">' + fmt(reste) + '</span></div>' +
    (reste ? '<form id="fp" style="margin-top:8px"><div class="grid2"><label>Montant<input name="montant" type="number" inputmode="numeric" value="' + reste + '" required></label><label>Mode<select name="mode">' + MODES.map(function (m) { return '<option value="' + m[0] + '">' + m[1] + '</option>'; }).join('') + '</select></label></div><button class="btn or" type="submit">Enregistrer le paiement</button></form>' : '') + '</section>' +
    (tel ? '<section class="card"><h2>Messages WhatsApp prêts</h2>' + messagesWA(c).map(function (m) { return '<a class="row" target="_blank" rel="noopener" href="' + waLink(tel, m[1]) + '"><span class="ico" style="background:#E3F2E8">💬</span><div class="grow"><span class="t">' + m[0] + '</span><span class="mut" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(m[1].split('\n')[0]) + '</span></div><b style="font-size:12px;color:#1FAF55">Envoyer</b></a>'; }).join('') + '</section>' : '') +
    '<section class="card"><h2>Note de l’atelier</h2><form id="fn"><textarea name="details" placeholder="Couleur, prénom, police, photo reçue…">' + esc(c.details || '') + '</textarea><button class="btn sm" type="submit" style="width:100%">Enregistrer la note</button></form></section>' +
    '<button class="btn danger" id="del">Supprimer la commande</button>';
  render(page({ title: 'Commande', back: 1, body: body, nav: 'cmd' }));
  async function setSt(st) { await act(function () { return DB.update('commandes', c.id, { statut: st }); }, 'Statut : ' + STL[st]); vCommande(id); }
  if (q('#next')) q('#next').onclick = function () { setSt(next[0]); };
  document.querySelectorAll('[data-st]').forEach(function (b) { b.onclick = function () { setSt(b.dataset.st); }; });
  if (q('#fp')) q('#fp').onsubmit = async function (e) { e.preventDefault(); var d = formData(e.target); if (n(d.montant) <= 0) return toast('Montant invalide'); await act(function () { return DB.insert('paiements', { commande_id: c.id, montant: n(d.montant), mode: d.mode, date: new Date().toISOString() }); }, 'Paiement enregistré'); vCommande(id); };
  q('#fn').onsubmit = async function (e) { e.preventDefault(); await act(function () { return DB.update('commandes', c.id, { details: formData(e.target).details }); }, 'Note enregistrée'); };
  q('#del').onclick = async function () { if (!confirm('Supprimer définitivement la commande ' + c.numero + ' et ses paiements ?')) return; await act(function () { return DB.remove('commandes', c.id); }, 'Commande supprimée'); S.data.paiements = S.data.paiements.filter(function (p) { return p.commande_id !== c.id; }); location.hash = '#/commandes'; };
}

/* ---- Nouvelle vente ---- */
var V = null;
function newVente() { V = { client_nom: '', client_tel: '', quartier: '', ville: 'Conakry', source: 'boutique', urgent: false, livr: 'conakry', date_livraison: '', articles: [], acompte: '', mode: 'especes', details: '' }; }
function venteCalc() {
  var st = V.articles.reduce(function (a, x) { return a + (n(x.qte) || 1) * n(x.prix); }, 0);
  var cl = S.data.clients.filter(function (c) { return V.client_tel && telWa(c.telephone) === telWa(V.client_tel); })[0];
  var nb = cl ? cmdsOfClient(cl).length : 0;
  var fid = cl && nb + 1 >= n(R('remise_fidelite_des')) && (nb + 1) % n(R('remise_fidelite_des')) === 0;
  var remise = fid ? Math.round(st * n(R('remise_fidelite_pourcent')) / 100) : 0;
  var urg = V.urgent ? n(R('supplement_urgent')) : 0;
  var liv = V.livr === 'conakry' ? n(R('livraison_conakry')) : 0;
  return { st: st, remise: remise, urg: urg, liv: liv, total: st - remise + urg + liv, fid: fid, nb: nb, cl: cl };
}
function vVente() {
  if (!V) newVente();
  var k = venteCalc();
  var prods = S.data.produits.filter(function (p) { return p.actif !== false; });
  var body = '<form id="fv">' +
    '<section class="card" style="display:flex;flex-direction:column;gap:10px"><h2>Client</h2>' +
    '<label>Téléphone (WhatsApp)<input name="client_tel" inputmode="tel" list="tels" value="' + esc(V.client_tel) + '" placeholder="6XX XX XX XX"></label>' +
    '<datalist id="tels">' + S.data.clients.map(function (c) { return '<option value="' + esc(c.telephone || '') + '">' + esc(c.nom) + '</option>'; }).join('') + '</datalist>' +
    '<label>Nom<input name="client_nom" required value="' + esc(V.client_nom) + '"></label>' +
    '<div class="grid2"><label>Quartier<input name="quartier" value="' + esc(V.quartier) + '"></label><label>Ville<input name="ville" value="' + esc(V.ville) + '"></label></div>' +
    (k.cl ? '<div class="mut">Client connu : ' + k.nb + ' commande(s) déjà.' + (k.fid ? ' <b style="color:var(--ok)">⭐ Remise fidélité appliquée.</b>' : '') + '</div>' : '') +
    '<label>Venu par<select name="source">' + SOURCES.map(function (s) { return '<option value="' + s[0] + '"' + (V.source === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></label></section>' +
    '<section class="card" style="display:flex;flex-direction:column;gap:10px"><h2>Articles</h2>' +
    V.articles.map(function (a, i) { return '<div class="art"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:14px">' + esc(a.nom) + '</b><button type="button" class="btn sm danger" data-rm="' + i + '" style="min-height:30px;padding:0 10px">✕</button></div><div class="grid2"><label>Quantité<input type="number" min="1" data-qte="' + i + '" value="' + a.qte + '"></label><label>Prix unitaire<input type="number" data-prix="' + i + '" value="' + a.prix + '"></label></div><label>Personnalisation<input data-perso="' + i + '" value="' + esc(a.perso) + '" placeholder="Prénom, couleur, modèle…"></label></div>'; }).join('') +
    '<label>Ajouter un article<select id="addp"><option value="">— Choisir un produit —</option>' + prods.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nom) + ' · ' + fmtn(p.prix) + (p.suivi_stock ? ' (stock ' + n(p.stock) + ')' : '') + '</option>'; }).join('') + '<option value="libre">Autre article (texte libre)</option></select></label></section>' +
    '<section class="card" style="display:flex;flex-direction:column;gap:10px"><h2>Livraison</h2>' +
    '<label>Mode<select name="livr"><option value="conakry"' + (V.livr === 'conakry' ? ' selected' : '') + '>Livraison Conakry (' + fmtn(R('livraison_conakry')) + ')</option><option value="interieur"' + (V.livr === 'interieur' ? ' selected' : '') + '>Intérieur du pays (frais à part)</option><option value="retrait"' + (V.livr === 'retrait' ? ' selected' : '') + '>Retrait à l’atelier</option></select></label>' +
    '<label>Date de livraison<input type="date" name="date_livraison" value="' + esc(V.date_livraison) + '"></label>' +
    '<label class="check"><input type="checkbox" name="urgent"' + (V.urgent ? ' checked' : '') + '> ⚡ Urgent 24 h (+ ' + fmtn(R('supplement_urgent')) + ')</label>' +
    '<label>Note pour l’atelier<textarea name="details">' + esc(V.details) + '</textarea></label></section>' +
    '<section class="card"><h2>Total</h2><div class="line"><span>Articles</span><b>' + fmtn(k.st) + '</b></div>' +
    (k.remise ? '<div class="line"><span>Remise fidélité ' + R('remise_fidelite_pourcent') + ' %</span><b>− ' + fmtn(k.remise) + '</b></div>' : '') +
    (k.urg ? '<div class="line"><span>Supplément urgent</span><b>' + fmtn(k.urg) + '</b></div>' : '') +
    (k.liv ? '<div class="line"><span>Livraison</span><b>' + fmtn(k.liv) + '</b></div>' : '') +
    '<div class="line tot"><span>Total</span><span>' + fmt(k.total) + '</span></div>' +
    '<div class="grid2" style="margin-top:10px"><label>Payé maintenant<input name="acompte" type="number" inputmode="numeric" value="' + esc(V.acompte) + '" placeholder="Acompte ' + R('acompte_pourcent') + ' % = ' + fmtn(Math.round(k.total * n(R('acompte_pourcent')) / 100)) + '"></label><label>Mode<select name="mode">' + MODES.map(function (m) { return '<option value="' + m[0] + '"' + (V.mode === m[0] ? ' selected' : '') + '>' + m[1] + '</option>'; }).join('') + '</select></label></div>' +
    '<div class="grid2" style="margin-top:8px"><button type="button" class="btn sm" id="ac50" style="width:100%">Acompte ' + R('acompte_pourcent') + ' %</button><button type="button" class="btn sm" id="ac100" style="width:100%">Tout payé</button></div></section>' +
    '<button class="btn or" type="submit">Enregistrer la vente</button></form>';
  render(page({ title: 'Nouvelle vente', back: 1, body: body, nav: 'vente' }));
  var f = q('#fv');
  function sync() { var d = formData(f); ['client_nom', 'quartier', 'ville', 'source', 'livr', 'date_livraison', 'acompte', 'mode', 'details'].forEach(function (x) { V[x] = d[x] || ''; }); V.client_tel = (d.client_tel || '').trim(); V.urgent = !!f.urgent.checked;
    document.querySelectorAll('[data-qte]').forEach(function (e) { V.articles[e.dataset.qte].qte = n(e.value) || 1; });
    document.querySelectorAll('[data-prix]').forEach(function (e) { V.articles[e.dataset.prix].prix = n(e.value); });
    document.querySelectorAll('[data-perso]').forEach(function (e) { V.articles[e.dataset.perso].perso = e.value; }); }
  f.addEventListener('change', function (e) {
    sync();
    var redraw = e.target.tagName === 'SELECT' || e.target.type === 'checkbox' || e.target.dataset.qte != null || e.target.dataset.prix != null;
    if (e.target.name === 'client_tel') { var cl = S.data.clients.filter(function (c) { return V.client_tel && telWa(c.telephone) === telWa(V.client_tel); })[0]; if (cl) { V.client_nom = cl.nom; V.quartier = cl.quartier || ''; V.ville = cl.ville || 'Conakry'; redraw = true; } }
    if (e.target.id === 'addp' && e.target.value) { var v = e.target.value; if (v === 'libre') { var nm = prompt('Nom de l’article ?'); if (nm) V.articles.push({ produit_id: null, nom: nm, qte: 1, prix: 0, perso: '' }); } else { var p = findById('produits', Number(v)); V.articles.push({ produit_id: p.id, nom: p.nom, qte: 1, prix: n(p.prix), perso: '' }); } }
    if (redraw) vVente();
  });
  document.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { sync(); V.articles.splice(Number(b.dataset.rm), 1); vVente(); }; });
  q('#ac50').onclick = function () { sync(); V.acompte = String(Math.round(venteCalc().total * n(R('acompte_pourcent')) / 100)); vVente(); };
  q('#ac100').onclick = function () { sync(); V.acompte = String(venteCalc().total); vVente(); };
  f.onsubmit = async function (e) {
    e.preventDefault(); sync(); var k2 = venteCalc();
    if (!V.articles.length) return toast('Ajoute au moins un article');
    var row = { numero: numero(), client_nom: V.client_nom.trim(), client_tel: telWa(V.client_tel) || null, quartier: V.quartier || null, ville: V.ville || 'Conakry', source: V.source, statut: 'nouvelle', urgent: V.urgent,
      date_livraison: V.date_livraison || null, articles: V.articles, sous_total: k2.st, remise: k2.remise, supplement_urgent: k2.urg, livraison: k2.liv, total: k2.total, details: V.details || null };
    if (k2.cl) row.client_id = k2.cl.id;
    var c;
    try {
      await act(async function () {
        c = await DB.insert('commandes', row);
        if (n(V.acompte) > 0) await DB.insert('paiements', { commande_id: c.id, montant: n(V.acompte), mode: V.mode, date: new Date().toISOString() });
        for (var i = 0; i < V.articles.length; i++) { var a = V.articles[i]; var p = a.produit_id ? findById('produits', a.produit_id) : null; if (p && p.suivi_stock) await DB.update('produits', p.id, { stock: Math.max(0, n(p.stock) - (n(a.qte) || 1)) }); }
      }, 'Vente enregistrée ✓');
    } catch (er) { return; }
    V = null; location.hash = '#/commande/' + c.id;
  };
}

/* ---- Tâches du jour ---- */
function vTaches() {
  var t = today(); var dem = addDays(t, 1);
  var afab = S.data.commandes.filter(function (c) { return ['nouvelle', 'fabrication'].indexOf(c.statut) >= 0; }).sort(function (a, b) { return (b.urgent - a.urgent) || String(a.date_livraison || '9').localeCompare(String(b.date_livraison || '9')); });
  var aliv = S.data.commandes.filter(function (c) { return ['prete', 'livraison'].indexOf(c.statut) >= 0; });
  var perso = S.data.taches.filter(function (x) { return x.jour <= t && (!x.fait || x.jour === t); });
  function cr(c) { var late = c.date_livraison && c.date_livraison <= dem; return '<a class="row" href="#/commande/' + c.id + '"><span class="ico" style="background:' + (c.urgent || late ? '#FDE2E2' : '#DCE8F7') + '">' + (c.urgent ? '⚡' : '🛠️') + '</span><div class="grow"><span class="t">' + esc(title(c)) + '</span><span class="mut">' + esc(c.client_nom) + (c.date_livraison ? ' · pour le ' + dshort(c.date_livraison) : '') + '</span></div>' + chip(c.statut) + '</a>'; }
  var body = '<div class="mut">' + cap(dlong(t)) + '</div>' +
    '<section class="card"><h2>À fabriquer (' + afab.length + ')</h2>' + (afab.map(cr).join('') || '<div class="empty">Rien à fabriquer.</div>') + '</section>' +
    '<section class="card"><h2>À livrer (' + aliv.length + ')</h2>' + (aliv.map(function (c) { return '<a class="row" href="#/commande/' + c.id + '"><span class="ico" style="background:#DCE8F7">🚚</span><div class="grow"><span class="t">' + esc(c.client_nom) + ' · ' + esc(c.quartier || c.ville || '') + '</span><span class="mut">' + esc(title(c)) + (resteFor(c) ? ' · à encaisser ' + fmtn(resteFor(c)) : ' · payé') + '</span></div>' + chip(c.statut) + '</a>'; }).join('') || '<div class="empty">Rien à livrer.</div>') + '</section>' +
    '<section class="card"><h2>Mes tâches</h2>' + perso.map(function (x) { return '<label class="row check" style="cursor:pointer"><input type="checkbox" data-tk="' + x.id + '"' + (x.fait ? ' checked' : '') + '><span class="grow" style="' + (x.fait ? 'text-decoration:line-through;color:var(--mut)' : '') + '">' + esc(x.titre) + (x.jour < t ? ' <span class="mut">(' + dshort(x.jour) + ')</span>' : '') + '</span></label>'; }).join('') +
    '<form id="ft" style="flex-direction:row;margin-top:8px"><input name="titre" placeholder="Ajouter une tâche…" required><button class="btn sm or" type="submit">＋</button></form></section>';
  render(page({ title: 'Tâches du jour', back: 1, body: body, nav: 'home' }));
  document.querySelectorAll('[data-tk]').forEach(function (b) { b.onchange = async function () { await act(function () { return DB.update('taches', Number(b.dataset.tk), { fait: b.checked }); }); vTaches(); }; });
  q('#ft').onsubmit = async function (e) { e.preventDefault(); await act(function () { return DB.insert('taches', { titre: formData(e.target).titre, jour: t, fait: false }); }); vTaches(); };
}

/* ---- Argent ---- */
var perArg = 'jour';
function vArgent() {
  var p = periode(perArg); var b = bilan(p[0], p[1]); var s = soldesTotaux();
  var mv = [];
  S.data.paiements.filter(function (x) { return inPeriod(x.date, p[0], p[1]); }).forEach(function (x) { var c = findById('commandes', x.commande_id); mv.push({ d: x.date, plus: true, m: x.montant, t: c ? c.client_nom + ' · ' + title(c) : 'Paiement', s: MODEL[x.mode], h: c ? '#/commande/' + c.id : '' }); });
  S.data.depenses.filter(function (x) { return inPeriod(x.date, p[0], p[1]); }).forEach(function (x) { mv.push({ d: x.date, plus: false, m: x.montant, t: DEPL[x.categorie] + (x.note ? ' · ' + x.note : ''), s: MODEL[x.mode], id: x.id }); });
  mv.sort(function (a, b2) { return String(b2.d).localeCompare(String(a.d)); });
  var body = '<div class="chips">' + [['jour', "Aujourd'hui"], ['semaine', 'Semaine'], ['mois', 'Mois']].map(function (x) { return '<button data-p="' + x[0] + '" class="' + (perArg === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
    '<section class="hero"><small style="color:#D6E4F5">Encaissé − dépenses (' + p[2] + ')</small><div class="big">' + fmt(b.solde) + '</div><div class="grid2"><div class="tile"><small>Encaissé</small><b>' + fmt(b.encaisse) + '</b></div><div class="tile"><small>Dépenses</small><b>' + fmt(b.depenses) + '</b></div></div></section>' +
    '<section class="card"><h2>Caisse totale</h2><div class="grid3"><div class="mini"><small>Espèces</small><b>' + fmtn(s.esp) + '</b></div><div class="mini" style="background:var(--cream)"><small style="color:#6B4A06">Orange Money</small><b>' + fmtn(s.om) + '</b></div><div class="mini"><small>À encaisser</small><b>' + fmtn(s.aEnc) + '</b></div></div></section>' +
    '<div class="grid2"><a class="btn" href="#/depense">− Dépense</a><a class="btn navy" href="#/bilan/' + perArg + '">Bilan</a></div>' +
    '<section class="card"><h2>Mouvements</h2>' + (mv.map(function (m) { return '<' + (m.h ? 'a href="' + m.h + '"' : 'div') + ' class="row"' + (m.id ? ' data-dep="' + m.id + '"' : '') + '><span class="ico" style="background:' + (m.plus ? '#E3F2E8' : '#FDE2E2') + '">' + (m.plus ? '↓' : '↑') + '</span><div class="grow"><span class="t">' + esc(m.t) + '</span><span class="mut">' + dshort(m.d) + ' · ' + m.s + '</span></div><b style="color:' + (m.plus ? 'var(--ok)' : 'var(--bad)') + '">' + (m.plus ? '+' : '−') + fmtn(m.m) + '</b></' + (m.h ? 'a' : 'div') + '>'; }).join('') || '<div class="empty">Aucun mouvement.</div>') + '</section>';
  render(page({ title: 'Argent', body: body, nav: 'argent' }));
  document.querySelectorAll('[data-p]').forEach(function (b2) { b2.onclick = function () { perArg = b2.dataset.p; vArgent(); }; });
  document.querySelectorAll('[data-dep]').forEach(function (r) { r.onclick = async function () { if (!confirm('Supprimer cette dépense ?')) return; await act(function () { return DB.remove('depenses', Number(r.dataset.dep)); }, 'Dépense supprimée'); vArgent(); }; });
}
function vDepense() {
  var body = '<form id="fd" class="card"><label>Type<select name="categorie">' + DEP.map(function (d) { return '<option value="' + d[0] + '">' + d[1] + '</option>'; }).join('') + '</select></label>' +
    '<label>Montant (GNF)<input name="montant" type="number" inputmode="numeric" required></label><label>Payé en<select name="mode">' + MODES.map(function (m) { return '<option value="' + m[0] + '">' + m[1] + '</option>'; }).join('') + '</select></label>' +
    '<label>Date<input name="date" type="date" value="' + today() + '"></label><label>Note<input name="note" placeholder="Ex. 10 gourdes vierges, pub TikTok…"></label><button class="btn or" type="submit">Enregistrer la dépense</button></form>';
  render(page({ title: 'Ajouter une dépense', back: 1, body: body, nav: 'argent' }));
  q('#fd').onsubmit = async function (e) { e.preventDefault(); var d = formData(e.target); if (n(d.montant) <= 0) return toast('Montant invalide');
    var dt = d.date === today() ? new Date().toISOString() : new Date(d.date + 'T12:00:00').toISOString();
    await act(function () { return DB.insert('depenses', { categorie: d.categorie, montant: n(d.montant), mode: d.mode, note: d.note || null, date: dt }); }, 'Dépense enregistrée'); history.back(); };
}

/* ---- Bilan ---- */
function texteBilan(p, b) {
  var L = ['📊 *Bilan Condesscky Collection – ' + p[2] + '*', '(' + dshort(p[0] + 'T12:00:00') + (p[0] !== p[1] ? ' au ' + dshort(p[1] + 'T12:00:00') : '') + ')', '',
    '🛍️ Commandes : ' + b.cmds.length + ' pour ' + fmt(b.ventes), '💵 Encaissé : ' + fmt(b.encaisse) + ' (espèces ' + fmtn(b.esp) + ', OM ' + fmtn(b.om) + ')', '💸 Dépenses : ' + fmt(b.depenses)];
  Object.keys(b.depCat).forEach(function (k) { L.push('   • ' + DEPL[k] + ' : ' + fmtn(b.depCat[k])); });
  L.push('✅ Reste (encaissé − dépenses) : ' + fmt(b.solde));
  var tops = Object.keys(b.prod).sort(function (a, c) { return b.prod[c].montant - b.prod[a].montant; }).slice(0, 3);
  if (tops.length) { L.push('', '🏆 Meilleures ventes :'); tops.forEach(function (k) { L.push('   • ' + k + ' : ' + b.prod[k].qte + ' (' + fmtn(b.prod[k].montant) + ')'); }); }
  var srcs = Object.keys(b.src); if (srcs.length) { L.push('', '📣 Ventes par source :'); srcs.forEach(function (k) { L.push('   • ' + (SRC[k] || k) + ' : ' + fmtn(b.src[k])); }); }
  L.push('', '⏳ À encaisser au total : ' + fmt(soldesTotaux().aEnc));
  return L.join('\n');
}
function vBilan(per) {
  per = per || 'jour'; var p = periode(per); var b = bilan(p[0], p[1]);
  var tops = Object.keys(b.prod).sort(function (a, c) { return b.prod[c].montant - b.prod[a].montant; });
  var maxp = tops.length ? b.prod[tops[0]].montant : 1;
  var srcs = Object.keys(b.src).sort(function (a, c) { return b.src[c] - b.src[a]; }); var maxs = srcs.length ? b.src[srcs[0]] : 1;
  var body = '<div class="chips">' + [['jour', "Aujourd'hui"], ['semaine', 'Semaine'], ['mois', 'Mois']].map(function (x) { return '<a href="#/bilan/' + x[0] + '"><button class="' + (per === x[0] ? 'on' : '') + '">' + x[1] + '</button></a>'; }).join('') + '</div>' +
    '<section class="hero"><small style="color:#D6E4F5">Encaissé − dépenses (' + p[2] + ')</small><div class="big">' + fmt(b.solde) + '</div><div class="grid2"><div class="tile"><small>Commandes</small><b>' + b.cmds.length + ' · ' + fmtn(b.ventes) + '</b></div><div class="tile"><small>Dépenses</small><b>' + fmt(b.depenses) + '</b></div></div>' +
    (b.cout ? '<div class="mut" style="color:#D6E4F5">Bénéfice sur produits (ventes − prix d’achat) : ' + fmt(b.ventes - b.cout) + '</div>' : '') + '</section>' +
    '<section class="card"><h2>Ventes par produit</h2>' + (tops.map(function (k) { return '<div style="margin:8px 0"><div class="line" style="padding:0"><span>' + esc(k) + ' × ' + b.prod[k].qte + '</span><b>' + fmtn(b.prod[k].montant) + '</b></div><div class="bar" style="width:' + Math.max(4, Math.round(b.prod[k].montant / maxp * 100)) + '%"></div></div>'; }).join('') || '<div class="empty">Aucune vente.</div>') + '</section>' +
    '<section class="card"><h2>Ventes par source de pub</h2>' + (srcs.map(function (k) { return '<div style="margin:8px 0"><div class="line" style="padding:0"><span>' + esc(SRC[k] || k) + '</span><b>' + fmtn(b.src[k]) + '</b></div><div class="bar" style="background:var(--navy);width:' + Math.max(4, Math.round(b.src[k] / maxs * 100)) + '%"></div></div>'; }).join('') || '<div class="empty">—</div>') + '</section>' +
    '<section class="card"><h2>Dépenses</h2>' + (Object.keys(b.depCat).map(function (k) { return '<div class="line"><span>' + DEPL[k] + '</span><b>' + fmtn(b.depCat[k]) + '</b></div>'; }).join('') || '<div class="empty">Aucune dépense.</div>') + '</section>' +
    '<a class="btn wa" target="_blank" rel="noopener" href="' + waLink(R('whatsapp_patron'), texteBilan(p, b)) + '">Envoyer ce bilan sur WhatsApp</a>' +
    '<p class="mut" style="text-align:center;margin:0">Le message s’ouvre dans WhatsApp, prêt à envoyer (à toi-même ou à un associé).</p>';
  render(page({ title: 'Bilan', back: 1, body: body, nav: 'argent' }));
}

/* ---- Produits ---- */
function vProduits() {
  var cats = {}; S.data.produits.forEach(function (p) { (cats[p.categorie] = cats[p.categorie] || []).push(p); });
  var body = '<p class="mut" style="margin:0">Touchez un prix pour le changer. Le stock des vierges baisse tout seul à chaque vente.</p>' + Object.keys(cats).map(function (c) {
    return '<section class="card"><h2>' + esc(c) + '</h2>' + cats[c].map(function (p) {
      var low = p.suivi_stock && n(p.stock) <= n(p.stock_alerte);
      return '<div class="row" style="flex-wrap:wrap;padding:6px 0"><div class="grow"><span class="t" style="white-space:normal">' + esc(p.nom) + (p.actif === false ? ' <span class="mut">(caché)</span>' : '') + '</span>' + (p.suivi_stock ? '<span class="mut" style="color:' + (low ? 'var(--bad)' : 'var(--mut)') + '">Stock vierges : <b>' + n(p.stock) + '</b>' + (low ? ' · à recommander' : '') + '</span>' : '') + '</div>' +
        (p.suivi_stock ? '<button class="btn sm" data-sm="' + p.id + '" style="min-height:34px;padding:0 10px">−</button><button class="btn sm" data-sp="' + p.id + '" style="min-height:34px;padding:0 10px">＋</button>' : '') +
        '<button class="btn sm or" data-pr="' + p.id + '" style="min-height:34px">' + fmtn(p.prix) + '</button><button class="btn sm" data-ed="' + p.id + '" style="min-height:34px;padding:0 10px" aria-label="Modifier">✎</button></div>';
    }).join('') + '</section>';
  }).join('') + '<button class="btn or" id="addprod">＋ Ajouter un produit</button>';
  render(page({ title: 'Produits et prix', back: 1, body: body, nav: 'menu' }));
  function P(id) { return findById('produits', Number(id)); }
  document.querySelectorAll('[data-pr]').forEach(function (b) { b.onclick = async function () { var p = P(b.dataset.pr); var v = prompt('Nouveau prix pour « ' + p.nom + ' » (GNF) :', p.prix); if (v == null || n(v) <= 0) return; await act(function () { return DB.update('produits', p.id, { prix: n(v) }); }, 'Prix mis à jour'); vProduits(); }; });
  document.querySelectorAll('[data-sp],[data-sm]').forEach(function (b) { b.onclick = async function () { var id = b.dataset.sp || b.dataset.sm; var p = P(id); var delta = b.dataset.sp ? 1 : -1; var v = delta > 0 ? prompt('Combien de vierges ajoutées au stock de « ' + p.nom + ' » ?', '1') : '1'; if (v == null) return; await act(function () { return DB.update('produits', p.id, { stock: Math.max(0, n(p.stock) + delta * n(v)) }); }); vProduits(); }; });
  document.querySelectorAll('[data-ed]').forEach(function (b) { b.onclick = function () { location.hash = '#/produit/' + b.dataset.ed; }; });
  q('#addprod').onclick = function () { location.hash = '#/produit/nouveau'; };
}
function vProduitEdit(id) {
  var p = id === 'nouveau' ? { nom: '', categorie: '', prix: '', prix_achat: 0, suivi_stock: false, stock: 0, stock_alerte: 3, actif: true } : findById('produits', Number(id));
  if (!p) return vProduits();
  var body = '<form id="fe" class="card"><label>Nom<input name="nom" required value="' + esc(p.nom) + '"></label><label>Catégorie<input name="categorie" list="cats" value="' + esc(p.categorie) + '"></label>' +
    '<datalist id="cats">' + Object.keys(S.data.produits.reduce(function (a, x) { a[x.categorie] = 1; return a; }, {})).map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist>' +
    '<div class="grid2"><label>Prix de vente<input name="prix" type="number" required value="' + esc(p.prix) + '"></label><label>Prix d’achat (coût)<input name="prix_achat" type="number" value="' + esc(p.prix_achat) + '"></label></div>' +
    '<label class="check"><input type="checkbox" name="suivi_stock"' + (p.suivi_stock ? ' checked' : '') + '> Suivre le stock des vierges</label>' +
    '<div class="grid2"><label>Stock actuel<input name="stock" type="number" value="' + esc(p.stock) + '"></label><label>Alerte à partir de<input name="stock_alerte" type="number" value="' + esc(p.stock_alerte) + '"></label></div>' +
    '<label class="check"><input type="checkbox" name="actif"' + (p.actif !== false ? ' checked' : '') + '> Visible dans les ventes</label><button class="btn or" type="submit">Enregistrer</button></form>';
  render(page({ title: id === 'nouveau' ? 'Nouveau produit' : 'Modifier le produit', back: 1, body: body, nav: 'menu' }));
  q('#fe').onsubmit = async function (e) { e.preventDefault(); var f = e.target; var d = formData(f);
    var row = { nom: d.nom, categorie: d.categorie || 'Autre', prix: n(d.prix), prix_achat: n(d.prix_achat), suivi_stock: f.suivi_stock.checked, stock: n(d.stock), stock_alerte: n(d.stock_alerte), actif: f.actif.checked };
    await act(function () { return id === 'nouveau' ? DB.insert('produits', row) : DB.update('produits', p.id, row); }, 'Produit enregistré'); history.back(); };
}

/* ---- Clients ---- */
var rechCl = '';
function vClients() {
  var list = S.data.clients.map(function (c) { var cs = cmdsOfClient(c); return { c: c, nb: cs.length, tot: cs.reduce(function (a, x) { return a + n(x.total); }, 0) }; })
    .filter(function (x) { return !rechCl || (x.c.nom + ' ' + x.c.telephone + ' ' + (x.c.quartier || '')).toLowerCase().indexOf(rechCl.toLowerCase()) >= 0; })
    .sort(function (a, b) { return b.tot - a.tot; });
  var body = '<input id="r" type="search" placeholder="Chercher un client…" value="' + esc(rechCl) + '"><div class="mut">' + S.data.clients.length + ' client(s) · les fiches se créent toutes seules à chaque vente.</div>' +
    '<section class="card">' + (list.map(function (x) { return '<a class="row" href="#/client/' + x.c.id + '"><span class="ico">' + (x.nb >= n(R('remise_fidelite_des')) ? '⭐' : '👤') + '</span><div class="grow"><span class="t">' + esc(x.c.nom) + '</span><span class="mut">' + esc([x.c.telephone, x.c.quartier].filter(Boolean).join(' · ')) + '</span></div><div style="text-align:right"><b style="font-size:13px">' + fmtn(x.tot) + '</b><div class="mut">' + x.nb + ' cmd</div></div></a>'; }).join('') || '<div class="empty">Aucun client pour l’instant.</div>') + '</section>';
  render(page({ title: 'Clients', back: 1, body: body, nav: 'menu' }));
  q('#r').oninput = function (e) { rechCl = e.target.value; var p = e.target.selectionStart; vClients(); var r = q('#r'); r.focus(); r.setSelectionRange(p, p); };
}
function vClient(id) {
  var c = findById('clients', Number(id)); if (!c) return vClients();
  var cs = cmdsOfClient(c); var tot = cs.reduce(function (a, x) { return a + n(x.total); }, 0); var des = n(R('remise_fidelite_des'));
  var body = '<section class="card"><div style="display:flex;gap:12px;align-items:center"><span class="ico" style="width:48px;height:48px;font-size:22px">' + (cs.length >= des ? '⭐' : '👤') + '</span><div class="grow"><b style="font-size:17px">' + esc(c.nom) + '</b><span class="mut">' + esc([c.telephone, c.quartier, c.ville].filter(Boolean).join(' · ')) + '</span></div></div>' +
    '<div class="grid3" style="margin-top:12px"><div class="mini"><small>Commandes</small><b>' + cs.length + '</b></div><div class="mini"><small>Total</small><b>' + fmtn(tot) + '</b></div><div class="mini"><small>Fidélité</small><b>' + (cs.length % des) + '/' + des + '</b></div></div>' +
    (c.telephone ? '<div class="grid2" style="margin-top:10px"><a class="btn sm wa" style="width:100%" target="_blank" rel="noopener" href="' + waLink(c.telephone, 'Bonjour ' + c.nom.split(' ')[0] + ', ') + '">WhatsApp</a><a class="btn sm" style="width:100%" href="tel:' + esc(c.telephone) + '">Appeler</a></div>' : '') + '</section>' +
    '<form id="fc" class="card"><h2>Infos</h2><label>Nom<input name="nom" value="' + esc(c.nom) + '" required></label><label>Téléphone<input name="telephone" value="' + esc(c.telephone || '') + '"></label><div class="grid2"><label>Quartier<input name="quartier" value="' + esc(c.quartier || '') + '"></label><label>Ville<input name="ville" value="' + esc(c.ville || '') + '"></label></div>' +
    '<label>Anniversaire 🎂<input type="date" name="anniversaire" value="' + esc(c.anniversaire || '') + '"></label><label>Notes<textarea name="notes">' + esc(c.notes || '') + '</textarea></label><button class="btn sm" type="submit" style="width:100%">Enregistrer</button></form>' +
    '<section class="card"><h2>Commandes</h2>' + (cs.map(cmdRow).join('') || '<div class="empty">Aucune commande.</div>') + '</section>' +
    '<button class="btn or" id="nv">＋ Nouvelle vente pour ce client</button>';
  render(page({ title: 'Fiche client', back: 1, body: body, nav: 'menu' }));
  q('#fc').onsubmit = async function (e) { e.preventDefault(); var d = formData(e.target); await act(function () { return DB.update('clients', c.id, { nom: d.nom, telephone: telWa(d.telephone) || null, quartier: d.quartier || null, ville: d.ville || null, anniversaire: d.anniversaire || null, notes: d.notes || null }); }, 'Fiche enregistrée'); };
  q('#nv').onclick = function () { newVente(); V.client_nom = c.nom; V.client_tel = c.telephone || ''; V.quartier = c.quartier || ''; V.ville = c.ville || 'Conakry'; location.hash = '#/vente'; };
}

/* ---- Menu & réglages ---- */
function vMenu() {
  var it = [['#/taches', '✓', 'Tâches du jour'], ['#/clients', '👥', 'Clients'], ['#/produits', '🏷️', 'Produits, prix et stock'], ['#/bilan/semaine', '📊', 'Bilan de la semaine'], ['#/bilan/mois', '📅', 'Bilan du mois'], ['#/depense', '💸', 'Ajouter une dépense'], ['#/reglages', '⚙️', 'Réglages'], ['../', '🌐', 'Voir le site']];
  var body = '<section class="card">' + it.map(function (x) { return '<a class="row" href="' + x[0] + '"><span class="ico">' + x[1] + '</span><span class="grow t">' + x[2] + '</span><span class="mut">›</span></a>'; }).join('') + '</section>' +
    '<section class="card"><h2>Installer sur le téléphone</h2><p class="mut" style="margin:0">Android (Chrome) : menu ⋮ → « Ajouter à l’écran d’accueil ». iPhone (Safari) : bouton Partager → « Sur l’écran d’accueil ».</p>' + (deferredInstall ? '<button class="btn navy" id="inst" style="margin-top:10px">Installer l’application</button>' : '') + '</section>' +
    '<button class="btn" id="sync">↻ Recharger les données</button><button class="btn danger" id="out">Se déconnecter</button>' +
    '<p class="mut" style="text-align:center">' + (S.user ? esc(S.user.email) : '') + ' · ' + (S.mode === 'sb' ? 'données en ligne' : 'mode essai') + '</p>';
  render(page({ title: 'Menu', body: body, nav: 'menu' }));
  if (q('#inst')) q('#inst').onclick = function () { deferredInstall.prompt(); };
  q('#sync').onclick = async function () { await act(function () { return DB.load(); }, 'Données à jour'); };
  q('#out').onclick = async function () { await DB.logout(); S.user = null; location.hash = '#/'; route(); };
}
function vReglages() {
  var F = [['whatsapp_patron', 'Ton numéro WhatsApp (pour recevoir le bilan)', 'text'], ['livraison_conakry', 'Frais de livraison Conakry (GNF)', 'number'], ['supplement_urgent', 'Supplément urgent 24 h (GNF)', 'number'], ['acompte_pourcent', 'Acompte proposé (%)', 'number'], ['remise_fidelite_pourcent', 'Remise fidélité (%)', 'number'], ['remise_fidelite_des', 'Remise à partir de la commande n°', 'number'], ['adresse', 'Adresse de l’atelier', 'text'], ['lien_maps', 'Lien Google Maps', 'text']];
  var body = '<form id="fr" class="card">' + F.map(function (f) { return '<label>' + f[1] + '<input name="' + f[0] + '" type="' + f[2] + '" value="' + esc(R(f[0])) + '"></label>'; }).join('') + '<button class="btn or" type="submit">Enregistrer</button></form>';
  render(page({ title: 'Réglages', back: 1, body: body, nav: 'menu' }));
  q('#fr').onsubmit = async function (e) { e.preventDefault(); var d = formData(e.target);
    await act(async function () { for (var i = 0; i < F.length; i++) { var k = F[i][0]; var v = F[i][2] === 'number' ? n(d[k]) : d[k]; if (v !== R(k)) await DB.setReglage(k, v); } }, 'Réglages enregistrés'); };
}

/* ---------------- routeur ---------------- */
async function route() {
  if (!S.user) return vLogin();
  var h = (location.hash || '#/').slice(2).split('/');
  var r = h[0] || '';
  if (r === '') return vHome();
  if (r === 'commandes') return vCommandes();
  if (r === 'commande') return vCommande(Number(h[1]));
  if (r === 'vente') return vVente();
  if (r === 'taches') return vTaches();
  if (r === 'argent') return vArgent();
  if (r === 'depense') return vDepense();
  if (r === 'bilan') return vBilan(h[1]);
  if (r === 'produits') return vProduits();
  if (r === 'produit') return vProduitEdit(h[1]);
  if (r === 'clients') return vClients();
  if (r === 'client') return vClient(h[1]);
  if (r === 'menu') return vMenu();
  if (r === 'reglages') return vReglages();
  vHome();
}
var deferredInstall = null;
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredInstall = e; });
window.addEventListener('hashchange', route);
window.addEventListener('online', route); window.addEventListener('offline', route);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});

(async function start() {
  DB.init();
  try {
    S.user = await DB.getUser();
    if (S.user) await DB.load();
  } catch (e) {
    console.error(e);
    try { var c = JSON.parse(localStorage.getItem('condesscky_cache')); if (c) { S.data = c; toast('Hors ligne : dernières données gardées'); } } catch (e2) {}
  }
  route();
  if (S.mode === 'sb') setInterval(function () { if (S.user && document.visibilityState === 'visible' && navigator.onLine) DB.load().then(function () { var h = location.hash; if (h === '#/' || h === '' || h === '#/commandes') route(); }).catch(function () {}); }, 120000);
})();
})();
