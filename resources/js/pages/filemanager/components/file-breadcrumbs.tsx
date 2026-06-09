import { Fragment } from 'react';
import { ChevronRightIcon, FolderIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function FileBreadcrumbs({
  path,
  rootLabel,
  onNavigate,
}: {
  path: string;
  rootLabel: string;
  onNavigate: (path: string) => void;
}) {
  const segments = path ? path.split('/').filter(Boolean) : [];

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm">
      <Button
        variant="ghost"
        size="sm"
        className={cn('h-8 shrink-0 px-2', path === '' && 'bg-muted text-foreground')}
        onClick={() => onNavigate('')}
      >
        <FolderIcon className="size-4" />
        <span className="max-w-[8rem] truncate">{rootLabel}</span>
      </Button>
      {segments.map((segment, index) => {
        const target = segments.slice(0, index + 1).join('/');
        const isLast = index === segments.length - 1;

        return (
          <Fragment key={target}>
            <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
            <Button
              variant="ghost"
              size="sm"
              className={cn('h-8 max-w-[10rem] shrink-0 truncate px-2', isLast && 'bg-muted text-foreground')}
              onClick={() => onNavigate(target)}
            >
              {segment}
            </Button>
          </Fragment>
        );
      })}
    </div>
  );
}
