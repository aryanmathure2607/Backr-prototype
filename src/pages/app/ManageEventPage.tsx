import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useStore } from '../../lib/store';
import PageWrapper from '../../components/app/PageWrapper';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { PlusCircle, ArrowLeft, Edit2 } from 'lucide-react';

const ManageEventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const {
    profile,
    events,
    managedParticipants,
    addManagedParticipant,
    updateManagedParticipantPoints,
  } = useStore();

  const event = useMemo(() => events.find(e => e.id === eventId), [events, eventId]);
  const participants = useMemo(() => 
    managedParticipants.filter(p => p.event_id === eventId).sort((a,b) => b.points - a.points), 
    [managedParticipants, eventId]
  );

  const [newParticipantName, setNewParticipantName] = useState('');
  const [pointInputs, setPointInputs] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const initialPoints = participants.reduce((acc, p) => {
      acc[p.id] = p.points.toString();
      return acc;
    }, {} as Record<string, string>);
    setPointInputs(initialPoints);
  }, [participants]);

  if (!event || !profile) return <Navigate to="/app" replace />;
  if (!event.is_admin_only || event.creator_id !== profile.id) {
    return <Navigate to={`/app/event/${eventId}`} replace />;
  }

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParticipantName.trim()) {
      toast.error("Participant name cannot be empty.");
      return;
    }
    addManagedParticipant(eventId!, newParticipantName);
    toast.success(`"${newParticipantName}" added.`);
    setNewParticipantName('');
  };

  const handlePointChange = (id: string, value: string) => {
    setPointInputs(prev => ({ ...prev, [id]: value.replace(/[^0-9-]/g, '') }));
  };

  const handleUpdatePoints = (id: string) => {
    const newPoints = parseInt(pointInputs[id], 10);
    if (isNaN(newPoints)) {
      toast.error("Please enter a valid number for points.");
      const originalParticipant = participants.find(p => p.id === id);
      if (originalParticipant) {
        setPointInputs(prev => ({ ...prev, [id]: originalParticipant.points.toString() }));
      }
    } else {
      updateManagedParticipantPoints(id, newPoints);
      toast.success("Points updated!");
    }
    setEditingId(null);
  };

  return (
    <PageWrapper title={`Manage: ${event.title}`}>
      <Link to={`/app/event/${eventId}`} className="inline-flex items-center gap-2 text-primary mb-6 hover:underline">
        <ArrowLeft size={16} />
        Back to Event Page
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 bg-dark-200 p-6 rounded-xl border border-dark-300 h-fit"
        >
          <h2 className="text-xl font-bold text-white mb-4">Add Participant</h2>
          <form onSubmit={handleAddParticipant} className="space-y-4">
            <Input
              id="newParticipant"
              label="Participant Name"
              placeholder="e.g., AH-10"
              value={newParticipantName}
              onChange={e => setNewParticipantName(e.target.value)}
            />
            <Button type="submit" className="w-full">
              <PlusCircle size={20} /> Add
            </Button>
          </form>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-dark-200 p-6 rounded-xl border border-dark-300"
        >
          <h2 className="text-xl font-bold text-white mb-4">Update Points</h2>
          <div className="space-y-3">
            {participants.length > 0 ? (
              participants.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-4 bg-dark-300/50 p-3 rounded-lg">
                  <span className="font-semibold text-white flex-1">{p.name}</span>
                  <div className="flex items-center gap-2">
                    {editingId === p.id ? (
                      <Input
                        id={`points-${p.id}`}
                        label=""
                        className="!py-2 !w-28"
                        type="text"
                        inputMode="numeric"
                        value={pointInputs[p.id] || ''}
                        onChange={e => handlePointChange(p.id, e.target.value)}
                        onBlur={() => handleUpdatePoints(p.id)}
                        onKeyDown={e => { if(e.key === 'Enter') handleUpdatePoints(p.id) }}
                        autoFocus
                      />
                    ) : (
                      <div
                        className="flex items-center gap-3 cursor-pointer text-light-200 hover:text-white group"
                        onClick={() => {
                          setEditingId(p.id);
                        }}
                      >
                        <span className="font-bold text-white text-lg w-20 text-right">{p.points.toLocaleString()} pts</span>
                        <Edit2 size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-light-200 text-center py-4">No participants have been added yet.</p>
            )}
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
};

export default ManageEventPage;
