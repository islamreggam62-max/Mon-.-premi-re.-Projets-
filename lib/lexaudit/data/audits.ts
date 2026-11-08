/**
 * ============================================================================
 *  STATIC DEMONSTRATION DATA — LexAudit AI
 * ----------------------------------------------------------------------------
 *  Hand-written, realistic sample audits. No document is parsed and no model
 *  is called. Counterparties are fictional. The legal analysis is written in
 *  French (the deliverable language); every statutory reference is marked
 *  `unverified` so the UI shows "à vérifier" — nothing here should be relied
 *  on without confirmation against a primary source (JORADP).
 * ============================================================================
 */
import type { AuditResult } from "@/lib/lexaudit/types";

/** Governing-law reference marked for verification. */
function cc(label: string) {
  return { label, unverified: true };
}

/* ----------------------------------------------------------------------------
 * 1. Fuel / petroleum supply contract — reviewed for the BUYER
 * ------------------------------------------------------------------------- */

const SUPPLY: AuditResult = {
  id: "r-supply",
  fileName: "Contrat_fourniture_produits_petroliers_2026.pdf",
  documentType: "supply",
  party: "buyer",
  counterparty: "Société PetroMed SARL (fictif)",
  auditedOn: "2026-11-06",
  governingLaw: "Droit algérien",
  riskScore: 68,
  verdict: "conditional",
  pages: 24,
  clausesReviewed: 31,
  synthesis: [
    "Avis global : signable sous réserve de la levée des trois constats critiques ci-dessous.",
    "Pénalités asymétriques : le fournisseur plafonne les siennes mais laisse les nôtres non plafonnées et sans mise en demeure préalable.",
    "Responsabilité : clause d'exonération large au profit du fournisseur, sans contrepartie, qui fait peser sur l'acheteur les conséquences d'un défaut de conformité.",
    "Transfert des risques déconnecté de la livraison : les risques passent à l'acheteur avant le déchargement et le contrôle qualité.",
    "Protections manquantes : caution de bonne exécution, assurance responsabilité du fournisseur, clause HSE et clause de confidentialité.",
  ],
  findings: [
    {
      id: "f-s1",
      clause: "Article 9 — Pénalités de retard",
      checkpoint: "penalties",
      severity: "critical",
      title: "Pénalités asymétriques et sans plafond pour l'acheteur",
      current:
        "« Tout retard de paiement de l'acheteur entraîne une pénalité de 1 % par jour de retard. Les pénalités dues par le fournisseur au titre d'un retard de livraison sont plafonnées à 2 % du montant de la commande concernée. »",
      defect:
        "Déséquilibre manifeste : la pénalité à la charge de l'acheteur est quotidienne et non plafonnée, celle du fournisseur est plafonnée à 2 %. Aucune mise en demeure préalable n'est exigée, et l'assiette (montant global vs commande) diffère selon la partie.",
      risk:
        "Exposition financière non bornée côté acheteur pour un simple décalage de trésorerie ; 1 % par jour représente un taux annualisé dépassant largement les plafonds usuels et pourrait être jugé excessif.",
      proposed:
        "« Tout retard de livraison ou de paisment dûment constaté, après mise en demeure restée sans effet pendant sept (7) jours, donne lieu à une pénalité de 0,5 % par semaine de retard du montant de la livraison concernée, plafonnée pour chaque partie à 5 % de ce montant. Les pénalités sont libératoires et exclusives de tout autre dommage pour le retard. »",
      basis: [cc("Code civil algérien — clause pénale et sa révision par le juge"), cc("Code de commerce — intérêts de retard")],
    },
    {
      id: "f-s2",
      clause: "Article 14 — Responsabilité",
      checkpoint: "liability",
      severity: "critical",
      title: "Exonération large du fournisseur, sans contrepartie",
      current:
        "« Le fournisseur ne saurait être tenu responsable des dommages indirects, ni des pertes d'exploitation, ni de tout dommage résultant de la qualité des produits livrés, sauf faute lourde prouvée par l'acheteur. »",
      defect:
        "L'exclusion vise jusqu'aux conséquences d'un défaut de qualité des produits — c'est-à-dire l'obligation essentielle du fournisseur — et renverse la charge de la preuve sur l'acheteur. Une clause qui vide l'obligation essentielle de sa substance est fragile.",
      risk:
        "En cas de produit non conforme (indice, teneur, contamination), l'acheteur supporterait seul les conséquences opérationnelles et devrait prouver la faute lourde, preuve difficile à rapporter.",
      proposed:
        "« Le fournisseur répond de la conformité des produits aux spécifications contractuelles. Sa responsabilité au titre des dommages directs est plafonnée au montant annuel du contrat ; ce plafond ne s'applique ni en cas de faute lourde ou dolosive, ni en cas de dommage corporel, ni en matière de non-conformité des produits. La charge de la preuve de la conformité incombe au fournisseur. »",
      basis: [cc("Code civil algérien — responsabilité contractuelle et garantie des vices")],
    },
    {
      id: "f-s3",
      clause: "Article 11 — Transfert de propriété et des risques",
      checkpoint: "delivery",
      severity: "critical",
      title: "Risques transférés avant déchargement et contrôle qualité",
      current:
        "« La propriété et les risques sont transférés à l'acheteur dès le chargement des produits dans les moyens de transport au départ du dépôt du fournisseur. »",
      defect:
        "Le transfert des risques au chargement (départ) est déconnecté de la réception effective. L'acheteur supporte les pertes en transport alors qu'il n'a ni la maîtrise du transport ni encore procédé au contrôle quantité/qualité.",
      risk:
        "Perte, coulage ou contamination en cours de transport à la charge de l'acheteur, et difficulté à émettre des réserves utiles puisque la réception n'ouvre pas de délai de contestation.",
      proposed:
        "« Le transfert des risques s'opère à la livraison, après déchargement au lieu convenu et réception quantitative et qualitative par l'acheteur. L'acheteur dispose d'un délai de sept (7) jours pour émettre des réserves sur la conformité, le transfert de propriété étant subordonné au paiement intégral. »",
      basis: [cc("Code civil algérien — délivrance, transfert des risques et réception")],
    },
    {
      id: "f-s4",
      clause: "Article 7 — Révision des prix",
      checkpoint: "price",
      severity: "major",
      title: "Révision de prix unilatérale au bénéfice du fournisseur",
      current:
        "« Le fournisseur peut réviser les prix à tout moment moyennant un préavis de quinze (15) jours. »",
      defect:
        "Révision discrétionnaire, sans formule d'indexation objective ni plafond, ni droit de sortie pour l'acheteur. Un prix qui dépend de la seule volonté d'une partie n'est pas déterminé de façon objective.",
      risk:
        "Imprévisibilité budgétaire et impossibilité de contester une hausse ; l'acheteur est lié sans pouvoir refuser ou résilier à bref délai.",
      proposed:
        "« Les prix sont révisés selon une formule d'indexation contractuelle fondée sur un indice public vérifiable, au maximum une fois par trimestre. Toute révision est notifiée avec le détail du calcul. Une hausse cumulée supérieure à 10 % sur douze mois ouvre à l'acheteur un droit de résiliation sans pénalité moyennant préavis de trente (30) jours. »",
      basis: [cc("Code civil algérien — détermination du prix")],
    },
    {
      id: "f-s5",
      clause: "Article 19 — Force majeure",
      checkpoint: "force-majeure",
      severity: "major",
      title: "Force majeure sans notification ni issue en cas de prolongation",
      current:
        "« Les obligations sont suspendues en cas de force majeure, pour toute sa durée. »",
      defect:
        "Pas de définition, pas de délai de notification, pas de plafond de durée au-delà duquel les parties peuvent résilier. Une suspension illimitée bloque l'acheteur sans solution de sortie.",
      risk:
        "Approvisionnement suspendu indéfiniment sans droit de résilier ni de se fournir ailleurs ; coûts de substitution non couverts.",
      proposed:
        "« Constitue un cas de force majeure l'événement extérieur, imprévisible et irrésistible empêchant l'exécution. La partie affectée le notifie dans un délai de cinq (5) jours et met en œuvre les mesures d'atténuation. Si l'empêchement se prolonge au-delà de trente (30) jours, chaque partie peut résilier de plein droit, sans indemnité, les sommes dues pour les prestations exécutées restant acquises. »",
      basis: [cc("Code civil algérien — force majeure et imprévision")],
    },
    {
      id: "f-s6",
      clause: "Article 22 — Résiliation",
      checkpoint: "termination",
      severity: "major",
      title: "Résiliation pour convenance ouverte au seul fournisseur",
      current:
        "« Le fournisseur peut résilier le contrat à tout moment moyennant un préavis de dix (10) jours. L'acheteur ne peut résilier qu'en cas de manquement grave dûment constaté par voie judiciaire. »",
      defect:
        "Faculté de résiliation pour convenance réservée à une seule partie, avec un préavis très court, tandis que l'acheteur doit obtenir une décision de justice. Déséquilibre et insécurité d'approvisionnement.",
      risk:
        "Rupture d'approvisionnement à dix jours, sans substitution organisée ; l'acheteur ne dispose d'aucune sortie symétrique.",
      proposed:
        "« Chaque partie peut résilier pour manquement grave après mise en demeure restée sans effet pendant quinze (15) jours. La résiliation pour convenance, si elle est prévue, est ouverte aux deux parties moyennant un préavis de quatre-vingt-dix (90) jours permettant la continuité de l'approvisionnement. »",
      basis: [cc("Code civil algérien — résolution pour inexécution et mise en demeure")],
    },
    {
      id: "f-s7",
      clause: "Article 2 — Parties et signataires",
      checkpoint: "parties",
      severity: "major",
      title: "Pouvoirs du signataire du fournisseur non justifiés",
      current:
        "« Représentée par M. […], agissant en qualité de représentant dûment habilité. »",
      defect:
        "Aucune pièce (procès-verbal, délégation de pouvoirs, extrait du registre du commerce) ne justifie l'habilitation du signataire ni l'identification précise de la société (forme, RC, NIF, siège).",
      risk:
        "Risque de contestation ultérieure de l'engagement pour défaut de pouvoir, et difficulté d'exécution forcée si l'identité sociale est imprécise.",
      proposed:
        "« Identifier la société par sa dénomination, sa forme, son capital, son numéro de registre du commerce, son NIF et son siège. Annexer la délégation de pouvoirs ou la décision habilitant le signataire, et viser ces pièces à l'article Documents contractuels. »",
      basis: [cc("Code de commerce — représentation des sociétés")],
    },
    {
      id: "f-s8",
      clause: "Article 27 — Droit applicable et règlement des litiges",
      checkpoint: "law",
      severity: "major",
      title: "Clause attributive de juridiction au siège du fournisseur",
      current:
        "« Tout litige sera soumis aux tribunaux compétents du siège du fournisseur. »",
      defect:
        "La compétence est fixée au siège de la partie adverse, sans étape amiable préalable et sans précision de la loi applicable ni de la langue.",
      risk:
        "Contentieux porté devant une juridiction éloignée, coûts accrus et perte de l'avantage procédural pour l'acheteur.",
      proposed:
        "« Le contrat est régi par le droit algérien. Les parties recherchent une solution amiable pendant trente (30) jours avant toute action. À défaut, compétence est attribuée aux tribunaux du lieu d'exécution [ou du siège de l'acheteur]. La langue du contrat et de la procédure est le français [et/ou l'arabe]. »",
      basis: [cc("Code de procédure civile et administrative — compétence territoriale")],
    },
    {
      id: "f-s9",
      clause: "Article 4 — Documents contractuels",
      checkpoint: "form",
      severity: "minor",
      title: "Ordre de priorité des documents non défini",
      current: "« Le contrat et ses annexes forment un tout indivisible. »",
      defect:
        "Absence de hiérarchie entre le corps du contrat, les annexes techniques et les bons de commande en cas de contradiction.",
      risk: "Ambiguïté d'interprétation si une annexe contredit une clause du corps du contrat.",
      proposed:
        "« En cas de contradiction, l'ordre de priorité est : (1) le présent contrat, (2) ses annexes, (3) les bons de commande. »",
    },
    {
      id: "f-s10",
      clause: "Article 1 — Définitions",
      checkpoint: "object",
      severity: "minor",
      title: "Spécifications qualité renvoyées à une annexe absente",
      current: "« Les produits sont conformes aux spécifications figurant en annexe. »",
      defect: "L'annexe des spécifications (indices, teneurs, normes) n'est pas jointe au projet communiqué.",
      risk: "Impossible d'opposer un critère de conformité précis en cas de litige qualité.",
      proposed:
        "« Joindre l'annexe des spécifications techniques (normes applicables, caractéristiques, méthodes de contrôle) et la viser expressément comme critère de conformité à la réception. »",
    },
  ],
  missing: [
    {
      id: "m-s1",
      checkpoint: "guarantees",
      title: "Caution de bonne exécution",
      why: "Aucune garantie ne sécurise l'exécution des obligations du fournisseur (continuité et conformité des livraisons).",
      clause:
        "« Le fournisseur remet, dans les quinze (15) jours de la signature, une caution bancaire de bonne exécution égale à 10 % du montant annuel du contrat, valable jusqu'à l'expiration de la dernière obligation. »",
    },
    {
      id: "m-s2",
      checkpoint: "guarantees",
      title: "Assurance responsabilité du fournisseur",
      why: "Le contrat n'impose aucune couverture d'assurance, alors que les produits pétroliers présentent un risque élevé.",
      clause:
        "« Le fournisseur justifie d'une police d'assurance responsabilité civile et produits en cours de validité, dont il remet l'attestation annuellement, pour un montant de garantie au moins égal à […]. »",
    },
    {
      id: "m-s3",
      checkpoint: "hse",
      title: "Clause HSE et conformité réglementaire",
      why: "Pas d'engagement de conformité HSE ni aux règles de transport et de stockage des produits pétroliers.",
      clause:
        "« Le fournisseur respecte la réglementation HSE applicable au transport, au stockage et à la manipulation des produits pétroliers, et en justifie sur demande. Tout manquement constitue une faute grave. »",
    },
    {
      id: "m-s4",
      checkpoint: "confidentiality",
      title: "Clause de confidentialité",
      why: "Les prix, volumes et conditions négociés ne sont protégés par aucune obligation de confidentialité.",
      clause:
        "« Chaque partie garde confidentielles les informations échangées, notamment les prix et volumes, pendant la durée du contrat et deux (2) ans après son terme, sauf obligation légale de divulgation. »",
    },
  ],
  commercial: [
    { id: "c-s1", label: "Prix unitaire", value: "indexé — voir art. 7", note: "Condition commerciale : signalée, non retouchée. La formule d'indexation relève de la négociation prix." },
    { id: "c-s2", label: "Quantité annuelle", value: "volumes prévisionnels", note: "Condition commerciale : vérifier l'existence d'un engagement minimum (take-or-pay) côté acheteur." },
    { id: "c-s3", label: "Remise", value: "non précisée", note: "Condition commerciale : à confirmer avec le service émetteur." },
    { id: "c-s4", label: "Délai de paiement", value: "30 jours fin de mois", note: "Condition commerciale : cohérente avec l'art. 9 une fois les pénalités rééquilibrées." },
  ],
};

/* ----------------------------------------------------------------------------
 * 2. Non-disclosure agreement — reviewed for OUR side (disclosing party)
 * ------------------------------------------------------------------------- */

const NDA: AuditResult = {
  id: "r-nda",
  fileName: "NDA_TechNordic_mutuel.docx",
  documentType: "nda",
  party: "buyer",
  counterparty: "TechNordic AS (fictif)",
  auditedOn: "2026-11-04",
  governingLaw: "Droit algérien",
  riskScore: 42,
  verdict: "conditional",
  pages: 6,
  clausesReviewed: 12,
  synthesis: [
    "Avis global : signable sous réserve de deux ajustements sur la durée et le droit applicable.",
    "La durée de confidentialité post-contractuelle (6 mois) est trop courte pour un savoir-faire technique.",
    "La définition des informations confidentielles exclut les échanges oraux non confirmés par écrit.",
    "Droit applicable étranger et absence de clause de restitution/destruction des informations.",
    "Pas de clause sur les injonctions ni sur le sort des copies en cas de rupture des pourparlers.",
  ],
  findings: [
    {
      id: "f-n1",
      clause: "Article 4 — Durée",
      checkpoint: "duration",
      severity: "major",
      title: "Durée de confidentialité trop courte",
      current: "« L'obligation de confidentialité s'applique pendant six (6) mois à compter de la divulgation. »",
      defect: "Six mois sont insuffisants pour protéger un savoir-faire ou des données techniques dont la valeur persiste bien au-delà.",
      risk: "Les informations sensibles divulguées deviennent librement exploitables après six mois.",
      proposed: "« L'obligation de confidentialité s'applique pendant la durée des échanges et cinq (5) ans après la dernière divulgation ; sans limite de durée pour les secrets d'affaires tant qu'ils conservent ce caractère. »",
      basis: [cc("Code civil algérien — responsabilité contractuelle")],
    },
    {
      id: "f-n2",
      clause: "Article 1 — Définition des informations confidentielles",
      checkpoint: "confidentiality",
      severity: "major",
      title: "Les divulgations orales ne sont pas couvertes",
      current: "« Sont confidentielles les seules informations identifiées par écrit comme telles au moment de leur communication. »",
      defect: "Les informations communiquées oralement (réunions, démonstrations) échappent à la protection si elles ne sont pas confirmées par écrit.",
      risk: "Fuite d'informations sensibles échangées en réunion sans recours contractuel.",
      proposed: "« Sont confidentielles toutes les informations, écrites ou orales, dont le caractère confidentiel ressort de leur nature ou des circonstances de leur communication, qu'elles soient ou non marquées. »",
    },
    {
      id: "f-n3",
      clause: "Article 9 — Droit applicable",
      checkpoint: "law",
      severity: "major",
      title: "Droit et juridiction étrangers imposés",
      current: "« Le présent accord est régi par le droit norvégien ; compétence exclusive des tribunaux d'Oslo. »",
      defect: "Loi et juridiction étrangères, coûteuses et peu prévisibles pour la partie algérienne.",
      risk: "Contentieux difficilement accessible et exécution incertaine en Algérie.",
      proposed: "« Accord régi par le droit algérien ; à défaut d'accord amiable, compétence des tribunaux du siège de la partie défenderesse ou arbitrage selon un règlement convenu. »",
      basis: [cc("Code de procédure civile et administrative — compétence")],
    },
    {
      id: "f-n4",
      clause: "— (absente)",
      checkpoint: "confidentiality",
      severity: "minor",
      title: "Pas de restitution / destruction des informations",
      current: "Aucune clause ne prévoit le sort des informations à la fin des échanges.",
      defect: "L'accord ne prévoit ni restitution ni destruction certifiée des supports à la fin des pourparlers.",
      risk: "Les copies détenues par le destinataire subsistent sans obligation d'élimination.",
      proposed: "« À première demande ou à la fin des échanges, chaque partie restitue ou détruit les informations confidentielles et leurs copies, et le certifie par écrit. »",
    },
  ],
  missing: [
    {
      id: "m-n1",
      checkpoint: "liability",
      title: "Mesures conservatoires / injonction",
      why: "La violation d'une obligation de confidentialité appelle une réaction rapide que la seule réparation pécuniaire ne permet pas.",
      clause: "« En cas de violation, la partie lésée peut solliciter toute mesure conservatoire ou d'urgence, sans préjudice des dommages-intérêts. »",
    },
    {
      id: "m-n2",
      checkpoint: "object",
      title: "Clause de non-sollicitation (le cas échéant)",
      why: "Si les échanges exposent des équipes clés, une non-sollicitation encadrée protège la partie divulgatrice.",
      clause: "« Pendant la durée des échanges et douze (12) mois après, chaque partie s'abstient de solliciter le personnel clé de l'autre identifié d'un commun accord. »",
    },
  ],
  commercial: [],
};

export const AUDIT_RESULTS: AuditResult[] = [SUPPLY, NDA];

export function findResult(id: string): AuditResult | undefined {
  return AUDIT_RESULTS.find((r) => r.id === id);
}
