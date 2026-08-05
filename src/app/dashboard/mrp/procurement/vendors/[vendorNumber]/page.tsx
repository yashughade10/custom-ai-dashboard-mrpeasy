"use client";

import React from "react";
import { use } from "react";
import VendorForm from "@/components/procurement/VendorForm";

export default function EditVendorPage({ params }: { params: Promise<{ vendorNumber: string }> }) {
  const { vendorNumber } = use(params);
  return <VendorForm vendorNumber={vendorNumber} />;
}
