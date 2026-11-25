import React, { useState } from 'react';

const STARTER_CODE = '// Tulis draft solusi kelompok di sini.\n';

export default function StudyRoomWorkspace() {
  const [activeTab, setActiveTab] = useState('code');
  const [code, setCode] = useState(STARTER_CODE);
  const [notes, setNotes] = useState('');

  return (
    <section className="study-room-card study-room-workspace">
      <div className="study-room-card-heading">
        <h3>🧑‍💻 Ruang Kerja</h3>
        <span className="study-room-pill">Draf lokal</span>
      </div>

      <div className="study-room-tabs" role="group" aria-label="Mode ruang kerja">
        <button
          type="button"
          aria-pressed={activeTab === 'code'}
          className={activeTab === 'code' ? 'active' : ''}
          onClick={() => setActiveTab('code')}
        >
          Draft kode
        </button>
        <button
          type="button"
          aria-pressed={activeTab === 'notes'}
          className={activeTab === 'notes' ? 'active' : ''}
          onClick={() => setActiveTab('notes')}
        >
          Catatan
        </button>
      </div>

      {activeTab === 'code' ? (
        <div className="study-room-editor-panel">
          <label htmlFor="study-room-code">Editor teks</label>
          <textarea
            id="study-room-code"
            className="study-room-editor"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            spellCheck="false"
            aria-label="Draft kode lokal"
          />
        </div>
      ) : (
        <div className="study-room-editor-panel">
          <label htmlFor="study-room-notes">Catatan sesi</label>
          <textarea
            id="study-room-notes"
            className="study-room-editor study-room-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Simpan ide dan rangkumanmu di sini..."
          />
        </div>
      )}

      <p className="study-room-local-note">
        Draf bersifat sementara di halaman ini; belum dibagikan atau disinkronkan ke anggota grup.
      </p>
    </section>
  );
}
