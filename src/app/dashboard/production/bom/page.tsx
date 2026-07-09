"use client";

import BomEditor from "@/components/production/BomEditor";
import { RouteGuard } from "@/components/auth/RouteGuard";

function BomPage() {
  return <BomEditor />;
}

export default function BomPageGuarded() {
  return (
    <RouteGuard module="production">
      <BomPage />
    </RouteGuard>
  );
}
