import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAssets,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
  useRecordPortfolioHistory,
} from "@/hooks/use-assets";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  WalletMinimal,
  Camera,
  BarChart2,
} from "lucide-react";
import AssetReturnsDialog from "@/components/AssetReturnsDialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAssetSchema, type Asset } from "@shared/schema";
import { z } from "zod";

const assetFormSchema = insertAssetSchema.extend({
  value: z.coerce.number(),
  expectedReturn: z.coerce.number(),
  risk: z.coerce.number(),
});

type AssetFormData = z.infer<typeof assetFormSchema>;

export default function Assets() {
  const { data: assets, isLoading } = useAssets();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [returnsAssetId, setReturnsAssetId] = useState<number | null>(null);
  const [returnsOpen, setReturnsOpen] = useState(false);

  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();
  const deleteMutation = useDeleteAsset();

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      symbol: "",
      name: "",
      value: 0,
      expectedReturn: 0,
      risk: 0,
      color: "#000000",
    },
  });

  const onSubmit = (data: AssetFormData) => {
    if (editingAsset) {
      updateMutation.mutate(
        { id: editingAsset.id, ...data },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setEditingAsset(null);
            form.reset();
          },
        },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsDialogOpen(false);
          form.reset();
        },
      });
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    form.reset({
      symbol: asset.symbol,
      name: asset.name,
      value: asset.value,
      expectedReturn: asset.expectedReturn,
      risk: asset.risk,
      color: asset.color,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    setEditingAsset(null);
    form.reset({
      symbol: "",
      name: "",
      value: 0,
      expectedReturn: 0,
      risk: 0,
    });
    setIsDialogOpen(true);
  };

  const recordHistory = useRecordPortfolioHistory();

  if (isLoading) {
    return (
      <Layout>
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
        </div>
      </Layout>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Assets
          </h2>
          <p className="text-slate-500">Manage your portfolio holdings.</p>
        </div>

        <div className="flex gap-1">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={handleAddNew}
                className="bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingAsset ? "Edit Asset" : "Add New Asset"}
                </DialogTitle>
                <DialogDescription>
                  {editingAsset
                    ? "Make changes to your asset details below."
                    : "Enter the details of the asset you want to add to your portfolio."}
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="symbol">Symbol</Label>
                    <Input
                      id="symbol"
                      placeholder="AAPL"
                      {...form.register("symbol")}
                    />
                    {form.formState.errors.symbol && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.symbol.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Apple Inc."
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <p className="text-xs text-red-500">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Value (Rp)</Label>
                  <Input id="value" type="number" {...form.register("value")} />
                  {form.formState.errors.value && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.value.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>

                  <div className="flex items-center gap-3">
                    {/* Color Picker */}
                    <Input
                      id="color"
                      type="color"
                      className="h-10 w-14 p-1 cursor-pointer"
                      {...form.register("color")}
                    />

                    {/* Hex Preview */}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div
                        className="h-5 w-5 rounded-full border"
                        style={{ backgroundColor: form.watch("color") }}
                      />
                      <span>{form.watch("color") || "#------"}</span>
                    </div>
                  </div>

                  {form.formState.errors.color && (
                    <p className="text-xs text-red-500">
                      {form.formState.errors.color.message}
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 w-full"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingAsset ? (
                      "Save Changes"
                    ) : (
                      "Add Asset"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={() => recordHistory.mutate()}
            disabled={recordHistory.isPending}
            className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
            title="Save a snapshot of your portfolio value for today"
          >
            {recordHistory.isPending ? (
              "Saving..."
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Record
              </>
            )}
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Asset</TableHead>
                <TableHead className="text-right">Value (Rp)</TableHead>
                <TableHead className="text-right">Exp. Return</TableHead>
                <TableHead className="text-right">Risk (StdDev)</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-slate-500"
                  >
                    <WalletMinimal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No assets found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                assets?.map((asset) => (
                  <TableRow
                    key={asset.id}
                    className="group hover:bg-slate-50/50"
                  >
                    <TableCell className="pl-6 font-medium">
                      <div className="flex flex-col">
                        <span className="text-slate-900">{asset.symbol}</span>
                        <span className="text-xs text-slate-500 font-normal">
                          {asset.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {asset.value.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600">
                      {asset.expectedReturn}%
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {asset.risk}%
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-emerald-600"
                          onClick={() => handleEdit(asset)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-sky-600"
                          onClick={() => {
                            setReturnsAssetId(asset.id);
                            setReturnsOpen(true);
                          }}
                          title="Manage monthly returns"
                        >
                          <BarChart2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-red-500"
                          onClick={() => handleDelete(asset.id)}
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
      <AssetReturnsDialog
        assetId={returnsAssetId}
        open={returnsOpen}
        onOpenChange={(v) => {
          setReturnsOpen(v);
          if (!v) setReturnsAssetId(null);
        }}
      />
    </Layout>
  );
}
