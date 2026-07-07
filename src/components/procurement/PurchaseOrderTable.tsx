import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, FileText, Send, Box } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPurchaseOrders, sendPurchaseOrder, receiveGoods, fetchPurchaseOrder } from "@/services/api";
import PurchaseOrderForm from "./PurchaseOrderForm";
import GoodsReceiptForm from "./GoodsReceiptForm";

export default function PurchaseOrderTable({ onOpenCreate }: { onOpenCreate?: (fn: () => void) => void }) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPO, setEditingPO] = useState<any>(null);
  const [receivingPO, setReceivingPO] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["procurement-orders"],
    queryFn: fetchPurchaseOrders
  });

  const sendMutation = useMutation({
    mutationFn: sendPurchaseOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["procurement-orders"] })
  });

  const receiveMutation = useMutation({
    mutationFn: receiveGoods,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement-orders"] });
      setReceivingPO(null);
    }
  });

  const handleReceiveGoodsClick = async (poId: string) => {
    // Need full PO with items to receive against
    try {
      const fullPo = await fetchPurchaseOrder(poId);
      setReceivingPO(fullPo);
    } catch (e) {
      console.error(e);
      alert("Failed to load PO details.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">Draft</span>;
      case 'sent': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">Sent</span>;
      case 'partial_received': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Partial</span>;
      case 'received': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Received</span>;
      case 'cancelled': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">Cancelled</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const orders = data || [];
  const filtered = orders.filter((o: any) => 
    o.po_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.supplier_name && o.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">Loading...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No purchase orders found.</TableCell>
              </TableRow>
            ) : (
              filtered.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium text-primary">
                    {order.po_number}
                  </TableCell>
                  <TableCell>{order.supplier_name}</TableCell>
                  <TableCell>{order.expected_delivery ? new Date(order.expected_delivery).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>${parseFloat(order.total).toFixed(2)} {order.currency}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={async () => {
                          const fullPo = await fetchPurchaseOrder(order.id);
                          setEditingPO(fullPo);
                        }}>
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        
                        {(order.status === 'draft') && (
                          <DropdownMenuItem onClick={() => sendMutation.mutate(order.id)}>
                            <Send className="mr-2 h-4 w-4" />
                            Send to Supplier
                          </DropdownMenuItem>
                        )}
                        
                        {(order.status === 'sent' || order.status === 'partial_received') && (
                          <DropdownMenuItem onClick={() => handleReceiveGoodsClick(order.id)}>
                            <Box className="mr-2 h-4 w-4" />
                            Receive Goods
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingPO && (
        <PurchaseOrderForm
          isOpen={!!editingPO}
          onClose={() => setEditingPO(null)}
          initialData={editingPO}
          onSubmit={() => {
            // Edit is typically handled if status is draft, but for now we just close or implement update logic
            setEditingPO(null);
          }}
        />
      )}

      {receivingPO && (
        <GoodsReceiptForm
          isOpen={!!receivingPO}
          onClose={() => setReceivingPO(null)}
          purchaseOrder={receivingPO}
          onSubmit={(data) => receiveMutation.mutate(data)}
        />
      )}
    </div>
  );
}
