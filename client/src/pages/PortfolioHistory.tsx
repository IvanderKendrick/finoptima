import { Layout } from "@/components/Layout";
import {
  usePortfolioHistory,
  useDeletePortfolioHistory,
} from "@/hooks/use-portfolio";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Trash2, CalendarClock } from "lucide-react";
import { format } from "date-fns";

export default function PortfolioHistory() {
  const { data: history, isLoading } = usePortfolioHistory();
  const deleteMutation = useDeletePortfolioHistory();

  const handleDelete = (id: number) => {
    if (confirm("Delete this portfolio snapshot?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
          Portfolio History
        </h2>
        <p className="text-slate-500">
          Track snapshots of your portfolio value over time.
        </p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="pl-6">Date</TableHead>
                <TableHead>Portfolio Value</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {history?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-48 text-center text-slate-500"
                  >
                    <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    No portfolio history found. Record your first snapshot from
                    the Assets page.
                  </TableCell>
                </TableRow>
              ) : (
                history?.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell className="pl-6 font-medium text-slate-900">
                      {format(new Date(item.date), "MMM dd, yyyy")}
                    </TableCell>

                    <TableCell className="font-medium text-emerald-600">
                      Rp{" "}
                      {item.value.toLocaleString("id-ID", {
                        minimumFractionDigits: 0,
                      })}
                    </TableCell>

                    <TableCell className="text-right pr-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Layout>
  );
}
