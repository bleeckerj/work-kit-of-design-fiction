import React, { useMemo, useState } from 'react';

const SafeText = ({ children }) => (
  <div className="whitespace-pre-wrap break-words text-sm text-gray-800">
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <div className="mb-3">
    <div className="text-xs uppercase text-gray-500 font-medium mb-1">{label}</div>
    <div className="text-base text-gray-900">{children}</div>
  </div>
);

const ResponseViewer = ({ content }) => {
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(null);

  const CopyButton = ({ text, id }) => {
    const handleCopy = async () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard && text) {
          await navigator.clipboard.writeText(text);
          setCopied(id);
          setTimeout(() => setCopied(null), 2000);
        }
      } catch (e) {
        console.warn('Copy failed', e);
      }
    };

    return (
      <button
        onClick={handleCopy}
        aria-label="Copy"
        title="Copy"
        className="ml-2 inline-flex items-center justify-center p-1 rounded hover:bg-gray-100"
      >
        {copied === id ? (
          <svg className="w-4 h-4 text-green-600" viewBox="0 0 20 20" fill="none" stroke="currentColor">
            <path d="M4 10l3 3 9-9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M8 7h8v10H8z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 7v-2a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    );
  };

  const parsed = useMemo(() => {
    if (!content || content.trim() === '') return { ok: false, reason: 'empty' };

    // Sanitize common wrappers: triple-backtick code fences and surrounding single backticks
    const sanitize = (raw) => {
      if (typeof raw !== 'string') return raw;
      let t = raw.trim();

      // Match ```lang\n...\n``` or ```\n...\n```
      const fenceRegex = /^```(?:[\w+-]*)\n([\s\S]*?)\n```$/;
      const m = t.match(fenceRegex);
      if (m && m[1]) {
        return { cleaned: m[1].trim(), didSanitize: true };
      }

      // Remove leading ```lang or ``` and trailing ``` if present
      t = t.replace(/^```(?:[^\n]*)\n?/, '').replace(/\n?```$/, '').trim();

      // If wrapped in single backticks (inline), remove them
      if (t.startsWith('`') && t.endsWith('`')) {
        t = t.slice(1, -1).trim();
      }

      return { cleaned: t, didSanitize: false };
    };

    const { cleaned, didSanitize } = sanitize(content);

    try {
      const j = typeof cleaned === 'string' ? JSON.parse(cleaned) : cleaned;
      return { ok: true, value: j, raw: content, cleaned, didSanitize };
    } catch (e) {
      return { ok: false, reason: e && e.message ? e.message : 'invalid-json', raw: content, cleaned, didSanitize };
    }
  }, [content]);

  if (!content || content.trim() === '') {
    return (
      <div className="p-6 text-sm text-gray-500">Click "Conjure" to generate a design fiction — the formatted result will appear here.</div>
    );
  }

  if (!parsed.ok) {
    return (
      <div className="p-4">
        <div className="mb-2 text-sm text-red-600">Could not parse response as JSON: {parsed.reason}</div>
        <button
          className="!font-mono !text-[0.4em] mb-3 inline-block text-[0.5em] px-2 py-1 bg-gray-100 border hover:bg-gray-200"
          onClick={() => setShowRaw(s => !s)}
        >
          {showRaw ? 'Hide raw' : 'FShow raw'}
        </button>
        {showRaw && (
          <pre className="p-3 bg-black text-white text-xs rounded max-h-[40vh] overflow-auto">{parsed.raw}</pre>
        )}
      </div>
    );
  }

  const j = parsed.value;

  // Defensive extraction using the expected schema shape from the prompt
  const elements = j?.elements || {};
  const artifact = j?.artifact || {};
  const design = j?.design || {};
  const implications = j?.implications || {};
  const scenario = j?.scenario || {};
  const additional = j?.additional || {};

  return (
    <div className="p-6 min-h-0">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{artifact.title || (elements?.ARCHETYPE || 'Design Fiction')}</h2>
          {artifact.description && (
            <p className="mt-1 text-sm text-gray-600 max-w-2xl">{artifact.description}</p>
          )}
        </div>
        <div className="text-right flex items-center">
          <CopyButton id="full-json" text={JSON.stringify(j, null, 2)} />
          <button
            onClick={() => setShowRaw(s => !s)}
            className="!text-[0.7em] !font-mono !w-[100px] ml-2 bg-gray-100 border hover:bg-gray-200"
          >
            {showRaw ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {parsed.didSanitize && (
        <div className="mb-3 text-xs text-yellow-700">Note: removed surrounding code fences/backticks before parsing JSON.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="mb-4 p-4 bg-white border rounded">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Cards</h3>
              <CopyButton id="cards" text={JSON.stringify(elements, null, 2)} />
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-start">
                <div className="text-xs text-gray-500">Attribute</div>
                <div className="text-sm text-gray-900 font-medium">{elements?.ATTRIBUTE || '—'}</div>
              </div>
              <div className="flex justify-between items-start">
                <div className="text-xs text-gray-500">Object</div>
                <div className="text-sm text-gray-900 font-medium">{elements?.OBJECT || '—'}</div>
              </div>
              <div className="flex justify-between items-start">
                <div className="text-xs text-gray-500">Action</div>
                <div className="text-sm text-gray-900 font-medium">{elements?.ACTION || '—'}</div>
              </div>
              <div className="flex justify-between items-start">
                <div className="text-xs text-gray-500">Archetype</div>
                <div className="text-sm text-gray-900 font-medium">{elements?.ARCHETYPE || '—'}</div>
              </div>
              <div className="flex justify-between items-start">
                <div className="text-xs text-gray-500">Outcome</div>
                <div className="text-sm text-gray-900 font-medium">{elements?.OUTCOME || '—'}</div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border rounded">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Artifact</h3>
              <CopyButton id="artifact" text={JSON.stringify(artifact, null, 2)} />
            </div>
            <Field label="Title">{artifact.title || 'Untitled'}</Field>
            {artifact.description && <Field label="Description"><SafeText>{artifact.description}</SafeText></Field>}
          </div>
        </div>

        <div>
          <div className="p-4 bg-white border rounded mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Design</h3>
              <CopyButton id="design" text={design?.artifact_description || ''} />
            </div>
            {design?.artifact_description ? (
              <SafeText>{design.artifact_description}</SafeText>
            ) : (
              <div className="text-sm text-gray-500">No artifact description provided.</div>
            )}
          </div>

          <div className="p-4 bg-white border rounded mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Scenario</h3>
              <CopyButton id="scenario" text={scenario?.narrative || ''} />
            </div>
            {scenario?.narrative ? (
              <SafeText>{scenario.narrative}</SafeText>
            ) : (
              <div className="text-sm text-gray-500">No scenario provided.</div>
            )}
          </div>

          <div className="p-4 bg-white border rounded">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Implications</h3>
              <CopyButton id="implications" text={JSON.stringify(implications, null, 2)} />
            </div>
            <div className="text-sm text-gray-700">
              <div className="mb-2"><strong className="text-xs text-gray-500">Social:</strong> {implications?.social || '—'}</div>
              <div className="mb-2"><strong className="text-xs text-gray-500">Cultural:</strong> {implications?.cultural || '—'}</div>
              {implications?.ethical && <div className="mb-2"><strong className="text-xs text-gray-500">Ethical:</strong> {implications.ethical}</div>}
            </div>
          </div>
        </div>
      </div>

      {additional && (
        <div className="mt-6 p-4 bg-white border rounded">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Notes</h3>
            <CopyButton id="notes" text={JSON.stringify(additional || {}, null, 2)} />
          </div>
          {additional.meta_commentary && <Field label="Meta commentary"><SafeText>{additional.meta_commentary}</SafeText></Field>}
          {additional.reasoning && <Field label="Reasoning"><SafeText>{additional.reasoning}</SafeText></Field>}
          {additional.trends && <Field label="Trends"><SafeText>{additional.trends}</SafeText></Field>}
        </div>
      )}

      {showRaw && (
        <div className="mt-6">
          <h4 className="text-xs text-gray-500 mb-2">Raw JSON</h4>
          <pre className="p-3 bg-black text-white text-xs rounded">{JSON.stringify(j, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ResponseViewer;
