// Exécute le code du nœud « Calculer les échéances » tel qu'il est dans le workflow,
// sur le tableau contrats.csv, avec une date du jour simulée.
// Lancer : node --test n8n-alertes-contrats/test/echeances.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dossier = new URL('../', import.meta.url);
const workflow = JSON.parse(readFileSync(new URL('workflow-alertes-contrats.json', dossier), 'utf8'));
const noeudCode = workflow.nodes.find((n) => n.type === 'n8n-nodes-base.code');

function lireCsv() {
  const [entete, ...lignes] = readFileSync(new URL('contrats.csv', dossier), 'utf8').trim().split('\n');
  const colonnes = entete.split(',');
  return lignes.map((ligne) => {
    const valeurs = ligne.split(',');
    assert.equal(valeurs.length, colonnes.length, `colonnes en trop/manquantes : ${ligne}`);
    return Object.fromEntries(colonnes.map((col, i) => [col, valeurs[i]]));
  });
}

// Reproduit ce que n8n fournit au nœud Code : $input.all() et $today.
async function executer(lignes, aujourdhui) {
  const AsyncFunction = (async () => {}).constructor;
  const fn = new AsyncFunction('$input', '$today', noeudCode.parameters.jsCode);
  const $input = { all: () => lignes.map((json) => ({ json })) };
  const $today = { toISODate: () => aujourdhui };
  return (await fn($input, $today)).map((item) => item.json);
}

const resume = (sorties) => sorties.map((s) => `${s.reference} | ${s.echeance} | ${s.date}`);

test('30/10/2026 : préavis du bail (14/11) à J-15, le contrat terminé est ignoré', async () => {
  const sorties = await executer(lireCsv(), '2026-10-30');
  assert.deepEqual(resume(sorties), [
    'CTR-2026-002 | Date limite du préavis (90 j avant la fin) | 2026-11-14',
  ]);
});

test('31/10/2026 : fin du CTR-001 et préavis du CTR-008', async () => {
  const sorties = await executer(lireCsv(), '2026-10-31');
  assert.deepEqual(resume(sorties), [
    'CTR-2026-001 | Fin du contrat | 2026-11-15',
    'CTR-2026-008 | Date limite du préavis (10 j avant la fin) | 2026-11-15',
  ]);
  assert.equal(sorties[0].jours_restants, 15);
});

test('jour sans échéance à J-15 : aucune sortie, donc aucun message', async () => {
  assert.deepEqual(await executer(lireCsv(), '2026-11-02'), []);
});

test('contenu du message Telegram', async () => {
  const [alerte] = await executer(lireCsv(), '2026-10-30');
  assert.equal(alerte.message, [
    '⏰ <b>Échéance dans 15 jours</b>',
    '',
    '📄 <b>CTR-2026-002</b> — Bail commercial – local Bab Ezzouar',
    '🤝 Cocontractant : SARL Immo Atlas',
    '📌 Date limite du préavis (90 j avant la fin)',
    '📅 samedi 14/11/2026',
    '👤 Responsable : Sara',
    '',
    '➡️ Envoyer la dénonciation avant cette date pour éviter la reconduction tacite.',
  ].join('\n'));
});

test('formats de date acceptés : JJ/MM/AAAA et numéro de série Google Sheets', async () => {
  const lignes = [
    { reference: 'A', date_fin: '15/11/2026', preavis_jours: '0' },
    { reference: 'B', date_fin: 46341, preavis_jours: 0 }, // 15/11/2026
  ];
  assert.deepEqual(resume(await executer(lignes, '2026-10-31')), [
    'A | Fin du contrat | 2026-11-15',
    'B | Fin du contrat | 2026-11-15',
  ]);
});

test('ligne mal remplie : un avertissement au lieu d’un oubli silencieux', async () => {
  const sorties = await executer([
    { reference: 'X', date_fin: '31/02/2026', preavis_jours: '30' },
    { reference: 'Y', date_fin: '2026-12-31', preavis_jours: '3 mois' },
    { reference: '', date_fin: '' },
  ], '2026-10-31');
  assert.deepEqual(sorties.map((s) => [s.reference, s.type]), [['X', 'erreur'], ['Y', 'erreur']]);
  assert.match(sorties[0].message, /date_fin illisible/);
  assert.match(sorties[1].message, /preavis_jours illisible/);
});

test('les caractères HTML des cellules sont échappés', async () => {
  const [alerte] = await executer(
    [{ reference: 'R&D <1>', intitule: 'a<b', date_fin: '2026-11-15', preavis_jours: '' }],
    '2026-10-31',
  );
  assert.match(alerte.message, /<b>R&amp;D &lt;1&gt;<\/b> — a&lt;b/);
});

test('le workflow enchaîne déclencheur → Google Sheets → Code → Telegram', () => {
  const suivant = (nom) => workflow.connections[nom]?.main[0][0].node;
  const chaine = ['Chaque matin à 8h'];
  while (suivant(chaine.at(-1))) chaine.push(suivant(chaine.at(-1)));
  const types = chaine.map((nom) => workflow.nodes.find((n) => n.name === nom).type);
  assert.deepEqual(types, [
    'n8n-nodes-base.scheduleTrigger',
    'n8n-nodes-base.googleSheets',
    'n8n-nodes-base.code',
    'n8n-nodes-base.telegram',
  ]);
  assert.equal(workflow.settings.timezone, 'Africa/Algiers');
});
