import { FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import { Editor } from '@monaco-editor/react';
import { LoaderCircleIcon } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAppearance } from '@/hooks/use-appearance';
import { useInputFocus } from '@/stores/useInputFocus';
import { fileManagerHeaders, getApiErrorMessage, putJson } from '@/pages/filemanager/lib/api-client';
import { FileEntry } from '@/pages/filemanager/types';
import { SharedData } from '@/types';
import { Server } from '@/types/server';
import { Site } from '@/types/site';
import { toast } from 'sonner';

export default function EditFileSheet({
  open,
  onOpenChange,
  server,
  site,
  file,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server: Server;
  site: Site;
  file: FileEntry | null;
  onSaved: () => void;
}) {
  const { csrf_token } = usePage<SharedData>().props;
  const { getActualAppearance } = useAppearance();
  const setFocused = useInputFocus((state) => state.setFocused);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFocused(open);
    return () => setFocused(false);
  }, [open, setFocused]);

  useEffect(() => {
    if (!open || !file) {
      return;
    }

    setLoading(true);
    axios
      .get(route('site-filemanager.content', { server: server.id, site: site.id }), {
        params: { path: file.path },
        headers: fileManagerHeaders(csrf_token),
      })
      .then((response) => {
        setContent(response.data.content ?? '');
      })
      .catch(() => {
        toast.error('Failed to load file contents.');
        onOpenChange(false);
      })
      .finally(() => setLoading(false));
  }, [open, file, server.id, site.id, onOpenChange, csrf_token]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      return;
    }

    setSaving(true);
    try {
      await putJson(csrf_token, route('site-filemanager.content.update', { server: server.id, site: site.id }), {
        path: file.path,
        content,
      });
      toast.success('File saved.');
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-5xl" onCloseAutoFocus={(event) => event.preventDefault()}>
        <SheetHeader>
          <SheetTitle>{file?.name ?? 'Edit file'}</SheetTitle>
          <SheetDescription className="sr-only">Edit the selected file contents.</SheetDescription>
        </SheetHeader>
        <form id="filemanager-edit-form" className="min-h-0 flex-1" onSubmit={submit}>
          {loading ? (
            <div className="flex h-full min-h-[20rem] items-center justify-center">
              <LoaderCircleIcon className="text-muted-foreground size-6 animate-spin" />
            </div>
          ) : (
            <Editor
              value={content}
              theme={getActualAppearance() === 'dark' ? 'vs-dark' : 'vs'}
              className="h-full min-h-[20rem]"
              onChange={(value) => setContent(value ?? '')}
              options={{ fontSize: 14, minimap: { enabled: false } }}
            />
          )}
        </form>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button type="submit" form="filemanager-edit-form" disabled={loading || saving}>
            {saving && <LoaderCircleIcon className="animate-spin" />}
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
