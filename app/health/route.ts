// Lightweight liveness probe for the host (Railway). Deliberately doesn't call the backend,
// so a backend outage doesn't make the platform restart this service.
export function GET() {
  return Response.json({ status: "ok" });
}
