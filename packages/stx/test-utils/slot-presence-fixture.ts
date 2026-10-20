export const slotPresenceProbe = `<script client>
const active = state(false)
</script><div class="probe">
<button class="toggle" @click="active.set(!active())">Toggle</button>
<p class="or" :if="$slots.actions || active()">OR</p>
<p class="and" :if="$slots.actions && active()">AND</p>
<p class="not" :if="!$slots.actions && active()">NOT</p>
<p class="bracket" :if="active() || $slots['actions']">BRACKET</p>
<p class="presence" x-text="$slots.actions ? 'provided' : 'absent'"></p>
<slot name="actions" /><slot />
</div>`
