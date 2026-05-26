<template>
  <div class="calendar" :class="{ 'has-photo': showPhoto }">
    <div class="photo-bg" v-if="showPhoto"></div>

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
          work: d.status === 'work',
          selected: d.key === selectedKey,
          'anni-birthday': d.anni?.type === 'birthday',
          'anni-love': d.anni?.type === 'love'
        }"
        @click="selectCell(d)"
      >
        <span v-if="d.anni" class="heart" aria-hidden="true">♥</span>
        <div class="num">{{ d.day }}</div>
        <div v-if="d.anni" class="anni-label">{{ d.anni.name }}</div>
        <div v-else-if="d.festival" class="festival">{{ d.festival }}</div>
        <span v-if="d.status === 'off'" class="tag tag-off">休</span>
        <span v-else-if="d.status === 'work'" class="tag tag-work">班</span>
      </div>
    </div>

    <div class="footer">
      <template v-if="selectedInfo">
        <span>{{ selectedInfo.dateText }}</span>
        <span v-if="selectedInfo.anni" class="hl">· {{ selectedInfo.anni.name }} ♥</span>
        <span v-else-if="selectedInfo.festival" class="hl">· {{ selectedInfo.festival }}</span>
      </template>
      <template v-else-if="nextHoliday">
        距离 <strong>{{ nextHoliday.name }}</strong> 还有
        <span class="hl">{{ daysToNext }}</span> 天
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useHolidays } from '../composables/useHolidays.js'
import { useAnniversaries } from '../composables/useAnniversaries.js'

const { statusOf, holidayBlocks } = useHolidays()
const { lookup } = useAnniversaries()
const WEEKS = ['一', '二', '三', '四', '五', '六', '日']

const today = new Date()
today.setHours(0, 0, 0, 0)
const todayTs = today.getTime()

const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())
const selectedKey = ref('')

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
  selectedKey.value = ymd(today)
}

function ymd(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function selectCell(d) {
  selectedKey.value = selectedKey.value === d.key ? '' : d.key
}

const days = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1)
  const dayOfWeek = (first.getDay() + 6) % 7
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
      key,
      date: d,
      inMonth: d.getMonth() === viewMonth.value,
      isToday: d.getTime() === todayTs,
      isWeekend: dow === 0 || dow === 6,
      status: statusOf(key),
      festival: holidayStarts.get(key),
      anni: lookup(d)
    })
  }
  return out
})

const selectedInfo = computed(() => {
  if (!selectedKey.value) return null
  const cell = days.value.find(d => d.key === selectedKey.value)
  if (!cell) return null
  return {
    dateText: `${cell.date.getFullYear()}年${cell.date.getMonth() + 1}月${cell.date.getDate()}日`,
    anni: cell.anni,
    festival: cell.festival
  }
})

const showPhoto = computed(() => {
  if (!selectedKey.value) return false
  const cell = days.value.find(d => d.key === selectedKey.value)
  return cell?.anni?.type === 'love'
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
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
  isolation: isolate;
}

.photo-bg {
  position: absolute;
  inset: -10px;
  background-image: url('../assets/anniversary.jpg');
  background-size: cover;
  background-position: center 30%;
  border-radius: 12px;
  opacity: 0.35;
  filter: saturate(1.1);
  z-index: -1;
  animation: fadeIn 0.5s ease;
}
.calendar.has-photo::before {
  content: '';
  position: absolute;
  inset: -10px;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(15, 18, 38, 0.55) 80%);
  border-radius: 12px;
  z-index: -1;
  pointer-events: none;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(1.04); }
  to { opacity: 0.35; transform: scale(1); }
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
  transition: background 0.15s ease, transform 0.15s ease;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  cursor: pointer;
}
.cell:hover { background: rgba(255,255,255,0.07); }
.cell.out { opacity: 0.25; }
.cell.weekend .num { color: #ff8fcb; }
.cell.today {
  background: linear-gradient(135deg, rgba(124,92,255,0.4), rgba(255,105,180,0.28));
  border: 1px solid rgba(124,92,255,0.65);
}
.cell.selected {
  outline: 2px solid #ff8fcb;
  outline-offset: -2px;
}

.cell.anni-birthday {
  background: rgba(255, 105, 180, 0.18);
}
.cell.anni-love {
  background: rgba(255, 90, 150, 0.25);
}
.cell.anni-birthday:hover,
.cell.anni-love:hover { transform: scale(1.04); }

.heart {
  position: absolute;
  font-size: 46px;
  color: #ff4d8d;
  text-shadow:
    0 0 18px rgba(255, 77, 141, 0.85),
    0 0 6px rgba(255, 255, 255, 0.5);
  pointer-events: none;
  line-height: 1;
  z-index: 0;
  animation: heartBeat 1.6s ease-in-out infinite;
}
.cell.anni-love .heart {
  color: #ff2d75;
  font-size: 50px;
  text-shadow:
    0 0 24px rgba(255, 45, 117, 0.95),
    0 0 8px rgba(255, 255, 255, 0.6);
}

@keyframes heartBeat {
  0%, 100% { transform: scale(1); }
  18% { transform: scale(1.18); }
  36% { transform: scale(1); }
  54% { transform: scale(1.1); }
  72% { transform: scale(1); }
}

.num {
  font-weight: 600;
  font-size: 13px;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  position: relative;
  z-index: 1;
}
.cell.anni-birthday .num,
.cell.anni-love .num { color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,0.4); }

.festival, .anni-label {
  font-size: 9px;
  line-height: 1.1;
  margin-top: 2px;
  text-align: center;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
  z-index: 1;
}
.festival { color: #ff8fcb; }
.anni-label {
  color: #fff;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
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
  z-index: 2;
}
.tag-off { background: #e74c3c; color: #fff; }
.tag-work { background: #888; color: #fff; }

.footer {
  font-size: 11px;
  opacity: 0.85;
  text-align: center;
  padding-top: 4px;
  border-top: 1px solid rgba(255,255,255,0.06);
  display: flex;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
}
.footer .hl {
  color: #ff8fcb;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
</style>