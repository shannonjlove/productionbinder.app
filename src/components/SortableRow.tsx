import { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface SortableRowProps {
  id: string;
  children: (handleProps: {
    attributes: ReturnType<typeof useSortable>["attributes"];
    listeners: ReturnType<typeof useSortable>["listeners"];
    handle: ReactNode;
  }) => ReactNode;
  asTableRow?: boolean;
  className?: string;
}

export function SortableRow({ id, children, asTableRow, className }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handle = (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-amber-500 touch-none"
      aria-label="Drag to reorder"
    >
      <GripVertical className="w-4 h-4" />
    </button>
  );

  if (asTableRow) {
    return (
      <tr ref={setNodeRef} style={style} className={className}>
        {children({ attributes, listeners, handle })}
      </tr>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className={className}>
      {children({ attributes, listeners, handle })}
    </div>
  );
}
