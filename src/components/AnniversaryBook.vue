<template>
  <section class="glass card">
    <div class="head">
      <div class="card-title"><span class="dot"></span> 纪念日手册</div>
      <div class="muted small">仅你我之间的小日子</div>
    </div>

    <div v-if="next" class="body">
      <div class="big-block">
        <div class="anni-name">
          <span class="heart-icon">♥</span>
          下一个 · {{ next.name }}
        </div>
        <div class="big-num">
          <span>{{ days }}</span><em>天</em>
          <span>{{ pad(hms.h) }}</span><em>:</em>
          <span>{{ pad(hms.m) }}</span><em>:</em>
          <span>{{ pad(hms.s) }}</span>
        </div>
        <div class="muted small">{{ formatNext(next.next) }} · 距今 {{ days }} 天</div>
        <div class="progress">
          <div class="progress-inner" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="quote-bar">
          <transition name="fade-slide" mode="out-in">
            <div :key="currentQuote" class="quote-text">{{ currentQuote }}</div>
          </transition>
        </div>
      </div>

      <div class="side">
        <div class="list-title muted small">所有纪念日</div>
        <ul class="list">
          <li v-for="a in upcomingList" :key="a.name + a.month + a.day"
              :class="{ 'is-love': a.type === 'love' }">
            <div class="left">
              <span class="heart-mini">♥</span>
              <div>
                <div class="name">{{ a.name }}</div>
                <div class="muted small">{{ a.month }}月{{ a.day }}日</div>
              </div>
            </div>
            <div class="badge">
              <template v-if="a.days === 0">就是今天 🎉</template>
              <template v-else>{{ a.days }} 天后</template>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAnniversaries } from '../composables/useAnniversaries.js'

const { upcomingList, nextAnniversary } = useAnniversaries()

const now = ref(new Date())
let timer
onMounted(() => { timer = setInterval(() => (now.value = new Date()), 1000) })
onUnmounted(() => clearInterval(timer))

const quotes = [
  '心动不止一刻，是时时刻刻。',
  '岁岁年年，只想陪你',
  '遇见你，是最大的幸运',
  '朝夕相伴，欢喜不断',
  '满心欢喜，皆因是你',
  '谢谢你，给予了我勇敢面对世界的勇气',
  '和你在一起的每一天都是晴天☀',
  '未来的路我想和你一起慢慢走',
  '我们还要去看好多好多风景'
]

const currentQuote = ref(quotes[Math.floor(Math.random() * quotes.length)])
let quoteTimer

onMounted(() => {
  quoteTimer = setInterval(() => {
    let next
    do { next = quotes[Math.floor(Math.random() * quotes.length)] } while (next === currentQuote.value)
    currentQuote.value = next
  }, 4500)
})

onUnmounted(() => clearInterval(quoteTimer))

const pad = n => String(n).padStart(2, '0')

const next = computed(() => nextAnniversary.value)

const diffMs = computed(() => {
  if (!next.value) return 0
  return Math.max(0, next.value.next - now.value)
})

const days = computed(() => Math.floor(diffMs.value / 86400000))

const hms = computed(() => {
  const ms = diffMs.value % 86400000
  return {
    h: Math.floor(ms / 3600000),
    m: Math.floor((ms % 3600000) / 60000),
    s: Math.floor((ms % 60000) / 1000)
  }
})

const progress = computed(() => {
  // 进度条以 60 天为窗口
  const window = 60
  const left = days.value + diffMs.value / 86400000
  if (left >= window) return 5
  return Math.min(100, ((window - left) / window) * 100)
})

function formatNext(d) {
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`
}
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

.body {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr;
  gap: 10px;
  flex: 1;
  min-height: 0;
}

.big-block {
  background: linear-gradient(135deg, rgba(255, 105, 180, 0.18), rgba(124, 92, 255, 0.14));
  border: 1px solid rgba(255, 105, 180, 0.3);
  border-radius: 14px;
  padding: 12px 14px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.anni-name {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.heart-icon {
  color: #ff69b4;
  font-size: 16px;
  text-shadow: 0 0 10px rgba(255, 105, 180, 0.6);
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
  background: linear-gradient(135deg, #fff 0%, #ffc4e1 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.big-num em {
  font-style: normal;
  font-size: 11px;
  opacity: 0.75;
  margin-right: 2px;
  -webkit-text-fill-color: rgba(255,255,255,0.75);
}

.progress {
  height: 6px;
  background: rgba(255,255,255,0.08);
  border-radius: 999px;
  overflow: hidden;
  margin-top: 4px;
}
.progress-inner {
  height: 100%;
  background: linear-gradient(90deg, #ff69b4, #7c5cff);
  transition: width 0.6s ease;
}
.small { font-size: 11px; }

.side {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
}
.list-title { letter-spacing: 1px; }

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  overflow-y: auto;
}

.list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  transition: background 0.15s ease;
}
.list li:hover { background: rgba(255,255,255,0.08); }
.list li.is-love {
  background: rgba(255, 90, 150, 0.12);
  border-color: rgba(255, 90, 150, 0.3);
}

.left { display: flex; align-items: center; gap: 8px; }
.heart-mini {
  color: #ff69b4;
  font-size: 14px;
  text-shadow: 0 0 8px rgba(255, 105, 180, 0.5);
}
.name { font-size: 13px; font-weight: 600; }

.badge {
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(255, 105, 180, 0.2);
  border: 1px solid rgba(255, 105, 180, 0.4);
  white-space: nowrap;
}

.quote-bar {
  margin-top: 6px;
  min-height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.quote-text {
  font-size: 11px;
  color: #ffc4e1;
  opacity: 0.9;
  letter-spacing: 0.5px;
  white-space: nowrap;
  text-shadow: 0 0 8px rgba(255, 105, 180, 0.4);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 720px) {
  .body { grid-template-columns: 1fr; }
}
</style>