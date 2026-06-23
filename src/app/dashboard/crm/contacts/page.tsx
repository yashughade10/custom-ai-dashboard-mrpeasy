import ContactsTable from "@/components/crm/ContactsTable";

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Contacts</h1>
        <p className="text-sm text-muted-foreground">
          Manage your CRM contacts, lifecycles, and ownership.
        </p>
      </div>
      <ContactsTable />
    </div>
  );
}
