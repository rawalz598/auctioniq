import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const vinRaw = (searchParams.get("vin") || "").trim();

    if (!vinRaw) {
      return NextResponse.json({ error: "VIN is required" }, { status: 400 });
    }

    // cleanup: remove spaces, uppercase
    const vin = vinRaw.replace(/\s+/g, "").toUpperCase();

    if (vin.length < 11) {
      return NextResponse.json({ error: "VIN looks too short" }, { status: 400 });
    }

    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${encodeURIComponent(
      vin
    )}?format=json`;

    const r = await fetch(url, { cache: "no-store" });

    if (!r.ok) {
      return NextResponse.json(
        { error: "VIN decode request failed" },
        { status: 502 }
      );
    }

    const data = await r.json();
    const row = data?.Results?.[0];

    if (!row) {
      return NextResponse.json({ error: "No VIN decode results" }, { status: 404 });
    }

    const year = Number(row.ModelYear) || null;
    const make = (row.Make || "").trim();
    const model = (row.Model || "").trim();
    const trim = (row.Trim || "").trim();

    if (!year && !make && !model) {
      return NextResponse.json(
        { error: "VIN decode returned empty data" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      vin,
      year,
      make,
      model,
      trim,
      bodyClass: (row.BodyClass || "").trim(),
      engineCylinders: (row.EngineCylinders || "").trim(),
      fuelTypePrimary: (row.FuelTypePrimary || "").trim(),
      driveType: (row.DriveType || "").trim(),
      transmissionStyle: (row.TransmissionStyle || "").trim(),
    });
  } catch {
    return NextResponse.json({ error: "VIN decode server error" }, { status: 500 });
  }
}