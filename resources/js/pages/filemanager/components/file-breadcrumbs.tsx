import { Fragment } from 'react';
import { ChevronRightIcon, HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="flex flex-wrap items-center gap-1 text-sm">
      <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => onNavigate('')}>
        <HomeIcon className="size-4" />
        <span className="hidden sm:inline">{rootLabel}</span>
      </Button>
      {segments.map((segment, index) => {
        const target = segments.slice(0, index + 1).join('/');

        return (
          <Fragment key={target}>
            <ChevronRightIcon className="text-muted-foreground size-4" />
            <Button variant="ghost" size="sm" className="h-8 max-w-[10rem] truncate px-2" onClick={() => onNavigate(target)}>
              {segment}
            </Button>
          </Fragment>
        );
      })}
    </div>
  );
}
