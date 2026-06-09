import { FormEvent, useEffect, useState } from 'react';
import { LoaderCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormFields } from '@/components/ui/form';
import InputError from '@/components/ui/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PermissionsDialog({
  open,
  onOpenChange,
  defaultValue,
  error,
  processing,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValue: string;
  error?: string | null;
  processing?: boolean;
  onSubmit: (permissions: string) => Promise<void> | void;
}) {
  const [permissions, setPermissions] = useState(defaultValue);

  useEffect(() => {
    if (open) {
      setPermissions(defaultValue.replace(/[^0-7]/g, '').slice(-3) || '644');
    }
  }, [open, defaultValue]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!permissions.trim() || processing) {
      return;
    }

    await onSubmit(permissions.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Change permissions</DialogTitle>
          <DialogDescription className="sr-only">Set numeric permissions for the selected item.</DialogDescription>
        </DialogHeader>
        <Form id="filemanager-permissions-form" onSubmit={submit} className="p-4">
          <FormFields>
            <FormField>
              <Label htmlFor="filemanager-permissions">Permissions</Label>
              <Input
                id="filemanager-permissions"
                value={permissions}
                onChange={(event) => setPermissions(event.target.value.replace(/[^0-7]/g, '').slice(0, 4))}
                placeholder="644"
                disabled={processing}
              />
              <p className="text-muted-foreground text-sm">Use numeric chmod values like 644, 755, or 775.</p>
              <InputError message={error ?? undefined} />
            </FormField>
          </FormFields>
        </Form>
        <DialogFooter>
          <div className="flex items-center gap-2">
            <Button form="filemanager-permissions-form" type="submit" disabled={processing || !permissions.trim()}>
              {processing && <LoaderCircleIcon className="animate-spin" />}
              Save
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
