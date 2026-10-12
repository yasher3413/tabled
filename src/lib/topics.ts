// Fixed topic taxonomy for bills. Summaries may only tag topics from this list (checked by the validator).
import type { Locale } from "@/i18n/config"

export const TOPICS = {
  "agriculture-food": { en: "Agriculture and food", fr: "Agriculture et alimentation" },
  "budget-taxes": { en: "Budget and taxes", fr: "Budget et impôts" },
  "crime-justice": { en: "Crime and justice", fr: "Criminalité et justice" },
  "defence-security": { en: "Defence and security", fr: "Défense et sécurité" },
  "democracy-elections": { en: "Democracy and elections", fr: "Démocratie et élections" },
  "economy-business": { en: "Economy and business", fr: "Économie et entreprises" },
  education: { en: "Education", fr: "Éducation" },
  "energy-resources": { en: "Energy and natural resources", fr: "Énergie et ressources naturelles" },
  "environment-climate": { en: "Environment and climate", fr: "Environnement et climat" },
  "families-children": { en: "Families and children", fr: "Familles et enfants" },
  health: { en: "Health", fr: "Santé" },
  housing: { en: "Housing", fr: "Logement" },
  "immigration-citizenship": { en: "Immigration and citizenship", fr: "Immigration et citoyenneté" },
  "indigenous-peoples": { en: "Indigenous peoples", fr: "Peuples autochtones" },
  "labour-employment": { en: "Labour and employment", fr: "Travail et emploi" },
  "rights-equality": { en: "Rights and equality", fr: "Droits et égalité" },
  "technology-privacy": { en: "Technology and privacy", fr: "Technologie et vie privée" },
  "trade-foreign-affairs": { en: "Trade and foreign affairs", fr: "Commerce et affaires étrangères" },
  "transport-infrastructure": { en: "Transport and infrastructure", fr: "Transports et infrastructures" },
  "seniors-veterans": { en: "Seniors and veterans", fr: "Aînés et anciens combattants" },
  "government-operations": { en: "Government operations", fr: "Fonctionnement du gouvernement" },
  "commemoration": { en: "Commemorations and observances", fr: "Commémorations et journées" },
} as const

export type TopicId = keyof typeof TOPICS
export const TOPIC_IDS = Object.keys(TOPICS) as TopicId[]

export function isTopic(id: string): id is TopicId {
  return id in TOPICS
}

export function topicLabel(id: string, locale: Locale): string {
  return isTopic(id) ? TOPICS[id][locale] : id
}
