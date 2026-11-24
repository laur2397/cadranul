import { createHmac } from 'node:crypto'
/** Semnatura cererii de reincarcare a instantaneului (worker -> site), derivata din PAYLOAD_SECRET. */
export const semnaturaReincarcare = () => createHmac('sha256', process.env.PAYLOAD_SECRET || '').update('cadranul:reincarca-date').digest('hex')
