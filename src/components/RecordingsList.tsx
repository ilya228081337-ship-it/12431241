import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { AudioRecording } from '../lib/supabase';
import { supabase } from '../lib/supabase';

interface RecordingsListProps {
  recordings: AudioRecording[];
  selectedRecording: AudioRecording | null;
  onSelectRecording: (recording: AudioRecording) => void;
  onRecordingDeleted: () => void;
}

export function RecordingsList({
  recordings,
  selectedRecording,
  onSelectRecording,
  onRecordingDeleted
}: RecordingsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (recording: AudioRecording, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Удалить эту запись и все её транскрипции?')) {
      return;
    }

    setDeletingId(recording.id);

    try {
      const urlParts = recording.audio_url.split('/');
      const filePath = urlParts.slice(-2).join('/');

      await supabase.storage
        .from('audio-files')
        .remove([filePath]);

      const { error: dbError } = await supabase
        .from('audio_recordings')
        .delete()
        .eq('id', recording.id);

      if (dbError) throw dbError;

      onRecordingDeleted();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Не удалось удалить запись');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y max-h-96 overflow-y-auto">
      {recordings.length === 0 ? (
        <p className="p-4 text-center text-gray-500 text-sm">
          Нет загруженных записей
        </p>
      ) : (
        recordings.map((recording) => (
          <div
            key={recording.id}
            className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
              selectedRecording?.id === recording.id ? 'bg-blue-50' : ''
            }`}
          >
            <button
              onClick={() => onSelectRecording(recording)}
              className="flex-1 text-left"
            >
              <div className="font-medium text-gray-900 truncate">
                {recording.filename}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  {Math.round(recording.duration)}s
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  recording.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : recording.status === 'processing'
                    ? 'bg-yellow-100 text-yellow-700'
                    : recording.status === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {recording.status === 'completed' && 'Готово'}
                  {recording.status === 'processing' && 'Обработка'}
                  {recording.status === 'error' && 'Ошибка'}
                  {recording.status === 'uploaded' && 'Загружено'}
                </span>
              </div>
            </button>

            <button
              onClick={(e) => handleDelete(recording, e)}
              disabled={deletingId === recording.id}
              className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Удалить запись"
            >
              {deletingId === recording.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        ))
      )}
    </div>
  );
}
