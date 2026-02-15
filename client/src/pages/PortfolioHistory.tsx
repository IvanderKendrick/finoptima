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
import { Loader2, Trash2, CalendarClock, ExternalLink } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { useLocation } from "wouter";

export default function PortfolioHistory() {
  const { data: history, isLoading } = usePortfolioHistory();
  const deleteMutation = useDeletePortfolioHistory();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [, navigate] = useLocation();

  const handleDelete = (id: number) => {
    setDeleteId(id);
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
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() =>
                            navigate(`/history/portfolio/${item.id}`)
                          }
                          title="View details"
                          aria-label="View details"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDelete(item.id)}
                          title="Delete"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete history?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              record.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId !== null) {
                  deleteMutation.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
