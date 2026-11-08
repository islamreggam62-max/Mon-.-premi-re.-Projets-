/**
 * STATIC DEMO — sample tender-specification (cahier des charges) audit,
 * reviewed from a bidder's standpoint. Statutory references marked for
 * verification. See lib/lexaudit/data/audits.ts for conventions.
 */
import type { AuditResult } from "@/lib/lexaudit/types";

function cc(label: string) {
  return { label, unverified: true };
}

export const TENDER_RESULT: AuditResult = {
  id: "r-tender",
  fileName: "Cahier_des_charges_AO_transport_2026.pdf",
  documentType: "tender",
  party: "contractor",
  counterparty: "Maître de l'ouvrage (fictif)",
  auditedOn: "2026-11-05",
  governingLaw: "Droit algérien — réglementation des marchés",
  riskScore: 58,
  verdict: "conditional",
  pages: 41,
  clausesReviewed: 48,
  synthesis: [
    "Avis global : soumissionnable sous réserve de demandes d'éclaircissement sur trois points avant remise de l'offre.",
    "Un critère technique paraît taillé pour une référence précise et pourrait être discriminatoire.",
    "Les pénalités de retard cumulées ne sont pas plafonnées et se combinent avec la résiliation aux torts.",
    "Le délai de paiement et les modalités de révision des prix exposent le soumissionnaire à un risque de trésorerie.",
    "La caution et les assurances exigées doivent être chiffrées pour évaluer le coût réel de l'offre.",
  ],
  findings: [
    {
      id: "f-t1",
      clause: "Article 12 — Capacités techniques exigées",
      checkpoint: "object",
      severity: "critical",
      title: "Critère d'éligibilité potentiellement discriminatoire",
      current:
        "« Le soumissionnaire doit disposer d'une flotte strictement identique au modèle [marque/type précis] et d'au moins trois marchés exécutés avec ce même modèle. »",
      defect:
        "Exiger une marque et un modèle précis, plutôt qu'une performance ou une capacité fonctionnelle, restreint la concurrence et peut constituer une spécification discriminatoire.",
      risk:
        "Offre écartée pour un motif formel, ou marché exposé à un recours ; perte de temps de soumission.",
      proposed:
        "Demander par écrit au maître de l'ouvrage, pendant la phase de questions, de reformuler le critère en termes de performance (capacité, charge utile, normes d'émission) plutôt que de marque, conformément au principe de non-discrimination.",
      basis: [cc("Réglementation des marchés — principe de libre concurrence et non-discrimination")],
    },
    {
      id: "f-t2",
      clause: "Article 23 — Pénalités de retard",
      checkpoint: "penalties",
      severity: "major",
      title: "Pénalités cumulées non plafonnées",
      current:
        "« Un retard entraîne une pénalité de 1 ‰ du montant du marché par jour, cumulable avec la résiliation aux torts du titulaire et la confiscation de la caution. »",
      defect:
        "Cumul de sanctions (pénalités + résiliation + confiscation) sans plafond global ni mise en demeure, pour un même manquement.",
      risk:
        "Exposition financière élevée et cumul de sanctions pour un retard partiel ; marge de l'offre absorbée par le risque de pénalités.",
      proposed:
        "Solliciter l'introduction d'un plafond global des pénalités (p. ex. 10 % du montant du marché) et d'une mise en demeure préalable à la résiliation, et vérifier l'articulation avec la caution.",
      basis: [cc("Réglementation des marchés — pénalités et plafonnement")],
    },
    {
      id: "f-t3",
      clause: "Article 31 — Délais de paiement et révision des prix",
      checkpoint: "price",
      severity: "major",
      title: "Risque de trésorerie : paiement long, prix ferme",
      current:
        "« Prix ferme et non révisable pendant toute la durée d'exécution ; paiement à quatre-vingt-dix (90) jours après service fait et attestation. »",
      defect:
        "Prix ferme sur une longue durée combiné à un paiement à 90 jours expose le titulaire à l'inflation des intrants (carburant, pièces) sans mécanisme de révision.",
      risk:
        "Érosion de la marge si les coûts augmentent ; tension de trésorerie sur la durée du marché.",
      proposed:
        "Demander une clause de révision indexée sur un indice public (carburant) au-delà d'un seuil, ou intégrer une provision de risque dans le prix ; vérifier la possibilité d'acomptes.",
    },
    {
      id: "f-t4",
      clause: "Article 8 — Cautions et assurances",
      checkpoint: "guarantees",
      severity: "major",
      title: "Coût des garanties non chiffré",
      current:
        "« Caution de bonne exécution, retenue de garantie et polices d'assurance « tous risques » exigées, montants précisés en annexe. »",
      defect:
        "Le cumul caution + retenue + assurances pèse sur la trésorerie et doit être chiffré avant de fixer le prix de l'offre ; l'annexe doit être lue attentivement.",
      risk: "Sous-estimation du coût réel de l'offre et du besoin en fonds de roulement.",
      proposed:
        "Chiffrer précisément le coût total des garanties et assurances à partir de l'annexe, et l'intégrer au prix ; demander la libération échelonnée de la retenue de garantie.",
    },
    {
      id: "f-t5",
      clause: "Article 39 — Variantes et sous-traitance",
      checkpoint: "object",
      severity: "minor",
      title: "Sous-traitance encadrée mais plafond imprécis",
      current: "« La sous-traitance est admise dans la limite fixée par la réglementation. »",
      defect: "Le plafond de sous-traitance n'est pas chiffré dans le cahier des charges, renvoyant à un texte non cité.",
      risk: "Incertitude sur la part sous-traitable, qui peut conditionner le montage de l'offre.",
      proposed: "Demander la confirmation écrite du plafond de sous-traitance applicable et des pièces à fournir pour chaque sous-traitant.",
      basis: [cc("Réglementation des marchés — sous-traitance")],
    },
  ],
  missing: [
    {
      id: "m-t1",
      checkpoint: "force-majeure",
      title: "Clause de force majeure et de prolongation de délai",
      why: "Le cahier des charges ne prévoit pas clairement la prolongation des délais en cas d'événement extérieur (pénurie, aléa climatique).",
      clause: "Demander l'insertion d'une clause de prolongation automatique des délais en cas de force majeure dûment notifiée, sans pénalité.",
    },
    {
      id: "m-t2",
      checkpoint: "law",
      title: "Procédure de règlement amiable des différends",
      why: "Aucune étape amiable n'est prévue avant le contentieux, ce qui alourdit la gestion des litiges d'exécution.",
      clause: "Proposer une phase de règlement amiable (comité, médiation) préalable à toute saisine, avec délai encadré.",
    },
  ],
  commercial: [
    { id: "c-t1", label: "Montant estimatif", value: "non communiqué", note: "Condition commerciale : à estimer à partir du bordereau des prix unitaires." },
    { id: "c-t2", label: "Durée du marché", value: "24 mois", note: "Condition commerciale : impacte le risque prix ferme (cf. constat Art. 31)." },
  ],
};
