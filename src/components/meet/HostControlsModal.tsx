'use client'

import React from 'react'
import {
  Shield,
  Lock,
  Unlock,
  Users,
  VolumeX,
  MessageSquare,
  ScreenShare,
  Mic,
  Video,
  Check,
  X,
  UserCheck,
  UserX,
} from 'lucide-react'
import { RoomPermissions, WaitingParticipant } from '@/lib/meet/useMeetRoom'

export interface HostControlsModalProps {
  isOpen: boolean
  isLocked: boolean
  isWaitingRoom: boolean
  permissions: RoomPermissions
  waitingList: WaitingParticipant[]
  onClose: () => void
  onToggleLock: () => void
  onToggleWaitingRoom: () => void
  onUpdatePermissions: (perms: Partial<RoomPermissions>) => void
  onMuteAll: () => void
  onAdmitUser: (id: string) => void
  onRejectUser: (id: string) => void
  onAdmitAll?: () => void
}

export const HostControlsModal: React.FC<HostControlsModalProps> = ({
  isOpen,
  isLocked,
  isWaitingRoom,
  permissions,
  waitingList,
  onClose,
  onToggleLock,
  onToggleWaitingRoom,
  onUpdatePermissions,
  onMuteAll,
  onAdmitUser,
  onRejectUser,
  onAdmitAll,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5 max-h-[85vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-blue-400">
            <Shield className="w-5 h-5" />
            <h2 className="text-base font-bold text-white">Host & Security Controls</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Waiting Room Knock Queue */}
        {waitingList.length > 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Waiting Room ({waitingList.length})
              </span>
              {onAdmitAll && waitingList.length > 1 && (
                <button
                  type="button"
                  onClick={onAdmitAll}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                >
                  Admit All
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
              {waitingList.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800"
                >
                  <span className="text-xs font-medium text-slate-200">{w.name}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onAdmitUser(w.id)}
                      className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-all cursor-pointer"
                      title="Admit to meeting"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRejectUser(w.id)}
                      className="p-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-all cursor-pointer"
                      title="Deny entry"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Moderation: Mute All */}
        <div>
          <button
            type="button"
            onClick={onMuteAll}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            <VolumeX className="w-4 h-4 text-rose-400" />
            Mute All Participants
          </button>
        </div>

        {/* Meeting Security Toggles */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Meeting Security
          </span>

          {/* Lock Meeting Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-700 text-slate-300">
                {isLocked ? <Lock className="w-4 h-4 text-rose-400" /> : <Unlock className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Lock Meeting</p>
                <p className="text-[10px] text-slate-400">Prevent new participants from joining</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleLock}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                isLocked ? 'bg-rose-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                  isLocked ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Waiting Room Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-700 text-slate-300">
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Enable Waiting Room</p>
                <p className="text-[10px] text-slate-400">Require host admission for newcomers</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleWaitingRoom}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                isWaitingRoom ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                  isWaitingRoom ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Participant Permissions */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Participant Permissions
          </span>

          {/* Share Screen */}
          <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl">
            <div className="flex items-center gap-2.5">
              <ScreenShare className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-300">Share their screen</span>
            </div>
            <input
              type="checkbox"
              checked={permissions.allowScreenShare}
              onChange={(e) => onUpdatePermissions({ allowScreenShare: e.target.checked })}
              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Send Chat */}
          <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-300">Send chat messages</span>
            </div>
            <input
              type="checkbox"
              checked={permissions.allowChat}
              onChange={(e) => onUpdatePermissions({ allowChat: e.target.checked })}
              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Unmute Microphone */}
          <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl">
            <div className="flex items-center gap-2.5">
              <Mic className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-300">Unmute microphone</span>
            </div>
            <input
              type="checkbox"
              checked={permissions.allowUnmute}
              onChange={(e) => onUpdatePermissions({ allowUnmute: e.target.checked })}
              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Turn on Camera */}
          <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl">
            <div className="flex items-center gap-2.5">
              <Video className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-300">Turn on camera</span>
            </div>
            <input
              type="checkbox"
              checked={permissions.allowVideo}
              onChange={(e) => onUpdatePermissions({ allowVideo: e.target.checked })}
              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
