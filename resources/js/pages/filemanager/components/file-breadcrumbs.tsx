import { Fragment } from 'react';
import { ChevronRightIcon, FolderIcon, HomeIcon } from 'lucide-react';
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
    <div className="relative min-w-0 flex-1">
      <div className="flex items-center gap-0.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-8 shrink-0 gap-1.5 px-2.5', path === '' && 'bg-background shadow-xs ring-1 ring-border')}
          onClick={() => onNavigate('')}
        >
          {path === '' ? <HomeIcon className="size-3.5" /> : <FolderIcon className="size-3.5" />}
          <span className="max-w-[9rem] truncate sm:max-w-[12rem]">{rootLabel}</span>
        </Button>
        {segments.map((segment, index) => {
          const target = segments.slice(0, index + 1).join('/');
          const isLast = index === segments.length - 1;

          return (
            <Fragment key={target}>
              <ChevronRightIcon className="text-muted-foreground size-3.5 shrink-0" />
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 max-w-[8rem] shrink-0 truncate px-2.5 sm:max-w-[10rem]',
                  isLast && 'bg-background shadow-xs ring-1 ring-border',
                )}
                onClick={() => onNavigate(target)}
              >
                {segment}
              </Button>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
