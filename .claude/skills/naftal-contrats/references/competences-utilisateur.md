# Compétences de l'utilisateur — règles prioritaires

> L'utilisateur a créé dans son compte Claude cinq compétences qui fixent la façon de travailler
> du Dépt Contrats et Conseils. **Elles priment** sur `modeles-courriers.md` et sur
> `scripts/courrier_docx.py` en cas de différence.
>
> Où les lire (texte intégral) :
> - compétences synchronisées depuis le compte : `/root/.claude/skills/synced/*/<nom>/SKILL.md`
>   (dans une session, le directeur les appelle avec l'outil Skill : `anthropic-skills:<nom>`) ;
> - copie locale, non publiée (dépôt public) : `.claude/skills/naftal-contrats/prive/competences/<nom>/SKILL.md`.
>
> Ce fichier public n'en garde que les règles, sans nom de signataire ni numéro réel.

| Compétence | Quand | Remplace |
|---|---|---|
| `contrat` | Toute lettre du département, vers toute direction : retour visé ou corrigé, « porter à la connaissance » | `lettres-contrats-conseils` (ancienne version) |
| `lettres-direction-commercialisation` | Retour d'un contrat client ou d'un avenant à la Direction Commercialisation (COM / D.COM) | — |
| `examen-contrat` | Examen d'un contrat, d'une convention ou d'un contrat d'application avant visa | — |
| `correction-avenant` | Correction d'un avenant ou d'un contrat en mode révision Word | — |
| `francais-juridique` | Relecture finale de tout texte rédigé ou relu en français | — |

## 1. Lettres (`contrat`, `lettres-direction-commercialisation`)

- Toujours en français, même si la demande est en arabe ou en darja.
- **Corps : une seule phrase** (retour d'un document). Aucune note d'observations, aucun
  paragraphe d'explication, aucune phrase demandant de reprendre les corrections ou de
  retransmettre le document pour visa. Clôture : « Salutations. » uniquement.
- Le numéro de référence et la date de la lettre restent vides. Ne jamais inventer un numéro :
  laisser « …… » et le signaler.
- Choix du modèle : **visé** (« visé », « dûment visé ») ou **corrigé (non visé)** ; si ce n'est
  pas clair, une seule question avant de rédiger.
- Nombre d'exemplaires en lettres puis en chiffres sur deux positions : « deux (02) exemplaires ».
- **Direction Commercialisation** : Objet « A/S Contrat N°… » avec **le seul numéro du
  contrat** (ni objet ni client) ; pour un avenant « A/S Avenant N°… au [contrat / marché] N°… ».
  Réf : **toujours « V/E N° … du … »**, jamais « V/Bordereau d'envoi », même si la pièce reçue
  est un bordereau.
- **Autres directions** (Aviation, Marine, DTM…) : Objet « A/S [document et numéro complet]
  [– objet court][– Partenaire : …] » ; Réf « V/Bordereau d'envoi N°… du … » ou « V/E N°… du … »
  selon la pièce reçue.
- Formules (exactes, voir la compétence) : « … dûment visé par nos soins dans ses clauses
  juridiques, ainsi que la fiche de suivi [avenant] dûment signée. » / « … dûment corrigé par nos
  soins, ainsi que la fiche de suivi [avenant] non signée. »
- **Porter à la connaissance** (hiérarchie) : objet repris tel quel sans « A/S », pas de ligne
  Réf, prose sans puces, premier paragraphe « Nous avons été rendus destinataires d'un courrier
  émanant de … N° … du …, nous informant … ».
- Mise en page Word : script `lettre.js` de la compétence `contrat` (bibliothèque Node `docx`) :
  A4, Times New Roman 12, « Dar El Beida, le » sur la même ligne que BRANCHE CARBURANTS
  (taquet 4253 twips), destinataire en retrait 4253, corps justifié, alinéa 709, interligne 1,5,
  signature en retrait 5103. Vérifier le rendu (PDF) avant l'envoi.
- Livraison : le .docx (et le texte copiable si demandé), puis **trois points au plus** à
  vérifier (chiffre manuscrit incertain, numéro manquant, correction faite par rapport à
  l'envoi…). Aucun autre commentaire.

## 2. Examen avant visa (`examen-contrat`)

- Identifier le document ; s'il existe un contrat type validé, comparer d'abord au modèle.
- Grille : parties, objet, documents contractuels, durée, prix et paiement, exécution (livraison,
  transfert de propriété et des risques), garanties et assurances, pénalités, responsabilité,
  force majeure, résiliation, confidentialité, cession et sous-traitance, litiges, clauses
  finales ; cohérence générale (numérotation, renvois, chiffres et lettres, dates).
- Le fond commercial ou technique (prix, quantités, spécifications) **se signale, il ne se
  tranche pas**.
- Livrable : tableau **Article | Constat | Proposition | Gravité** (bloquant / à corriger /
  remarque), puis une ligne « Proposition : visé » ou « Proposition : corrigé » avec la raison.
- **La décision appartient à l'utilisateur** : attendre sa confirmation avant de produire le
  document corrigé ou la lettre.

## 3. Correction en mode révision (`correction-avenant`)

- Le suivi des modifications n'est possible que sur un Word : le demander si le document arrive
  en PDF ou en photo (à défaut, retranscrire et le signaler). Travailler sur une copie.
- Vérifier : références et numérotation par rapport au contrat de base, parties identiques au
  contrat de base, textes visés, objet, articles modifiés et formule « L'article … est modifié
  comme suit : », montants (chiffres et lettres, HT / TVA / TTC), délais et dates, clause de
  maintien, entrée en vigueur, exemplaires, signatures, langue.
- **Ne pas modifier le fond commercial** (prix, quantités, conditions négociées) : une
  incohérence de fond se signale, elle ne se corrige pas.
- Révisions Word, auteur « Direction Juridique » (à défaut d'un autre nom) ; **la plus petite
  modification possible** (le mot ou le chiffre, pas le paragraphe) ; **ne pas accepter, refuser
  ni supprimer les révisions déjà présentes** ; **pas de commentaires Word** sauf demande.
- Livraison : le .docx en mode révision, un tableau **N° | Emplacement | Texte initial |
  Correction | Raison**, puis trois points au plus sur les questions de fond à trancher. Lettre
  de retour (si demandée) : compétence `contrat`, modèle corrigé.

## 4. Français juridique (`francais-juridique`)

- Les modèles de l'utilisateur ne s'« améliorent » pas. Texte reçu : corriger les fautes sans
  réécrire le style, chaque correction avec sa raison. Texte rédigé : registre soutenu.
- Relecture finale de chaque livrable : accords, chiffres et lettres concordants, numéros et
  dates identiques partout, typographie (espaces insécables, guillemets « », majuscules
  accentuées, 1er / 2e), termes juridiques exacts et constants (résiliation ≠ résolution ≠
  nullité ≠ caducité ; avenant ≠ contrat d'application ≠ marché), aucune impropriété
  (« suite à », « impacter », « en charge de »…).
