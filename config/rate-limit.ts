export const rateLimitConfig = {
  actions: {
    // 3 per 24h
    submission: { points: 3, duration: 24 * 60 * 60 },
    // 3 per 24h
    newsletter: { points: 3, duration: 24 * 60 * 60 },
    // 3 per 1h
    report: { points: 3, duration: 60 * 60 },
    // 5 per 1h
    claim: { points: 5, duration: 60 * 60 },
    // 20 per 1h
    media: { points: 20, duration: 60 * 60 },
  },
}
