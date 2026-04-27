// Mock data for L'Étudiant Admin Console

export interface Lead {
  id: string
  name: string
  academic_level: string
  total_score: number
  intent_score: number
  engagement_score: number
  monetisable_score: number
  tier_label: "BASE" | "SILVER" | "GOLD" | "PLATINUM"
  tier_eur: number
  resell_factor: number
  monetisable_value_eur: number
  why_driver: string
  action: string
  is_minor_under15: boolean
  consent_partner: boolean
  consent_call: boolean
  timeline_events: { time: string; label: string; icon: string; detail?: string }[]
}

export interface Stand {
  rank: number
  name: string
  sector: "Tech" | "Business" | "Art" | "Santé"
  hall: "A" | "B" | "C"
  zone: string
  stand_scans: number
  brochure_downloads: number
  mini_game_engagement: number
  conversion_rate: number
  trend_delta: number
  high_intent_scans: number
  avg_score: number
  dwell_time: string
  intent_level: "ÉLEVÉ" | "MOYEN" | "FAIBLE"
}

export interface Conference {
  id: string
  title: string
  tags: string[]
  scans: number
  slide_downloads: number
  engagement_rate: number
  trend_delta: number
  location: string
  time: string
}

export interface HourlyEngagement {
  hour: string
  scans_stand: number
  scans_conference: number
}

// Generate leads
const firstNames = ["Julien", "Léa", "Thomas", "Sarah", "Marc", "Camille", "Hugo", "Chloé", "Enzo", "Manon", "Lucas", "Inès", "Nathan", "Jade", "Léo", "Emma", "Louis", "Alice", "Raphaël", "Louise", "Gabriel", "Zoé", "Arthur", "Charlotte", "Jules", "Amandine", "Paul", "Sophie", "Maxime", "Clara"]
const lastNames = ["Depardieu", "Martinez", "Claire", "Vallee", "Antoine", "Petit", "Bernard", "Dubois", "Simon", "Leroy", "Roux", "Morel", "Garcia", "Robert", "Richard", "Durand", "Moreau", "Laurent", "Michel", "Fournier", "Lefebvre", "Mercier", "Bonnet", "Dupont", "Girard", "Andre", "Lefevre", "Rousseau", "Vincent", "Muller"]
const levels = ["Terminale", "Bac+1", "Bac+2", "Bac+3", "Licence", "Master 1", "Master 2", "Première"]
const actions = ["Exhibitor Scan", "Quiz Completion", "Newsletter Opt-in", "Webinar Attendee", "Direct Appointment", "Brochure Download", "Organic Search", "Social Ad Click", "Campus Visit", "Email Engagement", "Portal Inquiry", "Form Submission", "Reference", "Event Sign-up", "App Download"]

function getTierFromScore(score: number): { label: "BASE" | "SILVER" | "GOLD" | "PLATINUM"; eur: number } {
  if (score >= 90) return { label: "PLATINUM", eur: 23 }
  if (score >= 75) return { label: "GOLD", eur: 15 }
  if (score >= 50) return { label: "SILVER", eur: 3 }
  return { label: "BASE", eur: 0 }
}

export const leads: Lead[] = Array.from({ length: 60 }, (_, i) => {
  const intent = Math.floor(Math.random() * 40) + 60
  const engagement = Math.floor(Math.random() * 40) + 60
  const monetisable = Math.floor(Math.random() * 40) + 60
  const total = Math.floor((intent * 0.4 + engagement * 0.35 + monetisable * 0.25))
  const tier = getTierFromScore(total)
  const factor = [1, 1, 2, 2, 2, 3][Math.floor(Math.random() * 6)]
  const isMinor = Math.random() < 0.08
  
  return {
    id: `ETD-${92841 + i}`,
    name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    academic_level: levels[Math.floor(Math.random() * levels.length)],
    total_score: total,
    intent_score: intent,
    engagement_score: engagement,
    monetisable_score: monetisable,
    tier_label: tier.label,
    tier_eur: tier.eur,
    resell_factor: factor,
    monetisable_value_eur: parseFloat((tier.eur * factor * (1 + Math.random() * 0.5)).toFixed(2)),
    why_driver: actions[Math.floor(Math.random() * actions.length)],
    action: ["Export", "Nurture ORI", "Consent", "Anonymised export"][Math.floor(Math.random() * 4)],
    is_minor_under15: isMinor,
    consent_partner: Math.random() > 0.3,
    consent_call: Math.random() > 0.5,
    timeline_events: [
      { time: "AUJOURD'HUI, 14:20", label: "Scan Hall de Conférence", icon: "scan", detail: "Le Salon de l'Étudiant - Paris" },
      { time: "AUJOURD'HUI, 11:45", label: "Visite Stand: HEC Paris", icon: "visit", detail: "Contact établi avec le responsable de recrutement" },
      { time: "HIER, 09:12", label: "Enregistrement Portail", icon: "register", detail: "Activation badge numérique et synchro profil" },
      { time: "IL Y A 3 JOURS", label: "Inscription Newsletter", icon: "newsletter", detail: "Opt-in pour les communications partenaires" },
    ]
  }
})

// Generate stands
const standNames = [
  "Epitech Technology", "HEC Paris", "Sorbonne Université", "Engineering Lyon", "Business School", "Tech Academy",
  "ESSEC Business School", "École Polytechnique", "Sciences Po", "ESCP Europe", "EDHEC", "EM Lyon",
  "Centrale Paris", "ENSAE", "Mines ParisTech", "Arts et Métiers", "KEDGE Business School", "Audencia",
  "Grenoble École de Management", "TBS Education", "IESEG", "SKEMA", "NEOMA", "ICN Business School",
  "Montpellier Business School", "ISC Paris", "EDC Paris", "ESSCA", "PSB Paris School of Business", "IPAG"
]

export const stands: Stand[] = standNames.map((name, i) => {
  const sectors: ("Tech" | "Business" | "Art" | "Santé")[] = ["Tech", "Business", "Art", "Santé"]
  const halls: ("A" | "B" | "C")[] = ["A", "B", "C"]
  const scans = Math.floor(Math.random() * 2000) + 300
  const downloads = Math.floor(scans * (0.4 + Math.random() * 0.4))
  const conversion = parseFloat((10 + Math.random() * 15).toFixed(1))
  const avgScore = Math.floor(70 + Math.random() * 25)
  
  return {
    rank: i + 1,
    name,
    sector: sectors[i % 4],
    hall: halls[i % 3],
    zone: `ZONE ${String(Math.floor(Math.random() * 15) + 1).padStart(2, "0")}`,
    stand_scans: scans,
    brochure_downloads: downloads,
    mini_game_engagement: Math.floor(Math.random() * 100),
    conversion_rate: conversion,
    trend_delta: parseFloat((-20 + Math.random() * 50).toFixed(1)),
    high_intent_scans: Math.floor(scans * 0.15),
    avg_score: avgScore,
    dwell_time: `${Math.floor(5 + Math.random() * 10)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
    intent_level: avgScore > 85 ? "ÉLEVÉ" : avgScore > 70 ? "MOYEN" : "FAIBLE"
  }
})

// Sort stands by scans
stands.sort((a, b) => b.stand_scans - a.stand_scans)
stands.forEach((s, i) => s.rank = i + 1)

// Generate conferences
export const conferences: Conference[] = [
  { id: "C1", title: "Se réorienter après une Licence", tags: ["ORIENTATION", "POST-LICENCE"], scans: 1248, slide_downloads: 432, engagement_rate: 85, trend_delta: 12, location: "Amphi 1", time: "14:30 - 15:30" },
  { id: "C2", title: "Les métiers de la Tech en 2024", tags: ["TECH", "EMPLOI"], scans: 982, slide_downloads: 356, engagement_rate: 78, trend_delta: 8, location: "Salle A", time: "10:00 - 11:00" },
  { id: "C3", title: "Comment financer ses études ?", tags: ["FINANCEMENT", "BOURSES"], scans: 876, slide_downloads: 421, engagement_rate: 82, trend_delta: 15, location: "Amphi 2", time: "11:30 - 12:30" },
  { id: "C4", title: "L'alternance : mode d'emploi", tags: ["ALTERNANCE", "EMPLOI"], scans: 754, slide_downloads: 289, engagement_rate: 71, trend_delta: -3, location: "Salle B", time: "14:00 - 15:00" },
  { id: "C5", title: "Études à l'étranger", tags: ["INTERNATIONAL", "MOBILITÉ"], scans: 698, slide_downloads: 234, engagement_rate: 68, trend_delta: 22, location: "Salle C", time: "15:30 - 16:30" },
  { id: "C6", title: "Parcoursup : les clés du succès", tags: ["PARCOURSUP", "ORIENTATION"], scans: 1456, slide_downloads: 567, engagement_rate: 91, trend_delta: 5, location: "Grand Amphi", time: "09:00 - 10:00" },
  { id: "C7", title: "Les écoles de commerce", tags: ["BUSINESS", "GRANDES ÉCOLES"], scans: 623, slide_downloads: 198, engagement_rate: 65, trend_delta: -8, location: "Salle D", time: "16:00 - 17:00" },
  { id: "C8", title: "Médecine et santé", tags: ["SANTÉ", "MÉDECINE"], scans: 589, slide_downloads: 267, engagement_rate: 74, trend_delta: 11, location: "Amphi 3", time: "13:00 - 14:00" },
  { id: "C9", title: "Arts et création", tags: ["ART", "DESIGN"], scans: 412, slide_downloads: 156, engagement_rate: 62, trend_delta: -2, location: "Espace Créatif", time: "15:00 - 16:00" },
  { id: "C10", title: "Ingénierie et Sciences", tags: ["INGÉNIEUR", "SCIENCES"], scans: 834, slide_downloads: 312, engagement_rate: 76, trend_delta: 18, location: "Amphi 1", time: "11:00 - 12:00" },
  { id: "C11", title: "Droit et Sciences Politiques", tags: ["DROIT", "SCIENCES PO"], scans: 567, slide_downloads: 234, engagement_rate: 69, trend_delta: 4, location: "Salle E", time: "14:30 - 15:30" },
  { id: "C12", title: "Entrepreneuriat étudiant", tags: ["STARTUP", "ENTREPRENEURIAT"], scans: 445, slide_downloads: 178, engagement_rate: 72, trend_delta: 25, location: "Espace Innovation", time: "16:30 - 17:30" },
  { id: "C13", title: "Les métiers du numérique", tags: ["DIGITAL", "TECH"], scans: 723, slide_downloads: 289, engagement_rate: 77, trend_delta: 14, location: "Salle F", time: "10:30 - 11:30" },
  { id: "C14", title: "Communication et Marketing", tags: ["MARKETING", "COMMUNICATION"], scans: 534, slide_downloads: 201, engagement_rate: 66, trend_delta: -5, location: "Salle G", time: "13:30 - 14:30" },
  { id: "C15", title: "Développement durable et RSE", tags: ["RSE", "ENVIRONNEMENT"], scans: 489, slide_downloads: 187, engagement_rate: 73, trend_delta: 31, location: "Espace Vert", time: "15:30 - 16:30" },
]

// Generate hourly engagement data
export const hourlyEngagement: HourlyEngagement[] = [
  { hour: "08:00", scans_stand: 45, scans_conference: 20 },
  { hour: "09:00", scans_stand: 120, scans_conference: 85 },
  { hour: "10:00", scans_stand: 234, scans_conference: 156 },
  { hour: "11:00", scans_stand: 312, scans_conference: 198 },
  { hour: "12:00", scans_stand: 287, scans_conference: 134 },
  { hour: "13:00", scans_stand: 198, scans_conference: 167 },
  { hour: "14:00", scans_stand: 356, scans_conference: 245 },
  { hour: "15:00", scans_stand: 423, scans_conference: 289 },
  { hour: "16:00", scans_stand: 389, scans_conference: 312 },
  { hour: "17:00", scans_stand: 298, scans_conference: 234 },
  { hour: "18:00", scans_stand: 187, scans_conference: 145 },
  { hour: "19:00", scans_stand: 89, scans_conference: 67 },
  { hour: "20:00", scans_stand: 34, scans_conference: 23 },
]

// Dashboard KPIs
export const dashboardKPIs = {
  revenue_velocity: 428500,
  revenue_growth: 12.4,
  confidence: 94,
  total_leads: 12400,
  opt_in_partner: 64,
  opt_in_partner_delta: 3,
  opt_in_call: 42,
  opt_in_call_delta: -1,
  tier_distribution: {
    tier1_vip: 1240,
    tier2_high: 4820,
    tier3_medium: 6340,
  },
  timeline_stages: [
    { stage: "INSCRIPTION", score: 20, value: 5 },
    { stage: "AVANT L'ÉVÉNEMENT", score: 45, value: 18 },
    { stage: "PENDANT L'ÉVÉNEMENT", score: 85, value: 55 },
    { stage: "APRÈS L'ÉVÉNEMENT", score: 92, value: 72 },
  ],
  measurement_plan: [
    { indicator: "Qualité des Données", method: "API de Validation", frequency: "TEMPS RÉEL", threshold: "< 98.5%", action: "Bloquer Export" },
    { indicator: "Intention Partenaire", method: "Analyse NLP", frequency: "HORAIRE", threshold: "< 15.0%", action: "Alerte Ops" },
    { indicator: "Vélocité des Leads", method: "Flux d'Événements", frequency: "QUOTIDIEN", threshold: "> 500/h", action: "Mise à l'échelle" },
  ],
  high_intensity_signals: [
    { name: "Amandine V.", tier: 1, interaction: "Séminaire Master", value: 185, timeAgo: "2 MINS" },
    { name: "Thomas G.", tier: 2, interaction: "Stand Salon Ingénieurs", value: 95, timeAgo: "14 MINS" },
    { name: "Inès M.", tier: 1, interaction: "Portail Études Internationales", value: 210, timeAgo: "32 MINS" },
  ]
}

// Stands KPIs
export const standsKPIs = {
  stand_scans: { value: 1248, delta: 12 },
  brochure_dl: { value: 842, delta: 5 },
  mini_jeux: { value: 315, delta: -2 },
  conf_scans: { value: 2104, delta: 24 },
  high_intent: { value: 156, delta: 8 },
  capture_rate: { value: 68, delta: 3 },
}
