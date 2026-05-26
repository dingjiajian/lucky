import { ref, computed } from 'vue'

// 写死兜底（接口都挂时使用）
const FALLBACK_DAYS = [
  { name: '元旦', date: '2026-01-01', isOffDay: true },
  { name: '元旦', date: '2026-01-02', isOffDay: true },
  { name: '元旦', date: '2026-01-03', isOffDay: true },
  { name: '春节', date: '2026-02-16', isOffDay: true },
  { name: '春节', date: '2026-02-17', isOffDay: true },
  { name: '春节', date: '2026-02-18', isOffDay: true },
  { name: '春节', date: '2026-02-19', isOffDay: true },
  { name: '春节', date: '2026-02-20', isOffDay: true },
  { name: '春节', date: '2026-02-21', isOffDay: true },
  { name: '春节', date: '2026-02-22', isOffDay: true },
  { name: '清明节', date: '2026-04-04', isOffDay: true },
  { name: '清明节', date: '2026-04-05', isOffDay: true },
  { name: '清明节', date: '2026-04-06', isOffDay: true },
  { name: '劳动节', date: '2026-05-01', isOffDay: true },
  { name: '劳动节', date: '2026-05-02', isOffDay: true },
  { name: '劳动节', date: '2026-05-03', isOffDay: true },
  { name: '劳动节', date: '2026-05-04', isOffDay: true },
  { name: '劳动节', date: '2026-05-05', isOffDay: true },
  { name: '端午节', date: '2026-06-19', isOffDay: true },
  { name: '端午节', date: '2026-06-20', isOffDay: true },
  { name: '端午节', date: '2026-06-21', isOffDay: true },
  { name: '中秋节', date: '2026-09-25', isOffDay: true },
  { name: '中秋节', date: '2026-09-26', isOffDay: true },
  { name: '中秋节', date: '2026-09-27', isOffDay: true },
  { name: '国庆节', date: '2026-10-01', isOffDay: true },
  { name: '国庆节', date: '2026-10-02', isOffDay: true },
  { name: '国庆节', date: '2026-10-03', isOffDay: true },
  { name: '国庆节', date: '2026-10-04', isOffDay: true },
  { name: '国庆节', date: '2026-10-05', isOffDay: true },
  { name: '国庆节', date: '2026-10-06', isOffDay: true },
  { name: '国庆节', date: '2026-10-07', isOffDay: true },
  { name: '国庆节', date: '2026-10-08', isOffDay: true }
]

const days = ref([])
const loaded = ref(false)
const source = ref('')
let promise = null

async function fetchYear(year) {
  const urls = [
    `https://cdn.jsdelivr.net/gh/NateScarlet/holiday-cn@master/${year}.json`,
    `https://raw.githubusercontent.com/NateScarlet/holiday-cn/master/${year}.json`
  ]
  for (const url of urls) {
    try {
      const r = await fetch(url)
      if (r.ok) {
        const data = await r.json()
        if (Array.isArray(data?.days)) return data
      }
    } catch (e) { /* try next */ }
  }
  return null
}

function load() {
  if (promise) return promise
  promise = (async () => {
    const year = new Date().getFullYear()
    const [a, b] = await Promise.all([fetchYear(year), fetchYear(year + 1)])
    const merged = []
    if (a?.days) merged.push(...a.days)
    if (b?.days) merged.push(...b.days)
    if (merged.length > 0) {
      days.value = merged
      source.value = 'holiday-cn'
    } else {
      days.value = FALLBACK_DAYS
      source.value = '离线兜底'
    }
    loaded.value = true
  })()
  return promise
}

function ymd(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function useHolidays() {
  load()

  // 查某天的标记。返回 'off' (放假) / 'work' (调休工作日) / null (普通日)
  function statusOf(date) {
    const key = typeof date === 'string' ? date : ymd(date)
    const e = days.value.find(d => d.date === key)
    if (!e) return null
    return e.isOffDay ? 'off' : 'work'
  }

  // 把官方逐日数据合并为「假期段」（仅 isOffDay 连续段）
  const holidayBlocks = computed(() => {
    const off = days.value.filter(d => d.isOffDay).slice().sort((a, b) => a.date.localeCompare(b.date))
    const groups = []
    let cur = null
    for (const d of off) {
      const isNext = cur && cur.name === d.name &&
        (new Date(d.date) - new Date(cur.end)) === 86400000
      if (isNext) {
        cur.end = d.date
        cur.length++
      } else {
        if (cur) groups.push(cur)
        cur = { name: d.name, start: d.date, end: d.date, length: 1 }
      }
    }
    if (cur) groups.push(cur)
    return groups
  })

  // 调休工作日（被挪去上班的周末）
  const adjustedWorkDays = computed(() =>
    days.value.filter(d => !d.isOffDay).map(d => ({ ...d }))
  )

  return { days, loaded, source, statusOf, holidayBlocks, adjustedWorkDays, ymd }
}
