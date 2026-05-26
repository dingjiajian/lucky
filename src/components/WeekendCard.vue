<template>
  <section class="glass card">
    <div class="head">
      <div class="card-title"><span class="dot"></span> 休息日倒计时</div>
      <div class="tabs">
        <button
          v-for="opt in REST_OPTIONS"
          :key="opt.value"
          class="tab"
          :class="{ active: restType === opt.value }"
          @click="restType = opt.value"
        >{{ opt.label }}</button>
      </div>
    </div>

    <div class="emoji-bg">{{ todayRest ? '🌴' : '⛏️' }}</div>

    <template v-if="todayRest">
      <div class="value-big">{{ todayLabel }}</div>
      <div class="muted">{{ todayHint }} · 距下个工作日：</div>
      <div class="hms">
        <div class="hms-item"><span>{{ left.days }}</span><em>天</em></div>
        <div class="hms-item"><span>{{ pad(left.h) }}</span><em>时</em></div>
        <div class="hms-item"><span>{{ pad(left.m) }}</span><em>分</em></div>
        <div class="hms-item"><span>{{ pad(left.s) }}</span><em>秒</em></div>
      </div>
    </template>
    <template v-else>
      <div class="value-big">{{ left.days }}</div>
      <div class="muted">天后到 <strong>{{ nextLabel }}</strong></div>
      <div class="hms">
        <div class="hms-item"><span>{{ pad(left.h) }}</span><em>时</em></div>
        <div class="hms-item"><span>{{ pad(left.m) }}</span><em>分</em></div>
        <div class="hms-item"><span>{{ pad(left.s) }}</span><em>秒</em></div>
      </div>
    </template>

    <div class="notes">
      <span v-if="todayStatus === 'work'" class="note warn">⚠️ 今天是调休工作日</span>
      <span v-else-if="todayStatus === 'off'" class="note good">🎉 今天是法定假日</span>
      <span v-else-if="isThisWeekendAdjusted" class="note warn">⚠️ 本周末有调休工作</span>
      <span v-if="!todayRest" class="muted small">本周下班 · {{ todayLeftText }}</span>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useHolidays } from '../composables/useHolidays.js'

const STORAGE_KEY = 'life-dashboard:rest-type'

const REST_OPTIONS = [
  { value: 'double',   label: '双休' },
  { value: 'sunday',   label: '单休·周日' },
  { value: 'saturday', label: '单休·周六' }
]

const restType = ref('double')
const saved = localStorage.getItem(STORAGE_KEY)
if (saved && REST_OPTIONS.some(o => o.value === saved)) restType.value = saved
watch(restType, v => localStorage.setItem(STORAGE_KEY, v))

const now = ref(new Date())
let timer
onMounted(() => { timer = setInterval(() => (now.value = new Date()), 1000) })
onUnmounted(() => clearInterval(timer))

const pad = n => String(n).padStart(2, '0')

const { statusOf, ymd } = useHolidays()

// 根据休假类型 + 节假日数据判断某日是否休息
function isRestDay(date) {
  const s = statusOf(date)
  if (s === 'off') return true   // 法定假日 / 补休
  if (s === 'work') return false // 调休工作日
  const w = date.getDay()
  if (restType.value === 'double')   return w === 0 || w === 6
  if (restType.value === 'sunday')   return w === 0
  if (restType.value === 'saturday') return w === 6
  return false
}

const today = computed(() => {
  const d = new Date(now.value)
  d.setHours(0, 0, 0, 0)
  return d
})

const todayStatus = computed(() => statusOf(today.value))
const todayRest = computed(() => isRestDay(today.value))

// 下一个休息日（不含今天，用于「下次休息」倒计时）
function findNextDay(predicate) {
  for (let i = 1; i <= 40; i++) {
    const d = new Date(today.value)
    d.setDate(d.getDate() + i)
    if (predicate(d)) return d
  }
  return null
}

const targetDate = computed(() => {
  if (todayRest.value) return findNextDay(d => !isRestDay(d))
  return findNextDay(d => isRestDay(d))
})

const diffMs = computed(() => {
  if (!targetDate.value) return 0
  return targetDate.value - now.value
})

const left = computed(() => {
  const ms = Math.max(0, diffMs.value)
  return {
    days: Math.floor(ms / 86400000),
    h:    Math.floor((ms / 3600000) % 24),
    m:    Math.floor((ms / 60000) % 60),
    s:    Math.floor((ms / 1000) % 60)
  }
})

const WEEK_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const todayLabel = computed(() => {
  const w = now.value.getDay()
  return WEEK_NAMES[w] + (todayStatus.value === 'off' ? ' · 法定假' : '')
})

const todayHint = computed(() => {
  if (todayStatus.value === 'off') return '今天是法定假日 🎉'
  return '今天是休息日，好好享受'
})

const nextLabel = computed(() => {
  if (!targetDate.value) return '—'
  const s = statusOf(targetDate.value)
  const w = WEEK_NAMES[targetDate.value.getDay()]
  if (s === 'off') {
    const e = useHolidays().days.value.find(x => x.date === ymd(targetDate.value))
    return `${w} · ${e?.name || '假期'}`
  }
  return w
})

// 本周末（最近的周六/周日）是否被调休
const isThisWeekendAdjusted = computed(() => {
  for (let i = 0; i <= 7; i++) {
    const d = new Date(today.value)
    d.setDate(d.getDate() + i)
    if ((d.getDay() === 0 || d.getDay() === 6) && statusOf(d) === 'work') return true
  }
  return false
})

const todayLeftText = computed(() => {
  const d = new Date(now.value)
  d.setHours(18, 0, 0, 0)
  const ms = d - now.value
  if (ms <= 0) return '今天已下班 🎉'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms / 60000) % 60)
  return `18:00 还剩 ${h}h ${m}m`
})
</script>

<style scoped>
.card {
  padding: 14px 16px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tabs {
  display: flex;
  gap: 3px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  padding: 3px;
  border-radius: 10px;
}
.tab {
  background: transparent;
  box-shadow: none;
  padding: 3px 8px;
  font-size: 11px;
  border-radius: 7px;
  color: rgba(255,255,255,0.7);
  white-space: nowrap;
}
.tab:hover { background: rgba(255,255,255,0.06); transform: none; box-shadow: none; }
.tab.active {
  background: linear-gradient(135deg, #7c5cff, #ff69b4);
  color: #fff;
  box-shadow: 0 4px 12px rgba(124, 92, 255, 0.4);
}

.emoji-bg {
  position: absolute;
  font-size: 140px;
  right: -20px;
  bottom: -40px;
  opacity: 0.08;
  pointer-events: none;
}

.value-big { font-size: 52px; margin-top: 4px; line-height: 1; }
.muted strong { color: #fff; font-weight: 600; }

.hms {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}
.hms-item {
  flex: 1;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 6px 4px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.hms-item span { display: block; font-size: 16px; font-weight: 600; }
.hms-item em { font-style: normal; font-size: 10px; opacity: 0.6; }

.notes {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.note {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 999px;
  display: inline-block;
  width: fit-content;
}
.note.warn {
  background: rgba(255, 180, 60, 0.15);
  border: 1px solid rgba(255, 180, 60, 0.35);
  color: #ffd58a;
}
.note.good {
  background: rgba(60, 220, 130, 0.15);
  border: 1px solid rgba(60, 220, 130, 0.35);
  color: #a8f0c6;
}
.muted { font-size: 12px; }
.small { font-size: 11px; }
</style>
