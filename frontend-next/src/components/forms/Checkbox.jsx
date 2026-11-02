/** Case à cocher avec son libellé (le libellé peut contenir des liens). */
export default function Checkbox({ id, children, error, ...inputProps }) {
    const messageId = error ? `${id}-error` : undefined;

    return (
        <div>
            <div className="flex items-start gap-2">
                <input
                    id={id}
                    name={id}
                    type="checkbox"
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={messageId}
                    className="mt-1 h-4 w-4 rounded border-gray-300 accent-jardinerie-primary focus:ring-jardinerie-primary"
                    {...inputProps}
                />
                <label htmlFor={id} className="text-sm text-gray-700">{children}</label>
            </div>
            {error && <p id={messageId} className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}
