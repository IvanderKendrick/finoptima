import { Layout } from "@/components/Layout";
import {
  useOptimizationHistory,
  useDeleteHistory,
} from "@/hooks/use-optimization";
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
import { format } from "date-fns";
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
import { useLocation } from "wouter";

export default function History() {
  const { data: history, isLoading } = useOptimizationHistory();
  const deleteMutation = useDeleteHistory();
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
          Optimization History
        </h2>
        <p className="text-slate-500">Review your past analysis results.</p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="pl-6">Date</TableHead>
                <TableHead>Return</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Sharpe Ratio</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-48 text-center text-slate-500"
                  >
                    <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    No optimization history found. Run your first analysis in
                    the Optimization tab.
                  </TableCell>
                </TableRow>
              ) : (
                history?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-6 font-medium text-slate-900">
                      {item.date
                        ? format(new Date(item.date), "MMM dd, yyyy HH:mm")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-emerald-600 font-medium">
                      {item.return.toFixed(2)}%
                    </TableCell>
                    <TableCell>{item.risk.toFixed(2)}%</TableCell>
                    <TableCell>{item.sharpeRatio.toFixed(2)}</TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-emerald-600"
                          onClick={() =>
                            navigate(`/history/optimization/${item.id}`)
                          }
                          title="View details"
                          aria-label="View details"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-500"
                          onClick={() => handleDelete(item.id)}
                          aria-label="Delete"
                          title="Delete"
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
