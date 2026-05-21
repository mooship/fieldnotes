export async function onRequest(context) {
  const url = new URL(context.request.url);
  const bytes = url.searchParams.get("bytes");
  const green = url.searchParams.get("green") ?? "1";

  if (!bytes || Number.isNaN(Number(bytes))) {
    return Response.json({ error: "Invalid bytes parameter" }, { status: 400 });
  }

  try {
    const upstream = await fetch(
      `https://api.websitecarbon.com/data?bytes=${encodeURIComponent(bytes)}&green=${encodeURIComponent(green)}`
    );

    if (!upstream.ok) {
      return Response.json(
        { error: `Upstream error ${upstream.status}` },
        { status: upstream.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await upstream.json();

    return Response.json(
      { gco2e: data.c, cleanerThan: data.p },
      {
        status: 200,
        headers: { "Cache-Control": "public, max-age=86400" },
      }
    );
  } catch {
    return Response.json({ error: "Failed to fetch" }, { status: 502 });
  }
}
