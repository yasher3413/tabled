// French versions of the hand-written stage explainers in src/lib/stages.ts. Written by hand, not generated.
import type { StageInfo } from "@/lib/stages"

export const HOUSE_FR: Record<string, StageInfo> = {
  "first-reading": {
    label: "Première lecture",
    short: "1re",
    explainer:
      "Le projet de loi est déposé à la Chambre des communes et imprimé pour que les députés puissent le lire. Il n’y a encore ni débat ni vote sur son contenu.",
  },
  "second-reading": {
    label: "Deuxième lecture",
    short: "2e",
    explainer:
      "Les députés débattent du principe du projet de loi. Si une majorité vote pour, il est renvoyé à un comité pour un examen plus approfondi.",
  },
  committee: {
    label: "Comité",
    short: "Comité",
    explainer:
      "Un petit groupe de députés étudie le projet de loi article par article. Il peut entendre des experts et le public, et proposer des modifications (amendements).",
  },
  report: {
    label: "Étape du rapport",
    short: "Rapport",
    explainer:
      "Le comité fait rapport à l’ensemble de la Chambre. Tous les députés peuvent alors débattre de modifications à des parties précises du projet de loi et voter sur celles-ci.",
  },
  "third-reading": {
    label: "Troisième lecture",
    short: "3e",
    explainer:
      "Le dernier débat et le dernier vote à la Chambre des communes sur l’ensemble du projet de loi. S’il est adopté, il est envoyé au Sénat.",
  },
}

export const SENATE_FR: Record<string, StageInfo> = {
  "first-reading": {
    label: "Première lecture",
    short: "1re",
    explainer: "Le projet de loi est déposé au Sénat et imprimé. Il n’y a pas encore de débat.",
  },
  "second-reading": {
    label: "Deuxième lecture",
    short: "2e",
    explainer:
      "Les sénateurs débattent du principe du projet de loi. S’ils l’approuvent en principe, il est renvoyé à un comité sénatorial.",
  },
  committee: {
    label: "Comité",
    short: "Comité",
    explainer:
      "Un comité du Sénat étudie le projet de loi en détail, entend des témoins et peut recommander des amendements.",
  },
  report: {
    label: "Étape du rapport",
    short: "Rapport",
    explainer: "Le Sénat examine le rapport du comité et les amendements qu’il recommande.",
  },
  "third-reading": {
    label: "Troisième lecture",
    short: "3e",
    explainer:
      "Le vote final du Sénat sur le projet de loi. Si les sénateurs l’ont modifié, la Chambre doit accepter les modifications avant qu’il puisse devenir loi.",
  },
}

export const ROYAL_ASSENT_FR: StageInfo = {
  label: "Sanction royale",
  short: "Loi",
  explainer:
    "Le gouverneur général approuve officiellement le projet de loi au nom du Roi. Il a maintenant force de loi, même si certaines parties peuvent n’entrer en vigueur qu’à une date ultérieure.",
}

export const BILL_TYPE_EXPLAINERS_FR: Record<string, string> = {
  government:
    "Déposé par un ministre au nom du gouvernement. Les projets de loi du gouvernement disposent de temps réservé pour le débat; ce sont donc ceux qui ont le plus de chances de devenir loi.",
  private_member:
    "Déposé par un député qui n’est pas ministre. Ces projets de loi sont soumis à un tirage au sort pour obtenir du temps de débat, et la plupart ne deviennent pas loi.",
  senate_public:
    "Déposé par un sénateur. Si le Sénat l’adopte, il est envoyé à la Chambre des communes, où un député doit accepter de le parrainer.",
  senate_private:
    "Concerne une personne ou une organisation précise plutôt que le public, par exemple la modification de la charte d’une entreprise. Ces projets de loi commencent au Sénat.",
}

export const PRIVATE_VS_GOVERNMENT_FR = `Les projets de loi du gouvernement sont déposés par des ministres et mettent en œuvre le programme du gouvernement. Ils disposent de temps de débat réservé et sont presque toujours adoptés lorsque le gouvernement détient la majorité des voix. Les projets de loi émanant des députés sont déposés par des députés qui ne sont pas ministres. Leur ordre de passage est déterminé par tirage au sort, le temps de débat est limité, et beaucoup ne sont jamais mis aux voix. Un projet de loi « hors de l’ordre de priorité » a été déposé, mais n’a pas encore été tiré au sort pour être débattu.`
