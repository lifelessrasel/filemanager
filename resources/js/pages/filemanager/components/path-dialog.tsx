import { FormEvent, useEffect, useState } from 'react';
import { LoaderCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormFields } from '@/components/ui/form';
import InputError from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PathDialog({
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
  onSubmit: (path: string) => Promise<void> | void;
}) {
  const [path, setPath] = useState(defaultValue);

  useEffect(() => {
    if (open) {
      setPath(defaultValue);
    }
  }, [open, defaultValue]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (processing) {
      return;
    }

    await onSubmit(path.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>
        </DialogHeader>
        <Form id="filemanager-path-form" onSubmit={submit} className="p-4">
          <FormFields>
            <FormField>
              <Label htmlFor="filemanager-path">{label}</Label>
              <Input
                id="filemanager-path"
                value={path}
                onChange={(event) => setPath(event.target.value)}
                placeholder="Leave empty for current folder"
                disabled={processing}
              />
              <p className="text-muted-foreground text-sm">{description}</p>
              <InputError message={error ?? undefined} />
            </FormField>
          </FormFields>
        </Form>
        <DialogFooter>
          <div className="flex items-center gap-2">
            <Button form="filemanager-path-form" type="submit" disabled={processing}>
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
