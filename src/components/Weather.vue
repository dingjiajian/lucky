<template>
  <section class="glass card">
    <div class="head">
      <div class="card-title"><span class="dot"></span> 天气预报</div>
      <form class="search" @submit.prevent="onSearch">
        <input v-model="cityInput" placeholder="搜索城市" />
        <button type="submit">查询</button>
      </form>
    </div>

    <div v-if="loading" class="loading">天气数据加载中…</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="current" class="body">
      <div class="main">
        <div class="now-left">
          <div class="city">{{ locationLabel }}</div>
          <div class="temp">
            {{ Math.round(current.temperature_2m) }}<span class="unit">°C</span>
          </div>
          <div class="desc">
            <span class="emoji">{{ weatherEmoji(current.weather_code) }}</span>
            <span>{{ weatherText(current.weather_code) }}</span>
          </div>
          <div class="meta">
            <span class="tag">体感 {{ Math.round(current.apparent_temperature) }}°</span>
            <span class="tag">湿度 {{ current.relative_humidity_2m }}%</span>
            <span class="tag">风 {{ current.wind_speed_10m }}km/h</span>
            <span class="tag">☀ {{ timePart(daily?.sunrise?.[0]) }}</span>
            <span class="tag">🌙 {{ timePart(daily?.sunset?.[0]) }}</span>
          </div>
        </div>

        <div class="forecast">
          <div v-for="(d, i) in forecastDays" :key="i" class="day">
            <div class="day-name">{{ i === 0 ? '今天' : weekdayShort(d.date) }}</div>
            <div class="day-emoji">{{ weatherEmoji(d.code) }}</div>
            <div class="day-temps">
              <span class="hi">{{ Math.round(d.max) }}°</span>
              <span class="lo">{{ Math.round(d.min) }}°</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="chart" class="hourly">
        <div class="chart-wrap">
          <svg viewBox="0 0 600 100" preserveAspectRatio="none" class="chart">
            <defs>
              <linearGradient id="hourlyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#ff8fcb" stop-opacity="0.55"/>
                <stop offset="100%" stop-color="#7c5cff" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path :d="chart.areaPath" fill="url(#hourlyGrad)"/>
            <path :d="chart.linePath" fill="none" stroke="#fff" stroke-width="2"
                  vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>
          </svg>
          <template v-for="(d, i) in chart.data" :key="'t' + i">
            <span v-if="i === 0 || isLabelHour(i, d)"
                  class="temp-label"
                  :style="{ left: chart.xPct[i] + '%', top: chart.yPct[i] + '%' }">
              {{ Math.round(d.temp) }}°
            </span>
          </template>
        </div>
        <div class="hour-labels">
          <template v-for="(d, i) in chart.data" :key="'h' + i">
            <span v-if="i === 0 || isLabelHour(i, d)"
                  class="hour-label"
                  :class="{ now: i === 0 }"
                  :style="{ left: chart.xPct[i] + '%' }">
              {{ i === 0 ? '现在' : formatHour(d.time) }}
            </span>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const cityInput = ref('')
const loading = ref(false)
const error = ref('')
const current = ref(null)
const daily = ref(null)
const hourly = ref(null)
const locationLabel = ref('')

const forecastDays = computed(() => {
  if (!daily.value) return []
  return (daily.value.time || []).slice(0, 5).map((t, i) => ({
    date: t,
    max: daily.value.temperature_2m_max[i],
    min: daily.value.temperature_2m_min[i],
    code: daily.value.weather_code[i]
  }))
})

// ---- 小时折线图 ----
const HOURS = 24

const hourlyData = computed(() => {
  if (!hourly.value) return []
  const t = hourly.value.time || []
  const temps = hourly.value.temperature_2m || []
  const codes = hourly.value.weather_code || []
  const pops = hourly.value.precipitation_probability || []
  if (t.length === 0) return []
  const nowTs = Date.now()
  let start = 0
  for (let i = 0; i < t.length; i++) {
    if (new Date(t[i]).getTime() >= nowTs) { start = Math.max(0, i - 1); break }
  }
  return t.slice(start, start + HOURS).map((iso, i) => ({
    time: new Date(iso),
    temp: temps[start + i],
    code: codes[start + i],
    pop: pops[start + i] ?? 0
  }))
})

function smoothPath(pts) {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M ${pts[0][0]} ${pts[0][1]}`
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    const mx = (x0 + x1) / 2
    const my = (y0 + y1) / 2
    if (i === 0) d += ` L ${mx} ${my}`
    else d += ` Q ${x0} ${y0}, ${mx} ${my}`
  }
  const last = pts[pts.length - 1]
  d += ` L ${last[0]} ${last[1]}`
  return d
}

const chart = computed(() => {
  const data = hourlyData.value
  if (data.length < 2) return null
  const W = 600
  const H = 100
  const padX = 6
  const padTop = 22
  const padBottom = 6
  const temps = data.map(d => d.temp)
  const minT = Math.min(...temps)
  const maxT = Math.max(...temps)
  const range = Math.max(2, maxT - minT)
  const innerW = W - 2 * padX
  const innerH = H - padTop - padBottom
  const points = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * innerW
    const y = padTop + (1 - (d.temp - minT) / range) * innerH
    return [x, y]
  })
  const linePath = smoothPath(points)
  const first = points[0]
  const last = points[points.length - 1]
  const areaPath = `${linePath} L ${last[0]} ${H - padBottom} L ${first[0]} ${H - padBottom} Z`
  const xPct = points.map(p => (p[0] / W) * 100)
  const yPct = points.map(p => p[1])
  return { data, W, H, points, linePath, areaPath, xPct, yPct }
})

function formatHour(d) {
  return `${d.getHours()}时`
}

function isLabelHour(i, d) {
  if (i === 0) return false
  return i % 3 === 0
}

function timePart(iso) {
  if (!iso) return '--:--'
  return iso.slice(11, 16)
}

function weekdayShort(iso) {
  const d = new Date(iso)
  return ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()]
}

const WEATHER_MAP = {
  0:  ['晴', '☀️'],
  1:  ['大致晴朗', '🌤️'],
  2:  ['局部多云', '⛅'],
  3:  ['阴', '☁️'],
  45: ['雾', '🌫️'],
  48: ['冻雾', '🌫️'],
  51: ['毛毛雨', '🌦️'],
  53: ['小雨', '🌦️'],
  55: ['中雨', '🌧️'],
  56: ['冻雨', '🌧️'],
  57: ['冻雨', '🌧️'],
  61: ['小雨', '🌧️'],
  63: ['中雨', '🌧️'],
  65: ['大雨', '🌧️'],
  66: ['冻雨', '🌧️'],
  67: ['冻雨', '🌧️'],
  71: ['小雪', '🌨️'],
  73: ['中雪', '🌨️'],
  75: ['大雪', '❄️'],
  77: ['雪粒', '🌨️'],
  80: ['阵雨', '🌦️'],
  81: ['强阵雨', '🌧️'],
  82: ['暴雨', '⛈️'],
  85: ['阵雪', '🌨️'],
  86: ['强阵雪', '❄️'],
  95: ['雷阵雨', '⛈️'],
  96: ['雷雨夹冰雹', '⛈️'],
  99: ['强雷雨夹冰雹', '⛈️']
}
function weatherText(code) { return (WEATHER_MAP[code] || ['未知', '❓'])[0] }
function weatherEmoji(code) { return (WEATHER_MAP[code] || ['未知', '❓'])[1] }

async function fetchWeather(lat, lon, label) {
  loading.value = true
  error.value = ''
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&hourly=temperature_2m,weather_code,precipitation_probability` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
      `&timezone=auto&forecast_days=5&past_hours=1`
    const r = await fetch(url)
    if (!r.ok) throw new Error('天气接口请求失败')
    const data = await r.json()
    current.value = data.current
    daily.value = data.daily
    hourly.value = data.hourly
    locationLabel.value = label
  } catch (e) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function searchCity(name) {
  const r = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=zh`
  )
  if (!r.ok) throw new Error('城市搜索失败')
  const data = await r.json()
  const item = data?.results?.[0]
  if (!item) throw new Error('未找到该城市')
  return {
    lat: item.latitude,
    lon: item.longitude,
    label: [item.name, item.admin1, item.country].filter(Boolean).join(' · ')
  }
}

async function onSearch() {
  const q = cityInput.value.trim()
  if (!q) return
  try {
    loading.value = true
    const loc = await searchCity(q)
    await fetchWeather(loc.lat, loc.lon, loc.label)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function fallbackBeijing() {
  return fetchWeather(39.9042, 116.4074, '北京 · 中国')
}

onMounted(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => fetchWeather(pos.coords.latitude, pos.coords.longitude, '当前位置'),
      () => fallbackBeijing(),
      { timeout: 5000 }
    )
  } else {
    fallbackBeijing()
  }
})
</script>

<style scoped>
.card { padding: 12px 16px; height: 100%; display: flex; flex-direction: column; gap: 10px; }

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search { display: flex; gap: 6px; }
.search input { width: 140px; padding: 5px 10px; font-size: 12px; }
.search button { padding: 5px 12px; font-size: 12px; }

.loading, .error { padding: 16px 0; opacity: 0.8; }

.body { display: flex; flex-direction: column; gap: 10px; flex: 1; }

.main {
  display: grid;
  grid-template-columns: minmax(160px, 0.85fr) 1.5fr;
  gap: 16px;
  align-items: center;
}

.now-left { display: flex; flex-direction: column; gap: 4px; }

.city { font-size: 12px; opacity: 0.7; }

.temp {
  font-size: 52px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -1px;
  background: linear-gradient(135deg, #fff 0%, #b7c0ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.unit { font-size: 20px; opacity: 0.8; margin-left: 2px; }

.desc {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
.emoji { font-size: 18px; }

.meta {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
  margin-top: 2px;
  justify-content: flex-start;
}
.meta .tag {
  padding: 2px 6px;
  font-size: 10px;
  white-space: nowrap;
  flex-shrink: 0;
}

.forecast {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  align-self: center;
}
.day {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 8px 4px;
  text-align: center;
  transition: background 0.2s ease;
  align-self: center;
}
.day:hover { background: rgba(255,255,255,0.1); }
.day-name { font-size: 11px; opacity: 0.7; }
.day-emoji { font-size: 18px; margin: 1px 0; }
.day-temps { font-size: 12px; }
.day-temps .hi { font-weight: 600; margin-right: 4px; }
.day-temps .lo { opacity: 0.6; }

.hourly {
  display: flex;
  flex-direction: column;
  margin-top: auto;
}
.chart-wrap {
  position: relative;
  width: 100%;
  height: 76px;
}
.chart { width: 100%; height: 100%; display: block; }
.temp-label {
  position: absolute;
  transform: translate(-50%, -125%);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
}
.hour-labels {
  position: relative;
  height: 14px;
  margin-top: 2px;
}
.hour-label {
  position: absolute;
  transform: translateX(-50%);
  font-size: 10px;
  opacity: 0.6;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.hour-label.now { opacity: 1; color: #ff8fcb; font-weight: 600; }

@media (max-width: 720px) {
  .main { grid-template-columns: 1fr; }
}
</style>
