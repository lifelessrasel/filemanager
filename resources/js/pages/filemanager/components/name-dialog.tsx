import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function NameDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  defaultValue = '',
  confirmLabel,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  label: string;
  defaultValue?: string;
  confirmLabel: string;
  onSubmit: (name: string) => Promise<void> | void;
}) {
  const [name, setName] = useState(defaultValue);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setName(defaultValue);
    }
  }, [open, defaultValue]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName(defaultValue);
    }
    onOpenChange(nextOpen);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }

    setProcessing(true);
    try {
      await onSubmit(name.trim());
      handleOpenChange(false);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filemanager-name">{label}</Label>
            <Input
              id="filemanager-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              disabled={processing}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={processing}>
              Cancel
            </Button>
            <Button type="submit" disabled={processing || !name.trim()}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
