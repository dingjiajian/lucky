

<template>
  <div class="container">
    <header class="header">
      <div class="header-left">
        <div class="brand">
          <span class="logo">✦</span>
          <span>Life Dashboard</span>
        </div>
        <h1 class="title">{{ greeting }}，今天是 {{ todayStr }} · {{ lunarOrWeek }} 欢迎访问刘淑珍的生活仪表盘</h1>
      </div>
      <div class="clock glass">
        <div class="time">{{ clock }}</div>
        <div class="muted">{{ tzText }}</div>
      </div>
    </header>

    <main class="grid">
      <Weather class="span-2" />
      <Holidays />
      <WeekendCard />
      <Payday class="span-2" />
      <Retirement class="span-2" />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Weather from './components/Weather.vue'
import Holidays from './components/Holidays.vue'
import WeekendCard from './components/WeekendCard.vue'
import Payday from './components/Payday.vue'
import Retirement from './components/Retirement.vue'

const now = ref(new Date())
let timer

onMounted(() => {
  timer = setInterval(() => (now.value = new Date()), 1000)
})
onUnmounted(() => clearInterval(timer))

const pad = n => String(n).padStart(2, '0')

const clock = computed(() => {
  const d = now.value
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
})

const todayStr = computed(() => {
  const d = now.value
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`
})

const greeting = computed(() => {
  const h = now.value.getHours()
  if (h < 6) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 13) return '中午好'
  if (h < 18) return '下午好'
  if (h < 22) return '晚上好'
  return '夜深了'
})

const lunarOrWeek = computed(() => {
  const week = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return week[now.value.getDay()]
})

const tzText = computed(() => {
  const offset = -now.value.getTimezoneOffset() / 60
  return `UTC${offset >= 0 ? '+' : ''}${offset}`
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.header-left { display: flex; flex-direction: column; gap: 2px; }

.brand {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  letter-spacing: 3px;
  text-transform: uppercase;
  opacity: 0.7;
}

.logo {
  display: inline-flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  background: linear-gradient(135deg, #7c5cff, #ff69b4);
  box-shadow: 0 4px 14px rgba(124, 92, 255, 0.45);
  font-size: 11px;
}

.title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.clock {
  padding: 6px 14px;
  text-align: right;
  min-width: 130px;
}

.clock .time {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 1px;
  font-variant-numeric: tabular-nums;
}
.clock .muted { font-size: 11px; }

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: minmax(340px, 1fr) minmax(340px, 1fr);
  flex: 1;
  min-height: 0;
  gap: 12px;
}

.span-2 { grid-column: span 2; }

@media (max-width: 1180px) {
  .grid { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(4, minmax(320px, 1fr)); }
  .span-2 { grid-column: span 2; }
}
@media (max-width: 640px) {
  .grid { grid-template-columns: 1fr; grid-template-rows: none; grid-auto-rows: minmax(220px, auto); }
  .span-2 { grid-column: span 1; }
}
</style>
