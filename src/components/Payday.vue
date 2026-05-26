<template>
  <section class="glass card">
    <div class="head">
      <div class="card-title"><span class="dot"></span> 发薪日倒计时</div>
      <div class="tabs">
        <button
          v-for="d in [5, 10, 15, 20, 25]"
          :key="d"
          class="tab"
          :class="{ active: selected === d }"
          @click="selected = d"
        >{{ d }} 号</button>
      </div>
    </div>

    <div class="dual">
      <div v-for="view in views" :key="view.day" class="pay" :class="{ highlight: view.day === selected }">
        <div class="pay-head">
          <span class="pay-tag">每月 {{ view.day }} 号</span>
          <span class="muted small">{{ formatFull(view.next) }}</span>
        </div>
        <div class="pay-num">
          <template v-if="view.isToday">
            <span class="big">今天</span><em>发薪日 🎉</em>
          </template>
          <template v-else>
            <span class="big">{{ view.days }}</span><em>天后</em>
          </template>
        </div>
        <div class="hms">
          <div class="hms-item"><span>{{ pad(view.h) }}</span><em>时</em></div>
          <div class="hms-item"><span>{{ pad(view.m) }}</span><em>分</em></div>
          <div class="hms-item"><span>{{ pad(view.s) }}</span><em>秒</em></div>
        </div>
        <div class="bar">
          <div class="bar-inner" :style="{ width: view.progress + '%' }"></div>
        </div>
        <div class="muted small">距上次发薪 {{ view.sinceLast }} 天 · 本周期进度 {{ view.progress.toFixed(0) }}%</div>
      </div>
    </div>

    <div class="tips">
      <span class="tag">💰 选你公司实际发薪日，置顶高亮</span>
      <span class="tag">📅 若发薪日遇周末/节假日，公司通常会提前发</span>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const STORAGE_KEY = 'life-dashboard:payday'

const selected = ref(15)
const saved = localStorage.getItem(STORAGE_KEY)
if (saved && !isNaN(+saved)) selected.value = +saved
watch(selected, v => localStorage.setItem(STORAGE_KEY, String(v)))

const now = ref(new Date())
let timer
onMounted(() => { timer = setInterval(() => (now.value = new Date()), 1000) })
onUnmounted(() => clearInterval(timer))

const pad = n => String(n).padStart(2, '0')

function lastDayOfMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

// 计算下一个「day 号」的具体日期（如果当月该号已经过去，则取下月）
function nextPayday(day) {
  const n = new Date(now.value)
  let y = n.getFullYear()
  let m = n.getMonth()
  const todayDate = n.getDate()
  if (todayDate > day) {
    m += 1
    if (m > 11) { m = 0; y += 1 }
  }
  const clamped = Math.min(day, lastDayOfMonth(y, m))
  return new Date(y, m, clamped, 0, 0, 0, 0)
}

function lastPayday(day) {
  const n = new Date(now.value)
  let y = n.getFullYear()
  let m = n.getMonth()
  const todayDate = n.getDate()
  if (todayDate <= day) {
    m -= 1
    if (m < 0) { m = 11; y -= 1 }
  }
  const clamped = Math.min(day, lastDayOfMonth(y, m))
  return new Date(y, m, clamped, 0, 0, 0, 0)
}

function formatFull(d) {
  const w = ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()]
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日 · ${w}`
}

function buildView(day) {
  const next = nextPayday(day)
  const last = lastPayday(day)
  const diffMs = next - now.value
  const isToday = now.value.getDate() === day
  const days = Math.max(0, Math.ceil(diffMs / 86400000))
  const h = Math.max(0, Math.floor((diffMs / 3600000) % 24))
  const m = Math.max(0, Math.floor((diffMs / 60000) % 60))
  const s = Math.max(0, Math.floor((diffMs / 1000) % 60))
  const cycle = next - last
  const elapsed = now.value - last
  const progress = Math.max(0, Math.min(100, (elapsed / cycle) * 100))
  const sinceLast = Math.max(0, Math.floor((now.value - last) / 86400000))
  return { day, next, days, h, m, s, progress, sinceLast, isToday }
}

// 默认展示 5 号 和 15 号两张卡片；用户切换后把所选那张也加入展示
const views = computed(() => {
  const days = new Set([5, 15, selected.value])
  return [...days].sort((a, b) => a - b).map(buildView)
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

.tabs {
  display: flex;
  gap: 4px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  padding: 3px;
  border-radius: 10px;
}
.tab {
  background: transparent;
  box-shadow: none;
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 7px;
  color: rgba(255,255,255,0.7);
}
.tab:hover {
  background: rgba(255,255,255,0.06);
  transform: none;
  box-shadow: none;
}
.tab.active {
  background: linear-gradient(135deg, #7c5cff, #ff69b4);
  color: #fff;
  box-shadow: 0 4px 12px rgba(124, 92, 255, 0.4);
}

.dual {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  flex: 1;
}

.pay {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: background 0.2s ease, border 0.2s ease;
}
.pay.highlight {
  background: linear-gradient(135deg, rgba(124, 92, 255, 0.18), rgba(255, 105, 180, 0.14));
  border-color: rgba(124, 92, 255, 0.45);
  box-shadow: 0 6px 20px rgba(124, 92, 255, 0.25);
}

.pay-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}
.pay-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  font-size: 11px;
  font-weight: 600;
}

.pay-num {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.pay-num .big {
  font-size: 38px;
  font-weight: 700;
  letter-spacing: -1px;
  background: linear-gradient(135deg, #fff 0%, #b7c0ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.pay-num em {
  font-style: normal;
  font-size: 12px;
  opacity: 0.7;
}

.hms { display: flex; gap: 5px; }
.hms-item {
  flex: 1;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 4px 2px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.hms-item span { display: block; font-size: 14px; font-weight: 600; }
.hms-item em { font-style: normal; font-size: 9px; opacity: 0.6; }

.bar {
  height: 5px;
  background: rgba(255,255,255,0.08);
  border-radius: 999px;
  overflow: hidden;
}
.bar-inner {
  height: 100%;
  background: linear-gradient(90deg, #7c5cff, #ff69b4);
  transition: width 0.6s ease;
}

.small { font-size: 11px; }

.tips { display: none; }

@media (max-width: 720px) {
  .dual { grid-template-columns: 1fr; }
}
</style>
