import Masonry from 'react-masonry-css';

const MASONRY_BREAKPOINTS = {
  default: 4,
  1400: 3,
  1100: 2,
  700: 1,
};

/**
 * Renders a grid or list of notes using Masonry layout for grid view.
 * Handles empty state display when no items are present.
 *
 * @param {{ items: object[], viewMode: string, title?: string, emptyMessage?: string, renderItem: Function, className?: string }} props
 */
function NoteGrid({ items, viewMode, title, emptyMessage, renderItem, className = '' }) {
  const isEmpty = items.length === 0;

  return (
    <section className={`mb-4 ${className}`}>
      {title ? <div className="notes-section-title">{title}</div> : null}

      {!isEmpty ? (
        viewMode === 'grid' ? (
          <Masonry
            breakpointCols={MASONRY_BREAKPOINTS}
            className="notes-masonry-grid"
            columnClassName="notes-masonry-grid_column"
          >
            {items.map(renderItem)}
          </Masonry>
        ) : (
          <div className="notes-list">{items.map(renderItem)}</div>
        )
      ) : emptyMessage ? (
        <div className="notes-shared-space__empty">{emptyMessage}</div>
      ) : null}
    </section>
  );
}

export default NoteGrid;
