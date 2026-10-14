"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DealsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/crm/opportunities");
  }, [router]);

  return null;
}
