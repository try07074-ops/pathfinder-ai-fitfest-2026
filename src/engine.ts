import type { Opportunity, Profile } from './data'

export interface MatchBreakdown {
  score: number
  education: boolean
  skillMatches: string[]
  interest: boolean
  locationMode: boolean
  experience: boolean
  category: boolean
}

const normalize = (value: string) => value.trim().toLowerCase()

const includesAny = (values: string[], candidates: string[]) =>
  values.some((value) => candidates.some((candidate) => normalize(value).includes(normalize(candidate)) || normalize(candidate).includes(normalize(value))))

export function getMatch(opportunity: Opportunity, profile: Profile): MatchBreakdown {
  const profileSkills = profile.skills.map(normalize)
  const opportunitySkills = opportunity.skills.map(normalize)
  const skillMatches = opportunity.skills.filter((skill) => profileSkills.some((profileSkill) => profileSkill === normalize(skill) || profileSkill.includes(normalize(skill)) || normalize(skill).includes(profileSkill)))
  const education = opportunity.education.some((level) => normalize(level) === normalize(profile.education) || normalize(profile.education).includes(normalize(level)) || normalize(level).includes(normalize(profile.education)))
  const skillRatio = opportunitySkills.length === 0 ? 0 : skillMatches.length / opportunitySkills.length
  const interest = includesAny([...profile.interests, ...profile.skills], opportunity.tags) || includesAny(profile.interests, [opportunity.category])
  const locationMode =
    profile.mode === 'Any' ||
    normalize(opportunity.mode) === normalize(profile.mode) ||
    normalize(opportunity.location).includes(normalize(profile.location)) ||
    (normalize(profile.location).split(',')[0] !== '' && normalize(opportunity.location).includes(normalize(profile.location).split(',')[0]))
  const experience = opportunity.experience === 'Any level' || (opportunity.experience === 'Beginner-friendly' && ['Beginner', 'Intermediate'].includes(profile.experience)) || normalize(opportunity.experience).includes(normalize(profile.experience))
  const category = profile.categories.includes(opportunity.category)
  const educationPoints = education ? 25 : 0
  const skillPoints = Math.round(skillRatio * 25)
  const interestPoints = interest ? 20 : 0
  const locationModePoints = locationMode ? 10 : 0
  const experiencePoints = experience ? 10 : 0
  const categoryPoints = category ? 10 : 0

  return {
    score: Math.min(100, educationPoints + skillPoints + interestPoints + locationModePoints + experiencePoints + categoryPoints),
    education,
    skillMatches,
    interest,
    locationMode,
    experience,
    category,
  }
}

export function explainMatch(match: MatchBreakdown) {
  return [
    { label: 'Education match', active: match.education, detail: match.education ? 'Your study level is eligible' : 'Check the education requirements' },
    { label: 'Skill matches', active: match.skillMatches.length > 0, detail: match.skillMatches.length > 0 ? match.skillMatches.join(', ') : 'Build one of the listed skills' },
    { label: 'Interest match', active: match.interest, detail: match.interest ? 'Fits your stated interests' : 'Related to your broader discovery set' },
    { label: 'Location / mode', active: match.locationMode, detail: match.locationMode ? 'Works with your location preference' : 'Different from your current mode preference' },
    { label: 'Experience fit', active: match.experience, detail: match.experience ? 'Appropriate for your experience' : 'May ask for more experience' },
    { label: 'Preferred category', active: match.category, detail: match.category ? 'One of your preferred categories' : 'Outside your selected categories' },
  ]
}