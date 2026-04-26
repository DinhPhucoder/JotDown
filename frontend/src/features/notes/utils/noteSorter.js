/**
 * Sorts notes by pin status (pinned first), then by updatedAt descending.
 *
 * @param {object[]} items
 * @returns {object[]}
 */
export function sortNotes(items) {
  return [...items].sort((left, right) => {
    if (left.isPinned !== right.isPinned) {
      return Number(right.isPinned) - Number(left.isPinned);
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}
