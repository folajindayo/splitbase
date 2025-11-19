import { GET } from "@/api/health/route";

describe("/api/health", () => {
  it("returns health status", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.timestamp).toBeDefined();
    expect(data.uptime).toBeGreaterThan(0);
  });

  it("includes environment information", async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.environment).toBeDefined();
    expect(data.version).toBeDefined();
  });
});

