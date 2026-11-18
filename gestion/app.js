/* Condesscky Collection – application de gestion (v2) */
(function () {
'use strict';
var $app = document.getElementById('app');
var LOGO = '../img/logo.png';
var STATUTS = [
  ['nouvelle', 'Nouvelle'], ['confirmee', 'Confirmée'], ['fabrication', 'En fabrication'], ['prete', 'Prête'],
  ['livraison', 'En livraison'], ['livree', 'Livrée'], ['annulee', 'Annulée']
];
var STL = {}; STATUTS.forEach(function (s) { STL[s[0]] = s[1]; });
var SOURCES = [['boutique', 'Boutique'], ['whatsapp', 'WhatsApp'], ['site', 'Site'], ['facebook', 'Facebook'], ['tiktok', 'TikTok'], ['autre', 'Autre']];
var SRC = {}; SOURCES.forEach(function (s) { SRC[s[0]] = s[1]; });
var DEP = [['pub', 'Publicité Facebook'], ['carburant', 'Carburant livraison'], ['achat', 'Achat de produits'], ['autre', 'Autre']];
var DEPL = {}; DEP.forEach(function (d) { DEPL[d[0]] = d[1]; });
var MODES = [['especes', 'Espèces'], ['orange_money', 'Orange Money']];
var MODEL = { especes: 'Espèces', orange_money: 'Orange Money' };
var ROLES = [['vendeur', 'Vendeur'], ['livreur', 'Livreur']];
var TABLES = ['produits', 'clients', 'commandes', 'paiements', 'depenses', 'taches', 'reglages', 'profils'];
var SITE = 'https://condessckycollection.github.io';

/* ---------------- utilitaires ---------------- */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function n(v) { return Math.round(Number(v) || 0); }
function fmtn(v) { return n(v).toLocaleString('fr-FR').replace(/[  ]/g, ' '); }
function fmt(v) { return fmtn(v) + ' GNF'; }
function pad(x) { return (x < 10 ? '0' : '') + x; }
function dkey(d) { d = new Date(d); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function today() { return dkey(new Date()); }
function addDays(k, nb) { var d = new Date(k + 'T12:00:00'); d.setDate(d.getDate() + nb); return dkey(d); }
function daysBetween(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5); }
var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
var MCOURT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
function dlong(k) { var d = new Date(k + 'T12:00:00'); return JOURS[d.getDay()] + ' ' + d.getDate() + ' ' + MOIS[d.getMonth()]; }
function dshort(v) { if (!v) return ''; var d = new Date(String(v).length === 10 ? v + 'T12:00:00' : v); return d.getDate() + ' ' + MCOURT[d.getMonth()]; }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function telWa(t) { t = String(t || '').replace(/\D/g, ''); if (!t) return ''; if (t.length === 9) t = '224' + t; return t; }
function waLink(tel, msg) { return 'https://wa.me/' + telWa(tel) + '?text=' + encodeURIComponent(msg); }
function mapsLink(c) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([c.quartier, c.ville || 'Conakry', 'Guinée'].filter(Boolean).join(', ')); }
function numero() { var d = new Date(); var s = String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()); var r = ''; for (var i = 0; i < 4; i++) r += 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.charAt(Math.floor(Math.random() * 32)); return 'CC-' + s + '-' + r; }
function toast(msg) { var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2800); }
function inPeriod(v, from, to) { var k = dkey(v); return k >= from && k <= to; }
function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function suiviLien(c) { var d = c.code_suivi || String(c.client_tel || '').replace(/\D/g, '').slice(-4); return 'https://condessckycollection.github.io/suivi.html?n=' + encodeURIComponent(c.numero) + (String(d).length === 4 ? '&c=' + d : ''); }
function msgStatut(c, st) {
  var nom = first(c.client_nom), l = '\nSuivre ta commande : ' + suiviLien(c), reste = resteFor(c);
  var M = { nouvelle: 'Bonjour ' + nom + ', nous avons bien reçu ta commande ' + c.numero + ' (' + title(c) + ').', confirmee: 'Bonjour ' + nom + ', ta commande ' + c.numero + ' est confirmée ✅ (' + title(c) + ').' + (n(c.total) ? '\nTotal : ' + fmt(c.total) + '.' : '') + ' Nous la préparons avec soin.', fabrication: 'Bonjour ' + nom + ', ta commande ' + c.numero + ' est en fabrication à l’atelier ✨', prete: 'Bonjour ' + nom + ', ta commande ' + c.numero + ' est prête ! 🎉' + (reste ? '\nReste à payer : ' + fmt(reste) + '.' : ''), livraison: 'Bonjour ' + nom + ', ta commande ' + c.numero + ' est en route 🚚' + (c.chauffeur_nom ? '\nChauffeur : ' + c.chauffeur_nom + (c.chauffeur_tel ? ' (' + c.chauffeur_tel + ')' : '') : ' Le livreur t’appelle avant d’arriver.'), livree: 'Bonjour ' + nom + ', ta commande ' + c.numero + ' est livrée. Merci pour ta confiance 🙏 Condesscky Collection', annulee: 'Bonjour ' + nom + ', ta commande ' + c.numero + ' a été annulée. Écris-moi si tu as une question.' };
  return (M[st] || M.nouvelle) + (st === 'annulee' ? '' : l);
}
function first(s) { return String(s || '').split(' ')[0]; }

/* ---------------- données ---------------- */
var S = { data: {}, user: null, mode: 'demo', role: 'patron' };
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
var FETES_DEFAUT = [
  { nom: 'Saint-Valentin', date: '2027-02-14' }, { nom: 'Début du Ramadan (estimé)', date: '2027-02-08' },
  { nom: 'Journée de la femme', date: '2027-03-08' }, { nom: 'Aïd el-Fitr / Ramadan (estimé)', date: '2027-03-10' },
  { nom: 'Tabaski (estimée)', date: '2027-05-16' }, { nom: 'Fête des mères (date à vérifier)', date: '2027-05-30' },
  { nom: 'Fête de l’indépendance', date: '2026-10-02' }, { nom: 'Rentrée scolaire (date à vérifier)', date: '2027-10-01' },
  { nom: 'Noël', date: '2026-12-25' }, { nom: 'Nouvel an', date: '2027-01-01' }
];
var SEED_REGLAGES = { livraison_conakry: 20000, supplement_urgent: 30000, acompte_pourcent: 50, remise_fidelite_pourcent: 10, remise_fidelite_des: 5, whatsapp_patron: '224613095004', adresse: "Matoto, Bas-fond, près de l'École Kirikou, Conakry", lien_maps: 'https://maps.app.goo.gl/myEMsGnWxyUobgTB7', patron_email: '', fetes: FETES_DEFAUT };

var LS = 'condesscky_demo_v1', QK = 'condesscky_queue', QM = 'condesscky_qmap', CK = 'condesscky_cache';
function demoLoad() {
  var d = lsGet(LS, null);
  if (!d) { d = { seq: 100 }; TABLES.forEach(function (t) { d[t] = []; });
    SEED_PRODUITS.forEach(function (p, i) { d.produits.push({ id: i + 1, nom: p[0], categorie: p[1], prix: p[2], prix_achat: 0, suivi_stock: p[3], stock: 0, stock_alerte: 3, actif: true, created_at: new Date().toISOString() }); });
    Object.keys(SEED_REGLAGES).forEach(function (k) { d.reglages.push({ cle: k, valeur: SEED_REGLAGES[k] }); }); }
  TABLES.forEach(function (t) { if (!d[t]) d[t] = []; });
  return d;
}
function demoSave(d) { lsSet(LS, d); }
function demoSync(d) { TABLES.forEach(function (x) { S.data[x] = d[x]; }); }
function cacheSave() { if (S.mode === 'sb') lsSet(CK, S.data); }
function pkOf(t) { return t === 'reglages' ? 'cle' : (t === 'profils' ? 'email' : 'id'); }
function isNetErr(e) { return !navigator.onLine || /fetch|network|Failed|Load failed|timeout/i.test(String((e && (e.message || e)) || '')); }
var tmpSeq = lsGet('condesscky_tmpseq', -1);
function tmpId() { tmpSeq -= 1; lsSet('condesscky_tmpseq', tmpSeq); return tmpSeq; }
function queue() { return lsGet(QK, []); }

var DB = {
  init: function () {
    var c = window.CONFIG || {};
    if (c.supabaseUrl && c.supabaseKey && window.supabase) {
      sb = window.supabase.createClient(c.supabaseUrl, c.supabaseKey, { auth: { persistSession: true, storageKey: 'condesscky-auth' } });
      S.mode = 'sb';
    }
  },
  getUser: async function () {
    if (S.mode === 'demo') { var u = lsGet(LS + '_user', null); return u ? { email: u } : null; }
    var r = await sb.auth.getSession(); return r.data.session ? r.data.session.user : null;
  },
  login: async function (email, pass) {
    if (S.mode === 'demo') { lsSet(LS + '_user', email); return { email: email }; }
    var r = await sb.auth.signInWithPassword({ email: email.trim(), password: pass });
    if (r.error) throw new Error(isNetErr(r.error) ? 'Pas de connexion internet.' : 'E-mail ou mot de passe incorrect.');
    return r.data.user;
  },
  logout: async function (global) {
    if (S.mode === 'demo') { try { localStorage.removeItem(LS + '_user'); } catch (e) {} return; }
    await sb.auth.signOut(global ? { scope: 'global' } : undefined);
    try { localStorage.removeItem(CK); } catch (e) {}
  },
  load: async function () {
    if (S.mode === 'demo') { demoSync(demoLoad()); return; }
    var since = new Date(); since.setDate(since.getDate() - 400);
    var res = await Promise.all(TABLES.map(function (t) {
      var q = sb.from(t).select('*');
      if (t === 'commandes') q = q.gte('created_at', since.toISOString()).order('created_at', { ascending: false });
      if (t === 'paiements' || t === 'depenses') q = q.gte('date', since.toISOString());
      return q.limit(5000);
    }));
    res.forEach(function (r, i) { if (r.error) throw r.error; S.data[TABLES[i]] = r.data; });
    // ré-appliquer les changements pas encore envoyés
    queue().forEach(function (it) { applyLocal(it); });
    cacheSave();
  },
  insert: async function (t, row) {
    row = Object.assign({}, row);
    if (S.mode === 'demo') {
      var d = demoLoad();
      if (pkOf(t) === 'id') { d.seq++; row.id = d.seq; }
      if (!row.created_at && t !== 'reglages' && t !== 'profils') row.created_at = new Date().toISOString();
      if (t === 'commandes' && !row.client_id && row.client_tel) {
        var c = d.clients.filter(function (x) { return x.telephone === row.client_tel; })[0];
        if (!c) { d.seq++; c = { id: d.seq, nom: row.client_nom, telephone: row.client_tel, quartier: row.quartier, ville: row.ville || 'Conakry', created_at: new Date().toISOString() }; d.clients.push(c); }
        row.client_id = c.id;
      }
      d[t].unshift(row); demoSave(d); demoSync(d); return row;
    }
    if (navigator.onLine) {
      try {
        var r = await sb.from(t).insert(row).select().single();
        if (r.error) throw r.error;
        S.data[t].unshift(r.data);
        if (t === 'commandes' && r.data.client_id && !findById('clients', r.data.client_id)) { var c2 = await sb.from('clients').select('*').eq('id', r.data.client_id).single(); if (c2.data) S.data.clients.unshift(c2.data); }
        cacheSave(); return r.data;
      } catch (e) { if (!isNetErr(e)) throw e; }
    }
    if (pkOf(t) === 'id') row.id = tmpId();
    if (!row.created_at && t !== 'reglages' && t !== 'profils') row.created_at = new Date().toISOString();
    pushQ({ op: 'insert', t: t, row: row }); S.data[t].unshift(row); cacheSave();
    return row;
  },
  update: async function (t, id, patch) {
    if (S.mode === 'demo') { var d = demoLoad(); d[t].forEach(function (x) { if (x[pkOf(t)] === id) Object.assign(x, patch); }); demoSave(d); demoSync(d); return; }
    if (navigator.onLine && !(typeof id === 'number' && id < 0)) {
      try { var r = await sb.from(t).update(patch).eq(pkOf(t), id).select().single(); if (r.error) throw r.error;
        S.data[t] = S.data[t].map(function (x) { return x[pkOf(t)] === id ? r.data : x; }); cacheSave(); return;
      } catch (e) { if (!isNetErr(e)) throw e; }
    }
    var it = { op: 'update', t: t, id: id, patch: patch }; pushQ(it); applyLocal(it); cacheSave();
  },
  remove: async function (t, id) {
    if (S.mode === 'demo') { var d = demoLoad(); d[t] = d[t].filter(function (x) { return x[pkOf(t)] !== id; }); demoSave(d); demoSync(d); return; }
    if (navigator.onLine && !(typeof id === 'number' && id < 0)) {
      try { var r = await sb.from(t).delete().eq(pkOf(t), id); if (r.error) throw r.error;
        S.data[t] = S.data[t].filter(function (x) { return x[pkOf(t)] !== id; }); cacheSave(); return;
      } catch (e) { if (!isNetErr(e)) throw e; }
    }
    var it = { op: 'remove', t: t, id: id }; pushQ(it); applyLocal(it); cacheSave();
  },
  setReglage: async function (cle, valeur) {
    if (S.mode === 'demo') { var d = demoLoad(); var f = d.reglages.filter(function (x) { return x.cle === cle; })[0]; if (f) f.valeur = valeur; else d.reglages.push({ cle: cle, valeur: valeur }); demoSave(d); demoSync(d); return; }
    var it = { op: 'upsert', t: 'reglages', row: { cle: cle, valeur: valeur } };
    if (navigator.onLine) { try { var r = await sb.from('reglages').upsert(it.row); if (r.error) throw r.error; applyLocal(it); cacheSave(); return; } catch (e) { if (!isNetErr(e)) throw e; } }
    pushQ(it); applyLocal(it); cacheSave();
  },
  flush: async function () {
    if (S.mode !== 'sb' || !navigator.onLine) return 0;
    var q = queue(); if (!q.length) return 0;
    var map = lsGet(QM, {}); var done = 0;
    function fix(v) { return (typeof v === 'number' && v < 0 && map[v]) ? map[v] : v; }
    try {
      while (q.length) {
        var it = q[0];
        if (it.op === 'insert') {
          var r = Object.assign({}, it.row), tmp = r.id;
          if (pkOf(it.t) === 'id') delete r.id;
          ['commande_id', 'produit_id', 'client_id'].forEach(function (k) { if (r[k] != null) { r[k] = fix(r[k]); if (r[k] < 0) delete r[k]; } });
          var res = await sb.from(it.t).insert(r).select().single();
          if (res.error && it.t === 'commandes' && res.error.code === '23505') res = await sb.from('commandes').select('*').eq('numero', r.numero).single();
          if (res.error) throw res.error;
          if (tmp != null) map[tmp] = res.data.id;
        } else if (it.op === 'update') {
          var id = fix(it.id); var p = Object.assign({}, it.patch); ['commande_id', 'produit_id', 'client_id'].forEach(function (k) { if (p[k] != null) p[k] = fix(p[k]); });
          if (!(typeof id === 'number' && id < 0)) { var r2 = await sb.from(it.t).update(p).eq(pkOf(it.t), id); if (r2.error) throw r2.error; }
        } else if (it.op === 'remove') {
          var id2 = fix(it.id); if (!(typeof id2 === 'number' && id2 < 0)) { var r3 = await sb.from(it.t).delete().eq(pkOf(it.t), id2); if (r3.error) throw r3.error; }
        } else if (it.op === 'upsert') {
          var r4 = await sb.from(it.t).upsert(it.row); if (r4.error) throw r4.error;
        }
        q.shift(); done++; lsSet(QK, q); lsSet(QM, map);
      }
      lsSet(QM, {});
    } catch (e) { console.error(e); lsSet(QK, q); lsSet(QM, map); if (!isNetErr(e)) toast('Un changement n’a pas pu être envoyé : ' + (e.message || e)); }
    await DB.load();
    return done;
  },
  uploadPhoto: async function (commandeId, blob) {
    if (S.mode === 'demo') { return await blobToDataURL(blob); }
    var path = commandeId + '/' + Date.now() + '.jpg';
    var r = await sb.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg' });
    if (r.error) throw r.error; return path;
  },
  photoUrls: async function (paths) {
    if (!paths.length) return {};
    var out = {}; var ext = paths.filter(function (p) { return /^(data:|https?:)/.test(p); }); ext.forEach(function (p) { out[p] = p; });
    var st = paths.filter(function (p) { return !/^(data:|https?:)/.test(p); });
    if (st.length && S.mode === 'sb' && navigator.onLine) { var r = await sb.storage.from('photos').createSignedUrls(st, 3600); (r.data || []).forEach(function (x) { if (x.signedUrl) out[x.path] = x.signedUrl; }); }
    return out;
  },
  removePhoto: async function (path) { if (S.mode === 'sb' && !/^(data:|https?:)/.test(path)) await sb.storage.from('photos').remove([path]); }
};
function pushQ(it) { var q = queue(); q.push(it); lsSet(QK, q); }
function applyLocal(it) {
  var t = it.t, pk = pkOf(t);
  if (it.op === 'insert') { if (!S.data[t].some(function (x) { return x[pk] === it.row[pk]; })) S.data[t].unshift(it.row); }
  else if (it.op === 'update') S.data[t] = S.data[t].map(function (x) { return x[pk] === it.id ? Object.assign({}, x, it.patch) : x; });
  else if (it.op === 'remove') S.data[t] = S.data[t].filter(function (x) { return x[pk] !== it.id; });
  else if (it.op === 'upsert') { var f = S.data[t].filter(function (x) { return x[pk] === it.row[pk]; })[0]; if (f) Object.assign(f, it.row); else S.data[t].push(it.row); }
}
function blobToDataURL(b) { return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.readAsDataURL(b); }); }
function compress(file, max) {
  return new Promise(function (res, rej) {
    var img = new Image(); var url = URL.createObjectURL(file);
    img.onload = function () { var k = Math.min(1, max / Math.max(img.width, img.height)); var c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(function (b) { b ? res(b) : rej(new Error('Image illisible')); }, 'image/jpeg', 0.82); };
    img.onerror = function () { rej(new Error('Image illisible')); }; img.src = url;
  });
}

function R(k) { var f = S.data.reglages.filter(function (x) { return x.cle === k; })[0]; return f ? f.valeur : SEED_REGLAGES[k]; }
function findById(t, id) { return S.data[t].filter(function (x) { return x.id === id; })[0]; }
function isDevis(c) { return c.type === 'devis'; }
function vraies() { return S.data.commandes.filter(function (c) { return !isDevis(c); }); }
function paidFor(id) { return S.data.paiements.filter(function (p) { return p.commande_id === id; }).reduce(function (a, p) { return a + n(p.montant); }, 0); }
function resteFor(c) { return (c.statut === 'annulee' || isDevis(c)) ? 0 : Math.max(0, n(c.total) - paidFor(c.id)); }
function cmdsOfClient(cl) { return vraies().filter(function (c) { return c.statut !== 'annulee' && (c.client_id === cl.id || (cl.telephone && telWa(c.client_tel) === telWa(cl.telephone))); }); }
function title(c) { var a = c.articles || []; if (!a.length) return c.details ? c.details.slice(0, 40) : 'Commande'; return a.map(function (x) { return (n(x.qte) > 1 ? x.qte + ' × ' : '') + x.nom; }).join(' + '); }
function chip(c) { if (typeof c === 'string') return '<span class="chip st-' + c + '">' + esc(STL[c] || c) + '</span>'; return isDevis(c) ? '<span class="chip st-devis">Devis</span>' : chip(c.statut); }
function interieur(c) { return n(c.livraison) === 0 && c.ville && !/conakry/i.test(c.ville); }
function remiseQte(qte) { return qte >= 100 ? 20 : qte >= 50 ? 15 : qte >= 10 ? 10 : 0; }

/* ---------------- calculs ---------------- */
function periode(p) {
  var t = today();
  if (p === 'jour') return [t, t, "aujourd'hui"];
  if (p === 'semaine') { var d = new Date(t + 'T12:00:00'); var dow = (d.getDay() + 6) % 7; var from = addDays(t, -dow); return [from, addDays(from, 6), 'cette semaine']; }
  var m = t.slice(0, 8) + '01'; var dm = new Date(m + 'T12:00:00'); dm.setMonth(dm.getMonth() + 1); dm.setDate(0); return [m, dkey(dm), 'ce mois-ci'];
}
function bilan(from, to) {
  var cmds = vraies().filter(function (c) { return c.statut !== 'annulee' && inPeriod(c.created_at, from, to); });
  var pays = S.data.paiements.filter(function (p) { return inPeriod(p.date, from, to) && String(p.note || '').indexOf('Fond de caisse') !== 0; });
  var deps = S.data.depenses.filter(function (d) { return inPeriod(d.date, from, to); });
  var b = { cmds: cmds, ventes: 0, encaisse: 0, esp: 0, om: 0, depenses: 0, depCat: {}, src: {}, prod: {}, cout: 0 };
  cmds.forEach(function (c) {
    b.ventes += n(c.total); b.src[c.source] = (b.src[c.source] || 0) + n(c.total);
    (c.articles || []).forEach(function (a) {
      var q = n(a.qte) || 1; var p = b.prod[a.nom] || (b.prod[a.nom] = { qte: 0, montant: 0 }); p.qte += q; p.montant += q * n(a.prix);
      var pr = a.produit_id ? findById('produits', a.produit_id) : null; if (pr) b.cout += n(pr.prix_achat) * q;
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
  return { esp: esp, om: om, aEnc: S.data.commandes.reduce(function (a, c) { return a + resteFor(c); }, 0) };
}
function prochainesFetes(jours) {
  var t = today(), lim = addDays(t, jours);
  return (R('fetes') || []).filter(function (f) { return f.date >= t && f.date <= lim; }).sort(function (a, b) { return a.date.localeCompare(b.date); });
}
function rappels() {
  var out = []; var t = today(); var lim = addDays(t, 7); var now = new Date();
  if (now.getDay() === 0 && now.getHours() >= 18) out.push({ ico: '📊', bg: '#DCE8F7', t: 'Bilan de la semaine à envoyer', d: "C'est dimanche soir : le message est prêt", cta: 'Envoyer', href: '#/bilan/semaine' });
  var nq = queue().length; if (nq) out.push({ ico: '📶', bg: '#FDF1DC', t: nq + ' changement(s) pas encore envoyé(s)', d: 'Ils partiront dès le retour d’internet', cta: 'Envoyer', href: '#/sync' });
  vraies().filter(function (c) { return c.statut === 'nouvelle' && c.source === 'site'; }).forEach(function (c) { out.push({ ico: '🛒', bg: '#FDF1DC', t: 'Commande du site : ' + c.client_nom, d: title(c) + (n(c.total) ? '' : ' · prix à fixer'), cta: 'Voir', href: '#/commande/' + c.id }); });
  vraies().filter(function (c) { return c.urgent && ['livree', 'annulee'].indexOf(c.statut) < 0; }).forEach(function (c) { out.push({ ico: '⚡', bg: '#FDE2E2', t: 'Urgent : ' + title(c), d: c.client_nom + (c.date_livraison ? ' · à livrer le ' + dshort(c.date_livraison) : ''), cta: 'Voir', href: '#/commande/' + c.id }); });
  vraies().filter(function (c) { return ['prete', 'livraison', 'livree'].indexOf(c.statut) >= 0 && resteFor(c) > 0; }).forEach(function (c) { out.push({ ico: '💰', bg: '#E3F1E8', t: 'Reste à encaisser : ' + c.client_nom, d: fmt(resteFor(c)) + ' · ' + STL[c.statut], cta: 'Voir', href: '#/commande/' + c.id }); });
  S.data.produits.filter(function (p) { return p.actif !== false && p.suivi_stock && n(p.stock) <= n(p.stock_alerte); }).forEach(function (p) { out.push({ ico: '📦', bg: '#DCE8F7', t: 'Stock bas : ' + p.nom, d: 'Plus que ' + n(p.stock) + ' vierge(s)', cta: 'Stock', href: '#/produits' }); });
  S.data.clients.forEach(function (cl) {
    if (!cl.anniversaire) return;
    var a = t.slice(0, 4) + cl.anniversaire.slice(4, 10); if (a < t) a = (Number(t.slice(0, 4)) + 1) + cl.anniversaire.slice(4, 10);
    if (a <= lim) { var j = daysBetween(t, a);
      out.push({ ico: '🎂', bg: '#FDF1DC', t: 'Anniversaire de ' + cl.nom + (j === 0 ? " aujourd'hui" : ' dans ' + j + ' jour' + (j > 1 ? 's' : '')), d: cmdsOfClient(cl).length + ' commande(s)', cta: 'Écrire', href: waLink(cl.telephone, 'Bonjour ' + first(cl.nom) + ', ton anniversaire approche ! Pour l’occasion, Condesscky Collection t’offre ' + R('remise_fidelite_pourcent') + ' % sur ta prochaine création.') }); }
  });
  var des = n(R('remise_fidelite_des'));
  S.data.clients.forEach(function (cl) { if (cmdsOfClient(cl).length === des - 1) out.push({ ico: '⭐', bg: '#FDF1DC', t: cl.nom + ' : la prochaine sera sa ' + des + 'e commande', d: 'Remise fidélité de ' + R('remise_fidelite_pourcent') + ' % automatique', cta: 'Fiche', href: '#/client/' + cl.id }); });
  prochainesFetes(21).forEach(function (f) { var j = daysBetween(t, f.date); out.push({ ico: '🎉', bg: '#EDE7FB', t: f.nom + (j === 0 ? " aujourd'hui" : ' dans ' + j + ' jours'), d: 'Préparer la pub et le stock', cta: 'Fêtes', href: '#/fetes' }); });
  return out;
}
function messagesWA(c) {
  var nom = first(c.client_nom); var reste = resteFor(c); var paye = paidFor(c.id);
  var L = [
    ['Confirmer la commande', 'Bonjour ' + nom + ', merci pour ta commande chez Condesscky Collection ! 🙏\nCommande ' + c.numero + ' : ' + title(c) + '.\nTotal : ' + fmt(c.total) + (paye ? ' (déjà payé : ' + fmt(paye) + ')' : '') + '.\nSuis ta commande ici : ' + SITE + '/suivi.html'],
    ['En fabrication', 'Bonjour ' + nom + ', bonne nouvelle : ta commande ' + c.numero + ' est en fabrication à l’atelier. Je te préviens dès qu’elle est prête ✨'],
    ['Lien de suivi', 'Bonjour ' + nom + ', voici le lien pour suivre ta commande ' + c.numero + ' à chaque étape :\n' + suiviLien(c)],
    ['Prête (photo)', 'Bonjour ' + nom + ', ta commande ' + c.numero + ' est prête ! Je t’envoie la photo juste après.' + (reste ? '\nReste à payer : ' + fmt(reste) + '.' : '')]
  ];
  if (interieur(c)) {
    L.push(['Colis prêt (intérieur)', 'Bonjour ' + nom + ', ton colis ' + c.numero + ' est prêt (photo juste après). ' + (reste ? 'Merci de faire le dépôt Orange Money de ' + fmt(reste) + ' et de m’envoyer la capture. ' : '') + 'Dès réception, je le remets au chauffeur à la gare' + (c.gare ? ' de ' + c.gare : '') + '.']);
    L.push(['Colis remis au chauffeur', 'Bonjour ' + nom + ', ton colis ' + c.numero + ' est parti 🚐' + (c.gare ? ' depuis la gare de ' + c.gare : '') + '.\nChauffeur : ' + (c.chauffeur_nom || '…') + ' · ' + (c.chauffeur_tel || '…') + '.\nPense à l’appeler pour récupérer ton colis à l’arrivée.' + (n(c.transport_frais) ? '\nTransport à payer au chauffeur : ' + fmt(c.transport_frais) + '.' : '')]);
  } else {
    L.push(['En livraison', 'Bonjour ' + nom + ', ta commande ' + c.numero + ' est en route 🚚. Le livreur t’appelle à l’arrivée.' + (reste ? '\nMontant à remettre : ' + fmt(reste) + ' (espèces ou Orange Money).' : '')]);
  }
  L.push(['Reçu (texte)', recuTexte(c)]);
  L.push(['Merci après livraison', 'Merci ' + nom + ' pour ta confiance 🙏 J’espère que ta création te plaît ! Une photo ou un petit avis nous ferait très plaisir. À bientôt chez Condesscky Collection.']);
  if (reste && ['prete', 'livraison', 'livree'].indexOf(c.statut) >= 0) L.push(['Relance paiement', 'Bonjour ' + nom + ', j’espère que tu vas bien. Petit rappel pour la commande ' + c.numero + ' : il reste ' + fmt(reste) + ' à régler (espèces ou Orange Money). Merci beaucoup 🙏']);
  return L;
}
function recuTexte(c) {
  var L = ['🧾 *Reçu Condesscky Collection*', 'Commande ' + c.numero + ' du ' + dshort(c.created_at), 'Client : ' + c.client_nom, ''];
  (c.articles || []).forEach(function (a) { L.push('• ' + (n(a.qte) > 1 ? a.qte + ' × ' : '') + a.nom + ' : ' + fmtn((n(a.qte) || 1) * n(a.prix))); });
  if (n(c.remise)) L.push('• Remise : − ' + fmtn(c.remise)); if (n(c.supplement_urgent)) L.push('• Urgent : ' + fmtn(c.supplement_urgent)); if (n(c.livraison)) L.push('• Livraison : ' + fmtn(c.livraison));
  L.push('', 'Total : ' + fmt(c.total), 'Payé : ' + fmt(paidFor(c.id)), 'Reste : ' + fmt(resteFor(c)), '', 'Merci ! Condesscky Collection · ' + R('adresse') + ' · +' + R('whatsapp_patron'));
  return L.join('\n');
}

/* ---------------- interface ---------------- */
function navItems() {
  if (S.role === 'livreur') return [['#/', '🚚', 'Livraisons', 'home'], ['#/commandes', '🛍️', 'Commandes', 'cmd'], ['#/menu', '☰', 'Menu', 'menu']];
  if (S.role === 'vendeur') return [['#/', '🏠', 'Accueil', 'home'], ['#/commandes', '🛍️', 'Commandes', 'cmd'], ['#/vente', '+', 'Vente', 'vente'], ['#/taches', '✓', 'Tâches', 'taches'], ['#/menu', '☰', 'Menu', 'menu']];
  return [['#/', '🏠', 'Accueil', 'home'], ['#/commandes', '🛍️', 'Commandes', 'cmd'], ['#/vente', '+', 'Vente', 'vente'], ['#/argent', '💵', 'Argent', 'argent'], ['#/menu', '☰', 'Menu', 'menu']];
}
function nav(active) {
  var it = navItems();
  return '<nav class="bot" aria-label="Menu principal" style="grid-template-columns:repeat(' + it.length + ',1fr)">' + it.map(function (x) {
    var ic = x[1] === '+' ? '<span class="plus" aria-hidden="true">+</span>' : '<span aria-hidden="true" style="font-size:20px">' + x[1] + '</span>';
    var nb = x[3] === 'cmd' && S.data ? vraies().filter(function (c) { return c.statut === 'nouvelle'; }).length : 0;
    return '<a href="' + x[0] + '" class="' + (active === x[3] ? 'on' : '') + '" style="position:relative">' + ic + x[2] + (nb ? '<span style="position:absolute;top:2px;right:18%;background:#D93025;color:#fff;border-radius:10px;font-size:11px;font-weight:800;padding:1px 6px">' + nb + '</span>' : '') + '</a>'; }).join('') + '</nav>';
}
function page(o) {
  var head = o.back ? '<header class="top"><button class="back" aria-label="Retour" onclick="history.back()">‹</button><h1>' + esc(o.title) + '</h1>' + (o.right || '') + '</header>'
    : '<header class="top"><img src="' + LOGO + '" alt="Condesscky Collection"><h1></h1>' + (o.right || '') + '</header>';
  var nq = queue().length;
  var ban = (S.mode === 'demo' ? '<div class="banner demo">Mode essai : les données restent dans ce téléphone seulement.</div>' : '') +
    (navigator.onLine === false ? '<div class="banner off">📶 Pas d’internet : tu peux continuer, tout sera envoyé au retour du réseau' + (nq ? ' (' + nq + ' en attente)' : '') + '.</div>' : (nq ? '<a href="#/sync" class="banner off" style="display:block;text-decoration:none">↻ ' + nq + ' changement(s) en attente d’envoi — toucher pour envoyer</a>' : ''));
  return head + ban + '<main>' + o.body + '</main>' + nav(o.nav);
}
var hooks = [], lastHash = null;
function render(html) { hooks = []; var y = window.scrollY; $app.innerHTML = html; window.scrollTo(0, location.hash === lastHash ? y : 0); lastHash = location.hash; }
function q(s) { return document.querySelector(s); }
function qa(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
function formData(f) { var o = {}; new FormData(f).forEach(function (v, k) { o[k] = v; }); return o; }
async function act(fn, okMsg) { try { await fn(); if (okMsg) toast(okMsg + (queue().length && !navigator.onLine ? ' (envoi au retour d’internet)' : '')); } catch (e) { console.error(e); toast('Erreur : ' + (e.message || e)); throw e; } }
function isPatron() { return S.role === 'patron'; }
function denied() { render(page({ title: 'Accès réservé', back: 1, body: '<div class="empty">Cette page est réservée au patron.</div>', nav: 'menu' })); }

/* ---- Connexion & code PIN ---- */
function vLogin() {
  render('<div class="login"><img src="' + LOGO + '" alt="Condesscky Collection"><div style="text-align:center"><span class="script">Bienvenue</span><div style="font-weight:800;font-size:18px">Condesscky Collection</div></div>' +
    '<form id="f"><label>E-mail<input name="email" type="email" required autocomplete="username"></label><label>Mot de passe<input name="pass" type="password" required autocomplete="current-password"></label>' +
    '<p id="err" style="color:#A32D2D;font-size:13px;margin:0"></p><button class="btn navy" type="submit">Se connecter</button></form>' +
    (S.mode === 'demo' ? '<p class="mut" style="text-align:center">Mode essai : n’importe quel e-mail et mot de passe fonctionnent.</p>' : '') + '</div>');
  q('#f').onsubmit = async function (e) {
    e.preventDefault(); var d = formData(e.target); q('#err').textContent = '';
    try { S.user = await DB.login(d.email, d.pass); await DB.load(); setRole(); location.hash = '#/'; route(); } catch (er) { q('#err').textContent = er.message; }
  };
}
async function sha(t) { try { var b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('condesscky:' + t)); return Array.from(new Uint8Array(b)).map(function (x) { return x.toString(16).padStart(2, '0'); }).join(''); } catch (e) { return t; } }
var locked = false, hiddenAt = 0;
function pinSet() { return !!lsGet('condesscky_pin', null); }
function vPin() {
  locked = true;
  render('<div class="login"><img src="' + LOGO + '" alt=""><div style="text-align:center;font-weight:800;font-size:18px">Code PIN</div>' +
    '<form id="fp"><input name="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="8" style="text-align:center;font-size:26px;letter-spacing:8px" autofocus required><p id="err" style="color:#A32D2D;font-size:13px;margin:0;text-align:center"></p><button class="btn navy" type="submit">Ouvrir</button></form>' +
    '<button class="btn" id="oubli" style="border-width:1px">Code oublié : se reconnecter</button></div>');
  q('#fp').onsubmit = async function (e) { e.preventDefault(); var h = await sha(formData(e.target).pin); if (h === lsGet('condesscky_pin', '')) { locked = false; route(); } else { q('#err').textContent = 'Code incorrect.'; e.target.pin.value = ''; } };
  q('#oubli').onclick = async function () { try { localStorage.removeItem('condesscky_pin'); } catch (e) {} await DB.logout(); S.user = null; locked = false; route(); };
}
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'hidden') hiddenAt = Date.now();
  else if (S.user && pinSet() && hiddenAt && Date.now() - hiddenAt > 5 * 60000) vPin();
});
function setRole() {
  var em = String((S.user && S.user.email) || '').toLowerCase();
  var pe = String(R('patron_email') || '').toLowerCase();
  if (S.mode === 'demo' || !pe || em === pe) { S.role = 'patron'; return; }
  var p = S.data.profils.filter(function (x) { return String(x.email).toLowerCase() === em; })[0];
  S.role = p ? p.role : 'vendeur';
}

/* ---- Accueil ---- */
function cmdRow(c) {
  return '<a class="row" href="#/commande/' + c.id + '"><div class="grow"><span class="t">' + esc(title(c)) + '</span><span class="mut">' + esc(c.client_nom) + ' · ' + esc(SRC[c.source] || c.source) + (c.urgent ? ' · ⚡ urgent' : '') + (n(c.total) ? '' : ' · prix à fixer') + '</span></div>' + chip(c) + '</a>';
}
function rappelRow(r) { var ext = r.href.indexOf('http') === 0; return '<a class="row" href="' + esc(r.href) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '><span class="ico" style="background:' + r.bg + '">' + r.ico + '</span><div class="grow"><span class="t">' + esc(r.t) + '</span><span class="mut">' + esc(r.d) + '</span></div><b style="font-size:12px;color:var(--navy)">' + r.cta + '</b></a>'; }
function vHome() {
  if (S.role === 'livreur') return vLivraisons();
  var t = today(); var b = bilan(t, t); var s = soldesTotaux(); var rp = rappels();
  if (!isPatron()) rp = rp.filter(function (r) { return ['📊', '💰'].indexOf(r.ico) < 0; });
  var enCours = vraies().filter(function (c) { return ['livree', 'annulee'].indexOf(c.statut) < 0; });
  var aValider = vraies().filter(function (c) { return c.statut === 'nouvelle'; }).sort(function (a, b2) { return String(b2.created_at).localeCompare(String(a.created_at)); });
  var valHTML = aValider.length ? '<section class="card" style="border:2px solid var(--or)"><h2>🛒 À valider (' + aValider.length + ')</h2>' + aValider.slice(0, 8).map(function (c) {
      var ph = (c.photos || [])[0], perso = (c.articles || []).map(function (a) { return a.perso; }).filter(Boolean).join(' · ');
      return '<div style="display:flex;gap:10px;padding:10px 0;border-top:1px solid #EEF1F5"><a href="#/commande/' + c.id + '" style="flex:0 0 64px;height:64px;border-radius:10px;background:#F1EEE8;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:24px;text-decoration:none">' + (ph ? '<img data-vph="' + esc(ph.path) + '" alt="Photo du client" style="width:100%;height:100%;object-fit:cover">' : '🎁') + '</a>' +
        '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><b style="font-size:14px">' + esc(title(c)) + '</b>' + (perso ? '<span style="font-size:13px">✏️ ' + esc(perso) + '</span>' : '') +
        '<span class="mut">' + esc(SRC[c.source] || c.source) + (c.quartier ? ' · ' + esc(c.quartier) : '') + ' · ' + (n(c.total) ? fmt(c.total) : 'prix à fixer') + '</span>' +
        '<div class="grid2" style="margin-top:6px"><button class="btn sm navy" data-valider="' + c.id + '" style="width:100%">✓ Valider</button><a class="btn sm" href="#/commande/' + c.id + '" style="width:100%">Voir</a></div></div></div>';
    }).join('') + '</section>' : '';
  var body = valHTML + '<div><span class="mut">' + cap(dlong(t)) + '</span><div style="display:flex;align-items:baseline;gap:8px"><span class="script">Bonjour,</span><b style="font-size:20px">' + (isPatron() ? 'le patron' : esc(first(nomEquipe()))) + '</b></div></div>' +
    (isPatron() ? '<section class="hero" aria-label="Bilan du jour"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:14px">Bilan du jour</b><a href="#/bilan/jour" style="font-size:12px;background:var(--navy2);color:#fff;padding:6px 12px;border-radius:12px;text-decoration:none">' + b.cmds.length + ' vente(s) · Voir</a></div>' +
    '<div><small style="color:#D6E4F5;font-size:12px">Argent du jour (encaissé − dépenses)</small><div class="big">' + fmt(b.solde) + '</div></div>' +
    '<div class="grid2"><div class="tile"><small>Encaissé</small><b>' + fmt(b.encaisse) + '</b></div><div class="tile"><small>Dépenses</small><b>' + fmt(b.depenses) + '</b></div></div></section>' +
    '<section class="card"><h2>Où est l’argent</h2><div class="grid3"><div class="mini"><small>Espèces</small><b>' + fmtn(s.esp) + '</b></div><div class="mini" style="background:var(--cream)"><small style="color:#6B4A06">Orange Money</small><b>' + fmtn(s.om) + '</b></div><a class="mini" href="#/dettes" style="text-decoration:none;color:inherit"><small>À encaisser ›</small><b>' + fmtn(s.aEnc) + '</b></a></div></section>' +
    '<div class="grid2"><a class="btn or" href="#/vente">＋ Nouvelle vente</a><a class="btn" href="#/depense">− Dépense</a></div>' : '<a class="btn or" href="#/vente">＋ Nouvelle vente</a>') +
    '<section class="card"><h2>À ne pas oublier</h2>' + (rp.length ? rp.map(rappelRow).join('') : '<div class="empty">Rien d’urgent. Bonne journée ✨</div>') + '</section>' +
    '<section class="card"><div style="display:flex;justify-content:space-between"><h2>Commandes en cours (' + enCours.length + ')</h2><a href="#/commandes" style="font-size:13px;font-weight:700;color:var(--navy)">Tout voir</a></div>' +
    (enCours.length ? enCours.slice(0, 6).map(cmdRow).join('') : '<div class="empty">Aucune commande en cours.</div>') + '</section>';
  render(page({ body: body, nav: 'home', right: '<a href="#/taches" class="btn sm" style="border-width:1px">✓ Tâches</a>' }));
  var vph = qa('[data-vph]'); if (vph.length) DB.photoUrls(vph.map(function (im) { return im.dataset.vph; })).then(function (u) { vph.forEach(function (im) { if (u[im.dataset.vph]) im.src = u[im.dataset.vph]; }); }).catch(function () {});
  qa('[data-valider]').forEach(function (b2) { b2.onclick = async function () { var id = Number(b2.dataset.valider); b2.disabled = true; await act(function () { return DB.update('commandes', id, { statut: 'confirmee' }); }, 'Commande validée ✓'); S.justSt = id; location.hash = '#/commande/' + id; }; });
}
function nomEquipe() { var em = String((S.user && S.user.email) || '').toLowerCase(); var p = S.data.profils.filter(function (x) { return String(x.email).toLowerCase() === em; })[0]; return (p && p.nom) || em.split('@')[0]; }

/* ---- Livreur ---- */
function vLivraisons() {
  var list = vraies().filter(function (c) { return ['prete', 'livraison'].indexOf(c.statut) >= 0; });
  var body = '<div><span class="mut">' + cap(dlong(today())) + '</span><div style="display:flex;align-items:baseline;gap:8px"><span class="script">Bonjour,</span><b style="font-size:20px">' + esc(first(nomEquipe())) + '</b></div></div>' +
    '<section class="card"><h2>Mes livraisons (' + list.length + ')</h2>' + (list.map(function (c) {
      return '<div style="border-top:1px solid #EEF1F5;padding:10px 0;display:flex;flex-direction:column;gap:6px"><div style="display:flex;justify-content:space-between;gap:8px"><b>' + esc(c.client_nom) + '</b>' + chip(c) + '</div>' +
        '<span class="mut">' + esc([c.quartier, c.ville].filter(Boolean).join(', ')) + ' · ' + esc(title(c)) + '</span><b style="color:' + (resteFor(c) ? 'var(--bad)' : 'var(--ok)') + '">' + (resteFor(c) ? 'À encaisser : ' + fmt(resteFor(c)) : 'Déjà payé') + '</b>' +
        '<div class="grid3"><a class="btn sm" style="width:100%" href="tel:' + esc(c.client_tel || '') + '">Appeler</a><a class="btn sm wa" style="width:100%" target="_blank" rel="noopener" href="' + waLink(c.client_tel, 'Bonjour ' + first(c.client_nom) + ', c’est le livreur de Condesscky Collection, je suis en route avec ta commande.') + '">WhatsApp</a><a class="btn sm" style="width:100%" target="_blank" rel="noopener" href="' + mapsLink(c) + '">Itinéraire</a></div>' +
        '<a class="btn navy sm" style="width:100%" href="#/commande/' + c.id + '">Ouvrir (encaisser, livrée)</a></div>'; }).join('') || '<div class="empty">Aucune livraison pour l’instant.</div>') + '</section>';
  render(page({ body: body, nav: 'home' }));
}

/* ---- Commandes ---- */
var filtreCmd = 'encours', rechCmd = '';
function vCommandes() {
  var fs = [['encours', 'En cours'], ['nouvelle', 'Nouvelles'], ['confirmee', 'Confirmées'], ['fabrication', 'Fabrication'], ['prete', 'Prêtes'], ['livraison', 'Livraison'], ['livree', 'Livrées'], ['devis', 'Devis'], ['annulee', 'Annulées'], ['toutes', 'Toutes']];
  var body = '<input id="r" type="search" placeholder="Chercher un nom, un numéro…" value="' + esc(rechCmd) + '">' +
    '<div class="chips">' + fs.map(function (f) { return '<button data-f="' + f[0] + '" class="' + (filtreCmd === f[0] ? 'on' : '') + '">' + f[1] + '</button>'; }).join('') + '</div>' +
    '<section class="card" id="lst">' + listeCmdHTML() + '</section>';
  render(page({ title: 'Commandes', body: body, nav: 'cmd' }));
  q('#r').oninput = function (e) { rechCmd = e.target.value; q('#lst').innerHTML = listeCmdHTML(); };
  qa('[data-f]').forEach(function (b) { b.onclick = function () { filtreCmd = b.dataset.f; vCommandes(); }; });
}
function listeCmdHTML() {
  var list = S.data.commandes.filter(function (c) {
    if (filtreCmd === 'devis') { if (!isDevis(c)) return false; }
    else { if (isDevis(c) && filtreCmd !== 'toutes') return false;
      if (filtreCmd === 'encours' && ['livree', 'annulee'].indexOf(c.statut) >= 0) return false;
      if (['encours', 'toutes'].indexOf(filtreCmd) < 0 && c.statut !== filtreCmd) return false; }
    if (rechCmd) { var h = (c.client_nom + ' ' + c.client_tel + ' ' + c.numero + ' ' + title(c)).toLowerCase(); if (h.indexOf(rechCmd.toLowerCase()) < 0) return false; }
    return true;
  });
  return (list.length ? list.map(function (c) { return '<a class="row" href="#/commande/' + c.id + '"><div class="grow"><span class="t">' + esc(title(c)) + '</span><span class="mut">' + esc(c.client_nom) + ' · ' + dshort(c.created_at) + ' · ' + (n(c.total) ? fmt(c.total) : 'prix à fixer') + (resteFor(c) ? ' · reste ' + fmtn(resteFor(c)) : '') + '</span></div>' + chip(c) + '</a>'; }).join('') : '<div class="empty">Aucune commande ici.</div>');
}

function vCommande(id) {
  var c = findById('commandes', id); if (!c) { render(page({ title: 'Commande', back: 1, body: '<div class="empty">Commande introuvable.</div>', nav: 'cmd' })); return; }
  var dv = isDevis(c), paid = paidFor(c.id), reste = resteFor(c);
  var pays = S.data.paiements.filter(function (p) { return p.commande_id === c.id; });
  var idx = STATUTS.map(function (s) { return s[0]; }).indexOf(c.statut);
  var next = (!dv && idx >= 0 && idx < 5) ? STATUTS[idx + 1] : null;
  var tel = c.client_tel; var ph = c.photos || [];
  var justPaid = S.justPaid === c.id; S.justPaid = null; var justSt = S.justSt === c.id; S.justSt = null;
  var body = (justSt && !tel && !isDevis(c) ? '<section class="card" style="border:2px solid #1FAF55"><h2>✓ ' + esc(STL[c.statut]) + '</h2><p class="mut" style="margin:0 0 10px">Pour envoyer le lien de suivi au client, ajoute son numéro WhatsApp (celui qui t’a écrit) :</p><form id="ftel" style="gap:8px">' + (c.client_nom === 'Client du site' ? '<input name="nom" placeholder="Nom du client (facultatif)">' : '') + '<input name="tel" type="tel" inputmode="tel" placeholder="6XX XX XX XX" required><button class="btn wa" type="submit">Enregistrer et prévenir le client</button></form></section>' : '') +
    (justSt && tel ? '<section class="card" style="border:2px solid #1FAF55"><h2>✓ ' + esc(STL[c.statut]) + '</h2><p class="mut" style="margin:0 0 10px">Préviens le client : il reçoit le message avec le lien pour suivre sa commande.</p><a class="btn wa" target="_blank" rel="noopener" href="' + waLink(tel, msgStatut(c, c.statut)) + '">Prévenir ' + esc(first(c.client_nom)) + ' sur WhatsApp</a></section>' : '') +
    (c.statut === 'nouvelle' && !dv && !justSt ? '<section class="card" style="border:2px solid var(--or, #F29A00)"><h2>Nouvelle commande</h2><p class="mut" style="margin:0 0 10px">Vérifie la commande puis confirme-la : le client pourra suivre chaque étape.</p><button class="btn navy" id="confirm">✓ Confirmer la commande</button></section>' : '') +
    (justPaid ? '<section class="card" style="border:2px solid #1FAF55"><h2>✓ Paiement enregistré</h2><p class="mut" style="margin:0 0 10px">Donne son reçu au client :</p><div class="grid2"><button class="btn sm or" id="recu2" style="width:100%">🧾 Reçu en image</button>' + (tel ? '<a class="btn sm wa" style="width:100%" target="_blank" rel="noopener" href="' + waLink(tel, recuTexte(c)) + '">Reçu par WhatsApp</a>' : '') + '</div></section>' : '') +
    '<section class="card"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>' + esc(c.numero) + '</b>' + chip(c) + '</div>' +
    '<div class="mut" style="margin-top:4px">' + dshort(c.created_at) + ' · ' + esc(SRC[c.source] || c.source) + (c.urgent ? ' · ⚡ Urgent' : '') + (c.date_livraison ? ' · pour le ' + dshort(c.date_livraison) : '') + '</div>' +
    (dv ? '<p class="mut" style="margin:10px 0 0">C’est un devis : il ne compte pas dans les ventes tant que le client n’a pas accepté.</p><button class="btn navy" id="accept" style="margin-top:10px">✓ Le client accepte : en faire une commande</button>' : '') +
    (!n(c.total) && !dv ? '<p style="margin:10px 0 0;color:var(--bad);font-weight:700;font-size:13px">Prix à fixer : touche « Modifier » pour mettre les prix.</p>' : '') +
    (next ? '<button class="btn navy" id="next" style="margin-top:12px">Passer à : ' + next[1] + '</button>' : '') +
    (!dv ? '<div class="chips" style="margin-top:10px">' + STATUTS.map(function (s) { return '<button data-st="' + s[0] + '" class="' + (c.statut === s[0] ? 'on' : '') + '">' + s[1] + '</button>'; }).join('') + '</div>' : '') +
    (S.role !== 'livreur' ? '<a class="btn sm" href="#/modifier/' + c.id + '" style="width:100%;margin-top:10px">✎ Modifier (articles, prix, livraison)</a>' : '') + '</section>' +
    '<section class="card"><h2>Client</h2><div class="line"><span>' + esc(c.client_nom) + '</span>' + (c.client_id && c.client_id > 0 && S.role !== 'livreur' ? '<a href="#/client/' + c.client_id + '" style="font-size:13px;font-weight:700;color:var(--navy)">Fiche</a>' : '') + '</div>' +
    '<div class="mut">' + esc([tel, c.quartier, c.ville].filter(Boolean).join(' · ')) + '</div>' +
    '<div class="grid3" style="margin-top:10px">' + (tel ? '<a class="btn sm wa" style="width:100%" target="_blank" rel="noopener" href="' + waLink(tel, 'Bonjour ' + first(c.client_nom) + ', ') + '">WhatsApp</a><a class="btn sm" style="width:100%" href="tel:' + esc(tel) + '">Appeler</a>' : '') + '<a class="btn sm" style="width:100%" target="_blank" rel="noopener" href="' + mapsLink(c) + '">Itinéraire</a></div></section>' +
    '<section class="card"><h2>Articles</h2>' + ((c.articles || []).map(function (a) { return '<div class="line"><span>' + (n(a.qte) > 1 ? a.qte + ' × ' : '') + esc(a.nom) + (a.perso ? '<br><span class="mut">' + esc(a.perso) + '</span>' : '') + '</span><b>' + fmtn((n(a.qte) || 1) * n(a.prix)) + '</b></div>'; }).join('') || '<div class="mut">' + esc(c.details || '—') + '</div>') +
    (c.remise ? '<div class="line"><span>Remise</span><b>− ' + fmtn(c.remise) + '</b></div>' : '') +
    (c.supplement_urgent ? '<div class="line"><span>Supplément urgent</span><b>' + fmtn(c.supplement_urgent) + '</b></div>' : '') +
    (c.livraison ? '<div class="line"><span>Livraison</span><b>' + fmtn(c.livraison) + '</b></div>' : '') +
    '<div class="line tot"><span>Total</span><span>' + fmt(c.total) + '</span></div></section>' +
    (!dv ? '<section class="card"><h2>Paiements</h2>' + (pays.map(function (p) { return '<div class="line"><span>' + dshort(p.date) + ' · ' + MODEL[p.mode] + (p.reference ? '<br><span class="mut">Réf. ' + esc(p.reference) + '</span>' : '') + (p.preuve ? '<br><button type="button" class="btn sm" data-preuve="' + esc(p.preuve) + '" style="min-height:32px;margin-top:4px">📎 Voir la preuve</button>' : '') + '</span><b>' + fmtn(p.montant) + '</b></div>'; }).join('') || '<div class="mut">Aucun paiement pour l’instant.</div>') +
    '<div class="line tot"><span>Reste à payer</span><span style="color:' + (reste ? 'var(--bad)' : 'var(--ok)') + '">' + fmt(reste) + '</span></div>' +
    (reste ? '<form id="fp" style="margin-top:8px"><div class="grid2"><label>Montant<input name="montant" type="number" inputmode="numeric" value="' + reste + '" required></label><label>Mode<select name="mode" id="pmode">' + MODES.map(function (m) { return '<option value="' + m[0] + '">' + m[1] + '</option>'; }).join('') + '</select></label></div><label id="pref" hidden>Référence de la transaction Orange Money<input name="reference" placeholder="Ex. PP231117.1234.A12345"></label><label>📎 Capture du dépôt ou photo du reçu <span class="mut">(facultatif)</span><input name="preuve" type="file" accept="image/*"></label><button class="btn or" type="submit">Enregistrer le paiement</button></form>' : '') +
    '<button class="btn sm" id="recu" style="width:100%;margin-top:10px">🧾 Reçu en image (à envoyer au client)</button></section>' : '<a class="btn wa" target="_blank" rel="noopener" href="' + waLink(tel, devisTexte(c)) + '">Envoyer le devis sur WhatsApp</a>') +
    (interieur(c) && !dv ? '<form id="fi" class="card"><h2>Envoi à l’intérieur du pays</h2><div class="grid2"><label>Gare<input name="gare" value="' + esc(c.gare || '') + '" placeholder="Ex. Madina"></label><label>Transport (GNF)<input name="transport_frais" type="number" value="' + esc(c.transport_frais || '') + '"></label></div><div class="grid2"><label>Nom du chauffeur<input name="chauffeur_nom" value="' + esc(c.chauffeur_nom || '') + '"></label><label>Tél. du chauffeur<input name="chauffeur_tel" inputmode="tel" value="' + esc(c.chauffeur_tel || '') + '"></label></div><button class="btn sm" type="submit" style="width:100%">Enregistrer l’envoi</button></form>' : '') +
    '<section class="card"><h2>Photos (' + ph.length + ')</h2><div id="phs" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">' + ph.map(function (p, i) { return '<div style="position:relative"><img data-ph="' + i + '" alt="' + esc(p.type || 'photo') + '" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px;background:var(--bg)"><span class="mut" style="font-size:11px">' + esc(p.type || '') + '</span></div>'; }).join('') + '</div>' +
    '<div class="grid2" style="margin-top:8px"><select id="phtype"><option>Photo du client</option><option>Produit fini</option><option>Colis</option><option>Capture paiement</option></select><label class="btn sm or" style="width:100%;flex-direction:row;cursor:pointer">📷 Ajouter<input id="phin" type="file" accept="image/*" hidden></label></div></section>' +
    (tel ? '<section class="card"><h2>Messages WhatsApp prêts</h2>' + messagesWA(c).map(function (m) { return '<a class="row" target="_blank" rel="noopener" href="' + waLink(tel, m[1]) + '"><span class="ico" style="background:#E3F2E8">💬</span><div class="grow"><span class="t">' + m[0] + '</span><span class="mut" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(m[1].split('\n')[0]) + '</span></div><b style="font-size:12px;color:#1FAF55">Envoyer</b></a>'; }).join('') + '</section>' : '') +
    '<section class="card"><h2>Note de l’atelier</h2><form id="fn"><textarea name="details" placeholder="Couleur, prénom, police, photo reçue…">' + esc(c.details || '') + '</textarea><button class="btn sm" type="submit" style="width:100%">Enregistrer la note</button></form></section>' +
    (isPatron() ? '<button class="btn danger" id="del">Supprimer ' + (dv ? 'le devis' : 'la commande') + '</button>' : '');
  render(page({ title: dv ? 'Devis' : 'Commande', back: 1, body: body, nav: 'cmd' }));
  async function setSt(st) { await act(async function () { var extra = await stockSelonStatut(c, st); return DB.update('commandes', c.id, Object.assign({ statut: st }, extra)); }, 'Statut : ' + STL[st] + (st === 'livree' ? ' · stock mis à jour' : '')); S.justSt = c.id; vCommande(id); }
  if (q('#confirm')) q('#confirm').onclick = function () { setSt('confirmee'); };
  if (q('#ftel')) q('#ftel').onsubmit = async function (e) { e.preventDefault(); var fd = formData(e.target), t = telWa(fd.tel); if (!t || t.length < 11) return toast('Numéro incomplet'); var up = { client_tel: t }; if (fd.nom && fd.nom.trim()) up.client_nom = fd.nom.trim(); await act(function () { return DB.update('commandes', c.id, up); }, 'Numéro enregistré'); S.justSt = c.id; vCommande(id); };
  if (q('#next')) q('#next').onclick = function () { setSt(next[0]); };
  qa('[data-st]').forEach(function (b) { b.onclick = function () { setSt(b.dataset.st); }; });
  if (q('#accept')) q('#accept').onclick = async function () { await act(async function () { await DB.update('commandes', c.id, { type: 'commande', statut: 'nouvelle' }); }, 'Devis accepté : c’est une commande'); vCommande(id); };
  if (q('#pmode')) q('#pmode').onchange = function (e) { q('#pref').hidden = e.target.value !== 'orange_money'; };
  if (q('#fp')) q('#fp').onsubmit = async function (e) { e.preventDefault(); var d = formData(e.target); if (n(d.montant) <= 0) return toast('Montant invalide'); var bt = e.target.querySelector('button[type=submit]'); bt.disabled = true; bt.textContent = 'Enregistrement…'; var preuve = await envoiPreuve(e.target.preuve.files[0]); await act(function () { return DB.insert('paiements', { commande_id: c.id, montant: n(d.montant), mode: d.mode, reference: d.mode === 'orange_money' && d.reference ? d.reference.trim() : null, preuve: preuve, date: new Date().toISOString() }); }, 'Paiement enregistré'); S.justPaid = c.id; vCommande(id); };
  if (q('#recu')) q('#recu').onclick = function () { recuImage(c); };
  if (q('#recu2')) q('#recu2').onclick = function () { recuImage(c); };
  qa('[data-preuve]').forEach(function (b) { b.onclick = function () { voirPreuve(b.dataset.preuve); }; });
  if (q('#fi')) q('#fi').onsubmit = async function (e) { e.preventDefault(); var d = formData(e.target); await act(function () { return DB.update('commandes', c.id, { gare: d.gare || null, transport_frais: n(d.transport_frais), chauffeur_nom: d.chauffeur_nom || null, chauffeur_tel: d.chauffeur_tel || null }); }, 'Envoi enregistré'); vCommande(id); };
  q('#fn').onsubmit = async function (e) { e.preventDefault(); await act(function () { return DB.update('commandes', c.id, { details: formData(e.target).details }); }, 'Note enregistrée'); };
  if (q('#del')) q('#del').onclick = async function () { if (!confirm('Supprimer définitivement ' + c.numero + ' et ses paiements ?')) return; await act(function () { return DB.remove('commandes', c.id); }, 'Supprimé'); S.data.paiements = S.data.paiements.filter(function (p) { return p.commande_id !== c.id; }); location.hash = '#/commandes'; };
  // photos
  if (ph.length) DB.photoUrls(ph.map(function (p) { return p.path; })).then(function (urls) { ph.forEach(function (p, i) { var im = q('[data-ph="' + i + '"]'); if (im && urls[p.path]) { im.src = urls[p.path]; im.onclick = function () { photoViewer(c, i, urls[p.path]); }; } }); }).catch(function () {});
  q('#phin').onchange = async function (e) {
    var f = e.target.files[0]; if (!f) return;
    if (S.mode === 'sb' && !navigator.onLine) return toast('Il faut internet pour ajouter une photo');
    try { toast('Envoi de la photo…'); var blob = await compress(f, S.mode === 'demo' ? 700 : 1600); var path = await DB.uploadPhoto(c.id, blob);
      var list = (c.photos || []).concat([{ path: path, type: q('#phtype').value, date: new Date().toISOString() }]);
      await act(function () { return DB.update('commandes', c.id, { photos: list }); }, 'Photo ajoutée'); vCommande(id);
    } catch (er) { toast('Erreur photo : ' + (er.message || er)); }
  };
}
function photoViewer(c, i, url) {
  var p = c.photos[i];
  var w = document.createElement('div'); w.style.cssText = 'position:fixed;inset:0;background:rgba(10,20,40,.92);z-index:30;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px';
  w.innerHTML = '<img src="' + url + '" style="max-width:100%;max-height:70vh;border-radius:12px"><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button class="btn sm wa" id="pvs">Envoyer au client</button>' + (isPatron() ? '<button class="btn sm danger" id="pvd" style="background:#fff">Supprimer</button>' : '') + '<button class="btn sm" id="pvc" style="background:#fff">Fermer</button></div>';
  document.body.appendChild(w);
  w.querySelector('#pvc').onclick = function () { w.remove(); };
  w.querySelector('#pvs').onclick = async function () { try { var b = await (await fetch(url)).blob(); var file = new File([b], c.numero + '.jpg', { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], text: 'Condesscky Collection · ' + c.numero }); else { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = c.numero + '.jpg'; a.click(); toast('Photo téléchargée : envoie-la sur WhatsApp'); } } catch (e) {} };
  if (w.querySelector('#pvd')) w.querySelector('#pvd').onclick = async function () { if (!confirm('Supprimer cette photo ?')) return; var list = c.photos.filter(function (_, k) { return k !== i; }); try { await DB.removePhoto(p.path); } catch (e) {} await act(function () { return DB.update('commandes', c.id, { photos: list }); }, 'Photo supprimée'); w.remove(); vCommande(c.id); };
}
function devisTexte(c) {
  var L = ['📄 *Devis Condesscky Collection*', 'N° ' + c.numero + ' du ' + dshort(c.created_at), 'Pour : ' + c.client_nom, ''];
  (c.articles || []).forEach(function (a) { L.push('• ' + (n(a.qte) || 1) + ' × ' + a.nom + (a.perso ? ' (' + a.perso + ')' : '') + ' : ' + fmtn(a.prix) + ' l’unité = ' + fmtn((n(a.qte) || 1) * n(a.prix))); });
  if (n(c.remise)) L.push('• Remise : − ' + fmtn(c.remise)); if (n(c.supplement_urgent)) L.push('• Urgent : ' + fmtn(c.supplement_urgent)); if (n(c.livraison)) L.push('• Livraison : ' + fmtn(c.livraison));
  L.push('', '*Total : ' + fmt(c.total) + '*', 'Acompte pour lancer la fabrication : ' + R('acompte_pourcent') + ' % (' + fmt(Math.round(n(c.total) * n(R('acompte_pourcent')) / 100)) + ')', 'Devis valable 15 jours.', '', 'Condesscky Collection · ' + R('adresse') + ' · +' + R('whatsapp_patron'));
  return L.join('\n');
}
function recuImage(c) {
  var arts = c.articles || []; var W = 900, H = 520 + arts.length * 56 + 260;
  var cv = document.createElement('canvas'); cv.width = W; cv.height = H; var g = cv.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.fillStyle = '#0E4C8F'; g.fillRect(0, 0, W, 16); g.fillStyle = '#EE9F16'; g.fillRect(0, 16, W, 6);
  var img = new Image(); img.onload = draw; img.onerror = draw; img.src = LOGO;
  function T(t, x, y, f, col, al) { g.font = f; g.fillStyle = col || '#14233A'; g.textAlign = al || 'left'; g.fillText(t, x, y); }
  function draw() {
    try { if (img.width) { var h = 120, w = img.width * h / img.height; g.drawImage(img, 50, 50, w, h); } } catch (e) {}
    T('REÇU', W - 50, 100, '800 44px Montserrat, sans-serif', '#0E4C8F', 'right'); T(c.numero, W - 50, 140, '600 24px Montserrat, sans-serif', '#5A6B82', 'right'); T(dshort(new Date()) + ' ' + new Date().getFullYear(), W - 50, 172, '500 22px Montserrat, sans-serif', '#5A6B82', 'right');
    var y = 240; T('Client', 50, y, '600 22px Montserrat, sans-serif', '#5A6B82'); T(c.client_nom + (c.client_tel ? '  ·  +' + telWa(c.client_tel) : ''), 50, y + 34, '700 28px Montserrat, sans-serif');
    y += 90; g.fillStyle = '#E1E6EE'; g.fillRect(50, y, W - 100, 2); y += 46;
    arts.forEach(function (a) { var lib = (n(a.qte) > 1 ? a.qte + ' × ' : '') + a.nom; if (lib.length > 42) lib = lib.slice(0, 41) + '…'; T(lib, 50, y, '500 26px Montserrat, sans-serif'); T(fmtn((n(a.qte) || 1) * n(a.prix)), W - 50, y, '700 26px Montserrat, sans-serif', '#14233A', 'right'); y += 56; });
    [['Remise', -n(c.remise)], ['Urgent', n(c.supplement_urgent)], ['Livraison', n(c.livraison)]].forEach(function (r) { if (r[1]) { T(r[0], 50, y, '500 24px Montserrat, sans-serif', '#5A6B82'); T((r[1] < 0 ? '− ' : '') + fmtn(Math.abs(r[1])), W - 50, y, '600 24px Montserrat, sans-serif', '#5A6B82', 'right'); y += 46; } });
    g.fillStyle = '#E1E6EE'; g.fillRect(50, y - 20, W - 100, 2); y += 30;
    T('Total', 50, y, '800 32px Montserrat, sans-serif'); T(fmt(c.total), W - 50, y, '800 32px Montserrat, sans-serif', '#14233A', 'right'); y += 52;
    T('Payé', 50, y, '600 26px Montserrat, sans-serif', '#145A32'); T(fmt(paidFor(c.id)), W - 50, y, '700 26px Montserrat, sans-serif', '#145A32', 'right'); y += 46;
    var r = resteFor(c); T('Reste à payer', 50, y, '600 26px Montserrat, sans-serif', r ? '#A32D2D' : '#145A32'); T(fmt(r), W - 50, y, '700 26px Montserrat, sans-serif', r ? '#A32D2D' : '#145A32', 'right'); y += 70;
    T('Merci pour votre confiance !', W / 2, y, '700 26px Montserrat, sans-serif', '#EE9F16', 'center'); y += 40;
    T(String(R('adresse')), W / 2, y, '500 20px Montserrat, sans-serif', '#5A6B82', 'center'); T('WhatsApp +' + R('whatsapp_patron') + '  ·  condessckycollection.github.io', W / 2, y + 30, '500 20px Montserrat, sans-serif', '#5A6B82', 'center');
    cv.toBlob(async function (b) {
      var file = new File([b], 'Recu-' + c.numero + '.png', { type: 'image/png' });
      try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: 'Reçu ' + c.numero }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
      var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); toast('Reçu téléchargé : envoie-le sur WhatsApp');
    }, 'image/png');
  }
}
function sansAccent(x) { return String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function produitStock(a) {
  if (a.produit_id) return findById('produits', a.produit_id);
  var t = sansAccent(a.nom), L = S.data.produits;
  function par(mot) { return L.filter(function (p) { return p.suivi_stock && sansAccent(p.nom).indexOf(mot) >= 0; })[0] || null; }
  if (/carnet|pochette|portefeuille/.test(t)) return par('pochette');
  if (t.indexOf('diamant') >= 0) return par('diamant');
  if (t.indexOf('gourde') >= 0) return L.filter(function (p) { return p.suivi_stock && sansAccent(p.nom).indexOf('gourde') >= 0 && sansAccent(p.nom).indexOf('diamant') < 0; })[0] || null;
  if (t.indexOf('coque') >= 0) return par('coque');
  var best = null, sc = 0;
  L.forEach(function (p) { if (!p.suivi_stock) return; var m = sansAccent(p.nom).split(/[^a-z0-9]+/).filter(function (w) { return w.length > 3 && t.indexOf(w.replace(/s$/, '')) >= 0; }).length; if (m > sc) { sc = m; best = p; } });
  return best;
}
async function baisserStock(arts, signe) {
  signe = signe || -1;
  for (var i = 0; i < (arts || []).length; i++) { var a = arts[i]; var p = produitStock(a); if (p && p.suivi_stock) { p = findById('produits', p.id); await DB.update('produits', p.id, { stock: Math.max(0, n(p.stock) + signe * (n(a.qte) || 1)) }); } }
}
// Le stock sort quand la commande est livrée (une seule fois), et revient si on annule ou si on revient en arrière
async function stockSelonStatut(c, st) {
  if (isDevis(c)) return {};
  if (st === 'livree' && !c.stock_sorti) { await baisserStock(c.articles, -1); return { stock_sorti: true }; }
  if (st !== 'livree' && c.stock_sorti) { await baisserStock(c.articles, +1); return { stock_sorti: false }; }
  return {};
}

/* ---- Nouvelle vente / modification / devis ---- */
var V = null;
function newVente() { V = { editId: null, type: 'commande', client_nom: '', client_tel: '', quartier: '', ville: 'Conakry', source: 'boutique', urgent: false, livr: 'conakry', gare: '', date_livraison: '', articles: [], acompte: '', mode: 'especes', reference: '', details: '', tarifPro: false, remiseFixe: null }; }
function editVente(c) {
  V = { editId: c.id, type: c.type || 'commande', client_nom: c.client_nom || '', client_tel: c.client_tel || '', quartier: c.quartier || '', ville: c.ville || 'Conakry', source: c.source, urgent: !!c.urgent,
    livr: n(c.livraison) > 0 ? 'conakry' : (interieur(c) ? 'interieur' : 'retrait'), gare: c.gare || '', date_livraison: c.date_livraison || '', articles: JSON.parse(JSON.stringify(c.articles || [])),
    acompte: '', mode: 'especes', reference: '', details: c.details || '', tarifPro: false, remisePct: n(c.sous_total) ? Math.round(n(c.remise) / n(c.sous_total) * 100) : 0, orig: c };
}
function venteCalc() {
  var st = V.articles.reduce(function (a, x) { return a + (n(x.qte) || 1) * n(x.prix); }, 0);
  var qte = V.articles.reduce(function (a, x) { return a + (n(x.qte) || 1); }, 0);
  var cl = S.data.clients.filter(function (c) { return V.client_tel && telWa(c.telephone) === telWa(V.client_tel); })[0];
  var nb = cl ? cmdsOfClient(cl).filter(function (c) { return c.id !== V.editId; }).length : 0;
  var des = n(R('remise_fidelite_des'));
  var fid = !V.editId && V.type !== 'devis' && cl && (nb + 1) % des === 0;
  var pct = V.editId ? V.remisePct : 0; var why = V.editId && pct ? 'Remise' : '';
  if (fid && n(R('remise_fidelite_pourcent')) > pct) { pct = n(R('remise_fidelite_pourcent')); why = 'Remise fidélité'; }
  if (V.tarifPro && remiseQte(qte) > pct) { pct = remiseQte(qte); why = 'Remise quantité (' + qte + ' pièces)'; }
  var remise = Math.round(st * pct / 100);
  var urg = V.urgent ? n(R('supplement_urgent')) : 0;
  var liv = V.livr === 'conakry' ? n(R('livraison_conakry')) : 0;
  return { st: st, qte: qte, pct: pct, why: why, remise: remise, urg: urg, liv: liv, total: st - remise + urg + liv, fid: fid, nb: nb, cl: cl };
}
function vVente() {
  if (!V || (V.editId && location.hash.indexOf('#/modifier') !== 0)) newVente();
  var k = venteCalc(); var ed = !!V.editId;
  var prods = S.data.produits.filter(function (p) { return p.actif !== false; });
  var body = '<form id="fv">' +
    (!ed ? '<div class="chips"><button type="button" data-ty="commande" class="' + (V.type === 'commande' ? 'on' : '') + '">Vente / commande</button><button type="button" data-ty="devis" class="' + (V.type === 'devis' ? 'on' : '') + '">Devis (entreprise, école…)</button></div>' : '') +
    '<section class="card" style="display:flex;flex-direction:column;gap:10px"><h2>Client</h2>' +
    '<label>Téléphone (WhatsApp)<input name="client_tel" inputmode="tel" list="tels" value="' + esc(V.client_tel) + '" placeholder="6XX XX XX XX"></label>' +
    '<datalist id="tels">' + S.data.clients.map(function (c) { return '<option value="' + esc(c.telephone || '') + '">' + esc(c.nom) + '</option>'; }).join('') + '</datalist>' +
    '<label>Nom' + (V.type === 'devis' ? ' (ou entreprise / école)' : '') + '<input name="client_nom" required value="' + esc(V.client_nom) + '"></label>' +
    '<div class="grid2"><label>Quartier<input name="quartier" value="' + esc(V.quartier) + '"></label><label>Ville<input name="ville" value="' + esc(V.ville) + '"></label></div>' +
    (k.cl ? '<div class="mut">Client connu : ' + k.nb + ' commande(s) déjà.' + (k.fid ? ' <b style="color:var(--ok)">⭐ Remise fidélité appliquée.</b>' : '') + '</div>' : '') +
    '<label>Venu par<select name="source">' + SOURCES.map(function (s) { return '<option value="' + s[0] + '"' + (V.source === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></label></section>' +
    '<section class="card" style="display:flex;flex-direction:column;gap:10px"><h2>Articles</h2>' +
    V.articles.map(function (a, i) { return '<div class="art"><div style="display:flex;justify-content:space-between;gap:8px">' + (a.libre ? '<input data-nom="' + i + '" value="' + esc(a.nom) + '" placeholder="Nom de l’article (ex. Porte-clés)">' : '<b style="font-size:14px">' + esc(a.nom) + '</b>') + '<button type="button" class="btn sm danger" data-rm="' + i + '" style="min-height:30px;padding:0 10px">✕</button></div><div class="grid2"><label>Quantité<input type="number" min="1" data-qte="' + i + '" value="' + a.qte + '"></label><label>Prix unitaire<input type="number" data-prix="' + i + '" value="' + a.prix + '"></label></div><label>Personnalisation<input data-perso="' + i + '" value="' + esc(a.perso || '') + '" placeholder="Prénom, couleur, modèle…"></label></div>'; }).join('') +
    '<label>Ajouter un article<select id="addp"><option value="">— Choisir un produit —</option>' + prods.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nom) + ' · ' + fmtn(p.prix) + (p.suivi_stock ? ' (stock ' + n(p.stock) + ')' : '') + '</option>'; }).join('') + '<option value="libre">Autre article (texte libre)</option></select></label>' +
    '<label class="check"><input type="checkbox" name="tarifPro"' + (V.tarifPro ? ' checked' : '') + '> Tarif entreprise / école (−10 % dès 10, −15 % dès 50, −20 % dès 100 pièces)</label></section>' +
    '<section class="card" style="display:flex;flex-direction:column;gap:10px"><h2>Livraison</h2>' +
    '<label>Mode<select name="livr"><option value="conakry"' + (V.livr === 'conakry' ? ' selected' : '') + '>Livraison Conakry (' + fmtn(R('livraison_conakry')) + ')</option><option value="interieur"' + (V.livr === 'interieur' ? ' selected' : '') + '>Intérieur du pays (transport payé au chauffeur)</option><option value="retrait"' + (V.livr === 'retrait' ? ' selected' : '') + '>Retrait à l’atelier</option></select></label>' +
    (V.livr === 'interieur' ? '<label>Gare de départ<input name="gare" value="' + esc(V.gare) + '" placeholder="Ex. Madina"></label>' : '') +
    '<label>Date de livraison<input type="date" name="date_livraison" value="' + esc(V.date_livraison) + '"></label>' +
    '<label class="check"><input type="checkbox" name="urgent"' + (V.urgent ? ' checked' : '') + '> ⚡ Urgent 24 h (+ ' + fmtn(R('supplement_urgent')) + ')</label>' +
    '<label>Note pour l’atelier<textarea name="details">' + esc(V.details) + '</textarea></label></section>' +
    '<section class="card"><h2>Total</h2><div class="line"><span>Articles (' + k.qte + ')</span><b>' + fmtn(k.st) + '</b></div>' +
    (k.remise ? '<div class="line"><span>' + esc(k.why) + ' ' + k.pct + ' %</span><b>− ' + fmtn(k.remise) + '</b></div>' : '') +
    (k.urg ? '<div class="line"><span>Supplément urgent</span><b>' + fmtn(k.urg) + '</b></div>' : '') +
    (k.liv ? '<div class="line"><span>Livraison</span><b>' + fmtn(k.liv) + '</b></div>' : '') +
    '<div class="line tot"><span>Total</span><span>' + fmt(k.total) + '</span></div>' +
    (!ed && V.type !== 'devis' ? '<div class="grid2" style="margin-top:10px"><label>Payé maintenant<input name="acompte" type="number" inputmode="numeric" value="' + esc(V.acompte) + '" placeholder="Acompte ' + R('acompte_pourcent') + ' % = ' + fmtn(Math.round(k.total * n(R('acompte_pourcent')) / 100)) + '"></label><label>Mode<select name="mode">' + MODES.map(function (m) { return '<option value="' + m[0] + '"' + (V.mode === m[0] ? ' selected' : '') + '>' + m[1] + '</option>'; }).join('') + '</select></label></div>' +
    (V.mode === 'orange_money' ? '<label style="margin-top:8px">Référence Orange Money<input name="reference" value="' + esc(V.reference) + '"></label>' : '') +
    '<div class="grid2" style="margin-top:8px"><button type="button" class="btn sm" id="ac50" style="width:100%">Acompte ' + R('acompte_pourcent') + ' %</button><button type="button" class="btn sm" id="ac100" style="width:100%">Tout payé</button></div>' : '') + '</section>' +
    '<button class="btn or" type="submit">' + (ed ? 'Enregistrer les modifications' : V.type === 'devis' ? 'Enregistrer le devis' : 'Enregistrer la vente') + '</button></form>';
  render(page({ title: ed ? 'Modifier ' + (V.type === 'devis' ? 'le devis' : 'la commande') : (V.type === 'devis' ? 'Nouveau devis' : 'Nouvelle vente'), back: 1, body: body, nav: 'vente' }));
  var f = q('#fv');
  function sync() { var d = formData(f); ['client_nom', 'quartier', 'ville', 'source', 'livr', 'date_livraison', 'acompte', 'mode', 'details', 'reference', 'gare'].forEach(function (x) { if (d[x] != null) V[x] = d[x]; }); V.client_tel = (d.client_tel || '').trim(); V.urgent = !!f.urgent.checked; V.tarifPro = !!f.tarifPro.checked;
    qa('[data-qte]').forEach(function (e) { V.articles[e.dataset.qte].qte = n(e.value) || 1; });
    qa('[data-prix]').forEach(function (e) { V.articles[e.dataset.prix].prix = n(e.value); });
    qa('[data-perso]').forEach(function (e) { V.articles[e.dataset.perso].perso = e.value; });
    qa('[data-nom]').forEach(function (e) { V.articles[e.dataset.nom].nom = e.value; }); }
  f.addEventListener('change', function (e) {
    sync();
    var redraw = e.target.tagName === 'SELECT' || e.target.type === 'checkbox' || e.target.dataset.qte != null || e.target.dataset.prix != null;
    if (e.target.name === 'client_tel') { var cl = S.data.clients.filter(function (c) { return V.client_tel && telWa(c.telephone) === telWa(V.client_tel); })[0]; if (cl) { V.client_nom = cl.nom; V.quartier = cl.quartier || ''; V.ville = cl.ville || 'Conakry'; redraw = true; } }
    if (e.target.id === 'addp' && e.target.value) { var v = e.target.value; if (v === 'libre') { V.articles.push({ produit_id: null, nom: '', libre: true, qte: 1, prix: 0, perso: '' }); } else { var p = findById('produits', Number(v)); V.articles.push({ produit_id: p.id, nom: p.nom, qte: 1, prix: n(p.prix), perso: '' }); } }
    if (e.target.name === 'livr' && V.livr === 'interieur' && /conakry/i.test(V.ville)) V.ville = '';
    if (redraw) vVente();
  });
  qa('[data-ty]').forEach(function (b) { b.onclick = function () { sync(); V.type = b.dataset.ty; if (V.type === 'devis') V.tarifPro = true; vVente(); }; });
  qa('[data-rm]').forEach(function (b) { b.onclick = function () { sync(); V.articles.splice(Number(b.dataset.rm), 1); vVente(); }; });
  if (q('#ac50')) q('#ac50').onclick = function () { sync(); V.acompte = String(Math.round(venteCalc().total * n(R('acompte_pourcent')) / 100)); vVente(); };
  if (q('#ac100')) q('#ac100').onclick = function () { sync(); V.acompte = String(venteCalc().total); vVente(); };
  f.onsubmit = async function (e) {
    e.preventDefault(); sync(); var k2 = venteCalc();
    if (!V.articles.length) return toast('Ajoute au moins un article');
    if (V.articles.some(function (a) { return !String(a.nom).trim(); })) return toast('Écris le nom de l’article');
    V.articles.forEach(function (a) { delete a.libre; });
    if (V.livr === 'interieur' && !V.ville.trim()) return toast('Indique la ville de destination');
    var row = { client_nom: V.client_nom.trim(), client_tel: telWa(V.client_tel) || null, quartier: V.quartier || null, ville: V.ville || 'Conakry', source: V.source, urgent: V.urgent,
      date_livraison: V.date_livraison || null, articles: V.articles, sous_total: k2.st, remise: k2.remise, supplement_urgent: k2.urg, livraison: k2.liv, total: k2.total, details: V.details || null, gare: V.livr === 'interieur' ? (V.gare || null) : null };
    if (k2.cl) row.client_id = k2.cl.id;
    var c;
    try {
      await act(async function () {
        if (V.editId) {
          var o = V.orig; c = o;
          if (o.stock_sorti) { await baisserStock(o.articles, +1); }
          await DB.update('commandes', o.id, row);
          if (o.stock_sorti) await baisserStock(V.articles, -1);
        } else {
          row.numero = numero(); row.statut = 'nouvelle'; row.type = V.type;
          c = await DB.insert('commandes', row);
          if (V.type !== 'devis') {
            if (n(V.acompte) > 0) await DB.insert('paiements', { commande_id: c.id, montant: n(V.acompte), mode: V.mode, reference: V.mode === 'orange_money' && V.reference ? V.reference : null, date: new Date().toISOString() });
          }
        }
      }, V.editId ? 'Modifications enregistrées ✓' : (V.type === 'devis' ? 'Devis enregistré ✓' : 'Vente enregistrée ✓'));
    } catch (er) { return; }
    var go = c.id; if (!V.editId && V.type !== 'devis' && n(V.acompte) > 0) S.justPaid = go; V = null; location.hash = '#/commande/' + go;
  };
}

/* ---- Tâches du jour ---- */
function vTaches() {
  var t = today(); var dem = addDays(t, 1);
  var afab = vraies().filter(function (c) { return ['nouvelle', 'confirmee', 'fabrication'].indexOf(c.statut) >= 0; }).sort(function (a, b) { return (b.urgent - a.urgent) || String(a.date_livraison || '9').localeCompare(String(b.date_livraison || '9')); });
  var aliv = vraies().filter(function (c) { return ['prete', 'livraison'].indexOf(c.statut) >= 0; });
  var perso = S.data.taches.filter(function (x) { return x.jour <= t && (!x.fait || x.jour === t); });
  function cr(c) { var late = c.date_livraison && c.date_livraison <= dem; return '<a class="row" href="#/commande/' + c.id + '"><span class="ico" style="background:' + (c.urgent || late ? '#FDE2E2' : '#DCE8F7') + '">' + (c.urgent ? '⚡' : '🛠️') + '</span><div class="grow"><span class="t">' + esc(title(c)) + '</span><span class="mut">' + esc(c.client_nom) + (c.date_livraison ? ' · pour le ' + dshort(c.date_livraison) : '') + '</span></div>' + chip(c) + '</a>'; }
  var body = '<div class="mut">' + cap(dlong(t)) + '</div>' +
    '<section class="card"><h2>À fabriquer (' + afab.length + ')</h2>' + (afab.map(cr).join('') || '<div class="empty">Rien à fabriquer.</div>') + '</section>' +
    '<section class="card"><h2>À livrer (' + aliv.length + ')</h2>' + (aliv.map(function (c) { return '<a class="row" href="#/commande/' + c.id + '"><span class="ico" style="background:#DCE8F7">' + (interieur(c) ? '🚐' : '🚚') + '</span><div class="grow"><span class="t">' + esc(c.client_nom) + ' · ' + esc(c.quartier || c.ville || '') + '</span><span class="mut">' + esc(title(c)) + (resteFor(c) ? ' · à encaisser ' + fmtn(resteFor(c)) : ' · payé') + '</span></div>' + chip(c) + '</a>'; }).join('') || '<div class="empty">Rien à livrer.</div>') + '</section>' +
    '<section class="card"><h2>Mes tâches</h2>' + perso.map(function (x) { return '<label class="row check" style="cursor:pointer"><input type="checkbox" data-tk="' + x.id + '"' + (x.fait ? ' checked' : '') + '><span class="grow" style="' + (x.fait ? 'text-decoration:line-through;color:var(--mut)' : '') + '">' + esc(x.titre) + (x.jour < t ? ' <span class="mut">(' + dshort(x.jour) + ')</span>' : '') + '</span></label>'; }).join('') +
    '<form id="ft" style="flex-direction:row;margin-top:8px"><input name="titre" placeholder="Ajouter une tâche…" required><button class="btn sm or" type="submit">＋</button></form></section>';
  render(page({ title: 'Tâches du jour', back: 1, body: body, nav: 'taches' }));
  qa('[data-tk]').forEach(function (b) { b.onchange = async function () { await act(function () { return DB.update('taches', Number(b.dataset.tk), { fait: b.checked }); }); vTaches(); }; });
  q('#ft').onsubmit = async function (e) { e.preventDefault(); await act(function () { return DB.insert('taches', { titre: formData(e.target).titre, jour: t, fait: false }); }); vTaches(); };
}

/* ---- Argent ---- */
var perArg = 'jour';
function vArgent() {
  if (!isPatron()) return denied();
  var p = periode(perArg); var b = bilan(p[0], p[1]); var s = soldesTotaux();
  var mv = [];
  S.data.paiements.filter(function (x) { return inPeriod(x.date, p[0], p[1]); }).forEach(function (x) { var c = findById('commandes', x.commande_id); mv.push({ d: x.date, plus: true, m: x.montant, t: c ? c.client_nom + ' · ' + title(c) : (x.note || 'Entrée d’argent'), s: MODEL[x.mode] + (x.reference ? ' · ' + x.reference : '') + (x.preuve ? ' · 📎 preuve' : ''), h: c ? '#/commande/' + c.id : '' }); });
  S.data.depenses.filter(function (x) { return inPeriod(x.date, p[0], p[1]); }).forEach(function (x) { mv.push({ d: x.date, plus: false, m: x.montant, t: DEPL[x.categorie] + (x.note ? ' · ' + x.note : ''), s: MODEL[x.mode], id: x.id }); });
  mv.sort(function (a, b2) { return String(b2.d).localeCompare(String(a.d)); });
  var body = '<div class="chips">' + [['jour', "Aujourd'hui"], ['semaine', 'Semaine'], ['mois', 'Mois']].map(function (x) { return '<button data-p="' + x[0] + '" class="' + (perArg === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
    '<section class="hero"><small style="color:#D6E4F5">Encaissé − dépenses (' + p[2] + ')</small><div class="big">' + fmt(b.solde) + '</div><div class="grid2"><div class="tile"><small>Encaissé</small><b>' + fmt(b.encaisse) + '</b></div><div class="tile"><small>Dépenses</small><b>' + fmt(b.depenses) + '</b></div></div></section>' +
    '<section class="card"><h2>Caisse totale</h2><div class="grid3"><div class="mini"><small>Espèces</small><b>' + fmtn(s.esp) + '</b></div><div class="mini" style="background:var(--cream)"><small style="color:#6B4A06">Orange Money</small><b>' + fmtn(s.om) + '</b></div><a class="mini" href="#/dettes" style="text-decoration:none;color:inherit"><small>À encaisser ›</small><b>' + fmtn(s.aEnc) + '</b></a></div></section>' +
    '<div class="grid2"><a class="btn or" href="#/encaisser">+ Encaisser</a><a class="btn" href="#/depense">− Dépense</a></div><a class="btn navy" href="#/bilan/' + perArg + '" style="width:100%">Bilan</a><a class="btn sm" href="#/dettes" style="width:100%">Qui me doit de l’argent ?</a>' +
    '<section class="card"><h2>Mouvements</h2>' + (mv.map(function (m) { return '<' + (m.h ? 'a href="' + m.h + '"' : 'div') + ' class="row"' + (m.id ? ' data-dep="' + m.id + '"' : '') + '><span class="ico" style="background:' + (m.plus ? '#E3F2E8' : '#FDE2E2') + '">' + (m.plus ? '↓' : '↑') + '</span><div class="grow"><span class="t">' + esc(m.t) + '</span><span class="mut">' + dshort(m.d) + ' · ' + esc(m.s) + '</span></div><b style="color:' + (m.plus ? 'var(--ok)' : 'var(--bad)') + '">' + (m.plus ? '+' : '−') + fmtn(m.m) + '</b></' + (m.h ? 'a' : 'div') + '>'; }).join('') || '<div class="empty">Aucun mouvement.</div>') + '</section>';
  render(page({ title: 'Argent', body: body, nav: 'argent' }));
  qa('[data-p]').forEach(function (b2) { b2.onclick = function () { perArg = b2.dataset.p; vArgent(); }; });
  qa('[data-dep]').forEach(function (r) { r.onclick = async function () { if (!confirm('Supprimer cette dépense ?')) return; await act(function () { return DB.remove('depenses', Number(r.dataset.dep)); }, 'Dépense supprimée'); vArgent(); }; });
}
function vDettes() {
  if (!isPatron()) return denied();
  var by = {};
  vraies().forEach(function (c) { var r = resteFor(c); if (!r) return; var k = c.client_id || c.client_tel || c.client_nom; (by[k] = by[k] || { nom: c.client_nom, tel: c.client_tel, total: 0, cmds: [] }); by[k].total += r; by[k].cmds.push(c); });
  var L = Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.total - a.total; });
  var tot = L.reduce(function (a, x) { return a + x.total; }, 0);
  var body = '<section class="hero"><small style="color:#D6E4F5">Total à encaisser</small><div class="big">' + fmt(tot) + '</div><small style="color:#D6E4F5">' + L.length + ' client(s)</small></section>' +
    '<section class="card">' + (L.map(function (x) { var msg = 'Bonjour ' + first(x.nom) + ', j’espère que tu vas bien. Petit rappel : il reste ' + fmt(x.total) + ' à régler pour ' + x.cmds.map(function (c) { return c.numero; }).join(', ') + ' (espèces ou Orange Money). Merci beaucoup 🙏';
      return '<div style="border-top:1px solid #EEF1F5;padding:10px 0;display:flex;flex-direction:column;gap:6px"><div class="line" style="padding:0"><b>' + esc(x.nom) + '</b><b style="color:var(--bad)">' + fmtn(x.total) + '</b></div>' +
        x.cmds.map(function (c) { return '<a href="#/commande/' + c.id + '" class="mut" style="text-decoration:none">' + esc(c.numero) + ' · ' + esc(title(c)) + ' · ' + STL[c.statut] + ' · reste ' + fmtn(resteFor(c)) + ' ›</a>'; }).join('') +
        (x.tel ? '<a class="btn sm wa" style="width:100%" target="_blank" rel="noopener" href="' + waLink(x.tel, msg) + '">Relancer sur WhatsApp</a>' : '') + '</div>'; }).join('') || '<div class="empty">Personne ne te doit d’argent 🎉</div>') + '</section>';
  render(page({ title: 'Qui me doit', back: 1, body: body, nav: 'argent' }));
}
async function envoiPreuve(file) {
  if (!file || !file.size) return null;
  if (S.mode === 'sb' && !navigator.onLine) { toast('Pas d’internet : la preuve n’est pas envoyée, le paiement oui'); return null; }
  try { var blob = await compress(file, S.mode === 'demo' ? 700 : 1600); return await DB.uploadPhoto('paiements', blob); } catch (e) { toast('Preuve non envoyée : ' + (e.message || e)); return null; }
}
async function voirPreuve(path) {
  try { var u = (await DB.photoUrls([path]))[path]; if (!u) return toast('Preuve indisponible (internet ?)');
    var w = document.createElement('div'); w.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:99;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;gap:12px';
    w.innerHTML = '<img src="' + u + '" style="max-width:100%;max-height:80vh;object-fit:contain"><button class="btn" style="width:auto;padding:0 24px">Fermer</button>';
    w.onclick = function () { w.remove(); }; document.body.appendChild(w);
  } catch (e) { toast('Preuve indisponible'); }
}
function vEncaisser() {
  if (!isPatron()) return denied();
  var dues = vraies().filter(function (c) { return resteFor(c) > 0; }).sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); });
  var body = '<form id="fe" class="card">' +
    '<label>C’est pour<select name="pour" id="epour"><option value="">Une commande… (choisir plus bas)</option><option value="autre">Autre entrée d’argent (sans commande)</option><option value="fond">Fond de caisse : argent déjà dans la caisse</option></select></label>' +
    '<label id="ecmd">Commande<select name="commande_id"><option value="">— Choisir —</option>' + dues.map(function (c) { return '<option value="' + c.id + '" data-reste="' + resteFor(c) + '">' + esc(c.client_nom) + ' · ' + esc(c.numero) + ' · reste ' + fmtn(resteFor(c)) + '</option>'; }).join('') + '</select></label>' +
    '<label>Montant (GNF)<input name="montant" type="number" inputmode="numeric" required></label>' +
    '<label>Reçu en<select name="mode" id="emode">' + MODES.map(function (m) { return '<option value="' + m[0] + '">' + m[1] + '</option>'; }).join('') + '</select></label>' +
    '<label id="eref" hidden>Référence Orange Money<input name="reference" placeholder="Ex. PP231117.1234.A12345"></label>' +
    '<label>📎 Capture du dépôt ou photo du reçu <span class="mut">(facultatif)</span><input name="preuve" type="file" accept="image/*"></label>' +
    '<label>Note<input name="note" placeholder="Ex. avance de Fatou, monnaie du matin…"></label>' +
    '<button class="btn or" type="submit">Enregistrer l’entrée d’argent</button></form>' +
    '<p class="mut" style="padding:0 4px">La « Caisse totale » se calcule toute seule : elle additionne tout l’argent reçu (ventes, paiements, entrées) et enlève les dépenses. Pour la mettre juste la première fois, choisis « Fond de caisse » et tape l’argent que tu as déjà.</p>';
  render(page({ title: 'Encaisser de l’argent', back: 1, body: body, nav: 'argent' }));
  function tog() { var v = q('#epour').value; q('#ecmd').hidden = v !== ''; }
  q('#epour').onchange = tog; tog();
  q('[name=commande_id]').onchange = function (e) { var o = e.target.selectedOptions[0]; if (o && o.dataset.reste) q('[name=montant]').value = o.dataset.reste; };
  q('#emode').onchange = function (e) { q('#eref').hidden = e.target.value !== 'orange_money'; };
  q('#fe').onsubmit = async function (e) { e.preventDefault(); var d = formData(e.target); if (n(d.montant) <= 0) return toast('Montant invalide');
    var cid = d.pour === '' ? Number(d.commande_id) || null : null; if (d.pour === '' && !cid) return toast('Choisis la commande, ou « Autre entrée »');
    var btn = e.target.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Enregistrement…';
    var preuve = await envoiPreuve(e.target.preuve.files[0]);
    var note = d.pour === 'fond' ? 'Fond de caisse' + (d.note ? ' · ' + d.note : '') : (d.note || (d.pour === 'autre' ? 'Entrée d’argent' : null));
    await act(function () { return DB.insert('paiements', { commande_id: cid, montant: n(d.montant), mode: d.mode, reference: d.mode === 'orange_money' && d.reference ? d.reference.trim() : null, note: note, preuve: preuve, date: new Date().toISOString() }); }, 'Argent enregistré');
    if (cid) { S.justPaid = cid; location.hash = '#/commande/' + cid; } else location.hash = '#/argent';
  };
}
function vDepense() {
  if (!isPatron()) return denied();
  var stockP = S.data.produits.filter(function (p) { return p.suivi_stock; });
  var body = '<form id="fd" class="card"><label>Type<select name="categorie" id="dcat">' + DEP.map(function (d) { return '<option value="' + d[0] + '">' + d[1] + '</option>'; }).join('') + '</select></label>' +
    '<div id="dachat" hidden style="display:flex;flex-direction:column;gap:12px"><label>Vierges achetés (le stock monte tout seul)<select name="produit_id"><option value="">— Aucun —</option>' + stockP.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nom) + ' (stock ' + n(p.stock) + ')</option>'; }).join('') + '</select></label><label>Quantité achetée<input name="quantite" type="number" inputmode="numeric" min="0"></label></div>' +
    '<label>Montant (GNF)<input name="montant" type="number" inputmode="numeric" required></label><label>Payé en<select name="mode">' + MODES.map(function (m) { return '<option value="' + m[0] + '">' + m[1] + '</option>'; }).join('') + '</select></label>' +
    '<label>Date<input name="date" type="date" value="' + today() + '"></label><label>Note<input name="note" placeholder="Ex. 10 gourdes vierges, pub TikTok…"></label><button class="btn or" type="submit">Enregistrer la dépense</button></form>';
  render(page({ title: 'Ajouter une dépense', back: 1, body: body, nav: 'argent' }));
  function tog() { var a = q('#dcat').value === 'achat'; q('#dachat').hidden = !a; q('#dachat').style.display = a ? 'flex' : 'none'; }
  q('#dcat').onchange = tog; tog();
  q('#fd').onsubmit = async function (e) { e.preventDefault(); var d = formData(e.target); if (n(d.montant) <= 0) return toast('Montant invalide');
    var dt = d.date === today() ? new Date().toISOString() : new Date(d.date + 'T12:00:00').toISOString();
    var pid = d.categorie === 'achat' && d.produit_id ? Number(d.produit_id) : null; var qte = pid ? n(d.quantite) : 0;
    await act(async function () { await DB.insert('depenses', { categorie: d.categorie, montant: n(d.montant), mode: d.mode, note: d.note || null, date: dt, produit_id: pid, quantite: qte });
      if (pid && qte > 0) { var p = findById('produits', pid); await DB.update('produits', pid, { stock: n(p.stock) + qte }); } }, pid && qte ? 'Dépense enregistrée, stock + ' + qte : 'Dépense enregistrée');
    history.back(); };
}

/* ---- Bilan ---- */
function texteBilan(p, b) {
  var L = ['📊 *Bilan Condesscky Collection – ' + p[2] + '*', '(' + dshort(p[0]) + (p[0] !== p[1] ? ' au ' + dshort(p[1]) : '') + ')', '',
    '🛍️ Commandes : ' + b.cmds.length + ' pour ' + fmt(b.ventes), '💵 Encaissé : ' + fmt(b.encaisse) + ' (espèces ' + fmtn(b.esp) + ', OM ' + fmtn(b.om) + ')', '💸 Dépenses : ' + fmt(b.depenses)];
  Object.keys(b.depCat).forEach(function (k) { L.push('   • ' + DEPL[k] + ' : ' + fmtn(b.depCat[k])); });
  L.push('✅ Reste (encaissé − dépenses) : ' + fmt(b.solde));
  if (b.cout) L.push('📈 Bénéfice sur produits (ventes − prix d’achat) : ' + fmt(b.ventes - b.cout));
  var tops = Object.keys(b.prod).sort(function (a, c) { return b.prod[c].montant - b.prod[a].montant; }).slice(0, 3);
  if (tops.length) { L.push('', '🏆 Meilleures ventes :'); tops.forEach(function (k) { L.push('   • ' + k + ' : ' + b.prod[k].qte + ' (' + fmtn(b.prod[k].montant) + ')'); }); }
  var srcs = Object.keys(b.src); if (srcs.length) { L.push('', '📣 Ventes par source :'); srcs.forEach(function (k) { L.push('   • ' + (SRC[k] || k) + ' : ' + fmtn(b.src[k])); }); }
  L.push('', '⏳ À encaisser au total : ' + fmt(soldesTotaux().aEnc));
  return L.join('\n');
}
function vBilan(per) {
  if (!isPatron()) return denied();
  per = per || 'jour'; var p = periode(per); var b = bilan(p[0], p[1]);
  var tops = Object.keys(b.prod).sort(function (a, c) { return b.prod[c].montant - b.prod[a].montant; }); var maxp = tops.length ? b.prod[tops[0]].montant : 1;
  var srcs = Object.keys(b.src).sort(function (a, c) { return b.src[c] - b.src[a]; }); var maxs = srcs.length ? b.src[srcs[0]] : 1;
  var body = '<div class="chips">' + [['jour', "Aujourd'hui"], ['semaine', 'Semaine'], ['mois', 'Mois']].map(function (x) { return '<a href="#/bilan/' + x[0] + '"><button class="' + (per === x[0] ? 'on' : '') + '">' + x[1] + '</button></a>'; }).join('') + '</div>' +
    '<section class="hero"><small style="color:#D6E4F5">Encaissé − dépenses (' + p[2] + ')</small><div class="big">' + fmt(b.solde) + '</div><div class="grid2"><div class="tile"><small>Commandes</small><b>' + b.cmds.length + ' · ' + fmtn(b.ventes) + '</b></div><div class="tile"><small>Dépenses</small><b>' + fmt(b.depenses) + '</b></div></div>' +
    (b.cout ? '<div style="color:#D6E4F5;font-size:12px">Bénéfice sur produits (ventes − prix d’achat) : <b style="color:#fff">' + fmt(b.ventes - b.cout) + '</b></div>' : '<div style="color:#D6E4F5;font-size:12px">Ajoute tes prix d’achat dans Produits pour voir ton vrai bénéfice.</div>') + '</section>' +
    '<section class="card"><h2>Ventes par produit</h2>' + (tops.map(function (k) { return '<div style="margin:8px 0"><div class="line" style="padding:0"><span>' + esc(k) + ' × ' + b.prod[k].qte + '</span><b>' + fmtn(b.prod[k].montant) + '</b></div><div class="bar" style="width:' + Math.max(4, Math.round(b.prod[k].montant / maxp * 100)) + '%"></div></div>'; }).join('') || '<div class="empty">Aucune vente.</div>') + '</section>' +
    '<section class="card"><h2>Ventes par source de pub</h2>' + (srcs.map(function (k) { return '<div style="margin:8px 0"><div class="line" style="padding:0"><span>' + esc(SRC[k] || k) + '</span><b>' + fmtn(b.src[k]) + '</b></div><div class="bar" style="background:var(--navy);width:' + Math.max(4, Math.round(b.src[k] / maxs * 100)) + '%"></div></div>'; }).join('') || '<div class="empty">—</div>') + '</section>' +
    '<section class="card"><h2>Dépenses</h2>' + (Object.keys(b.depCat).map(function (k) { return '<div class="line"><span>' + DEPL[k] + '</span><b>' + fmtn(b.depCat[k]) + '</b></div>'; }).join('') || '<div class="empty">Aucune dépense.</div>') + '</section>' +
    '<a class="btn wa" target="_blank" rel="noopener" href="' + waLink(R('whatsapp_patron'), texteBilan(p, b)) + '">Envoyer ce bilan sur WhatsApp</a>' +
    '<p class="mut" style="text-align:center;margin:0">Le message s’ouvre dans WhatsApp, prêt à envoyer.</p>';
  render(page({ title: 'Bilan', back: 1, body: body, nav: 'argent' }));
}

/* ---- Produits ---- */
function vProduits() {
  var cats = {}; S.data.produits.forEach(function (p) { (cats[p.categorie] = cats[p.categorie] || []).push(p); });
  var pat = isPatron();
  var body = '<p class="mut" style="margin:0">' + (pat ? 'Tape le nouveau prix ou le stock dans la case : c’est enregistré dès que tu sors de la case. Le stock des vierges baisse à chaque vente et monte quand tu enregistres un achat.' : 'Prix et stock (modifiables par le patron).') + '</p>' + Object.keys(cats).map(function (c) {
    return '<section class="card"><h2>' + esc(c) + '</h2>' + cats[c].map(function (p) {
      var low = p.suivi_stock && n(p.stock) <= n(p.stock_alerte);
      return '<div class="row" style="flex-wrap:wrap;padding:6px 0"><div class="grow"><span class="t" style="white-space:normal">' + esc(p.nom) + (p.actif === false ? ' <span class="mut">(caché)</span>' : '') + '</span>' + (p.suivi_stock ? '<span class="mut" style="color:' + (low ? 'var(--bad)' : 'var(--mut)') + '">Stock vierges : <b>' + n(p.stock) + '</b>' + (low ? ' · à recommander' : '') + '</span>' : '') + (pat && n(p.prix_achat) ? '<span class="mut">Achat : ' + fmtn(p.prix_achat) + '</span>' : '') + '</div>' +
        (pat ? (p.suivi_stock ? '<label style="width:78px;font-size:11px">Stock<input type="number" inputmode="numeric" data-stk="' + p.id + '" value="' + n(p.stock) + '" style="padding:8px"></label>' : '') +
          '<label style="width:112px;font-size:11px">Prix (GNF)<input type="number" inputmode="numeric" data-pr="' + p.id + '" value="' + n(p.prix) + '" style="padding:8px"></label>' +
          '<button class="btn sm" data-ed="' + p.id + '" style="min-height:40px;padding:0 10px;align-self:flex-end" aria-label="Modifier">✎</button>'
        : '<b style="font-size:14px">' + fmtn(p.prix) + '</b>') + '</div>';
    }).join('') + '</section>';
  }).join('') + (pat ? '<button class="btn or" id="addprod">＋ Ajouter un produit</button>' : '');
  render(page({ title: 'Produits et prix', back: 1, body: body, nav: 'menu' }));
  if (!pat) return;
  function P(id) { return findById('produits', Number(id)); }
  qa('[data-pr]').forEach(function (i) { i.onchange = async function () { var p = P(i.dataset.pr); if (n(i.value) <= 0) { i.value = p.prix; return toast('Prix invalide'); } if (n(i.value) === n(p.prix)) return; await act(function () { return DB.update('produits', p.id, { prix: n(i.value) }); }, 'Prix enregistré : ' + p.nom); }; });
  qa('[data-stk]').forEach(function (i) { i.onchange = async function () { var p = P(i.dataset.stk); if (n(i.value) < 0) { i.value = p.stock; return; } if (n(i.value) === n(p.stock)) return; await act(function () { return DB.update('produits', p.id, { stock: n(i.value) }); }, 'Stock enregistré : ' + p.nom); }; });
  qa('[data-ed]').forEach(function (b) { b.onclick = function () { location.hash = '#/produit/' + b.dataset.ed; }; });
  q('#addprod').onclick = function () { location.hash = '#/produit/nouveau'; };
}
function vProduitEdit(id) {
  if (!isPatron()) return denied();
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
  var body = '<input id="r" type="search" placeholder="Chercher un client…" value="' + esc(rechCl) + '"><div class="mut">' + S.data.clients.length + ' client(s) · les fiches se créent toutes seules à chaque vente.</div>' +
    '<section class="card" id="lst">' + listeClHTML() + '</section>';
  render(page({ title: 'Clients', back: 1, body: body, nav: 'menu' }));
  q('#r').oninput = function (e) { rechCl = e.target.value; q('#lst').innerHTML = listeClHTML(); };
}
function listeClHTML() {
  var list = S.data.clients.map(function (c) { var cs = cmdsOfClient(c); return { c: c, nb: cs.length, tot: cs.reduce(function (a, x) { return a + n(x.total); }, 0) }; })
    .filter(function (x) { return !rechCl || (x.c.nom + ' ' + x.c.telephone + ' ' + (x.c.quartier || '')).toLowerCase().indexOf(rechCl.toLowerCase()) >= 0; })
    .sort(function (a, b) { return b.tot - a.tot; });
  return (list.map(function (x) { return '<a class="row" href="#/client/' + x.c.id + '"><span class="ico">' + (x.nb >= n(R('remise_fidelite_des')) ? '⭐' : '👤') + '</span><div class="grow"><span class="t">' + esc(x.c.nom) + '</span><span class="mut">' + esc([x.c.telephone, x.c.quartier].filter(Boolean).join(' · ')) + '</span></div><div style="text-align:right"><b style="font-size:13px">' + fmtn(x.tot) + '</b><div class="mut">' + x.nb + ' cmd</div></div></a>'; }).join('') || '<div class="empty">Aucun client pour l’instant.</div>');
}
function vClient(id) {
  var c = findById('clients', Number(id)); if (!c) return vClients();
  var cs = cmdsOfClient(c); var tot = cs.reduce(function (a, x) { return a + n(x.total); }, 0); var des = n(R('remise_fidelite_des'));
  var body = '<section class="card"><div style="display:flex;gap:12px;align-items:center"><span class="ico" style="width:48px;height:48px;font-size:22px">' + (cs.length >= des ? '⭐' : '👤') + '</span><div class="grow"><b style="font-size:17px">' + esc(c.nom) + '</b><span class="mut">' + esc([c.telephone, c.quartier, c.ville].filter(Boolean).join(' · ')) + '</span></div></div>' +
    '<div class="grid3" style="margin-top:12px"><div class="mini"><small>Commandes</small><b>' + cs.length + '</b></div><div class="mini"><small>Total</small><b>' + fmtn(tot) + '</b></div><div class="mini"><small>Fidélité</small><b>' + (cs.length % des) + '/' + des + '</b></div></div>' +
    (c.telephone ? '<div class="grid2" style="margin-top:10px"><a class="btn sm wa" style="width:100%" target="_blank" rel="noopener" href="' + waLink(c.telephone, 'Bonjour ' + first(c.nom) + ', ') + '">WhatsApp</a><a class="btn sm" style="width:100%" href="tel:' + esc(c.telephone) + '">Appeler</a></div>' : '') + '</section>' +
    '<form id="fc" class="card"><h2>Infos</h2><label>Nom<input name="nom" value="' + esc(c.nom) + '" required></label><label>Téléphone<input name="telephone" value="' + esc(c.telephone || '') + '"></label><div class="grid2"><label>Quartier<input name="quartier" value="' + esc(c.quartier || '') + '"></label><label>Ville<input name="ville" value="' + esc(c.ville || '') + '"></label></div>' +
    '<label>Anniversaire 🎂<input type="date" name="anniversaire" value="' + esc(c.anniversaire || '') + '"></label><label>Notes<textarea name="notes">' + esc(c.notes || '') + '</textarea></label><button class="btn sm" type="submit" style="width:100%">Enregistrer</button></form>' +
    '<section class="card"><h2>Commandes</h2>' + (cs.map(cmdRow).join('') || '<div class="empty">Aucune commande.</div>') + '</section>' +
    '<button class="btn or" id="nv">＋ Nouvelle vente pour ce client</button>';
  render(page({ title: 'Fiche client', back: 1, body: body, nav: 'menu' }));
  q('#fc').onsubmit = async function (e) { e.preventDefault(); var d = formData(e.target); await act(function () { return DB.update('clients', c.id, { nom: d.nom, telephone: telWa(d.telephone) || null, quartier: d.quartier || null, ville: d.ville || null, anniversaire: d.anniversaire || null, notes: d.notes || null }); }, 'Fiche enregistrée'); };
  q('#nv').onclick = function () { newVente(); V.client_nom = c.nom; V.client_tel = c.telephone || ''; V.quartier = c.quartier || ''; V.ville = c.ville || 'Conakry'; location.hash = '#/vente'; };
}

/* ---- Fêtes ---- */
function vFetes() {
  var t = today(); var L = (R('fetes') || []).slice().sort(function (a, b) { return a.date.localeCompare(b.date); });
  var body = '<p class="mut" style="margin:0">Un rappel apparaît sur l’accueil 3 semaines avant chaque fête, pour préparer la pub et le stock. Les dates des fêtes religieuses sont estimées : corrige-les quand elles sont annoncées.</p>' +
    '<section class="card">' + (L.map(function (f, i) { var j = daysBetween(t, f.date); return '<div class="row"><span class="ico" style="background:#EDE7FB">🎉</span><div class="grow"><span class="t">' + esc(f.nom) + '</span><span class="mut">' + cap(dlong(f.date)) + ' ' + f.date.slice(0, 4) + (j >= 0 ? ' · dans ' + j + ' jour(s)' : ' · passée') + '</span></div>' + (isPatron() ? '<button class="btn sm danger" data-fx="' + esc(f.nom) + '|' + f.date + '" style="min-height:32px;padding:0 10px">✕</button>' : '') + '</div>'; }).join('') || '<div class="empty">Aucune fête.</div>') + '</section>' +
    (isPatron() ? '<form id="ff" class="card"><h2>Ajouter ou corriger une fête</h2><label>Nom<input name="nom" required placeholder="Ex. Fête des mères"></label><label>Date<input type="date" name="date" required></label><button class="btn or" type="submit">Enregistrer</button></form>' : '');
  render(page({ title: 'Calendrier des fêtes', back: 1, body: body, nav: 'menu' }));
  if (!isPatron()) return;
  qa('[data-fx]').forEach(function (b) { b.onclick = async function () { var k = b.dataset.fx.split('|'); var nl = (R('fetes') || []).filter(function (f) { return !(f.nom === k[0] && f.date === k[1]); }); await act(function () { return DB.setReglage('fetes', nl); }, 'Fête retirée'); vFetes(); }; });
  q('#ff').onsubmit = async function (e) { e.preventDefault(); var d = formData(e.target); var nl = (R('fetes') || []).filter(function (f) { return f.nom !== d.nom; }).concat([{ nom: d.nom, date: d.date }]); await act(function () { return DB.setReglage('fetes', nl); }, 'Fête enregistrée'); vFetes(); };
}

/* ---- Export (Excel) ---- */
function csv(rows) { return '﻿' + rows.map(function (r) { return r.map(function (v) { v = v == null ? '' : String(v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(';'); }).join('\r\n'); }
function download(name, text) { var b = new Blob([text], { type: 'text/csv;charset=utf-8' }); var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
function vExport() {
  if (!isPatron()) return denied();
  var body = '<p class="mut" style="margin:0">Chaque bouton télécharge un fichier qui s’ouvre dans Excel ou Google Sheets. Garde-les une fois par mois comme sauvegarde.</p>' +
    [['cmd', 'Commandes'], ['pay', 'Paiements'], ['dep', 'Dépenses'], ['cli', 'Clients'], ['prod', 'Produits et stock']].map(function (x) { return '<button class="btn" data-x="' + x[0] + '">⬇ ' + x[1] + '</button>'; }).join('');
  render(page({ title: 'Exporter (Excel)', back: 1, body: body, nav: 'menu' }));
  var d = today();
  var X = {
    cmd: function () { return ['commandes', [['Numéro', 'Date', 'Type', 'Statut', 'Client', 'Téléphone', 'Quartier', 'Ville', 'Source', 'Articles', 'Sous-total', 'Remise', 'Urgent', 'Livraison', 'Total', 'Payé', 'Reste']].concat(S.data.commandes.map(function (c) { return [c.numero, dkey(c.created_at), c.type || 'commande', STL[c.statut], c.client_nom, c.client_tel, c.quartier, c.ville, SRC[c.source] || c.source, title(c), c.sous_total, c.remise, c.supplement_urgent, c.livraison, c.total, paidFor(c.id), resteFor(c)]; }))]; },
    pay: function () { return ['paiements', [['Date', 'Commande', 'Client', 'Montant', 'Mode', 'Référence']].concat(S.data.paiements.map(function (p) { var c = findById('commandes', p.commande_id) || {}; return [dkey(p.date), c.numero, c.client_nom, p.montant, MODEL[p.mode], p.reference]; }))]; },
    dep: function () { return ['depenses', [['Date', 'Type', 'Montant', 'Mode', 'Note']].concat(S.data.depenses.map(function (x) { return [dkey(x.date), DEPL[x.categorie], x.montant, MODEL[x.mode], x.note]; }))]; },
    cli: function () { return ['clients', [['Nom', 'Téléphone', 'Quartier', 'Ville', 'Anniversaire', 'Commandes', 'Total']].concat(S.data.clients.map(function (c) { var cs = cmdsOfClient(c); return [c.nom, c.telephone, c.quartier, c.ville, c.anniversaire, cs.length, cs.reduce(function (a, x) { return a + n(x.total); }, 0)]; }))]; },
    prod: function () { return ['produits', [['Produit', 'Catégorie', 'Prix', 'Prix d’achat', 'Stock suivi', 'Stock']].concat(S.data.produits.map(function (p) { return [p.nom, p.categorie, p.prix, p.prix_achat, p.suivi_stock ? 'oui' : 'non', p.suivi_stock ? p.stock : '']; }))]; }
  };
  qa('[data-x]').forEach(function (b) { b.onclick = function () { var r = X[b.dataset.x](); download('condesscky-' + r[0] + '-' + d + '.csv', csv(r[1])); toast('Fichier téléchargé'); }; });
}

/* ---- Menu, équipe, réglages ---- */
function vMenu() {
  var it = [['#/taches', '✓', 'Tâches du jour'], ['#/clients', '👥', 'Clients'], ['#/produits', '🏷️', 'Produits, prix et stock'], ['#/fetes', '🎉', 'Calendrier des fêtes']];
  if (isPatron()) it = it.concat([['#/dettes', '💰', 'Qui me doit de l’argent'], ['#/bilan/semaine', '📊', 'Bilan de la semaine'], ['#/bilan/mois', '📅', 'Bilan du mois'], ['#/depense', '💸', 'Ajouter une dépense'], ['#/export', '⬇', 'Exporter (Excel)'], ['#/equipe', '🧑‍🤝‍🧑', 'Équipe (vendeur, livreur)'], ['#/reglages', '⚙️', 'Réglages']]);
  if (S.role === 'livreur') it = [['#/', '🚚', 'Mes livraisons'], ['#/commandes', '🛍️', 'Commandes']];
  it.push(['../', '🌐', 'Voir le site']);
  var body = '<section class="card">' + it.map(function (x) { return '<a class="row" href="' + x[0] + '"><span class="ico">' + x[1] + '</span><span class="grow t">' + x[2] + '</span><span class="mut">›</span></a>'; }).join('') + '</section>' +
    (S.role !== 'livreur' ? '<section class="card"><h2>🔔 Alertes de commande</h2><p class="mut" style="margin:0 0 10px">' + (window.Notification && Notification.permission === 'granted' ? 'Activées sur ce téléphone : un son, une vibration et une notification à chaque nouvelle commande.' : 'Reçois un son, une vibration et une notification à chaque nouvelle commande du site.') + '</p>' + (window.Notification && Notification.permission !== 'granted' ? '<button class="btn or" id="alertes" style="width:100%">Activer les alertes</button>' : '<button class="btn sm" id="testalerte" style="width:100%">Tester le son</button>') + '</section>' : '') +
    '<section class="card"><h2>Sécurité de ce téléphone</h2><p class="mut" style="margin:0 0 10px">' + (pinSet() ? 'Un code PIN protège l’application sur ce téléphone.' : 'Ajoute un code PIN : il sera demandé à l’ouverture.') + '</p><form id="fpin" style="gap:8px"><div class="grid2"><input name="a" type="password" inputmode="numeric" maxlength="8" placeholder="Nouveau PIN" autocomplete="new-password"><input name="b" type="password" inputmode="numeric" maxlength="8" placeholder="Retape-le" autocomplete="new-password"></div><button class="btn sm" type="submit" style="width:100%">' + (pinSet() ? 'Changer le PIN' : 'Créer le PIN') + '</button></form>' + (pinSet() ? '<button class="btn sm danger" id="nopin" style="width:100%;margin-top:8px">Retirer le PIN</button>' : '') +
    (S.mode === 'sb' && isPatron() ? '<button class="btn sm danger" id="outall" style="width:100%;margin-top:8px">Téléphone perdu : déconnecter tous les téléphones</button>' : '') + '</section>' +
    '<section class="card"><h2>Installer sur le téléphone</h2><p class="mut" style="margin:0">Android (Chrome) : menu ⋮ → « Ajouter à l’écran d’accueil ». iPhone (Safari) : bouton Partager → « Sur l’écran d’accueil ».</p>' + (deferredInstall ? '<button class="btn navy" id="inst" style="margin-top:10px">Installer l’application</button>' : '') + '</section>' +
    '<button class="btn" id="sync">↻ Recharger les données</button><button class="btn danger" id="out">Se déconnecter</button>' +
    '<p class="mut" style="text-align:center">' + (S.user ? esc(S.user.email) : '') + ' · ' + ({ patron: 'Patron', vendeur: 'Vendeur', livreur: 'Livreur' })[S.role] + ' · ' + (S.mode === 'sb' ? 'données en ligne' : 'mode essai') + ' · v2.8</p>';
  render(page({ title: 'Menu', body: body, nav: 'menu' }));
  if (q('#inst')) q('#inst').onclick = function () { deferredInstall.prompt(); };
  if (q('#alertes')) q('#alertes').onclick = function () { bip(); Notification.requestPermission().then(function (r) { toast(r === 'granted' ? 'Alertes activées ✓' : 'Alertes refusées : autorise les notifications dans les réglages du téléphone'); vMenu(); }); };
  if (q('#testalerte')) q('#testalerte').onclick = function () { bip(); try { navigator.vibrate && navigator.vibrate([250, 120, 250]); } catch (e) {} };
  q('#fpin').onsubmit = async function (e) { e.preventDefault(); var d = formData(e.target); if (!/^\d{4,8}$/.test(d.a)) return toast('Le PIN doit faire 4 à 8 chiffres'); if (d.a !== d.b) return toast('Les deux codes ne sont pas pareils'); lsSet('condesscky_pin', await sha(d.a)); toast('PIN enregistré sur ce téléphone'); vMenu(); };
  if (q('#nopin')) q('#nopin').onclick = function () { try { localStorage.removeItem('condesscky_pin'); } catch (e) {} toast('PIN retiré'); vMenu(); };
  if (q('#outall')) q('#outall').onclick = async function () { if (!confirm('Déconnecter TOUS les téléphones, y compris celui-ci ? Il faudra se reconnecter avec le mot de passe.')) return; await DB.logout(true); S.user = null; route(); };
  q('#sync').onclick = async function () { await act(async function () { await DB.flush(); await DB.load(); }, 'Données à jour'); vMenu(); };
  q('#out').onclick = async function () { if (queue().length && !confirm('Des changements ne sont pas encore envoyés. Se déconnecter quand même ?')) return; await DB.logout(); S.user = null; location.hash = '#/'; route(); };
}
function vEquipe() {
  if (!isPatron()) return denied();
  var body = '<p class="mut" style="margin:0">Ajoute ici les personnes qui t’aident. Un <b>vendeur</b> voit les ventes, commandes, tâches et clients, mais pas l’argent ni le bilan. Un <b>livreur</b> voit seulement les livraisons à faire. Ensuite, demande-moi de créer leur accès (e-mail + mot de passe).</p>' +
    '<section class="card">' + (S.data.profils.map(function (p) { return '<div class="row"><span class="ico">' + (p.role === 'livreur' ? '🚚' : '🛍️') + '</span><div class="grow"><span class="t">' + esc(p.nom || p.email) + '</span><span class="mut">' + esc(p.email) + ' · ' + esc(p.role) + '</span></div><button class="btn sm danger" data-rp="' + esc(p.email) + '" style="min-height:32px;padding:0 10px">✕</button></div>'; }).join('') || '<div class="empty">Personne pour l’instant.</div>') + '</section>' +
    '<form id="fq" class="card"><h2>Ajouter une personne</h2><label>Nom<input name="nom" required></label><label>E-mail<input name="email" type="email" required></label><label>Rôle<select name="role">' + ROLES.map(function (r) { return '<option value="' + r[0] + '">' + r[1] + '</option>'; }).join('') + '</select></label><button class="btn or" type="submit">Ajouter</button></form>';
  render(page({ title: 'Équipe', back: 1, body: body, nav: 'menu' }));
  qa('[data-rp]').forEach(function (b) { b.onclick = async function () { if (!confirm('Retirer ' + b.dataset.rp + ' ?')) return; await act(function () { return DB.remove('profils', b.dataset.rp); }, 'Retiré'); vEquipe(); }; });
  q('#fq').onsubmit = async function (e) { e.preventDefault(); var d = formData(e.target); await act(function () { return DB.insert('profils', { email: d.email.trim().toLowerCase(), nom: d.nom, role: d.role }); }, 'Personne ajoutée'); vEquipe(); };
}
function vReglages() {
  if (!isPatron()) return denied();
  var F = [['whatsapp_patron', 'Ton numéro WhatsApp (pour recevoir le bilan)', 'text'], ['livraison_conakry', 'Frais de livraison Conakry (GNF)', 'number'], ['supplement_urgent', 'Supplément urgent 24 h (GNF)', 'number'], ['acompte_pourcent', 'Acompte proposé (%)', 'number'], ['remise_fidelite_pourcent', 'Remise fidélité (%)', 'number'], ['remise_fidelite_des', 'Remise à partir de la commande n°', 'number'], ['adresse', 'Adresse de l’atelier', 'text'], ['lien_maps', 'Lien Google Maps', 'text']];
  var body = '<form id="fr" class="card">' + F.map(function (f) { return '<label>' + f[1] + '<input name="' + f[0] + '" type="' + f[2] + '" value="' + esc(R(f[0])) + '"></label>'; }).join('') + '<button class="btn or" type="submit">Enregistrer</button></form>';
  render(page({ title: 'Réglages', back: 1, body: body, nav: 'menu' }));
  q('#fr').onsubmit = async function (e) { e.preventDefault(); var d = formData(e.target);
    await act(async function () { for (var i = 0; i < F.length; i++) { var k = F[i][0]; var v = F[i][2] === 'number' ? n(d[k]) : d[k]; if (v !== R(k)) await DB.setReglage(k, v); } }, 'Réglages enregistrés'); };
}
async function vSync() {
  render(page({ title: 'Envoi', back: 1, body: '<div class="empty">Envoi des changements…</div>', nav: 'menu' }));
  if (!navigator.onLine) { toast('Toujours pas d’internet'); history.back(); return; }
  var nb = await DB.flush(); toast(nb ? nb + ' changement(s) envoyé(s) ✓' : 'Tout est à jour'); location.hash = '#/';
}

/* ---------------- routeur ---------------- */
// ---- Alerte quand une nouvelle commande arrive
function bip() { try { var A = window.AudioContext || window.webkitAudioContext, ctx = new A(); [0, .25].forEach(function (t) { var o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(.25, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + t + .2); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + .22); }); } catch (e) {} }
function alerteNouvelles() {
  if (!S.data || !S.user || S.role === 'livreur') return;
  var ids = vraies().filter(function (c) { return c.statut === 'nouvelle'; }).map(function (c) { return c.id; });
  var vues = lsGet('condesscky_vues', null);
  if (vues === null) { lsSet('condesscky_vues', ids); return; }
  var neuves = ids.filter(function (i) { return vues.indexOf(i) < 0 && i > 0; });
  lsSet('condesscky_vues', ids.concat(vues.filter(function (i) { return ids.indexOf(i) < 0; })).slice(-300));
  if (!neuves.length) return;
  var c = findById('commandes', neuves[0]), txt = neuves.length > 1 ? neuves.length + ' nouvelles commandes à valider' : 'Nouvelle commande : ' + (c ? title(c) : '');
  bip(); try { navigator.vibrate && navigator.vibrate([250, 120, 250]); } catch (e) {}
  toast('🛒 ' + txt);
  try { if (window.Notification && Notification.permission === 'granted' && navigator.serviceWorker) navigator.serviceWorker.ready.then(function (r) { r.showNotification('Condesscky Collection', { body: txt, icon: 'icon-192.png', badge: 'icon-192.png', tag: 'commande', renotify: true, data: { url: location.href.split('#')[0] + (c ? '#/commande/' + c.id : '#/') } }); }); } catch (e) {}
}
async function route() {
  if (!S.user) return vLogin();
  if (locked) return vPin();
  var h = (location.hash || '#/').slice(2).split('/');
  var r = h[0] || '';
  if (S.role === 'livreur' && ['', 'commandes', 'commande', 'menu', 'sync'].indexOf(r) < 0) return vLivraisons();
  if (r === '') return vHome();
  if (r === 'commandes') return vCommandes();
  if (r === 'commande') return vCommande(Number(h[1]));
  if (r === 'vente') { if (V && V.editId) V = null; return vVente(); }
  if (r === 'modifier') { var c = findById('commandes', Number(h[1])); if (!c) return vCommandes(); if (!V || V.editId !== c.id) editVente(c); return vVente(); }
  if (r === 'taches') return vTaches();
  if (r === 'argent') return vArgent();
  if (r === 'dettes') return vDettes();
  if (r === 'depense') return vDepense();
  if (r === 'encaisser') return vEncaisser();
  if (r === 'bilan') return vBilan(h[1]);
  if (r === 'produits') return vProduits();
  if (r === 'produit') return vProduitEdit(h[1]);
  if (r === 'clients') return vClients();
  if (r === 'client') return vClient(h[1]);
  if (r === 'fetes') return vFetes();
  if (r === 'export') return vExport();
  if (r === 'equipe') return vEquipe();
  if (r === 'menu') return vMenu();
  if (r === 'reglages') return vReglages();
  if (r === 'sync') return vSync();
  vHome();
}
var deferredInstall = null;
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredInstall = e; });
window.addEventListener('hashchange', route);
window.addEventListener('online', function () { DB.flush().then(function (nb) { if (nb) toast(nb + ' changement(s) envoyé(s) ✓'); route(); }); });
window.addEventListener('offline', route);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(function () {});

(async function start() {
  DB.init();
  if (pinSet()) locked = true;
  try {
    S.user = await DB.getUser();
    if (S.user) { if (S.mode === 'sb' && navigator.onLine && queue().length) await DB.flush(); else await DB.load(); }
  } catch (e) {
    console.error(e);
    var c = lsGet(CK, null); if (c) { TABLES.forEach(function (t) { S.data[t] = c[t] || []; }); queue().forEach(applyLocal); toast('Hors ligne : dernières données gardées'); }
  }
  if (S.user) setRole();
  route();
  if (S.mode === 'sb') setTimeout(alerteNouvelles, 1500);
  if (S.mode === 'sb') setInterval(function () { if (S.user && !locked && document.visibilityState !== 'visible' && navigator.onLine) DB.load().then(alerteNouvelles).catch(function () {}); }, 60000);
  if (S.mode === 'sb') setInterval(function () { if (S.user && !locked && document.visibilityState === 'visible' && navigator.onLine) DB.flush().then(function () { return queue().length ? null : DB.load(); }).then(function () { alerteNouvelles(); var h = location.hash; if (h === '#/' || h === '' || h === '#/commandes') route(); }).catch(function () {}); }, 45000);
})();
})();
