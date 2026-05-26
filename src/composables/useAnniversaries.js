
import { computed } from 'vue'

// type: 'birthday' = 生日（爱心样式）, 'love' = 恋爱纪念日（爱心+特殊背景）
// month/day 为公历，无 year 表示每年都过
export const ANNIVERSARIES = [
  { month: 12, day: 15, name: '生日', type: 'birthday' },
  { month: 1, day: 1, name: '生日', type: 'birthday' },
  { month: 1, day: 6, name: '恋爱纪念日', type: 'love' }
]

function pad2(n) { return String(n).padStart(2, '0') }

function nextOccurrence(month, day, base) {
  const baseYear = base.getFullYear()
  let d = new Date(baseYear, month - 1, day)
  d.setHours(0, 0, 0, 0)
  if (d < base) d = new Date(baseYear + 1, month - 1, day)
  return d
}

export function useAnniversaries() {
  function lookup(date) {
    const m = date.getMonth() + 1
    const day = date.getDate()
    return ANNIVERSARIES.find(a => a.month === m && a.day === day) || null
  }

  function lookupByKey(mmdd) {
    return ANNIVERSARIES.find(a => `${pad2(a.month)}-${pad2(a.day)}` === mmdd) || null
  }

  const upcomingList = computed(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return ANNIVERSARIES
      .map(a => {
        const next = nextOccurrence(a.month, a.day, now)
        const days = Math.round((next - now) / 86400000)
        return { ...a, next, days }
      })
      .sort((a, b) => a.days - b.days)
  })

  const nextAnniversary = computed(() => upcomingList.value[0] || null)

  return { ANNIVERSARIES, lookup, lookupByKey, upcomingList, nextAnniversary }
}
