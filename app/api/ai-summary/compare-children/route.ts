import { NextResponse } from "next/server"

type RawChild = {
  id?: string
  name?: string
  wordsLearned?: number
  hoursLearned?: number
  weeklyProgress?: number
  totalSessions?: number
  recentWords?: string[]
}

type ChildMetrics = {
  id: string
  name: string
  wordsLearned: number
  hoursLearned: number
  weeklyProgress: number
  totalSessions: number
  recentWords: string[]
}

export async function POST(request: Request) {
  const { children }: { children?: RawChild[] } = await request.json()

  const normalizedChildren: ChildMetrics[] = (children ?? []).map((child, index) => ({
    id: child.id ?? `child-${index}`,
    name: (child.name ?? "Unknown Learner").trim() || "Unknown Learner",
    wordsLearned: Number.isFinite(child.wordsLearned) ? Number(child.wordsLearned) : 0,
    hoursLearned: Number.isFinite(child.hoursLearned) ? Number(child.hoursLearned) : 0,
    weeklyProgress: Number.isFinite(child.weeklyProgress) ? Number(child.weeklyProgress) : 0,
    totalSessions: Number.isFinite(child.totalSessions) ? Number(child.totalSessions) : 0,
    recentWords: Array.isArray(child.recentWords)
      ? child.recentWords.filter((word): word is string => typeof word === "string" && word.trim().length > 0)
      : [],
  }))

  if (normalizedChildren.length === 0) {
    return NextResponse.json({
      summary:
        "Moe needs learning data to compare your children. Once they log study sessions, you'll see highlights, gaps, and next steps here.",
    })
  }

  const count = normalizedChildren.length
  const wordsTotal = normalizedChildren.reduce((sum, child) => sum + child.wordsLearned, 0)
  const hoursTotal = normalizedChildren.reduce((sum, child) => sum + child.hoursLearned, 0)
  const sessionsTotal = normalizedChildren.reduce((sum, child) => sum + child.totalSessions, 0)

  const averageWords = wordsTotal / count
  const averageHours = hoursTotal / count
  const averageWeeklyProgress =
    normalizedChildren.reduce((sum, child) => sum + child.weeklyProgress, 0) / count

  const wordsLeaders = [...normalizedChildren].sort((a, b) => b.wordsLearned - a.wordsLearned)
  const practiceLeaders = [...normalizedChildren].sort((a, b) => b.hoursLearned - a.hoursLearned)
  const streakLeaders = [...normalizedChildren].sort((a, b) => b.weeklyProgress - a.weeklyProgress)

  const topVocabulary = wordsLeaders[0]
  const bottomVocabulary = wordsLeaders[wordsLeaders.length - 1]
  const vocabularyGap = topVocabulary.wordsLearned - bottomVocabulary.wordsLearned

  const topPractice = practiceLeaders[0]
  const bottomPractice = practiceLeaders[practiceLeaders.length - 1]
  const practiceGap = topPractice.hoursLearned - bottomPractice.hoursLearned

  const behindOnVocabulary = normalizedChildren.filter((child) => child.wordsLearned < averageWords * 0.5)
  const lowWeeklyProgress = normalizedChildren.filter((child) => child.weeklyProgress < 25)
  const idleStudents = normalizedChildren.filter((child) => child.totalSessions === 0 || child.hoursLearned < 0.25)

  const formatHours = (value: number) => `${Math.round(value * 10) / 10} hour${value === 1 ? "" : "s"}`
  const formatWords = (value: number) => `${value} word${value === 1 ? "" : "s"}`

  const lines: string[] = []

  lines.push(`**Moe compared ${count} learner${count === 1 ? "" : "s"}.**`)
  lines.push("")
  lines.push("### Quick Highlights")
  lines.push("")
  lines.push(
    `- **Vocabulary leader:** ${topVocabulary.name} with ${formatWords(topVocabulary.wordsLearned)} logged.`,
  )
  lines.push(`- **Study-time leader:** ${topPractice.name} at ${formatHours(topPractice.hoursLearned)} total.`)
  lines.push(
    `- **Average pace:** ${formatWords(Math.round(averageWords))}, ${formatHours(averageHours)}, and ${Math.round(averageWeeklyProgress)}% weekly streaks.`,
  )

  if (vocabularyGap > 0 && count > 1) {
    lines.push(
      `- **Vocabulary gap:** ${topVocabulary.name} is ahead of ${bottomVocabulary.name} by ${formatWords(vocabularyGap)}.`,
    )
  }
  if (practiceGap > 0 && count > 1) {
    lines.push(
      `- **Practice gap:** ${topPractice.name} has ${formatHours(Math.round(practiceGap * 10) / 10)} more study time than ${bottomPractice.name}.`,
    )
  }

  const needAttentionSections: string[] = []
  if (behindOnVocabulary.length > 0) {
    const names = behindOnVocabulary.map((child) => child.name).join(", ")
    needAttentionSections.push(
      `- Vocabulary boost needed for ${names}. Encourage daily “Hear It” and Word Bank missions to close the gap.`,
    )
  }
  if (lowWeeklyProgress.length > 0) {
    const names = lowWeeklyProgress.map((child) => child.name).join(", ")
    needAttentionSections.push(
      `- Weekly streaks are under 25% for ${names}. Set a simple goal (one reading or math session) to rebuild momentum.`,
    )
  }
  if (idleStudents.length > 0) {
    const names = idleStudents.map((child) => child.name).join(", ")
    needAttentionSections.push(`- Missing study time: ${names} barely logged any minutes this week. Schedule a short guided session.`)
  }

  if (needAttentionSections.length > 0) {
    lines.push("")
    lines.push("### Where Support Is Needed")
    lines.push("")
    lines.push(...needAttentionSections)
  }

  const celebrateSections: string[] = []
  normalizedChildren.forEach((child) => {
    if (child.wordsLearned >= averageWords && child.weeklyProgress >= averageWeeklyProgress) {
      celebrateSections.push(`- ${child.name} is on track—use their progress to motivate siblings.`)
    } else if (child.recentWords.length > 0) {
      celebrateSections.push(
        `- ${child.name} added ${child.recentWords.length} new word${child.recentWords.length === 1 ? "" : "s"}: ${child.recentWords
          .slice(0, 3)
          .join(", ")}.`,
      )
    }
  })

  if (celebrateSections.length > 0) {
    lines.push("")
    lines.push("### Celebrate Wins")
    lines.push("")
    lines.push(...celebrateSections)
  }

  lines.push("")
  lines.push("### Next Steps")
  lines.push("")
  lines.push("- Schedule a 15-minute family study block to help everyone log fresh progress.")
  lines.push("- Rotate Moe's Word Bank missions so each learner practices pronunciation and spelling.")
  lines.push("- Revisit goals in the parent dashboard next week to see how the gaps close.")

  return NextResponse.json({ summary: lines.join("\n") })
}
