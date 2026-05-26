<template>
  <section class="glass card">
    <div class="head">
      <div class="card-title"><span class="dot"></span> 退休倒计时</div>
      <div class="form">
        <input v-model="birthday" type="date" />
        <select v-model="role">
          <option value="male">男职工</option>
          <option value="female_cadre">女干部</option>
          <option value="female_worker">女工人</option>
          <option value="custom">自定义</option>
        </select>
        <input v-if="role === 'custom'" v-model.number="customAge" type="number" min="40" max="80" placeholder="退休岁数" style="width:110px" />
      </div>
    </div>

    <div v-if="!validBirthday" class="muted hint">
      选择你的出生日期，然后选岗位类别，看看距离退休还有多久 ⏳
    </div>

    <div v-else class="body">
      <div class="big-block">
        <div class="big-num">
          <span>{{ left.years }}</span><em>年</em>
          <span>{{ left.months }}</span><em>月</em>
          <span>{{ left.days }}</span><em>天</em>
        </div>
        <div class="big-num small">
          <span>{{ pad(left.h) }}</span><em>:</em>
          <span>{{ pad(left.m) }}</span><em>:</em>
          <span>{{ pad(left.s) }}</span>
        </div>
        <div class="progress">
          <div class="progress-inner" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="muted small">人生进度 {{ progress.toFixed(1) }}%</div>
      </div>

      <div class="side">
        <div class="kpi-grid">
          <div class="kpi">
            <div class="muted">退休年龄</div>
            <div class="value-mid">{{ retireAge }} 岁</div>
          </div>
          <div class="kpi">
            <div class="muted">退休日期</div>
            <div class="value-mid">{{ formatFull(retireDate) }}</div>
          </div>
          <div class="kpi">
            <div class="muted">已工作</div>
            <div class="value-mid">{{ workedYears }} 年</div>
          </div>
        </div>
        <div class="tips">
          <span class="tag">{{ totalDays }} 天</span>
          <span class="tag">{{ totalWeeks }} 个周末</span>
          <span class="tag">{{ workdays }} 个工作日</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const STORAGE_KEY = 'life-dashboard:retire'

const birthday = ref('')
const role = ref('male')
const customAge = ref(60)

const saved = localStorage.getItem(STORAGE_KEY)
if (saved) {
  try {
    const o = JSON.parse(saved)
    birthday.value = o.birthday || ''
    role.value = o.role || 'male'
    customAge.value = o.customAge || 60
  } catch {}
}

watch([birthday, role, customAge], () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ birthday: birthday.value, role: role.value, customAge: customAge.value })
  )
})

const now = ref(new Date())
let timer
onMounted(() => { timer = setInterval(() => (now.value = new Date()), 1000) })
onUnmounted(() => clearInterval(timer))

const pad = n => String(n).padStart(2, '0')

const validBirthday = computed(() => {
  if (!birthday.value) return false
  const d = new Date(birthday.value)
  return !isNaN(d) && d < now.value
})

const retireAge = computed(() => {
  if (role.value === 'male') return 63
  if (role.value === 'female_cadre') return 58
  if (role.value === 'female_worker') return 55
  return Math.max(40, Math.min(80, customAge.value || 60))
})

const retireDate = computed(() => {
  if (!validBirthday.value) return null
  const d = new Date(birthday.value)
  d.setFullYear(d.getFullYear() + retireAge.value)
  return d
})

function formatFull(d) {
  if (!d) return ''
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`
}

const left = computed(() => {
  if (!retireDate.value) return { years: 0, months: 0, days: 0, h: 0, m: 0, s: 0 }
  let target = retireDate.value
  const cur = now.value
  if (target <= cur) return { years: 0, months: 0, days: 0, h: 0, m: 0, s: 0 }

  let y = target.getFullYear() - cur.getFullYear()
  let mo = target.getMonth() - cur.getMonth()
  let d = target.getDate() - cur.getDate()
  let h = target.getHours() - cur.getHours()
  let mi = target.getMinutes() - cur.getMinutes()
  let s = target.getSeconds() - cur.getSeconds()

  if (s < 0) { s += 60; mi-- }
  if (mi < 0) { mi += 60; h-- }
  if (h < 0) { h += 24; d-- }
  if (d < 0) {
    const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0).getDate()
    d += prevMonth
    mo--
  }
  if (mo < 0) { mo += 12; y-- }
  return { years: y, months: mo, days: d, h, m: mi, s }
})

const diffMs = computed(() => retireDate.value ? retireDate.value - now.value : 0)
const totalDays = computed(() => Math.max(0, Math.ceil(diffMs.value / 86400000)).toLocaleString())
const totalWeeks = computed(() => Math.max(0, Math.floor(diffMs.value / (7 * 86400000))).toLocaleString())
const workdays = computed(() => {
  if (!retireDate.value) return 0
  const start = new Date(now.value); start.setHours(0,0,0,0)
  const end = new Date(retireDate.value); end.setHours(0,0,0,0)
  let n = 0
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const w = d.getDay()
    if (w !== 0 && w !== 6) n++
  }
  return n.toLocaleString()
})

const progress = computed(() => {
  if (!retireDate.value) return 0
  const birth = new Date(birthday.value).getTime()
  const ret = retireDate.value.getTime()
  const cur = now.value.getTime()
  return Math.max(0, Math.min(100, ((cur - birth) / (ret - birth)) * 100))
})

const workedYears = computed(() => {
  if (!validBirthday.value) return 0
  const ageMs = now.value - new Date(birthday.value)
  const ageYears = ageMs / (365.25 * 86400000)
  return Math.max(0, Math.floor(ageYears - 22))
})
</script>

<style scoped>
.card { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; height: 100%; }

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.form { display: flex; gap: 6px; flex-wrap: wrap; }
.form input, .form select { padding: 6px 10px; font-size: 13px; }

.hint { padding: 20px 0; text-align: center; }

.body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  flex: 1;
}

.kpi-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}
.kpi {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 8px 12px;
}
.kpi .muted { font-size: 11px; }
.value-mid {
  margin-top: 2px;
  font-size: 15px;
  font-weight: 600;
}

.big-block {
  background: linear-gradient(135deg, rgba(124, 92, 255, 0.15), rgba(255, 105, 180, 0.12));
  border: 1px solid rgba(124, 92, 255, 0.25);
  border-radius: 14px;
  padding: 14px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}
.big-num {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.5px;
  font-variant-numeric: tabular-nums;
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  background: linear-gradient(135deg, #fff 0%, #d6c2ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.big-num em {
  font-style: normal;
  font-size: 11px;
  opacity: 0.7;
  margin-right: 4px;
  -webkit-text-fill-color: rgba(255,255,255,0.7);
}
.big-num.small {
  font-size: 14px;
  margin-top: 0;
  opacity: 0.9;
}

.progress {
  height: 6px;
  background: rgba(255,255,255,0.08);
  border-radius: 999px;
  overflow: hidden;
  margin: 6px 0 2px;
}
.progress-inner {
  height: 100%;
  background: linear-gradient(90deg, #7c5cff, #ff69b4);
  transition: width 0.6s ease;
}
.small { font-size: 11px; }

.side { display: flex; flex-direction: column; gap: 8px; justify-content: space-between; }

.tips { display: flex; gap: 5px; flex-wrap: wrap; }
.tips .tag { font-size: 11px; padding: 3px 8px; }

@media (max-width: 720px) {
  .body { grid-template-columns: 1fr; }
}
</style>
