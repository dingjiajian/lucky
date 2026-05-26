<template>
  <div v-if="show" class="heart-rain" aria-hidden="true">
    <span
      v-for="h in hearts"
      :key="h.id"
      class="heart"
      :style="h.style"
    >{{ h.char }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const CHARS = ['♥', '❤', '💕', '💖', '💗', '💘']
const show = ref(true)
const hearts = ref([])

function rand(min, max) { return Math.random() * (max - min) + min }

onMounted(() => {
  const count = 22
  hearts.value = Array.from({ length: count }, (_, i) => ({
    id: i,
    char: CHARS[Math.floor(Math.random() * CHARS.length)],
    style: {
      left: rand(2, 98) + 'vw',
      fontSize: rand(16, 38) + 'px',
      animationDelay: rand(0, 1.8) + 's',
      animationDuration: rand(5, 8) + 's',
      color: `hsl(${rand(330, 360)}, 90%, ${rand(60, 78)}%)`
    }
  }))
  // 全部动画结束（最大 delay 2.8s + 最大 duration 8s）后卸载，避免 DOM 占位
  setTimeout(() => { show.value = false }, 11200)
})
</script>

<style scoped>
.heart-rain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}
.heart {
  position: absolute;
  bottom: -10vh;
  line-height: 1;
  filter: drop-shadow(0 0 6px rgba(255, 105, 180, 0.65));
  animation: floatUp linear forwards;
  opacity: 0;
  will-change: transform, opacity;
}
@keyframes floatUp {
  0%   { transform: translate(0, 0)        rotate(-10deg); opacity: 0; }
  8%   {                                                   opacity: 1; }
  30%  { transform: translate(22px, -30vh)  rotate(8deg); }
  55%  { transform: translate(-18px, -60vh) rotate(-10deg); }
  85%  { transform: translate(14px, -90vh)  rotate(12deg);  opacity: 0.9; }
  100% { transform: translate(0, -118vh)    rotate(0);      opacity: 0; }
}
</style>