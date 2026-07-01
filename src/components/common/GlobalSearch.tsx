"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useQuery } from "@tanstack/react-query";
import { fetchSearchResults } from "@/services/api";
import { Search, Building, User, Target, ClipboardList } from "lucide-react";
import "./command-palette.css"; // We'll add some basic styles since we aren't using shadcn Command component wrapper

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { data: results, isLoading } = useQuery({
    queryKey: ["global-search", query],
    queryFn: () => fetchSearchResults(query),
    enabled: query.length > 1,
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "contact": return <User className="h-4 w-4 mr-2 text-muted-foreground" />;
      case "company": return <Building className="h-4 w-4 mr-2 text-muted-foreground" />;
      case "deal": return <Target className="h-4 w-4 mr-2 text-muted-foreground" />;
      case "lead": return <ClipboardList className="h-4 w-4 mr-2 text-muted-foreground" />;
      default: return <Search className="h-4 w-4 mr-2 text-muted-foreground" />;
    }
  };

  const getUrl = (type: string, id: number) => {
    switch (type) {
      case "contact": return `/dashboard/crm/contacts?id=${id}`;
      case "company": return `/dashboard/crm/companies?id=${id}`;
      case "deal": return `/dashboard/crm/deals?id=${id}`;
      case "lead": return `/dashboard/crm/leads?id=${id}`;
      default: return `/dashboard`;
    }
  };

  const groupedResults = results?.reduce((acc: any, curr: any) => {
    if (!acc[curr.type]) acc[curr.type] = [];
    acc[curr.type].push(curr);
    return acc;
  }, {}) || {};

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline-flex">Search...</span>
        <kbd className="hidden sm:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={() => setOpen(false)}></div>
          <div className="relative z-50 w-full max-w-xl shadow-2xl rounded-xl border bg-card overflow-hidden">
            <Command className="flex w-full flex-col h-full bg-transparent" label="Global Command Menu">
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Command.Input 
                  autoFocus 
                  placeholder="Search contacts, companies, deals, leads..." 
                  className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0"
                  value={query}
                  onValueChange={setQuery}
                />
              </div>
              
              <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                {isLoading && query.length > 1 && (
                  <Command.Loading className="py-6 text-center text-sm text-muted-foreground">
                    Searching...
                  </Command.Loading>
                )}
                
                {!isLoading && query.length > 1 && results?.length === 0 && (
                  <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                    No results found for "{query}".
                  </Command.Empty>
                )}

                {Object.keys(groupedResults).map((type) => (
                  <Command.Group 
                    key={type} 
                    heading={<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground capitalize">{type}s</div>}
                    className="p-1 text-foreground"
                  >
                    {groupedResults[type].map((item: any) => (
                      <Command.Item
                        key={`${item.type}-${item.id}`}
                        onSelect={() => {
                          router.push(getUrl(item.type, item.id));
                          setOpen(false);
                          setQuery("");
                        }}
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent"
                      >
                        {getIcon(item.type)}
                        <span>{item.name}</span>
                        {item.detail && (
                          <span className="ml-2 text-xs text-muted-foreground">{item.detail}</span>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}
