import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth-provider";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAssetReturns, useCreateAssetReturns } from "@/hooks/use-assets";

const monthlyReturnSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM"),
  value: z.coerce.number(),
});

const formSchema = z.object({
  returns: z.array(monthlyReturnSchema).length(12),
});

type FormSchema = z.infer<typeof formSchema>;

function last12Months(): { month: string }[] {
  const res: { month: string }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    res.push({ month: format(d, "yyyy-MM") });
  }
  return res;
}

export function AssetReturnsDialog({
  assetId,
  open,
  onOpenChange,
}: {
  assetId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { token } = useAuth();
  const { toast } = useToast();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { returns: last12Months().map((m) => ({ ...m, value: 0 })) },
  });

  const { fields, replace } = useFieldArray({
    name: "returns",
    control: form.control,
  });

  const { data, isLoading } = useAssetReturns(assetId, open);

  useEffect(() => {
    if (!open) return;

    if (data?.returns?.length === 12) {
      replace(
        data.returns.map((r) => ({
          month: r.month.slice(0, 7), // YYYY-MM
          value: r.value,
        })),
      );
    } else {
      replace(last12Months().map((m) => ({ ...m, value: 0 })));
    }
  }, [open, data, replace]);

  const createReturnsMutation = useCreateAssetReturns(assetId);

  const onSubmit = (values: FormSchema) => {
    createReturnsMutation.mutate(
      { returns: values.returns },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Monthly Returns</DialogTitle>
          <DialogDescription>
            Enter the last 12 months of returns for this asset (percent values).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {fields.map((field, idx) => (
              <div key={field.id} className="space-y-1">
                <Label className="text-xs">{field.month}</Label>
                <Controller
                  control={form.control}
                  name={`returns.${idx}.value` as const}
                  render={({ field: f }) => (
                    <Input {...f} type="number" step="0.01" placeholder="0.0" />
                  )}
                />
              </div>
            ))}
          </div>

          {form.formState.errors?.returns && (
            <p className="text-sm text-red-500">
              Please provide exactly 12 months of returns.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AssetReturnsDialog;
