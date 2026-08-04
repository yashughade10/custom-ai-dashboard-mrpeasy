import { redirect } from "next/navigation";

export default function StockSettingsIndex() {
  redirect("/dashboard/mrp/inventory/settings/product-groups");
}

