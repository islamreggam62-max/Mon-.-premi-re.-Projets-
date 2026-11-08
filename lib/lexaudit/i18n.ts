/**
 * LexAudit AI — tri-lingual interface strings (Arabic · French · English).
 *
 * The UI chrome is fully translated. The demo legal analyses themselves are
 * authored in French, the deliverable language for legal work; the interface
 * around them switches freely, and direction (RTL/LTR) follows the language.
 */

export type Lang = "ar" | "fr" | "en";

export const LANGS: { id: Lang; label: string; dir: "rtl" | "ltr" }[] = [
  { id: "ar", label: "العربية", dir: "rtl" },
  { id: "fr", label: "Français", dir: "ltr" },
  { id: "en", label: "English", dir: "ltr" },
];

export const DEFAULT_LANG: Lang = "ar";

export function dirOf(lang: Lang): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr";
}

type Entry = Record<Lang, string>;

/** Flat dictionary keyed by dotted string. */
export const DICT: Record<string, Entry> = {
  // Brand
  "brand.name": { ar: "LexAudit AI", fr: "LexAudit AI", en: "LexAudit AI" },
  "brand.tagline": {
    ar: "مدقّق العقود ودفاتر الشروط الذكي",
    fr: "L'auditeur intelligent de contrats et cahiers des charges",
    en: "The smart auditor for contracts and tender specifications",
  },

  // Navigation
  "nav.dashboard": { ar: "لوحة القيادة", fr: "Tableau de bord", en: "Dashboard" },
  "nav.newAudit": { ar: "فحص عقد جديد", fr: "Nouvel audit", en: "New audit" },
  "nav.tender": { ar: "مراجعة دفاتر الشروط", fr: "Cahiers des charges", en: "Tender specifications" },
  "nav.log": { ar: "سجل التدقيق", fr: "Journal d'audit", en: "Audit log" },
  "nav.rules": { ar: "القواعد التنظيمية", fr: "Règles réglementaires", en: "Regulatory rules" },
  "nav.subscription": { ar: "الاشتراك", fr: "Abonnement", en: "Subscription" },
  "nav.modules": { ar: "الوحدات", fr: "Modules", en: "Modules" },

  // Topbar
  "top.search": { ar: "ابحث في سجل التدقيق…", fr: "Rechercher dans les audits…", en: "Search audits…" },
  "top.language": { ar: "اللغة", fr: "Langue", en: "Language" },
  "top.demoUser": { ar: "الجهة القانونية", fr: "Direction juridique", en: "Legal department" },

  // Common
  "common.demo": { ar: "عرض توضيحي — بيانات ثابتة", fr: "Démo — données statiques", en: "Demo — static data" },
  "common.demoShort": { ar: "عرض توضيحي", fr: "Démo", en: "Demo" },
  "common.previewOnly": { ar: "واجهة أولية · لا يُرفع أو يُرسل أي ملف", fr: "Aperçu · aucun fichier n'est envoyé", en: "Preview · no file is uploaded or sent" },
  "common.all": { ar: "الكل", fr: "Tous", en: "All" },
  "common.copy": { ar: "نسخ", fr: "Copier", en: "Copy" },
  "common.copied": { ar: "تم النسخ", fr: "Copié", en: "Copied" },
  "common.viewResult": { ar: "عرض نتيجة التدقيق", fr: "Voir l'audit", en: "View audit" },
  "common.toVerify": { ar: "للتحقّق", fr: "à vérifier", en: "to verify" },
  "common.of100": { ar: "من 100", fr: "sur 100", en: "of 100" },

  // Document types
  "doc.supply": { ar: "عقد توريد", fr: "Contrat de fourniture", en: "Supply contract" },
  "doc.services": { ar: "عقد خدمات", fr: "Contrat de services", en: "Services contract" },
  "doc.tender": { ar: "دفتر شروط مناقصة", fr: "Cahier des charges", en: "Tender specification" },
  "doc.nda": { ar: "اتفاقية عدم إفصاح", fr: "Accord de confidentialité", en: "Non-disclosure agreement" },

  // Parties
  "party.buyer": { ar: "مشترٍ", fr: "Acheteur", en: "Buyer" },
  "party.supplier": { ar: "مورّد", fr: "Fournisseur", en: "Supplier" },
  "party.contractor": { ar: "مقاول", fr: "Entrepreneur", en: "Contractor" },
  "party.weDefend": { ar: "نُمثّل مصلحة", fr: "Nous défendons", en: "We defend" },

  // Severity
  "sev.critical": { ar: "حرج", fr: "Critique", en: "Critical" },
  "sev.major": { ar: "جوهري", fr: "Majeur", en: "Major" },
  "sev.minor": { ar: "طفيف", fr: "Mineur", en: "Minor" },

  // Verdict
  "verdict.signable": { ar: "قابل للتوقيع", fr: "Signable", en: "Signable" },
  "verdict.conditional": { ar: "قابل للتوقيع بتحفّظ", fr: "Signable sous réserve", en: "Signable with reservations" },
  "verdict.not-signable": { ar: "غير قابل للتوقيع", fr: "Non signable en l'état", en: "Not signable as drafted" },

  // Checkpoints
  "cp.parties": { ar: "الأطراف والصفة", fr: "Parties & pouvoirs", en: "Parties & powers" },
  "cp.object": { ar: "المحل والتعريفات", fr: "Objet & définitions", en: "Object & definitions" },
  "cp.duration": { ar: "المدة والتجديد", fr: "Durée & renouvellement", en: "Duration & renewal" },
  "cp.price": { ar: "السعر والدفع", fr: "Prix & paiement", en: "Price & payment" },
  "cp.delivery": { ar: "التسليم ونقل الملكية", fr: "Livraison & transfert", en: "Delivery & transfer" },
  "cp.guarantees": { ar: "الضمانات والتأمين", fr: "Garanties & assurances", en: "Guarantees & insurance" },
  "cp.penalties": { ar: "الغرامات", fr: "Pénalités", en: "Penalties" },
  "cp.liability": { ar: "المسؤولية والتعويض", fr: "Responsabilité & indemnisation", en: "Liability & indemnity" },
  "cp.force-majeure": { ar: "القوة القاهرة", fr: "Force majeure", en: "Force majeure" },
  "cp.termination": { ar: "الفسخ والإنهاء", fr: "Résiliation", en: "Termination" },
  "cp.confidentiality": { ar: "السرّية", fr: "Confidentialité", en: "Confidentiality" },
  "cp.hse": { ar: "الصحة والسلامة والبيئة", fr: "HSE", en: "HSE" },
  "cp.law": { ar: "القانون والاختصاص", fr: "Droit & juridiction", en: "Law & jurisdiction" },
  "cp.form": { ar: "الشكل والإحالات", fr: "Forme & renvois", en: "Form & cross-references" },

  // Dashboard
  "dash.title": { ar: "لوحة القيادة", fr: "Tableau de bord", en: "Dashboard" },
  "dash.subtitle": {
    ar: "نظرة شاملة على التدقيقات الأخيرة ومستوى المخاطر عبر محافظ العقود.",
    fr: "Vue d'ensemble des audits récents et de l'exposition au risque sur le portefeuille de contrats.",
    en: "An overview of recent audits and risk exposure across the contract portfolio.",
  },
  "dash.kpi.audited": { ar: "عقود مُدقّقة", fr: "Contrats audités", en: "Contracts audited" },
  "dash.kpi.openRisks": { ar: "مخاطر مفتوحة", fr: "Risques ouverts", en: "Open risks" },
  "dash.kpi.avgRisk": { ar: "متوسط المخاطر", fr: "Risque moyen", en: "Average risk" },
  "dash.kpi.critical": { ar: "ملاحظات حرجة", fr: "Constats critiques", en: "Critical findings" },
  "dash.recent": { ar: "آخر التدقيقات", fr: "Audits récents", en: "Recent audits" },
  "dash.byCategory": { ar: "المخاطر حسب نقطة التحكّم", fr: "Risque par point de contrôle", en: "Risk by checkpoint" },
  "dash.startAudit": { ar: "ابدأ تدقيقاً جديداً", fr: "Lancer un nouvel audit", en: "Start a new audit" },
  "dash.openResult": { ar: "افتح نتيجة نموذجية", fr: "Ouvrir un audit type", en: "Open a sample audit" },
  "dash.thisMonth": { ar: "هذا الشهر", fr: "ce mois-ci", en: "this month" },
  "dash.acrossPortfolio": { ar: "عبر المحفظة", fr: "sur le portefeuille", en: "across the portfolio" },
  "dash.needAttention": { ar: "تتطلّب انتباهاً", fr: "à traiter", en: "need attention" },

  // New audit / upload
  "new.title": { ar: "فحص عقد جديد", fr: "Nouvel audit de contrat", en: "New contract audit" },
  "new.subtitle": {
    ar: "ارفع العقد، حدّد نوع الوثيقة والطرف الذي نُمثّل مصلحته، ثم شغّل التحليل.",
    fr: "Déposez le contrat, précisez le type de document et la partie défendue, puis lancez l'analyse.",
    en: "Upload the contract, set the document type and the party we defend, then run the analysis.",
  },
  "new.drop": { ar: "اسحب الملف وأفلته هنا", fr: "Glissez-déposez le fichier ici", en: "Drag and drop the file here" },
  "new.browse": { ar: "أو تصفّح الملفات", fr: "ou parcourir les fichiers", en: "or browse files" },
  "new.formats": { ar: "صيغ مدعومة: PDF، DOCX — حتى 25 ميغابايت", fr: "Formats pris en charge : PDF, DOCX — jusqu'à 25 Mo", en: "Supported: PDF, DOCX — up to 25 MB" },
  "new.selected": { ar: "الملف المحدّد", fr: "Fichier sélectionné", en: "Selected file" },
  "new.remove": { ar: "إزالة", fr: "Retirer", en: "Remove" },
  "new.docType": { ar: "نوع الوثيقة", fr: "Type de document", en: "Document type" },
  "new.party": { ar: "الطرف الذي نُمثّله", fr: "Partie défendue", en: "Party we defend" },
  "new.partyHint": {
    ar: "يوجّه هذا التحليل لحماية مصالح هذا الطرف تحديداً.",
    fr: "Oriente l'analyse pour protéger spécifiquement les intérêts de cette partie.",
    en: "Steers the analysis to protect this party's interests specifically.",
  },
  "new.analyze": { ar: "شغّل التدقيق", fr: "Lancer l'audit", en: "Run the audit" },
  "new.analyzing": { ar: "جارٍ التحليل…", fr: "Analyse en cours…", en: "Analyzing…" },
  "new.demoNote": {
    ar: "في هذا العرض لا يُرفع أي ملف ولا يُستدعى أي نموذج ذكاء اصطناعي. يعرض الزر نتيجة تدقيق نموذجية واقعية لتوضيح الواجهة.",
    fr: "Dans cette démo, aucun fichier n'est envoyé et aucun modèle d'IA n'est appelé. Le bouton affiche un audit type réaliste pour illustrer l'interface.",
    en: "In this demo no file is uploaded and no AI model is called. The button shows a realistic sample audit to illustrate the interface.",
  },

  // Results
  "res.title": { ar: "نتيجة التدقيق", fr: "Résultat de l'audit", en: "Audit result" },
  "res.subtitle": {
    ar: "مؤشّر المخاطر، الملاحظات بندًا بندًا، الحمايات الناقصة، والشروط التجارية — نتيجة تفاعلية ببيانات نموذجية.",
    fr: "Indicateur de risque, constats clause par clause, protections manquantes et conditions commerciales — résultat interactif sur données type.",
    en: "Risk indicator, clause-by-clause findings, missing protections, and commercial terms — interactive result on sample data.",
  },
  "res.selectSample": { ar: "اختر نموذجاً", fr: "Choisir un exemple", en: "Choose a sample" },
  "res.riskScore": { ar: "مؤشّر المخاطر العام", fr: "Indice de risque global", en: "Overall risk score" },
  "res.verdict": { ar: "الرأي العام", fr: "Avis global", en: "Overall verdict" },
  "res.counterparty": { ar: "الطرف الآخر", fr: "Contrepartie", en: "Counterparty" },
  "res.clauses": { ar: "بنود مُراجَعة", fr: "clauses revues", en: "clauses reviewed" },
  "res.pages": { ar: "صفحات", fr: "pages", en: "pages" },
  "res.tab.synthesis": { ar: "الخلاصة", fr: "Synthèse", en: "Synthesis" },
  "res.tab.findings": { ar: "الملاحظات", fr: "Constats", en: "Findings" },
  "res.tab.missing": { ar: "حمايات ناقصة", fr: "Protections manquantes", en: "Missing protections" },
  "res.tab.commercial": { ar: "شروط تجارية", fr: "Conditions commerciales", en: "Commercial terms" },
  "res.synthesisTitle": { ar: "الخلاصة التنفيذية", fr: "Synthèse exécutive", en: "Executive summary" },
  "res.topRisks": { ar: "أبرز المخاطر", fr: "Risques principaux", en: "Top risks" },
  "res.filterSeverity": { ar: "تصفية حسب الخطورة", fr: "Filtrer par gravité", en: "Filter by severity" },
  "res.filterCheckpoint": { ar: "تصفية حسب نقطة التحكّم", fr: "Filtrer par point de contrôle", en: "Filter by checkpoint" },
  "res.current": { ar: "الصياغة الحالية", fr: "Rédaction actuelle", en: "Current drafting" },
  "res.defect": { ar: "العيب", fr: "Défaut", en: "Defect" },
  "res.risk": { ar: "الخطر على مصلحتنا", fr: "Risque pour nous", en: "Risk for us" },
  "res.proposed": { ar: "صياغة مقترحة", fr: "Rédaction proposée", en: "Proposed drafting" },
  "res.basis": { ar: "الأساس القانوني", fr: "Fondement juridique", en: "Legal basis" },
  "res.whyMissing": { ar: "لماذا هذا مهم", fr: "Pourquoi c'est important", en: "Why it matters" },
  "res.addClause": { ar: "بند مقترح للإضافة", fr: "Clause à ajouter", en: "Clause to add" },
  "res.commercialNote": {
    ar: "تُعرَض الشروط التجارية (السعر، الكميات، التخفيضات) للإشارة فقط، ولا تُعدَّل في المراجعة القانونية.",
    fr: "Les conditions commerciales (prix, quantités, remises) sont signalées pour information et ne sont pas retouchées par la revue juridique.",
    en: "Commercial terms (price, quantities, discounts) are flagged for information only and are not changed by the legal review.",
  },
  "res.noFindings": { ar: "لا ملاحظات ضمن هذا التصفية", fr: "Aucun constat pour ce filtre", en: "No findings for this filter" },
  "res.noFindingsHint": { ar: "جرّب خطورة أو نقطة تحكّم أخرى.", fr: "Essayez une autre gravité ou point de contrôle.", en: "Try another severity or checkpoint." },
  "res.resolve": { ar: "اعتبره مُعالَجاً", fr: "Marquer traité", en: "Mark handled" },
  "res.resolved": { ar: "مُعالَج", fr: "Traité", en: "Handled" },
  "res.undo": { ar: "تراجع", fr: "Annuler", en: "Undo" },
  "res.handledNote": {
    ar: "الحالات تُحفظ في هذا المتصفّح فقط وتُمحى عند إعادة التحميل.",
    fr: "Les états ne vivent que dans cet onglet et disparaissent au rechargement.",
    en: "States live in this tab only and reset on reload.",
  },
  "res.export": { ar: "تصدير التقرير", fr: "Exporter le rapport", en: "Export report" },

  // Tender review
  "tender.title": { ar: "مراجعة دفاتر الشروط", fr: "Revue des cahiers des charges", en: "Tender specification review" },
  "tender.subtitle": {
    ar: "تحليل دفاتر شروط المناقصات: البنود التمييزية، المخاطر الفنية والمالية، والشروط المفقودة قبل تقديم العرض.",
    fr: "Analyse des cahiers des charges : clauses discriminatoires, risques techniques et financiers, et exigences manquantes avant soumission.",
    en: "Analysis of tender specifications: discriminatory clauses, technical and financial risks, and missing requirements before bidding.",
  },

  // Audit log
  "log.title": { ar: "سجل التدقيق", fr: "Journal d'audit", en: "Audit log" },
  "log.subtitle": {
    ar: "كل تدقيق أُجري، مع مستوى المخاطر والحالة — مرتّبة من الأحدث.",
    fr: "Tous les audits réalisés, avec niveau de risque et statut — les plus récents d'abord.",
    en: "Every audit run, with its risk level and status — most recent first.",
  },
  "log.col.document": { ar: "الوثيقة", fr: "Document", en: "Document" },
  "log.col.type": { ar: "النوع", fr: "Type", en: "Type" },
  "log.col.party": { ar: "الطرف", fr: "Partie", en: "Party" },
  "log.col.date": { ar: "التاريخ", fr: "Date", en: "Date" },
  "log.col.findings": { ar: "الملاحظات", fr: "Constats", en: "Findings" },
  "log.col.risk": { ar: "المخاطر", fr: "Risque", en: "Risk" },
  "log.col.status": { ar: "الحالة", fr: "Statut", en: "Status" },
  "log.status.completed": { ar: "مكتمل", fr: "Terminé", en: "Completed" },
  "log.status.in-progress": { ar: "قيد التنفيذ", fr: "En cours", en: "In progress" },
  "log.status.action-required": { ar: "يتطلّب إجراءً", fr: "Action requise", en: "Action required" },
  "log.searchPlaceholder": { ar: "ابحث باسم الوثيقة أو الطرف…", fr: "Nom du document ou partie…", en: "Document name or party…" },

  // Rules
  "rules.title": { ar: "القواعد التنظيمية المخصّصة", fr: "Règles réglementaires personnalisées", en: "Custom regulatory rules" },
  "rules.subtitle": {
    ar: "عرّف القواعد التي يفرضها القانون أو سياسة المؤسسة، فيتحقّق منها المدقّق في كل عقد.",
    fr: "Définissez les règles imposées par la loi ou la politique interne ; l'auditeur les contrôle sur chaque contrat.",
    en: "Define the rules imposed by law or internal policy; the auditor checks each contract against them.",
  },
  "rules.requirement": { ar: "ما يتحقّق منه", fr: "Ce qui est contrôlé", en: "What is checked" },
  "rules.appliesTo": { ar: "يُطبَّق على", fr: "S'applique à", en: "Applies to" },
  "rules.builtIn": { ar: "قاعدة مدمجة", fr: "Règle intégrée", en: "Built-in" },
  "rules.enabled": { ar: "مُفعّلة", fr: "Activée", en: "Enabled" },
  "rules.disabled": { ar: "معطّلة", fr: "Désactivée", en: "Disabled" },
  "rules.add": { ar: "أضف قاعدة", fr: "Ajouter une règle", en: "Add a rule" },
  "rules.addDisabled": {
    ar: "إضافة القواعد وحفظها متاح في المرحلة التالية مع قاعدة البيانات.",
    fr: "La création et la sauvegarde des règles arrivent à la prochaine phase avec la base de données.",
    en: "Creating and saving rules arrives in the next phase with the database.",
  },

  // Subscription
  "sub.title": { ar: "الاشتراك", fr: "Abonnement", en: "Subscription" },
  "sub.subtitle": {
    ar: "اختر الخطة المناسبة لحجم فريقك القانوني. الأسعار توضيحية.",
    fr: "Choisissez le plan adapté à votre équipe juridique. Les prix sont indicatifs.",
    en: "Choose the plan that fits your legal team. Prices are indicative.",
  },
  "sub.perMonth": { ar: "/ شهرياً", fr: "/ mois", en: "/ month" },
  "sub.onRequest": { ar: "حسب الطلب", fr: "Sur devis", en: "On request" },
  "sub.current": { ar: "خطتك الحالية", fr: "Votre plan actuel", en: "Your current plan" },
  "sub.choose": { ar: "اختر هذه الخطة", fr: "Choisir ce plan", en: "Choose this plan" },
  "sub.contact": { ar: "تواصل مع المبيعات", fr: "Contacter les ventes", en: "Contact sales" },
  "sub.plan.essential": { ar: "الأساسي", fr: "Essentiel", en: "Essential" },
  "sub.plan.cabinet": { ar: "المكتب القانوني", fr: "Cabinet", en: "Firm" },
  "sub.plan.enterprise": { ar: "المؤسسة", fr: "Entreprise", en: "Enterprise" },
  "sub.aud.essential": { ar: "للمستشار القانوني المستقل", fr: "Juriste indépendant", en: "Solo counsel" },
  "sub.aud.cabinet": { ar: "لفريق قانوني صغير", fr: "Petite équipe juridique", en: "Small legal team" },
  "sub.aud.enterprise": { ar: "لإدارة قانونية كاملة", fr: "Direction juridique complète", en: "Full legal department" },
  "sub.feat.audits10": { ar: "حتى 10 تدقيقات شهرياً", fr: "Jusqu'à 10 audits par mois", en: "Up to 10 audits per month" },
  "sub.feat.auditsUnlimited": { ar: "تدقيقات غير محدودة", fr: "Audits illimités", en: "Unlimited audits" },
  "sub.feat.docTypes": { ar: "كل أنواع الوثائق", fr: "Tous les types de documents", en: "All document types" },
  "sub.feat.redraft": { ar: "صياغات بديلة جاهزة للإدراج", fr: "Rédactions de remplacement prêtes à insérer", en: "Ready-to-insert redrafts" },
  "sub.feat.customRules": { ar: "قواعد تنظيمية مخصّصة", fr: "Règles réglementaires personnalisées", en: "Custom regulatory rules" },
  "sub.feat.seats3": { ar: "حتى 3 مستخدمين", fr: "Jusqu'à 3 utilisateurs", en: "Up to 3 seats" },
  "sub.feat.seatsUnlimited": { ar: "مستخدمون غير محدودين", fr: "Utilisateurs illimités", en: "Unlimited seats" },
  "sub.feat.sso": { ar: "دخول موحّد SSO وتدقيق أمني", fr: "SSO et piste d'audit", en: "SSO and audit trail" },
  "sub.feat.api": { ar: "واجهة برمجية API", fr: "Accès API", en: "API access" },
  "sub.feat.support": { ar: "دعم ذو أولوية", fr: "Support prioritaire", en: "Priority support" },
  "sub.feat.onprem": { ar: "استضافة خاصة ممكنة", fr: "Hébergement dédié possible", en: "Dedicated hosting available" },
};

/** Translate a key. Falls back to French, then the key itself. */
export function translate(key: string, lang: Lang): string {
  const entry = DICT[key];
  if (!entry) return key;
  return entry[lang] ?? entry.fr ?? key;
}
