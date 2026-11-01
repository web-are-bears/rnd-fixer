import Button from "./Button";
import Input from "./Input";
import { Loading } from "./Extras";
import { useMemo, useState } from "react";

export default function EdiTable({
  columns,
  data,
  onSave,
  onAdd,
  onDelete,
  loading = false,
  pageSize = 5,
  emptyMessage = "No records found :(",
  rowKey = "_id",
}) {
  const [page, setPage] = useState(0);
  const [editingID, setEditingID] = useState(null);
  const [draft, setDraft] = useState(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  const pageData = useMemo(
    () => data.slice(page * pageSize, (page + 1) * pageSize),
    [data, page, pageSize],
  );

  function startEdit(row) {
    setEditingID(row[rowKey]);
    setDraft({ ...row });
    setError("");
  }

  function startAdd() {
    const newRow = {};

    columns.forEach((col) => {
      newRow[col.key] = col.defaultValue ?? (col.type === "number" ? 0 : "");
    });

    setAdding(true);
    setEditingID(null);
    setDraft(newRow);
    setError("");
    setPage(0);
  }

  function cancelEdit() {
    setEditingID(null);
    setAdding(false);
    setDraft(null);
    setError("");
  }

  function updateField(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function saveEdit(originalRow) {
    if (!onSave) return;

    setSaving(true);
    setError("");

    try {
      await onSave(draft, originalRow);
      cancelEdit();
    } catch (err) {
      setError(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function addRow() {
    if (!onAdd) return;

    setSaving(true);
    setError("");

    try {
      await onAdd(draft);
      cancelEdit();
    } catch (err) {
      setError(err.message || "Failed to add record.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRow(row) {
    if (!onDelete) return;

    setError("");

    try {
      await onDelete(row);
    } catch (err) {
      setError(err.message || "Failed to delete record.");
    }
  }

  if (loading) return <Loading />;

  // hate the amount of nesting I had to do
  // aeugh
  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm font-bold text-red-700" role="alert">
          {error}
        </p>
      )}

      {onAdd && !adding && <Button onClick={startAdd}>Add Row</Button>}

      <div className="overflow-x-auto border-2 border-ink">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-ink text-paper">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="p-3 font-bold uppercase">
                  {col.label}
                </th>
              ))}
              {(onSave || onAdd || onDelete) && (
                <th className="p-3 font-bold uppercase">Actions</th>
              )}
            </tr>
          </thead>

          <tbody>
            {adding && (
              <tr className="border-t-2 border-ink">
                {columns.map((col) => (
                  <td key={col.key} className="p-3">
                    {col.editable !== false ? (
                      <Input
                        type={col.type || "text"}
                        value={draft[col.key] ?? ""}
                        onChange={(e) =>
                          updateField(
                            col.key,
                            col.type === "number"
                              ? e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                              : e.target.value,
                          )
                        }
                        className="min-w-24"
                      />
                    ) : (
                      draft[col.key]
                    )}
                  </td>
                ))}

                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={saving} onClick={addRow}>
                      Save
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={saving}
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </td>
              </tr>
            )}

            {pageData.length === 0 && !adding ? (
              <tr>
                <td
                  colSpan={
                    columns.length + (onSave || onAdd || onDelete ? 1 : 0)
                  }
                  className="p-6 text-center text-ink-soft"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageData.map((row) => {
                const isEditing = editingID === row[rowKey];

                return (
                  <tr key={row[rowKey]} className="border-t-2 border-ink">
                    {columns.map((col) => (
                      <td key={col.key} className="p-3">
                        {isEditing && col.editable !== false ? (
                          <Input
                            type={col.type || "text"}
                            value={draft[col.key] ?? ""}
                            onChange={(e) =>
                              updateField(
                                col.key,
                                col.type === "number"
                                  ? e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                  : e.target.value,
                              )
                            }
                            className="min-w-24"
                          />
                        ) : col.render ? (
                          col.render(row)
                        ) : (
                          row[col.key]
                        )}
                      </td>
                    ))}

                    {(onSave || onAdd || onDelete) && (
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                disabled={saving}
                                onClick={() => saveEdit(row)}
                              >
                                Save
                              </Button>
                              <Button
                                variant="secondary"
                                disabled={saving}
                                onClick={cancelEdit}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              {onSave && (
                                <Button
                                  variant="secondary"
                                  onClick={() => startEdit(row)}
                                >
                                  Edit
                                </Button>
                              )}
                              {onDelete && (
                                <Button
                                  variant="danger"
                                  onClick={() => deleteRow(row)}
                                >
                                  Delete
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-soft">
          Page {page + 1} of {totalPages} ({data.length} records)
        </p>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
