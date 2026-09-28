<template>
  <div class="drone-fleet-hud glass-panel">
    <div class="hud-header">
      <Radio :size="16" class="icon-radio" />
      <span>無人機編隊遙測矩陣 (Fleet Matrix)</span>
    </div>

    <div class="drone-grid">
      <div v-for="d in drones" :key="d.id" class="drone-card">
        <div class="card-top">
          <span class="drone-id">{{ d.id }}</span>
          <span
            :class="[
              'badge',
              d.status === 'WARNING' ? 'badge-danger' : d.status === 'PATROL' ? 'badge-emerald' : 'badge-cyan'
            ]"
          >
            {{ d.status || 'STANDBY' }}
          </span>
        </div>

        <div class="drone-coords">
          POS: ({{ d.x }}, {{ d.y }}, {{ d.z }})
        </div>

        <div class="battery-row">
          <span class="battery-label">BATTERY: {{ d.battery }}%</span>
          <div class="battery-track">
            <div
              class="battery-fill"
              :style="{
                width: `${d.battery}%`,
                background: d.battery < 20 ? '#ef4444' : '#10b981'
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Radio } from 'lucide-vue-next';

defineProps({
  drones: {
    type: Array,
    default: () => [
      { id: "drone-01", x: -6, y: 5, z: 2, battery: 85, status: 'STANDBY' },
      { id: "drone-02", x: -2, y: 7, z: -3, battery: 18, status: 'STANDBY' },
      { id: "drone-03", x: 3, y: 6, z: 1, battery: 92, status: 'STANDBY' },
      { id: "drone-04", x: 7, y: 4, z: -2, battery: 15, status: 'STANDBY' }
    ]
  }
});
</script>

<style scoped>
.drone-fleet-hud {
  position: absolute;
  top: 1rem;
  left: 1rem;
  width: 320px;
  background: rgba(11, 16, 28, 0.9);
  border: 1px solid var(--border-accent);
  border-radius: 8px;
  z-index: 10;
  pointer-events: auto;
}

.hud-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 242, 254, 0.1);
  border-bottom: 1px solid var(--border-subtle);
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--cyan-primary);
}

.icon-radio {
  color: var(--cyan-primary);
}

.drone-grid {
  padding: 0.6rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.drone-card {
  background: #060910;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.drone-id {
  font-family: var(--font-mono);
  font-size: 0.725rem;
  font-weight: 700;
  color: #f1f5f9;
}

.drone-coords {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: #64748b;
}

.battery-row {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.battery-label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: #94a3b8;
}

.battery-track {
  width: 100%;
  height: 4px;
  background: #1e293b;
  border-radius: 2px;
  overflow: hidden;
}

.battery-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.badge-danger {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid #ef4444;
  color: #f87171;
  font-size: 0.65rem;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}
</style>
