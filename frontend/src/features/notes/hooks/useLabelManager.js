import { useState } from 'react';

/**
 * Manages label CRUD: add, rename, delete, and filter selection.
 *
 * @param {{ labels: object[], setLabels: Function, setNotes: Function }} workspace
 * @returns {{
 *   selectedLabels, showShared,
 *   handleToggleLabel, handleToggleShared, handleShowAll,
 *   handleAddLabel, handleRenameLabel, handleDeleteLabel
 * }}
 */
export function useLabelManager({ labels, setLabels, setNotes }) {
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [showShared, setShowShared] = useState(false);

  function handleToggleLabel(labelName) {
    setSelectedLabels((current) =>
      current.includes(labelName)
        ? current.filter((item) => item !== labelName)
        : [...current, labelName],
    );
    setShowShared(false);
  }

  function handleToggleShared() {
    setShowShared((current) => !current);
    setSelectedLabels([]);
  }

  function handleShowAll() {
    setSelectedLabels([]);
    setShowShared(false);
  }

  function handleAddLabel(labelName) {
    setLabels((current) => {
      const normalizedName = labelName.trim().toLowerCase();

      if (current.some((label) => label.name.trim().toLowerCase() === normalizedName)) {
        return current;
      }

      return [...current, { id: crypto.randomUUID(), name: labelName.trim() }];
    });
  }

  function handleRenameLabel(labelId, nextName) {
    const currentLabel = labels.find((label) => label.id === labelId);

    if (!currentLabel) {
      return;
    }

    setLabels((current) =>
      current.map((label) => (label.id === labelId ? { ...label, name: nextName } : label)),
    );
    setSelectedLabels((current) =>
      current.map((name) => (name === currentLabel.name ? nextName : name)),
    );
    setNotes((current) =>
      current.map((note) => ({
        ...note,
        labels: note.labels.map((name) => (name === currentLabel.name ? nextName : name)),
      })),
    );
  }

  function handleDeleteLabel(labelId) {
    const label = labels.find((item) => item.id === labelId);

    setLabels((current) => current.filter((item) => item.id !== labelId));

    if (!label) {
      return;
    }

    setSelectedLabels((current) => current.filter((item) => item !== label.name));
    setNotes((current) =>
      current.map((note) => ({
        ...note,
        labels: note.labels.filter((item) => item !== label.name),
      })),
    );
  }

  return {
    selectedLabels,
    showShared,
    handleToggleLabel,
    handleToggleShared,
    handleShowAll,
    handleAddLabel,
    handleRenameLabel,
    handleDeleteLabel,
  };
}
