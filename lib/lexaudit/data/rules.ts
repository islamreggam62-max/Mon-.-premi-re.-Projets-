/**
 * STATIC DEMO — built-in custom regulatory rules the auditor checks on every
 * contract. These encode a review checklist; statutory references are marked
 * for verification (JORADP). Internal NAFTAL / group procedures are NOT
 * assumed — only generic, publicly-grounded checkpoints are shipped.
 */
import type { RegulatoryRule } from "@/lib/lexaudit/types";

function cc(label: string) {
  return { label, unverified: true };
}

export const REGULATORY_RULES: RegulatoryRule[] = [
  {
    id: "rule-1",
    title: "Pouvoirs des signataires justifiés",
    checkpoint: "parties",
    requirement:
      "Vérifier que la délégation de pouvoirs ou la décision habilitant chaque signataire est annexée, et que les sociétés sont identifiées (dénomination, forme, RC, NIF, siège).",
    basis: [cc("Code de commerce — représentation des sociétés")],
    appliesTo: ["supply", "services", "tender", "nda"],
    enabled: true,
    builtIn: true,
  },
  {
    id: "rule-2",
    title: "Plafonnement et symétrie des pénalités",
    checkpoint: "penalties",
    requirement:
      "Signaler toute pénalité non plafonnée, asymétrique entre les parties, ou applicable sans mise en demeure préalable.",
    basis: [cc("Code civil algérien — clause pénale")],
    appliesTo: ["supply", "services", "tender"],
    enabled: true,
    builtIn: true,
  },
  {
    id: "rule-3",
    title: "Transfert des risques lié à la réception",
    checkpoint: "delivery",
    requirement:
      "Vérifier que le transfert des risques coïncide avec la livraison et la réception, et qu'un délai de réserves est prévu.",
    basis: [cc("Code civil algérien — délivrance et transfert des risques")],
    appliesTo: ["supply"],
    enabled: true,
    builtIn: true,
  },
  {
    id: "rule-4",
    title: "Force majeure avec issue en cas de prolongation",
    checkpoint: "force-majeure",
    requirement:
      "Exiger une définition, un délai de notification, et un droit de résiliation si l'empêchement se prolonge au-delà d'un seuil.",
    basis: [cc("Code civil algérien — force majeure")],
    appliesTo: ["supply", "services", "tender"],
    enabled: true,
    builtIn: true,
  },
  {
    id: "rule-5",
    title: "Clause de confidentialité sur prix et volumes",
    checkpoint: "confidentiality",
    requirement:
      "Signaler l'absence de protection des informations sensibles (prix, volumes, conditions) dans les contrats de fourniture et de services.",
    basis: [],
    appliesTo: ["supply", "services"],
    enabled: true,
    builtIn: true,
  },
  {
    id: "rule-6",
    title: "Conformité HSE — produits pétroliers",
    checkpoint: "hse",
    requirement:
      "Exiger un engagement de conformité HSE au transport, stockage et manipulation des produits pétroliers, avec justificatifs.",
    basis: [cc("Réglementation des hydrocarbures et de la distribution des produits pétroliers")],
    appliesTo: ["supply", "tender"],
    enabled: true,
    builtIn: true,
  },
  {
    id: "rule-7",
    title: "Droit applicable et juridiction équilibrés",
    checkpoint: "law",
    requirement:
      "Signaler une clause attributive de juridiction au seul siège de la partie adverse ou l'application d'un droit étranger non justifié ; exiger une étape amiable.",
    basis: [cc("Code de procédure civile et administrative — compétence")],
    appliesTo: ["supply", "services", "tender", "nda"],
    enabled: true,
    builtIn: true,
  },
  {
    id: "rule-8",
    title: "Cohérence des montants en chiffres et en lettres",
    checkpoint: "form",
    requirement:
      "Contrôler la concordance des montants en chiffres et en lettres, la numérotation des articles et les renvois entre clauses et annexes.",
    basis: [],
    appliesTo: ["supply", "services", "tender", "nda"],
    enabled: false,
    builtIn: true,
  },
];
