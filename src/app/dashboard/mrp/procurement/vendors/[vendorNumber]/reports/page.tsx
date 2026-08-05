"use client";

import React from "react";
import { use } from "react";
import VendorReports from "@/components/procurement/VendorReports";

export default function VendorReportsPage({ params }: { params: Promise<{ vendorNumber: string }> }) {
  const { vendorNumber } = use(params);
  return <VendorReports vendorNumber={vendorNumber} />;
}
