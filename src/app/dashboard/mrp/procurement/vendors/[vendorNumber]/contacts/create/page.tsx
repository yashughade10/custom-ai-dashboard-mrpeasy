"use client";

import React from "react";
import { use } from "react";
import VendorContactForm from "@/components/procurement/VendorContactForm";

export default function CreateVendorContactPage({ params }: { params: Promise<{ vendorNumber: string }> }) {
  const { vendorNumber } = use(params);
  return <VendorContactForm vendorNumber={vendorNumber} />;
}
