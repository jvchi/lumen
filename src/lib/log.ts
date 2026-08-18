export function requestId() { return crypto.randomUUID(); }
export function logPipeline(request: string, event: string, data: Record<string, unknown> = {}) { console.info(JSON.stringify({ timestamp: new Date().toISOString(), requestId: request, event, ...data })); }
