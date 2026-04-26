import { motion, useReducedMotion } from 'framer-motion';
import NoteCard from '../../features/notes/components/NoteCard';

/**
 * Wraps NoteCard in a Framer Motion animated container.
 * Respects the user's reduced-motion preference.
 *
 * @param {{ note: object, viewMode: string, onOpen: Function, onTogglePin: Function, isOffline: boolean, shareScope: string|null, accessPermission: string|null }} props
 */
function AnimatedNoteCard({ note, viewMode, onOpen, onTogglePin, isOffline, shareScope, accessPermission }) {
  const prefersReducedMotion = useReducedMotion();

  const motionProps = {
    layout: true,
    initial: prefersReducedMotion ? false : { opacity: 0, y: 14, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 },
    transition: prefersReducedMotion
      ? { duration: 0.12 }
      : { type: 'spring', stiffness: 300, damping: 26, mass: 0.7 },
  };

  return (
    <motion.div key={note.id} className="note-card-motion" {...motionProps}>
      <NoteCard
        note={note}
        viewMode={viewMode}
        onOpen={onOpen}
        onTogglePin={onTogglePin}
        isOffline={isOffline}
        shareScope={shareScope}
        accessPermission={accessPermission}
      />
    </motion.div>
  );
}

export default AnimatedNoteCard;
