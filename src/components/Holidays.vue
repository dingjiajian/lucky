<template>
  <section class="glass card">
    <div class="head">
      <div class="card-title"><span class="dot"></span> 下一个法定节假日</div>
      <div v-if="source" class="muted small">{{ source }}</div>
    </div>

    <div v-if="!loaded" class="muted hint">节假日数据加载中…</div>

    <template v-else>
      <div v-if="next" class="next">
        <div class="next-name">{{ next.name }}</div>
        <div class="value-big">{{ daysTo(next.start) }}</div>
        <div class="muted">天后开始 · {{ formatDate(next.start) }} 起放 {{ next.length }} 天</div>
        <div class="bar">
          <div class="bar-inner" :style="{ width: progressWidth + '%' }"></div>
        </div>
      </div>
      <div v-else class="muted">今年节假日已全部结束 🎉</div>

      <ul class="list">
        <li v-for="h in upcoming" :key="h.name + h.start" :class="{ past: isPast(h.end) }">
          <div>
            <div class="name">{{ h.name }}</div>
            <div class="muted small">{{ formatDate(h.start) }} ~ {{ formatDate(h.end) }} · {{ h.length }} 天</div>
          </div>
          <div class="badge">
            <template v-if="isPast(h.end)">已结束</template>
            <template v-else-if="isOngoing(h.start, h.end)">假期中</template>
            <template v-else>{{ daysTo(h.start) }} 天后</template>
          </div>
        </li>
      </ul>
    </template>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useHolidays } from '../composables/useHolidays.js'

const { loaded, source, holidayBlocks } = useHolidays()

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
function daysTo(iso) {
  return Math.max(0, Math.ceil((new Date(iso) - startOfToday()) / 86400000))
}
function isPast(iso) { return new Date(iso) < startOfToday() }
function isOngoing(start, end) {
  const t = startOfToday().getTime()
  return new Date(start).getTime() <= t && t <= new Date(end).getTime()
}
function formatDate(iso) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

const next = computed(() => holidayBlocks.value.find(h => !isPast(h.end)))
const upcoming = computed(() => holidayBlocks.value.slice(0, 6))
const progressWidth = computed(() => {
  if (!next.value) return 0
  const total = 60
  const left = daysTo(next.value.start)
  if (left >= total) return 5
  return Math.min(100, ((total - left) / total) * 100)
})
</script>

<style scoped>
.card { padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; height: 100%; }

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.next { padding: 2px 0; }
.next-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.value-big { font-size: 44px; line-height: 1; margin-bottom: 2px; }
.bar {
  height: 5px;
  background: rgba(255,255,255,0.08);
  border-radius: 999px;
  overflow: hidden;
  margin-top: 8px;
}
.bar-inner {
  height: 100%;
  background: linear-gradient(90deg, #7c5cff, #ff69b4);
  border-radius: 999px;
  transition: width 0.6s ease;
}

.hint { padding: 16px 0; text-align: center; }

.list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
  margin-top: 4px;
}
.list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  transition: background 0.2s ease;
}
.list li:hover { background: rgba(255,255,255,0.08); }
.list li.past { opacity: 0.45; }
.name { font-size: 13px; font-weight: 600; }
.small { font-size: 11px; margin-top: 1px; }
.badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(124, 92, 255, 0.18);
  border: 1px solid rgba(124, 92, 255, 0.35);
  white-space: nowrap;
}
</style>
