import { FormEvent, useEffect, useState } from 'react';
import { LoaderCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormFields } from '@/components/ui/form';
import InputError from '@/components/ui/input-error';
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
  error,
  processing,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  label: string;
  defaultValue?: string;
  confirmLabel: string;
  error?: string | null;
  processing?: boolean;
  onSubmit: (name: string) => Promise<void> | void;
}) {
  const [name, setName] = useState(defaultValue);

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
    if (!name.trim() || processing) {
      return;
    }

    await onSubmit(name.trim());
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>
        </DialogHeader>
        <Form id="filemanager-name-form" onSubmit={submit} className="p-4">
          <FormFields>
            <FormField>
              <Label htmlFor="filemanager-name">{label}</Label>
              <Input
                id="filemanager-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoFocus
                disabled={processing}
              />
              <p className="text-muted-foreground text-sm">{description}</p>
              <InputError message={error ?? undefined} />
            </FormField>
          </FormFields>
        </Form>
        <DialogFooter>
          <div className="flex items-center gap-2">
            <Button form="filemanager-name-form" type="submit" disabled={processing || !name.trim()}>
              {processing && <LoaderCircleIcon className="animate-spin" />}
              {confirmLabel}
            </Button>
            <DialogClose asChild>
              <Button variant="outline" disabled={processing}>
                Cancel
              </Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
