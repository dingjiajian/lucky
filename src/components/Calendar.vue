<template>
  <div class="calendar">
    <div class="cal-head">
      <div class="cal-nav">
        <button class="nav-btn" @click="prevMonth" aria-label="上个月">‹</button>
        <span class="ym">{{ viewYear }}年 {{ viewMonth + 1 }}月</span>
        <button class="nav-btn" @click="nextMonth" aria-label="下个月">›</button>
      </div>
      <button class="today-btn" @click="goToday">今天</button>
    </div>

    <div class="weekdays">
      <span v-for="(w, i) in WEEKS" :key="w" :class="{ weekend: i >= 5 }">{{ w }}</span>
    </div>

    <div class="grid">
      <div
        v-for="(d, i) in days"
        :key="i"
        class="cell"
        :class="{
          out: !d.inMonth,
          today: d.isToday,
          weekend: d.isWeekend,
          off: d.status === 'off',
          work: d.status === 'work'
        }"
      >
        <div class="num">{{ d.day }}</div>
        <div v-if="d.festival" class="festival">{{ d.festival }}</div>
        <span v-if="d.status === 'off'" class="tag tag-off">休</span>
        <span v-else-if="d.status === 'work'" class="tag tag-work">班</span>
      </div>
    </div>

    <div v-if="nextHoliday" class="footer">
      距离 <strong>{{ nextHoliday.name }}</strong> 还有
      <span class="hl">{{ daysToNext }}</span> 天
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useHolidays } from '../composables/useHolidays.js'

const { statusOf, holidayBlocks } = useHolidays()
const WEEKS = ['一', '二', '三', '四', '五', '六', '日']

const today = new Date()
today.setHours(0, 0, 0, 0)
const todayTs = today.getTime()

const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())

function prevMonth() {
  if (viewMonth.value === 0) { viewYear.value--; viewMonth.value = 11 }
  else viewMonth.value--
}
function nextMonth() {
  if (viewMonth.value === 11) { viewYear.value++; viewMonth.value = 0 }
  else viewMonth.value++
}
function goToday() {
  viewYear.value = today.getFullYear()
  viewMonth.value = today.getMonth()
}

function ymd(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const days = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1)
  const dayOfWeek = (first.getDay() + 6) % 7 // 周一为 0
  const start = new Date(first)
  start.setDate(first.getDate() - dayOfWeek)

  const holidayStarts = new Map()
  for (const h of holidayBlocks.value) holidayStarts.set(h.start, h.name)

  const out = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const dow = d.getDay()
    const key = ymd(d)
    out.push({
      day: d.getDate(),
      inMonth: d.getMonth() === viewMonth.value,
      isToday: d.getTime() === todayTs,
      isWeekend: dow === 0 || dow === 6,
      status: statusOf(key),
      festival: holidayStarts.get(key)
    })
  }
  return out
})

const nextHoliday = computed(() =>
  holidayBlocks.value.find(h => new Date(h.end) >= today)
)

const daysToNext = computed(() => {
  if (!nextHoliday.value) return 0
  return Math.max(0, Math.ceil((new Date(nextHoliday.value.start) - today) / 86400000))
})
</script>

<style scoped>
.calendar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
}

.cal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.cal-nav { display: flex; align-items: center; gap: 4px; }

.nav-btn {
  width: 22px;
  height: 22px;
  padding: 0;
  font-size: 14px;
  background: rgba(255,255,255,0.08);
  border-radius: 6px;
  box-shadow: none;
  line-height: 1;
}
.nav-btn:hover { background: rgba(255,255,255,0.16); transform: none; box-shadow: none; }

.ym {
  font-size: 13px;
  font-weight: 600;
  min-width: 84px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.today-btn {
  padding: 3px 10px;
  font-size: 11px;
  border-radius: 6px;
  box-shadow: none;
  background: rgba(255,255,255,0.08);
}
.today-btn:hover { background: rgba(255,255,255,0.16); transform: none; box-shadow: none; }

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 11px;
  opacity: 0.6;
}
.weekdays .weekend { color: #ff8fcb; opacity: 0.85; }

.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 2px;
  flex: 1;
  min-height: 0;
}

.cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: 6px;
  background: rgba(255,255,255,0.025);
  transition: background 0.15s ease;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}
.cell:hover { background: rgba(255,255,255,0.07); }
.cell.out { opacity: 0.25; }
.cell.weekend .num { color: #ff8fcb; }
.cell.today {
  background: linear-gradient(135deg, rgba(124,92,255,0.4), rgba(255,105,180,0.28));
  border: 1px solid rgba(124,92,255,0.65);
}

.num {
  font-weight: 600;
  font-size: 13px;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.festival {
  font-size: 9px;
  color: #ff8fcb;
  line-height: 1.1;
  margin-top: 2px;
  text-align: center;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag {
  position: absolute;
  top: 1px;
  right: 1px;
  font-size: 9px;
  padding: 0 3px;
  border-radius: 3px;
  font-weight: 600;
  line-height: 1.3;
}
.tag-off { background: #e74c3c; color: #fff; }
.tag-work { background: #888; color: #fff; }

.footer {
  font-size: 11px;
  opacity: 0.75;
  text-align: center;
  padding-top: 4px;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.footer .hl {
  color: #ff8fcb;
  font-weight: 700;
  padding: 0 3px;
  font-variant-numeric: tabular-nums;
}
</style>